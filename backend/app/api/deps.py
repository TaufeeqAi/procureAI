from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

# A single typed alias used in every route signature (`db: DbSession`)
# rather than repeating `Annotated[AsyncSession, Depends(get_db)]` at
# every endpoint — Phase 3 has no auth yet (out of this phase's scope per
# the master plan), so this is the only shared dependency today. A
# `CurrentUser` dependency has an obvious home here once auth exists.
DbSession = Annotated[AsyncSession, Depends(get_db)]
