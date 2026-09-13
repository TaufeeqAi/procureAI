from __future__ import annotations

from app.ai.errors import AIOutputValidationError


def validate_agent_outputs(result: dict, facts: dict) -> None:
    candidates = facts["deterministic_intelligence"]["candidates"]
    allowed_suppliers = {item["supplier_id"] for item in candidates}
    
    # CRITICAL: Allow BOTH quote_id and quote_reference to prevent mismatches
    allowed_quotes = set()
    for item in candidates:
        if item.get("quote_id"):
            allowed_quotes.add(item["quote_id"])
        if item.get("quote_reference"):
            allowed_quotes.add(item["quote_reference"])
            
    allowed_evidence = set(facts["evidence_catalog"])
    winner = facts["deterministic_intelligence"]["recommended_supplier_id"]

    supplier = result.get("supplier_analysis", {})
    if supplier and supplier.get("recommended_supplier_id") != winner:
        raise AIOutputValidationError(
            f"Supplier Agent selected '{supplier.get('recommended_supplier_id')}', expected deterministic winner '{winner}'."
        )
    for item in supplier.get("shortlist", []):
        if item.get("supplier_id") not in allowed_suppliers:
            raise AIOutputValidationError(f"Supplier Agent referenced unknown supplier '{item.get('supplier_id')}'.")

    quote = result.get("quote_analysis", {})
    unknown_quotes = set(quote.get("validated_quote_ids", [])) - allowed_quotes
    if unknown_quotes:
        raise AIOutputValidationError(f"Quote Agent referenced unknown quotes: {', '.join(sorted(unknown_quotes))}.")

    for key in ("requirement", "supplier_analysis", "quote_analysis", "risk_analysis", "negotiation", "final_analysis"):
        evidence_ids = set((result.get(key) or {}).get("evidence_ids", []))
        unknown = evidence_ids - allowed_evidence
        if unknown:
            raise AIOutputValidationError(
                f"{key} referenced unknown evidence IDs: {', '.join(sorted(unknown))}."
            )

    negotiation = result.get("negotiation", {})
    if negotiation and negotiation.get("supplier_id") not in allowed_suppliers:
        raise AIOutputValidationError(
            f"Negotiation Agent referenced unknown supplier '{negotiation.get('supplier_id')}'."
        )
    if negotiation and negotiation.get("supplier_id") != winner:
        raise AIOutputValidationError(
            f"Negotiation Agent targeted '{negotiation.get('supplier_id')}', expected deterministic winner '{winner}'."
        )

    final = result.get("final_analysis", {})
    if final.get("supplier_id") != winner:
        raise AIOutputValidationError(
            f"Procurement Analyst selected '{final.get('supplier_id')}', expected deterministic winner '{winner}'."
        )