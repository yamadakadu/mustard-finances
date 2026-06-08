from fastapi import APIRouter, HTTPException
from sqlmodel import select

from ..database import SessionDep
from ..models import Banco
from ..schemas.banco import BancoCreate, BancoUpdate, BancoPublic

router = APIRouter(prefix="/bancos", tags=["bancos"])


@router.post("", response_model=BancoPublic, status_code=201)
def create_banco(data: BancoCreate, session: SessionDep):
    banco = Banco.model_validate(data)
    session.add(banco)
    session.commit()
    session.refresh(banco)
    return banco


@router.get("", response_model=list[BancoPublic])
def list_bancos(session: SessionDep):
    return session.exec(select(Banco)).all()


@router.get("/{id_banco}", response_model=BancoPublic)
def get_banco(id_banco: int, session: SessionDep):
    banco = session.get(Banco, id_banco)
    if not banco:
        raise HTTPException(status_code=404, detail="Banco não encontrado")
    return banco


@router.patch("/{id_banco}", response_model=BancoPublic)
def update_banco(id_banco: int, data: BancoUpdate, session: SessionDep):
    banco = session.get(Banco, id_banco)
    if not banco:
        raise HTTPException(status_code=404, detail="Banco não encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(banco, key, value)
    session.add(banco)
    session.commit()
    session.refresh(banco)
    return banco


@router.delete("/{id_banco}", status_code=204)
def delete_banco(id_banco: int, session: SessionDep):
    # banco has no deleted_at column -> hard delete (FKs SET NULL on contas).
    banco = session.get(Banco, id_banco)
    if not banco:
        raise HTTPException(status_code=404, detail="Banco não encontrado")
    session.delete(banco)
    session.commit()
