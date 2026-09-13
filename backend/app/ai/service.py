from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.config import get_ai_settings
from app.ai.errors import (
    AIConfigurationError,
    AIExecutionError,
    AIOutputValidationError,
)
from app.ai.graphs.procurement import build_procurement_graph
from app.ai.runtime import checkpoint_context
from app.ai.schemas import ProcurementAIRunOut
from app.ai.validators import validate_agent_outputs
from app.core.exceptions import NotFoundError
from app.models.quote import Quote
from app.models.requisition import Requisition
from app.models.supplier import Supplier
from app.schemas.ai import ProcurementRecommendation
from app.schemas.common import (
    EvidenceItem,
    EvidenceReference,
    RiskFlag,
)
from app.services.intelligence_service import (
    build_procurement_truth,
)


def _confidence_band(score: float) -> str:
    if score >= 0.85:
        return "HIGH"
    if score >= 0.60:
        return "MEDIUM"
    return "LOW"


def _evidence_catalog(
    truth,
    requisition: Requisition,
    quotes: list[Quote],
) -> dict[str, EvidenceItem]:
    """Build a stable evidence catalog for one AI run.

    The catalog is application-generated. The model can reference
    evidence IDs, but it cannot invent the catalog.
    """

    catalog: dict[str, EvidenceItem] = {}

    requisition_evidence_id = f"ev-{truth.pr_number}-requisition"

    catalog[requisition_evidence_id] = EvidenceItem(
        id=requisition_evidence_id,
        label="Purchase requisition",
        value=(
            f"{requisition.material_name} "
            f"({requisition.part_code}), "
            f"{requisition.quantity} {requisition.unit}, "
            f"required "
            f"{requisition.required_date.isoformat()}"
        ),
        source_type="requisition",
        source_ref=requisition.pr_number,
    )

    quotes_by_supplier: dict[str, list[Quote]] = {}

    for quote in quotes:
        quotes_by_supplier.setdefault(
            quote.supplier_id,
            [],
        ).append(quote)

    for supplier in truth.suppliers:
        supplier_quotes = quotes_by_supplier.get(
            supplier.supplier_id,
            [],
        )

        quote: Quote | None = None

        if supplier.quote_reference:
            quote = next(
                (
                    item
                    for item in supplier_quotes
                    if item.quote_reference
                    == supplier.quote_reference
                ),
                None,
            )

        if quote is None and supplier_quotes:
            quote = supplier_quotes[0]

        prefix = (
            f"ev-{truth.pr_number}-"
            f"{supplier.supplier_id}"
        )

        if quote is not None:
            quote_evidence_id = f"{prefix}-quote"

            landed_cost = (
                float(quote.unit_price_amount)
                * int(quote.quantity)
                + float(quote.freight_amount)
            )

            catalog[quote_evidence_id] = EvidenceItem(
                id=quote_evidence_id,
                label=(
                    f"Quote — "
                    f"{supplier.supplier_name}"
                ),
                value=(
                    f"₹{float(quote.unit_price_amount):,.2f}"
                    "/unit; "
                    f"quantity {quote.quantity}; "
                    f"freight "
                    f"₹{float(quote.freight_amount):,.2f}; "
                    f"pre-tax landed "
                    f"₹{landed_cost:,.2f}"
                ),
                source_type="quote",
                source_ref=quote.id,
            )

            benchmark_value = (
                truth.benchmark.benchmark.amount
                if truth.benchmark.benchmark
                else None
            )

            if benchmark_value is not None:
                benchmark_evidence_id = (
                    f"{prefix}-benchmark"
                )

                catalog[
                    benchmark_evidence_id
                ] = EvidenceItem(
                    id=benchmark_evidence_id,
                    label=(
                        "Historical benchmark — "
                        f"{supplier.supplier_name}"
                    ),
                    value=(
                        f"₹{benchmark_value:,.2f}"
                    ),
                    source_type="transaction",
                    source_ref=supplier.supplier_id,
                )

        quality_evidence_id = (
            f"{prefix}-quality"
        )

        catalog[quality_evidence_id] = EvidenceItem(
            id=quality_evidence_id,
            label=(
                "Quality acceptance — "
                f"{supplier.supplier_name}"
            ),
            value=(
                f"{supplier.quality_score:.1f}"
            ),
            source_type="supplier_record",
            source_ref=supplier.supplier_id,
        )

        otd_evidence_id = (
            f"{prefix}-otd"
        )

        catalog[otd_evidence_id] = EvidenceItem(
            id=otd_evidence_id,
            label=(
                "On-time delivery — "
                f"{supplier.supplier_name}"
            ),
            value=(
                f"{supplier.delivery_score:.1f}"
            ),
            source_type="supplier_record",
            source_ref=supplier.supplier_id,
        )

        if supplier.risk_assessment is not None:
            for finding in supplier.risk_assessment.findings:
                risk_evidence_id = (
                    f"{prefix}-"
                    f"{finding.code.lower()}"
                )

                catalog[
                    risk_evidence_id
                ] = EvidenceItem(
                    id=risk_evidence_id,
                    label=(
                        f"Risk: {finding.code} — "
                        f"{supplier.supplier_name}"
                    ),
                    value=finding.message,
                    source_type="quote",
                    source_ref=(
                        supplier.quote_reference
                        or supplier.supplier_id
                    ),
                )

    # Backward-compatible winner aliases.
    if truth.suppliers:
        winner = truth.suppliers[0]

        winner_prefix = (
            f"ev-{truth.pr_number}-"
            f"{winner.supplier_id}"
        )

        aliases = {
            (
                f"ev-{truth.pr_number}-benchmark"
            ): (
                f"{winner_prefix}-benchmark"
            ),
            (
                f"ev-{truth.pr_number}-quality"
            ): (
                f"{winner_prefix}-quality"
            ),
            (
                f"ev-{truth.pr_number}-otd"
            ): (
                f"{winner_prefix}-otd"
            ),
            (
                f"ev-{truth.pr_number}-quote"
            ): (
                f"{winner_prefix}-quote"
            ),
        }

        for alias, canonical in aliases.items():
            source = catalog.get(canonical)

            if source is not None:
                catalog[alias] = source.model_copy(
                    update={"id": alias}
                )

    return catalog


