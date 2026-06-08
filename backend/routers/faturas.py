from datetime import datetime

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from ..database import SessionDep
from ..models import Fatura
from ..schemas.fatura import FaturaCreate, FaturaUpdate, FaturaPublic

router = APIRouter(prefix="/faturas", tags=["faturas"])


@router.post("", response_model=FaturaPublic, status_code=201)
def create_fatura(data: FaturaCreate, session: SessionDep):
    fatura = Fatura.model_validate(data)
    session.add(fatura)
    session.commit()
    session.refresh(fatura)
    return fatura


@router.get("", response_model=list[FaturaPublic])
def list_faturas(session: SessionDep):
    return session.exec(select(Fatura).where(Fatura.deleted_at == None)).all()  # noqa: E711


@router.get("/{id_fatura}", response_model=FaturaPublic)
def get_fatura(id_fatura: int, session: SessionDep):
    fatura = session.get(Fatura, id_fatura)
    if not fatura or fatura.deleted_at:
        raise HTTPException(status_code=404, detail="Fatura não encontrada")
    return fatura


@router.patch("/{id_fatura}", response_model=FaturaPublic)
def update_fatura(id_fatura: int, data: FaturaUpdate, session: SessionDep):
    fatura = session.get(Fatura, id_fatura)
    if not fatura or fatura.deleted_at:
        raise HTTPException(status_code=404, detail="Fatura não encontrada")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(fatura, key, value)
    session.add(fatura)
    session.commit()
    session.refresh(fatura)
    return fatura


@router.delete("/{id_fatura}", status_code=204)
def soft_delete_fatura(id_fatura: int, session: SessionDep):
    fatura = session.get(Fatura, id_fatura)
    if not fatura or fatura.deleted_at:
        raise HTTPException(status_code=404, detail="Fatura não encontrada")
    fatura.deleted_at = datetime.now()
    session.add(fatura)
    session.commit()
