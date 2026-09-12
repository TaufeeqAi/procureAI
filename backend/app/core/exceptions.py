import logging

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

logger = logging.getLogger("app.exceptions")


class AppError(Exception):
    """Base for every domain-level error this API raises on purpose (as
    opposed to an unhandled bug). Carries an HTTP status and a machine-
    readable `code` so the frontend can branch on error type without
    string-matching a human-readable message."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    code: str = "app_error"

    def __init__(self, message: str, *, code: str | None = None):
        self.message = message
        if code:
            self.code = code
        super().__init__(message)


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "not_found"


class ConflictError(AppError):
    """A version/concurrency conflict — the same class of situation
    docs/architecture/state-machines.md names on the frontend (another
    user's update landed first). Distinct from a plain validation error so
    the frontend can render its ConflictState component specifically."""

    status_code = status.HTTP_409_CONFLICT
    code = "conflict"


class PolicyViolationError(AppError):
    """A procurement policy check failed (e.g. a buyer trying to approve
    a PO above their authorization limit) — see the PolicyCheck contract
    in the frontend's types/ai.ts, which this mirrors."""

    status_code = status.HTTP_403_FORBIDDEN
    code = "policy_violation"


def register_exception_handlers(app: FastAPI) -> None:
    """Every error this API returns — expected or not — comes back as
    `{"code": str, "message": str}`. A frontend integration should never
    need two different error-shape branches depending on which endpoint
    failed."""

    @app.exception_handler(AppError)
    async def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"code": exc.code, "message": exc.message})

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        # Logged with the request path so an on-call engineer can correlate
        # this against access logs; never leaked into the response body —
        # an unhandled exception's message may contain internals (a SQL
        # fragment, a file path) that shouldn't reach the client.
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"code": "internal_error", "message": "An unexpected error occurred."},
        )
