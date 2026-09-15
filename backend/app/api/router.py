from fastapi import APIRouter

from app.api import (
    ai,
    communications,
    dashboard,
    deliveries,
    intelligence,
    notifications,
    purchase_orders,
    quotes,
    recommendations,
    requisitions,
    rfqs,
    search,
    suppliers,
    chat,
)

api_router = APIRouter()

api_router.include_router(dashboard.router)
api_router.include_router(requisitions.router)
api_router.include_router(communications.router)
api_router.include_router(recommendations.router)
api_router.include_router(suppliers.router)
api_router.include_router(rfqs.router)
api_router.include_router(quotes.router)
api_router.include_router(purchase_orders.router)
api_router.include_router(deliveries.router)
api_router.include_router(intelligence.router)
api_router.include_router(notifications.router)
api_router.include_router(ai.router)
api_router.include_router(search.router)
api_router.include_router(chat.router)

