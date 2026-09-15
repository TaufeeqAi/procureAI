import inspect
import json
import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.config import get_ai_settings
from app.ai.runtime import build_llm
from app.core.config import get_settings
from app.core.database import get_db
from app.models.ai_recommendation import AIRecommendation
from app.models.quote import Quote
from app.models.requisition import Requisition
from app.models.supplier import Supplier
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import StructuredTool

# Configure logging for production observability
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai-chat"])
DbSession = Annotated[AsyncSession, Depends(get_db)]


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    thread_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    mode: str = "general"


GENERAL_SYSTEM_PROMPT = """
You are the Procurement AI Assistant for Elecon Procurement AI.
You help procurement professionals with system-wide questions.
RULES:
1. Use the available tools to fetch real data. Never fabricate numbers.
2. Be concise and actionable.
3. If a tool returns no data or an error, say so honestly and explain what went wrong.
4. Format lists with bullets when helpful.
"""


# --- Tool Implementations ---

async def _get_dashboard_summary(db: AsyncSession) -> str:
    try:
        requisitions = (await db.execute(select(Requisition))).scalars().all()
        open_prs = len([pr for pr in requisitions if str(pr.status).upper() != "COMPLETED"])
        pending = len([pr for pr in requisitions if str(pr.status).upper() in ("ANALYSIS_READY", "AWAITING_APPROVAL")])
        exceptions = len([pr for pr in requisitions if pr.exceptions])
        
        recs = (await db.execute(select(AIRecommendation))).scalars().all()
        ready = len([r for r in recs if r.recommendation_state == "READY"])
        
        return json.dumps({
            "open_prs": open_prs,
            "ai_ready_recommendations": ready,
            "pending_approvals": pending,
            "exceptions": exceptions,
        })
    except Exception as e:
        logger.error(f"Error fetching dashboard summary: {e}", exc_info=True)
        return json.dumps({"error": "Failed to retrieve dashboard data."})


async def _get_pending_approvals(db: AsyncSession) -> str:
    try:
        requisitions = (await db.execute(
            select(Requisition).where(Requisition.status.in_(["ANALYSIS_READY", "AWAITING_APPROVAL"]))
        )).scalars().all()
        items = [
            {
                "pr_number": r.pr_number,
                "material": r.material_name,
                "status": r.status,
                "exceptions": len(r.exceptions) if r.exceptions else 0,
            }
            for r in requisitions
        ]
        return json.dumps(items) if items else "No PRs currently awaiting approval."
    except Exception as e:
        logger.error(f"Error fetching pending approvals: {e}", exc_info=True)
        return json.dumps({"error": "Failed to retrieve pending approvals."})


async def _get_supplier_risks(db: AsyncSession) -> str:
    try:
        suppliers = (await db.execute(select(Supplier))).scalars().all()
        risky = [
            {
                "name": s.name,
                "risk_level": s.risk_level,
                "quality_acceptance_rate": float(s.quality_acceptance_rate) if s.quality_acceptance_rate else None,
                "on_time_delivery_rate": float(s.on_time_delivery_rate) if s.on_time_delivery_rate else None,
            }
            for s in suppliers
            if s.risk_level in ("HIGH", "MEDIUM") or (s.quality_acceptance_rate and float(s.quality_acceptance_rate) < 0.93)
        ]
        return json.dumps(risky) if risky else "No suppliers currently flagged with elevated risk."
    except Exception as e:
        logger.error(f"Error fetching supplier risks: {e}", exc_info=True)
        return json.dumps({"error": "Failed to retrieve supplier risk data."})


async def _get_cost_savings(db: AsyncSession) -> str:
    try:
        quotes = (await db.execute(select(Quote))).scalars().all()
        suppliers = {s.id: s for s in (await db.execute(select(Supplier))).scalars().all()}
        
        opportunities = []
        total_savings = 0.0
        for q in quotes:
            supplier = suppliers.get(q.supplier_id)
            if supplier and supplier.average_unit_price_amount and q.unit_price_amount:
                if q.unit_price_amount < supplier.average_unit_price_amount:
                    savings = (supplier.average_unit_price_amount - q.unit_price_amount) * (q.quantity or 1)
                    total_savings += savings
                    opportunities.append({
                        # ✅ FIX: Changed q.pr_number to q.requisition_id
                        "pr_number": q.requisition_id,
                        "supplier": supplier.name,
                        "quoted_price": q.unit_price_amount,
                        "benchmark": supplier.average_unit_price_amount,
                        "savings": round(savings, 2),
                    })
        
        return json.dumps({
            "total_estimated_savings_inr": round(total_savings, 2),
            "opportunities": opportunities,
        }) if opportunities else "No cost-saving opportunities currently identified."
    except Exception as e:
        logger.error(f"Error fetching cost savings: {e}", exc_info=True)
        return json.dumps({"error": "Failed to retrieve cost-saving opportunities."})


# --- Helper Functions ---