def _facts_payload(
    requisition: Requisition,
    quotes: list[Quote],
    suppliers: dict[str, Supplier],
    truth,
) -> dict[str, Any]:
    """Convert Phase 3/4 data into a serializable AI context.

    No SQLAlchemy objects cross the LangGraph boundary.
    """

    evidence = _evidence_catalog(
        truth,
        requisition,
        quotes,
    )

    quotes_by_supplier: dict[
        str,
        list[Quote],
    ] = {}

    for quote in quotes:
        quotes_by_supplier.setdefault(
            quote.supplier_id,
            [],
        ).append(quote)

    supplier_payloads: list[dict[str, Any]] = []

    for assessment in truth.suppliers:
        supplier = suppliers.get(
            assessment.supplier_id
        )

        if supplier is None:
            raise NotFoundError(
                "Supplier record missing for "
                f"'{assessment.supplier_id}'."
            )

        supplier_quotes = quotes_by_supplier.get(
            assessment.supplier_id,
            [],
        )

        selected_quote: Quote | None = None

        if assessment.quote_reference:
            selected_quote = next(
                (
                    quote
                    for quote in supplier_quotes
                    if quote.quote_reference
                    == assessment.quote_reference
                ),
                None,
            )

        if (
            selected_quote is None
            and len(supplier_quotes) == 1
        ):
            selected_quote = supplier_quotes[0]

        quote_payload: dict[str, Any] | None = None

        if selected_quote is not None:
            quote_payload = {
                "id": selected_quote.id,
                "quote_reference": (
                    selected_quote.quote_reference
                ),
                "unit_price_inr": (
                    float(
                        selected_quote.unit_price_amount
                    )
                ),
                "quantity": selected_quote.quantity,
                "freight_inr": (
                    float(
                        selected_quote.freight_amount
                    )
                ),
                "tax_rate_percent": (
                    float(
                        selected_quote.tax_rate_percent
                    )
                ),
                "delivery_date": (
                    selected_quote.delivery_date.isoformat()
                    if hasattr(selected_quote, 'delivery_date') and selected_quote.delivery_date
                    else None
                ),
                "payment_terms_days": (
                    selected_quote.payment_terms_days
                ),
                "validity_days": (
                    selected_quote.validity_days
                ),
                "lead_time_days": (
                    selected_quote.lead_time_days
                ),
                "received_at": (
                    selected_quote.received_at.isoformat()
                    if selected_quote.received_at
                    else None
                ),
                "validation_status": (
                    selected_quote.validation_status.value
                    if hasattr(
                        selected_quote.validation_status,
                        "value",
                    )
                    else str(
                        selected_quote.validation_status
                    )
                ),
                "extracted_fields": (
                    selected_quote.extracted_fields
                ),
                "validation_checks": (
                    selected_quote.validation_checks
                    if hasattr(selected_quote, 'validation_checks')
                    else []
                ),
            }

        supplier_payloads.append(
            {
                "supplier_id": assessment.supplier_id,
                "supplier_name": assessment.supplier_name,
                "quote_reference": assessment.quote_reference,
                "quote_id": selected_quote.id if selected_quote else None,  # <-- CRITICAL FIX: Added quote_id for validator
                "price_score": assessment.price_score,
                "quality_score": assessment.quality_score,
                "delivery_score": assessment.delivery_score,
                "commercial_score": assessment.commercial_score,
                "risk_score": assessment.risk_score,
                "overall_score": assessment.overall_score,
                "score_config_version": assessment.score_config_version,
                "risk_level": assessment.risk_level,
                "price_variance_percent": assessment.price_variance_percent,
                "historical_sample_size": assessment.historical_sample_size,
                "risk_assessment": (
                    assessment.risk_assessment.model_dump(mode="json")
                    if assessment.risk_assessment
                    else None
                ),
                "supplier_performance": {
                    "quality_acceptance_rate": float(supplier.quality_acceptance_rate),
                    "on_time_delivery_rate": float(supplier.on_time_delivery_rate),
                    "response_rate": float(supplier.response_rate),
                    "average_unit_price_inr": float(supplier.average_unit_price_amount),
                },
                "quote": quote_payload,
            }
        )

    return {
        "requisition": {
            "pr_number": (
                requisition.pr_number
            ),
            "material": (
                requisition.material_name
            ),
            "part_code": (
                getattr(requisition, 'part_code', '')
            ),
            "quantity": requisition.quantity,
            "unit": getattr(requisition, 'unit', ''),
            "required_date": (
                requisition.required_date.isoformat()
            ),
            "department": getattr(requisition, 'requesting_department', ''),
            "application": getattr(requisition, 'application', ''),
            "raised_by": getattr(requisition, 'raised_by', ''),
            "original_requirement_text": (
                getattr(requisition, 'original_requirement_text', '')
            ),
            "structured_fields": (
                getattr(requisition, 'structured_fields', {})
            ),
            "missing_information": (
                getattr(requisition, 'missing_information', [])
            ),
        },
        "deterministic_intelligence": {
            "calculation_version": (
                _calculation_version(truth)
            ),
            "supplier_count": len(
                truth.suppliers
            ),
            "eligible_quote_count": len(
                truth.suppliers
            ),
            "excluded_quote_count": max(
                len(quotes)
                - len(truth.suppliers),
                0,
            ),
            "recommended_supplier_id": (
                truth.recommendation.supplier_id
                if truth.recommendation
                else None
            ),
            "benchmark": (
                truth.benchmark.model_dump(
                    mode="json"
                )
            ),
            "suppliers": supplier_payloads,
            # Transitional alias for agent prompts/code
            # written against the previous Phase 4 DTO.
            "candidates": supplier_payloads,
            "recommendation": (
                truth.recommendation.model_dump(
                    mode="json"
                )
                if truth.recommendation
                else None
            ),
        },
        "evidence_catalog": {
            key: value.model_dump(
                mode="json"
            )
            for key, value in evidence.items()
        },
    }


