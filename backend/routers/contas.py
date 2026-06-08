from datetime import datetime

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from ..database import SessionDep
from ..models import Conta
from ..schemas.conta import ContaCreate, ContaUpdate, ContaPublic

router = APIRouter(prefix="/contas", tags=["contas"])


@router.post("", response_model=ContaPublic, status_code=201)
def create_conta(data: ContaCreate, session: SessionDep):
    conta = Conta.model_validate(data)
    session.add(conta)
    session.commit()
    session.refresh(conta)
    return conta


@router.get("", response_model=list[ContaPublic])
def list_contas(session: SessionDep):
    return session.exec(select(Conta).where(Conta.deleted_at == None)).all()  # noqa: E711


@router.get("/{id_conta}", response_model=ContaPublic)
def get_conta(id_conta: int, session: SessionDep):
    conta = session.get(Conta, id_conta)
    if not conta or conta.deleted_at:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    return conta


@router.patch("/{id_conta}", response_model=ContaPublic)
def update_conta(id_conta: int, data: ContaUpdate, session: SessionDep):
    conta = session.get(Conta, id_conta)
    if not conta or conta.deleted_at:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(conta, key, value)
    session.add(conta)
    session.commit()
    session.refresh(conta)
    return conta


@router.delete("/{id_conta}", status_code=204)
def soft_delete_conta(id_conta: int, session: SessionDep):
    conta = session.get(Conta, id_conta)
    if not conta or conta.deleted_at:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    conta.deleted_at = datetime.now()
    session.add(conta)
    session.commit()
