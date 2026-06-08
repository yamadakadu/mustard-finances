from datetime import datetime

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from ..database import SessionDep
from ..models import Categoria
from ..schemas.categoria import CategoriaCreate, CategoriaUpdate, CategoriaPublic

router = APIRouter(prefix="/categorias", tags=["categorias"])


@router.post("", response_model=CategoriaPublic, status_code=201)
def create_categoria(data: CategoriaCreate, session: SessionDep):
    categoria = Categoria.model_validate(data)
    session.add(categoria)
    session.commit()
    session.refresh(categoria)
    return categoria


@router.get("", response_model=list[CategoriaPublic])
def list_categorias(session: SessionDep):
    return session.exec(
        select(Categoria).where(Categoria.deleted_at == None)  # noqa: E711
    ).all()


@router.get("/{id_categoria}", response_model=CategoriaPublic)
def get_categoria(id_categoria: int, session: SessionDep):
    categoria = session.get(Categoria, id_categoria)
    if not categoria or categoria.deleted_at:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return categoria


@router.patch("/{id_categoria}", response_model=CategoriaPublic)
def update_categoria(id_categoria: int, data: CategoriaUpdate, session: SessionDep):
    categoria = session.get(Categoria, id_categoria)
    if not categoria or categoria.deleted_at:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(categoria, key, value)
    session.add(categoria)
    session.commit()
    session.refresh(categoria)
    return categoria


@router.delete("/{id_categoria}", status_code=204)
def soft_delete_categoria(id_categoria: int, session: SessionDep):
    categoria = session.get(Categoria, id_categoria)
    if not categoria or categoria.deleted_at:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    categoria.deleted_at = datetime.now()
    session.add(categoria)
    session.commit()