def _calculation_version(truth) -> str:
    if (
        truth.recommendation
        and truth.recommendation.score_config_version
    ):
        return (
            truth.recommendation
            .score_config_version
        )

    for supplier in truth.suppliers:
        if supplier.score_config_version:
            return supplier.score_config_version

    return "unknown"


def _supplier_by_id(
    truth,
    supplier_id: str,
):
    return next(
        (
            supplier
            for supplier in truth.suppliers
            if supplier.supplier_id
            == supplier_id
        ),
        None,
    )


def _recommendation(
    truth,
    facts: dict[str, Any],
    final: dict[str, Any],
    pr_number: str,
) -> ProcurementRecommendation:
    """Create the public recommendation contract.

    Deterministic Phase 4 facts remain authoritative.
    Groq can explain those facts but cannot change
    the selected supplier or numeric score.
    """

    if not truth.suppliers:
        raise AIOutputValidationError(
            "No eligible supplier candidates "
            f"exist for '{pr_number}'."
        )

    if truth.recommendation is None:
        raise AIOutputValidationError(
            "Phase 4 did not produce a deterministic "
            f"recommendation for '{pr_number}'."
        )

    winner = truth.suppliers[0]

    allowed_supplier = (
        truth.recommendation.supplier_id
    )

    if winner.supplier_id != allowed_supplier:
        winner = _supplier_by_id(
            truth,
            allowed_supplier,
        )

        if winner is None:
            raise AIOutputValidationError(
                "Deterministic recommendation points "
                f"to unknown supplier '{allowed_supplier}'."
            )

    evidence_catalog = facts[
        "evidence_catalog"
    ]

    evidence_ids = list(
        final.get("evidence_ids")
        or []
    )

    invalid_evidence = sorted(
        set(evidence_ids)
        - set(evidence_catalog)
    )

    if invalid_evidence:
        raise AIOutputValidationError(
            "AI returned unknown evidence IDs: "
            + ", ".join(invalid_evidence)
        )

    model_supplier_id = final.get(
        "supplier_id"
    )

    if (
        model_supplier_id
        and model_supplier_id
        != allowed_supplier
    ):
        raise AIOutputValidationError(
            f"AI supplier '{model_supplier_id}' "
            "contradicts deterministic winner "
            f"'{allowed_supplier}'."
        )

    # Existing API semantics:
    # confidence is a deterministic compatibility
    # value derived from the Phase 4 truth engine.
    #
    # It is NOT model/token probability.
    confidence = (
        truth.recommendation.confidence
    )

    recommendation = ProcurementRecommendation(
        id=(
            f"ai-{pr_number}-"
            f"{uuid4().hex[:12]}"
        ),
        pr_id=pr_number,
        supplier_id=(
            winner.supplier_id
        ),
        supplier_name=(
            winner.supplier_name
        ),
        confidence=confidence,
        confidence_band=(
            truth.recommendation
            .confidence_band
        ),
        recommendation_state=(
            truth.recommendation
            .recommendation_state
        ),
        overall_score=(
            winner.overall_score
        ),
        dimensions={
            "price": {
                "value": (
                    winner.price_score / 100
                ),
                "label": "Price",
                "detail": (
                    "Deterministic "
                    "relative-price score"
                ),
            },
            "quality": {
                "value": (
                    winner.quality_score / 100
                ),
                "label": "Quality",
                "detail": (
                    "Historical acceptance "
                    "rate"
                ),
            },
            "delivery": {
                "value": (
                    winner.delivery_score / 100
                ),
                "label": "Delivery",
                "detail": (
                    "Historical on-time "
                    "delivery rate"
                ),
            },
            "commercial_terms": {
                "value": (
                    winner.commercial_score
                    / 100
                ),
                "label": (
                    "Commercial terms"
                ),
                "detail": (
                    "Payment terms versus "
                    "configured target"
                ),
            },
            "risk": {
                "value": (
                    winner.risk_score / 100
                ),
                "label": "Risk",
                "detail": (
                    "Deterministic risk rules"
                ),
            },
        },
        reasons=(
            final.get("reasons")
            or truth.recommendation.rationale
        ),
        trade_off=final.get(
            "trade_off"
        ),
        risks=[
            RiskFlag(
                severity=finding.severity,
                message=finding.message,
                evidence=None,
            )
            for finding in (
                winner.risk_assessment.findings
                if winner.risk_assessment
                else []
            )
        ],
        evidence=(
            ProcurementAIService
            ._evidence_references(
                facts,
                evidence_ids,
            )
        ),
        policy_checks=[
            {
                "label": (
                    "Deterministic ranking preserved"
                ),
                "passed": True,
                "detail": (
                    winner.score_config_version
                ),
            },
            {
                "label": (
                    "Evidence IDs validated"
                ),
                "passed": True,
            },
        ],
        alternatives=[
            {
                "supplier_id": item.supplier_id,
                "supplier_name": item.supplier_name,
                "overall_score": (
                    item.overall_score
                ),
                "noteworthy_difference": (
                    f"{item.risk_level} risk; "
                    f"deterministic score "
                    f"{item.overall_score:.1f}"
                ),
            }
            for item in truth.suppliers[
                1:3
            ]
        ],
        generated_at=datetime.now(UTC),
    )

    return recommendation


