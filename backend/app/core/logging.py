import logging.config

from app.core.config import get_settings


def configure_logging() -> None:
    """
    Deliberately stdlib-only (`logging.config.dictConfig`), not structlog
    or loguru. Neither the original build plan nor anything in this phase's
    actual scope needs structured JSON logs with context binding — adding
    that dependency now would be solving a problem this phase doesn't have,
    the same discipline applied to the frontend's AIActionButton in Phase 2
    (generalize when there's a third real use, not preemptively).
    """
    settings = get_settings()

    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
                },
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                },
            },
            "root": {
                "handlers": ["console"],
                "level": settings.log_level,
            },
            "loggers": {
                "uvicorn.access": {"level": "WARNING" if not settings.debug else "INFO"},
                "sqlalchemy.engine": {"level": "WARNING"},
            },
        }
    )
