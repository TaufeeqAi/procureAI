from __future__ import annotations


def evidence_grounding_rate(referenced: list[str], allowed: set[str]) -> float:
    if not referenced:
        return 0.0
    return sum(1 for item in referenced if item in allowed) / len(referenced)


def supplier_consistency(ai_supplier_id: str, deterministic_supplier_id: str) -> float:
    return 1.0 if ai_supplier_id == deterministic_supplier_id else 0.0

