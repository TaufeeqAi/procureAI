from __future__ import annotations

import json
from typing import Any

PROMPT_VERSION = "procurement-prompts.v1"

BASE_GUARDRAILS = """
You are operating inside Elecon Procurement AI.

AUTHORITATIVE DATA RULES:
1. PostgreSQL-backed facts and Phase 4 deterministic calculations are authoritative.
2. Never invent prices, supplier metrics, dates, quantities, benchmarks, scores, taxes, or risks.
3. Do not recompute arithmetic when a deterministic field is provided.
4. Use only evidence IDs present in the supplied evidence catalog.
5. Distinguish supplier score from AI confidence. They are not the same concept.
6. Treat validation status literally. A NEEDS_REVIEW or REJECTED quote is not a trusted decision input.
7. Recommendations explain and prioritize facts; they never mutate procurement state.
""".strip()


def _context(title: str, facts: dict[str, Any], instructions: str) -> str:
    serialized = json.dumps(facts, ensure_ascii=False, sort_keys=True, default=str)
    return (
        f"{BASE_GUARDRAILS}\n\n"
        f"TASK: {title}\n\n"
        f"AUTHORITATIVE FACTS:\n{serialized}\n\n"
        f"INSTRUCTIONS:\n{instructions}"
    )


def requirement_prompt(facts: dict[str, Any]) -> str:
    return _context(
        "Requirement intelligence",
        facts,
        "Normalize the buyer requirement, identify explicit constraints, and surface only missing information actually visible in the requisition. Do not create technical specifications that are absent from the source.",
    )


def supplier_prompt(facts: dict[str, Any]) -> str:
    return _context(
        "Supplier intelligence",
        facts,
        "Explain the deterministic ranking already calculated by Phase 4. Select the top supplier from the provided candidates. You may explain trade-offs, but you must not alter the ranking or manufacture performance metrics.",
    )


def quote_prompt(facts: dict[str, Any]) -> str:
    return _context(
        "Quote intelligence",
        facts,
        "Summarize quote validation, pricing differences, benchmark position, and delivery observations using only the supplied quote facts. Flag inconsistencies rather than guessing their resolution.",
    )


def risk_prompt(facts: dict[str, Any]) -> str:
    return _context(
        "Risk intelligence",
        facts,
        "Interpret deterministic risk findings into an executive-ready risk assessment and mitigations. Never downgrade or contradict a deterministic HIGH/MEDIUM risk without explicit source evidence.",
    )


def negotiation_prompt(facts: dict[str, Any]) -> str:
    return _context(
        "Negotiation drafting",
        facts,
        "Draft a commercially credible supplier negotiation using the authoritative quote and benchmark. You may propose a target price, but it must be explicitly framed as a proposed negotiation target rather than a database fact. Cite only supplied evidence IDs.",
    )


def final_prompt(facts: dict[str, Any]) -> str:
    return _context(
        "Procurement decision recommendation",
        facts,
        "Produce a decision-ready explanation for a human procurement professional. Set supplier_id exactly equal to the deterministic Phase 4 recommended_supplier_id. Reasons must be grounded in the provided calculations and evidence. Keep the explanation concise, explicit about trade-offs, and actionable.",
    )


def question_prompt(facts: dict[str, Any], question: str) -> str:
    return _context(
        "Procurement question answering",
        {"facts": facts, "question": question},
        "Answer the buyer's question using only the authoritative facts. Cite only evidence IDs from the supplied catalog. If the evidence is insufficient, say so plainly instead of guessing. Do not invent calculations or supplier facts.",
    )