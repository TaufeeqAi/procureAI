from app.core.exceptions import AppError


class AIConfigurationError(RuntimeError):
    """The AI runtime is not configured correctly."""


class AIExecutionError(RuntimeError):
    """The graph failed while executing an agent or tool."""


class AIOutputValidationError(RuntimeError):
    """The model produced an output that cannot be trusted."""


class AIRequestError(AppError):
    """Stable API error envelope for AI execution failures."""

    status_code = 502
    error_code = "ai_execution_failed"

