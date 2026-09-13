import pytest

from app.ai.errors import AIOutputValidationError


def test_validation_error_is_explicit():
    with pytest.raises(AIOutputValidationError):
        raise AIOutputValidationError("AI returned unknown evidence IDs: fabricated")

