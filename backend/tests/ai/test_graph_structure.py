from app.ai.config import AISettings
from app.ai.graphs.procurement import build_procurement_graph


def test_graph_builds_with_current_langgraph_package(monkeypatch):
    # The graph constructor creates ChatGroq lazily enough for package-level
    # construction; a fake API key is sufficient because no network call occurs.
    settings = AISettings(
        model="qwen/qwen3-32b",
        temperature=0,
        max_tokens=512,
        timeout_seconds=30,
        max_retries=0,
        max_agent_attempts=1,
        graph_version="test",
        prompt_version="test",
    )
    graph = build_procurement_graph(ai_settings=settings, api_key="test-key", checkpointer=None)
    nodes = set(graph.get_graph().nodes)
    assert {"requirement", "supplier", "quote", "risk", "negotiation", "analyst"}.issubset(nodes)

