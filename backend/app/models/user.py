import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.supplier import Supplier



class ActorRole(enum.StrEnum):
    """Mirrors frontend/types/common.ts `ActorRole` exactly — field-for-
    field parity with the TypeScript union types is the whole point of
    this schema layer; see docs/architecture/backend-contract-parity.md."""

    BUYER = "BUYER"
    PURCHASE_MANAGER = "PURCHASE_MANAGER"
    SUPPLIER = "SUPPLIER"
    IT_ADMIN = "IT_ADMIN"
    AUDITOR = "AUDITOR"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200))
    role: Mapped[ActorRole] = mapped_column(Enum(ActorRole, native_enum=True))

    # Present only when role == SUPPLIER — mirrors Actor.supplierId being
    # optional in types/common.ts.
    supplier_id: Mapped[str | None] = mapped_column(ForeignKey("suppliers.id"), nullable=True)
    supplier: Mapped["Supplier | None"] = relationship(back_populates="users")
