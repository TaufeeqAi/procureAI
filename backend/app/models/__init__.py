"""
Every model must be imported here, even though nothing in this file uses
the names directly. Two things depend on it:

1. SQLAlchemy's `relationship("ClassName")` string references (used
   throughout app/models/ to avoid circular imports between, e.g.,
   Supplier and Quote) only resolve once every mapped class has actually
   been imported into the same registry — which happens at import time,
   not at class-definition time.
2. Alembic's autogenerate (alembic/env.py) discovers tables via
   `Base.metadata`, which is only populated for models that have been
   imported somewhere in the process before autogenerate runs.

Import order doesn't matter — only that every module runs once.
"""

from app.models.ai_recommendation import AgentRun, AIRecommendation  # noqa: F401
from app.models.communication import CommunicationMessage  # noqa: F401
from app.models.delivery import Delivery, DeliveryException, DeliveryTimelineStep  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.purchase_order import POLineItem, PurchaseOrder  # noqa: F401
from app.models.quote import Quote  # noqa: F401
from app.models.requisition import Requisition  # noqa: F401
from app.models.rfq import RFQ, RFQRecipient  # noqa: F401
from app.models.supplier import (  # noqa: F401
    Supplier,
    SupplierPriceHistoryPoint,
    SupplierTransactionRecord,
)
from app.models.user import User  # noqa: F401