def _extract_content(response: Any) -> str:
    """Robustly extract text content from various LLM response structures."""
    if not response:
        return ""
    
    content = getattr(response, "content", None)
    if content is None:
        return str(response).strip()
    
    if isinstance(content, str):
        return content.strip()
    
    if isinstance(content, list):
        text_parts = []
        for item in content:
            if isinstance(item, str):
                text_parts.append(item)
            elif isinstance(item, dict):
                if 'text' in item:
                    text_parts.append(str(item['text']))
                elif 'content' in item:
                    text_parts.append(str(item['content']))
        return "\n".join(text_parts).strip() if text_parts else str(content).strip()
    
    if isinstance(content, dict):
        for key in ['text', 'content', 'answer', 'response']:
            if key in content and isinstance(content[key], str):
                return content[key].strip()
        for value in content.values():
            if isinstance(value, str) and len(value) > 10:
                return value.strip()
        return str(content).strip()
    
    return str(content).strip()


def _build_llm_safe(config: Any, app_settings: Any) -> Any:
    """Safely initialize the LLM, handling signature variations."""
    gemini_api_key = getattr(app_settings, "gemini_api_key", None)
    gemini_model = getattr(app_settings, "gemini_model", "gemini-1.5-flash")
    
    sig = inspect.signature(build_llm)
    try:
        if len(sig.parameters) >= 4:
            return build_llm(config.ai, config.groq_api_key, gemini_api_key, gemini_model)
        else:
            return build_llm(config.ai, config.groq_api_key)
    except Exception as e:
        logger.error(f"Failed to initialize LLM: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="AI service initialization failed.")


# --- Endpoint ---

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: DbSession):
    config = get_ai_settings()
    if not config.groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")
    
    app_settings = get_settings()
    llm = _build_llm_safe(config, app_settings)
    
    # Define async wrappers to capture the `db` dependency safely
    async def get_dashboard_summary() -> str:
        return await _get_dashboard_summary(db)

    async def get_pending_approvals() -> str:
        return await _get_pending_approvals(db)

    async def get_supplier_risks() -> str:
        return await _get_supplier_risks(db)

    async def get_cost_savings() -> str:
        return await _get_cost_savings(db)

    # ✅ CRITICAL FIX: Use `coroutine=` explicitly for async functions to prevent RuntimeWarning
    tools = [
        StructuredTool.from_function(
            coroutine=get_dashboard_summary,
            name="get_dashboard_summary",
            description="Get current dashboard KPIs: open PRs, AI-ready recommendations, pending approvals, exceptions.",
        ),
        StructuredTool.from_function(
            coroutine=get_pending_approvals,
            name="get_pending_approvals",
            description="Get list of PRs currently awaiting approval with their material, supplier, and priority.",
        ),
        StructuredTool.from_function(
            coroutine=get_supplier_risks,
            name="get_supplier_risks",
            description="Get suppliers flagged with elevated risk (quality or delivery issues).",
        ),
        StructuredTool.from_function(
            coroutine=get_cost_savings,
            name="get_cost_savings",
            description="Get cost-saving opportunities: quotes above benchmark, negotiation opportunities, and estimated savings.",
        ),
    ]
    
    llm_with_tools = llm.bind_tools(tools)
    
    messages = [
        SystemMessage(content=GENERAL_SYSTEM_PROMPT),
        HumanMessage(content=request.message),
    ]
    
    response = None
    max_iterations = 3
    
    for iteration in range(max_iterations):
        try:
            response = await llm_with_tools.ainvoke(messages)
        except Exception as e:
            logger.error(f"LLM invocation failed on iteration {iteration}: {e}", exc_info=True)
            return ChatResponse(
                answer="I encountered an error while processing your request. Please try again later.",
                mode="general"
            )
        
        if not getattr(response, "tool_calls", None):
            break
        
        messages.append(response)
        
        for tool_call in response.tool_calls:
            tool_name = tool_call["name"]
            tool = next((t for t in tools if t.name == tool_name), None)
            
            if tool:
                try:
                    result = await tool.ainvoke(tool_call["args"])
                    messages.append(ToolMessage(content=str(result), tool_call_id=tool_call["id"]))
                except Exception as exc:
                    error_msg = f"Error executing tool '{tool_name}': {str(exc)}"
                    logger.error(error_msg, exc_info=True)
                    messages.append(ToolMessage(content=error_msg, tool_call_id=tool_call["id"]))
            else:
                messages.append(ToolMessage(content=f"Tool '{tool_name}' not found.", tool_call_id=tool_call["id"]))
    
    # Extract final answer
    answer = ""
    if response:
        # If the model is still trying to call tools after max iterations, force a text response
        if getattr(response, "tool_calls", None):
            messages.append(SystemMessage(content="You have reached the maximum number of tool calls. Please provide a final text summary based on the information gathered so far. Do not make any more tool calls."))
            try:
                final_response = await llm_with_tools.ainvoke(messages)
                answer = _extract_content(final_response)
            except Exception as e:
                logger.error(f"Final LLM invocation failed: {e}", exc_info=True)
                answer = "I gathered some information but encountered an error generating the final summary."
        else:
            answer = _extract_content(response)
    
    if not answer or not answer.strip():
        answer = "I processed your request but couldn't generate a text response. Please try rephrasing your question."

    return ChatResponse(
        answer=answer.strip(),
        mode="general",
    )