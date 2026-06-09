"use client";

import * as React from "react";
import {
  CornerDownRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

import { ApiError, type Categoria } from "@/lib/api";
import { buildTree, type CategoriaNode } from "@/lib/categorias";
import { useCategorias, useDeleteCategoria } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CategoriaDialog } from "@/components/categorias/categoria-dialog";

export default function CategoriasPage() {
  const categoriasQ = useCategorias();
  const del = useDeleteCategoria();

  const categorias = React.useMemo(() => categoriasQ.data ?? [], [categoriasQ.data]);
  const tree = React.useMemo(() => buildTree(categorias), [categorias]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Categoria | null>(null);
  const [toDelete, setToDelete] = React.useState<Categoria | null>(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (c: Categoria) => {
    setEditing(c);
    setDialogOpen(true);
  };

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id_categoria);
      toast.success("Categoria excluída");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao excluir");
    } finally {
      setToDelete(null);
    }
  }

  const offline = categoriasQ.error instanceof ApiError && categoriasQ.error.status === 0;
  const loading = categoriasQ.isLoading;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            Organize seus lançamentos (com hierarquia opcional)
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus />
          Nova categoria
        </Button>
      </div>

      {offline && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <WifiOff className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">API indisponível</p>
              <p className="text-muted-foreground">
                Verifique se o backend (FastAPI) e o MySQL estão rodando.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-2">
          {loading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : tree.length === 0 ? (
            <div className="grid h-32 place-items-center text-sm text-muted-foreground">
              {offline ? "Não foi possível carregar." : "Nenhuma categoria ainda."}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              <CategoryRows nodes={tree} depth={0} onEdit={openEdit} onDelete={setToDelete} />
            </ul>
          )}
        </CardContent>
      </Card>

      <CategoriaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categorias={categorias}
        categoria={editing}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.nome_categoria
                ? `"${toDelete.nome_categoria}" será removida.`
                : "Esta categoria será removida."}{" "}
              Subcategorias passam a ser categorias raiz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoryRows({
  nodes,
  depth,
  onEdit,
  onDelete,
}: {
  nodes: CategoriaNode[];
  depth: number;
  onEdit: (c: Categoria) => void;
  onDelete: (c: Categoria) => void;
}) {
  return (
    <>
      {nodes.map((node) => (
        <React.Fragment key={node.id_categoria}>
          <li
            className="flex items-center gap-2 py-2 pr-2"
            style={{ paddingLeft: 8 + depth * 22 }}
          >
            {depth > 0 && <CornerDownRight className="size-3.5 shrink-0 text-muted-foreground" />}
            <span className="flex-1 truncate text-sm font-medium">
              {node.nome_categoria ?? `Categoria #${node.id_categoria}`}
            </span>
            {node.filhos.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {node.filhos.length}
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Ações" />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(node)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(node)}>
                  <Trash2 className="size-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
          {node.filhos.length > 0 && (
            <CategoryRows nodes={node.filhos} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
          )}
        </React.Fragment>
      ))}
    </>
  );
}
