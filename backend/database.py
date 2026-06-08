from typing import Annotated

from fastapi import Depends
from sqlmodel import Session, create_engine

from .config import settings

# pool_pre_ping avoids "MySQL server has gone away" on idle connections.
engine = create_engine(settings.database_url, pool_pre_ping=True)


def get_session():
    """FastAPI dependency: yields a DB session per request and closes it after.

    On any error we roll back before re-raising, so a failed transaction never
    leaks into the next use of the connection.
    """
    with Session(engine) as session:
        try:
            yield session
        except Exception:
            session.rollback()
            raise


# Reusable annotated dependency: `session: SessionDep` in any path operation.
SessionDep = Annotated[Session, Depends(get_session)]
