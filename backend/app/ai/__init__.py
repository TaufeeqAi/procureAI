"""Phase 5 AI orchestration package.

This package owns agent orchestration and model interaction. It deliberately
imports deterministic procurement capabilities from ``app.calculations`` and
``app.services`` rather than re-implementing business truth in prompts.
"""

from app.ai.service import ProcurementAIService

__all__ = ["ProcurementAIService"]

