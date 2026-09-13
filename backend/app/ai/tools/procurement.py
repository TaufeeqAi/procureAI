from __future__ import annotations

from datetime import date

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

from app.calculations.landed_cost import calculate_landed_cost
from app.calculations.pricing import price_variance_percent


class LandedCostInput(BaseModel):
    unit_price_inr: float = Field(ge=0)
    quantity: int = Field(gt=0)
    freight_inr: float = Field(ge=0)
    tax_rate_percent: float = Field(ge=0, le=100)


class BenchmarkInput(BaseModel):
    current_price_inr: float = Field(ge=0)
    benchmark_inr: float = Field(ge=0)


class DeliveryInput(BaseModel):
    required_date: date
    quoted_delivery_date: date


def _landed_cost(payload: LandedCostInput) -> dict:
    result = calculate_landed_cost(**payload.model_dump())
    return result.model_dump() if hasattr(result, "model_dump") else result


def _benchmark(payload: BenchmarkInput) -> dict:
    return {
        "current_price_inr": payload.current_price_inr,
        "benchmark_inr": payload.benchmark_inr,
        "variance_percent": price_variance_percent(payload.current_price_inr, payload.benchmark_inr),
    }


def _delivery(payload: DeliveryInput) -> dict:
    slack = (payload.required_date - payload.quoted_delivery_date).days
    return {"delivery_slack_days": slack, "on_or_before_required_date": slack >= 0}

procurement_tools = [
    StructuredTool.from_function(
        _landed_cost,
        name="calculate_landed_cost",
        description="Calculate landed cost using the Phase 4 deterministic financial engine. Never calculate taxes manually.",
        args_schema=LandedCostInput,
    ),
    StructuredTool.from_function(
        _benchmark,
        name="calculate_price_variance",
        description="Calculate current quote variance against the authoritative benchmark.",
        args_schema=BenchmarkInput,
    ),
    StructuredTool.from_function(
        _delivery,
        name="calculate_delivery_slack",
        description="Calculate delivery schedule slack against the required date.",
        args_schema=DeliveryInput,
    ),
]