class ProcurementAIService:
    """Application boundary for Phase 5/6 AI execution."""

    def ensure_configured(self) -> None:
        settings = get_ai_settings()

        # Check for the primary LLM (Gemini) configuration
        if not settings.gemini_api_key:
            raise AIConfigurationError(
                "GEMINI_API_KEY is not configured."
            )

    async def _prepare(
        self,
        db: AsyncSession,
        pr_number: str,
        thread_id: str | None,
    ):
        config = get_ai_settings()

        self.ensure_configured()

        # FIX: Use select().where() to look up by pr_number, not db.get() which looks up by primary key (id)
        requisition_result = await db.execute(
            select(Requisition).where(Requisition.pr_number == pr_number)
        )
        requisition = requisition_result.scalar_one_or_none()

        if requisition is None:
            raise NotFoundError(
                f"No requisition '{pr_number}'."
            )

        truth = await build_procurement_truth(
            db,
            pr_number,
        )

        quote_result = await db.execute(
            select(Quote).where(
                Quote.requisition_id
                == requisition.id
            )
        )

        quotes = list(
            quote_result.scalars().all()
        )

        supplier_ids = sorted(
            {
                supplier.supplier_id
                for supplier in truth.suppliers
            }
        )

        suppliers: dict[
            str,
            Supplier,
        ] = {}

        if supplier_ids:
            supplier_result = await db.execute(
                select(Supplier).where(
                    Supplier.id.in_(
                        supplier_ids
                    )
                )
            )

            suppliers = {
                supplier.id: supplier
                for supplier in (
                    supplier_result
                    .scalars()
                    .all()
                )
            }

        missing = (
            set(supplier_ids)
            - set(suppliers)
        )

        if missing:
            raise NotFoundError(
                "Supplier records missing for "
                f"'{pr_number}': "
                f"{', '.join(sorted(missing))}."
            )

        run_id = (
            f"airun-{uuid4().hex}"
        )

        effective_thread_id = (
            thread_id
            or f"pr-{pr_number}-{run_id}"
        )

        facts = _facts_payload(
            requisition,
            quotes,
            suppliers,
            truth,
        )

        initial = {
            "pr_number": pr_number,
            "run_id": run_id,
            "thread_id": effective_thread_id,
            "facts": facts,
            "activity": [],
            "errors": [],
        }

        return (
            config,
            requisition,
            truth,
            facts,
            initial,
            run_id,
            effective_thread_id,
        )

    @staticmethod
    def _evidence_references(
        facts: dict[str, Any],
        ids: list[str],
    ) -> list[EvidenceReference]:
        references: list[
            EvidenceReference
        ] = []

        for evidence_id in ids:
            item = facts[
                "evidence_catalog"
            ].get(evidence_id)

            if item is None:
                raise AIOutputValidationError(
                    f"Unknown evidence ID "
                    f"'{evidence_id}'."
                )

            source_type = (
                item.get("source_type")
            )

            evidence_type = {
                "quote": "QUOTE",
                "transaction": "TRANSACTION",
                "supplier_record": (
                    "TRANSACTION"
                ),
                "requisition": "DOCUMENT",
            }.get(
                source_type,
                "DOCUMENT",
            )

            references.append(
                EvidenceReference(
                    id=item["id"],
                    type=evidence_type,
                    label=item["label"],
                    as_of=datetime.now(UTC),
                )
            )

        return references

    @staticmethod
    def _negotiation_payload(
        value: dict | None,
    ) -> dict | None:
        if not value:
            return None

        return {
            "supplierId": value.get(
                "supplier_id"
            ),
            "targetUnitPriceInr": value.get(
                "target_unit_price_inr"
            ),
            "anchorReason": value.get(
                "anchor_reason"
            ),
            "messageBody": value.get(
                "message_body"
            ),
            "evidenceIds": value.get(
                "evidence_ids",
                [],
            ),
        }

    async def run(
        self,
        db: AsyncSession,
        pr_number: str,
        *,
        thread_id: str | None = None,
    ) -> ProcurementAIRunOut:
        (
            config,
            _requisition,
            truth,
            facts,
            initial,
            run_id,
            effective_thread_id,
        ) = await self._prepare(
            db,
            pr_number,
            thread_id,
        )

        async with checkpoint_context(
            config
        ) as checkpointer:
            graph = build_procurement_graph(
                ai_settings=config.ai,
                groq_api_key=config.groq_api_key,
                gemini_api_key=config.gemini_api_key,
                gemini_model=config.gemini_model,
                checkpointer=checkpointer,
            )

            try:
                result = await graph.ainvoke(
                    initial,
                    config={
                        "configurable": {
                            "thread_id": (
                                effective_thread_id
                            )
                        }
                    },
                )
            except Exception as exc:
                raise AIExecutionError(
                    "Procurement graph failed "
                    f"for {pr_number}: {exc}"
                ) from exc

        validate_agent_outputs(
            result,
            facts,
        )

        final = (
            result.get(
                "final_analysis"
            )
            or {}
        )

        recommendation = (
            _recommendation(
                truth,
                facts,
                final,
                pr_number,
            )
        )

        return ProcurementAIRunOut(
            run_id=run_id,
            thread_id=effective_thread_id,
            pr_number=pr_number,
            status="completed",
            graph_version=(
                config.ai.graph_version
            ),
            prompt_version=(
                config.ai.prompt_version
            ),
            model=config.ai.model,
            recommendation=(
                recommendation.model_dump(
                    mode="json",
                    by_alias=True,
                )
            ),
            negotiation=(
                self._negotiation_payload(
                    result.get(
                        "negotiation"
                    )
                )
            ),
            activity=result.get(
                "activity",
                [],
            ),
            errors=result.get(
                "errors",
                [],
            ),
        )

    async def stream(
        self,
        db: AsyncSession,
        pr_number: str,
        *,
        thread_id: str | None = None,
    ) -> AsyncIterator[dict]:
        (
            config,
            _requisition,
            truth,
            facts,
            initial,
            run_id,
            effective_thread_id,
        ) = await self._prepare(
            db,
            pr_number,
            thread_id,
        )

        sequence = 0

        def event(
            event_type: str,
            data: dict,
        ) -> dict:
            nonlocal sequence

            sequence += 1

            return {
                "type": event_type,
                "run_id": run_id,
                "pr_number": pr_number,
                "thread_id": (
                    effective_thread_id
                ),
                "sequence": sequence,
                "timestamp": (
                    datetime.now(
                        UTC
                    ).isoformat()
                ),
                "data": data,
            }

        yield event(
            "run.started",
            {
                "graph_version": (
                    config.ai.graph_version
                ),
                "prompt_version": (
                    config.ai.prompt_version
                ),
                "model": config.ai.model,
                "detail": (
                    "Procurement AI run started."
                ),
            },
        )

        final_state = dict(initial)

        chunk_queue: asyncio.Queue[
            tuple[str, object]
        ] = asyncio.Queue()

        async def consume(graph) -> None:
            try:
                async for chunk in graph.astream(
                    initial,
                    config={
                        "configurable": {
                            "thread_id": (
                                effective_thread_id
                            )
                        }
                    },
                    stream_mode=[
                        "custom",
                        "updates",
                    ],
                    version="v2",
                ):
                    await chunk_queue.put(
                        ("chunk", chunk)
                    )

            except asyncio.CancelledError:
                raise

            except Exception as exc:
                await chunk_queue.put(
                    ("error", exc)
                )

            finally:
                await chunk_queue.put(
                    ("done", None)
                )

        task: asyncio.Task[
            None
        ] | None = None

        try:
            async with checkpoint_context(
                config
            ) as checkpointer:
                graph = build_procurement_graph(
                    ai_settings=config.ai,
                    groq_api_key=config.groq_api_key,
                    gemini_api_key=config.gemini_api_key,
                    gemini_model=config.gemini_model,
                    checkpointer=(
                        checkpointer
                    ),
                )

                task = asyncio.create_task(
                    consume(graph),
                    name=(
                        f"procurement-ai-"
                        f"{run_id}"
                    ),
                )

                heartbeat_seconds = max(
                    1.0,
                    getattr(get_ai_settings(), 'ai_ux_stream_heartbeat_seconds', 5.0),
                )

                while True:
                    try:
                        (
                            kind,
                            payload,
                        ) = await asyncio.wait_for(
                            chunk_queue.get(),
                            timeout=heartbeat_seconds,
                        )

                    except TimeoutError:
                        yield event(
                            "heartbeat",
                            {
                                "detail": (
                                    "AI analysis is "
                                    "still running."
                                )
                            },
                        )
                        continue

                    if kind == "error":
                        assert isinstance(
                            payload,
                            Exception,
                        )

                        raise AIExecutionError(
                            "Procurement graph "
                            f"failed for "
                            f"{pr_number}: "
                            f"{payload}"
                        ) from payload

                    if kind == "done":
                        break

                    chunk = payload

                    if not isinstance(
                        chunk,
                        dict,
                    ):
                        continue

                    chunk_type = chunk.get(
                        "type"
                    )

                    if chunk_type == "custom":
                        custom = (
                            chunk.get("data")
                            or {}
                        )

                        if (
                            custom.get(
                                "kind"
                            )
                            == "activity"
                        ):
                            yield event(
                                "activity",
                                custom[
                                    "activity"
                                ],
                            )

                    elif chunk_type == "updates":
                        updates = (
                            chunk.get(
                                "data"
                            )
                            or {}
                        )

                        for (
                            _node_name,
                            node_update,
                        ) in updates.items():
                            if not isinstance(
                                node_update,
                                dict,
                            ):
                                continue

                            for (
                                key,
                                value,
                            ) in node_update.items():
                                if (
                                    key
                                    in {
                                        "activity",
                                        "errors",
                                    }
                                    and isinstance(
                                        value,
                                        list,
                                    )
                                ):
                                    final_state.setdefault(
                                        key,
                                        [],
                                    )

                                    final_state[
                                        key
                                    ].extend(
                                        value
                                    )
                                else:
                                    final_state[
                                        key
                                    ] = value

            validate_agent_outputs(
                final_state,
                facts,
            )

            final = (
                final_state.get(
                    "final_analysis"
                )
                or {}
            )

            recommendation = (
                _recommendation(
                    truth,
                    facts,
                    final,
                    pr_number,
                )
            )

            run = ProcurementAIRunOut(
                run_id=run_id,
                thread_id=(
                    effective_thread_id
                ),
                pr_number=pr_number,
                status="completed",
                graph_version=(
                    config.ai.graph_version
                ),
                prompt_version=(
                    config.ai.prompt_version
                ),
                model=config.ai.model,
                recommendation=(
                    recommendation.model_dump(
                        mode="json",
                        by_alias=True,
                    )
                ),
                negotiation=(
                    self._negotiation_payload(
                        final_state.get(
                            "negotiation"
                        )
                    )
                ),
                activity=final_state.get(
                    "activity",
                    [],
                ),
                errors=final_state.get(
                    "errors",
                    [],
                ),
            )

            yield event(
                "run.completed",
                {
                    "run": run.model_dump(
                        mode="json",
                        by_alias=True,
                    )
                },
            )

        except asyncio.CancelledError:
            raise

        except Exception as exc:
            yield event(
                "run.failed",
                {
                    "code": getattr(
                        exc,
                        "code",
                        "ai_execution_failed",
                    ),
                    "message": str(exc),
                },
            )

        finally:
            if (
                task is not None
                and not task.done()
            ):
                task.cancel()

                try:
                    await task
                except asyncio.CancelledError:
                    pass