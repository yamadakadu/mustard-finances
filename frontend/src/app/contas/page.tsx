"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Plus, Trash2, WifiOff } from "lucide-react";
import { toast } from "sonner";

import { ApiError, type Conta } from "@/lib/api";
import { brl } from "@/lib/format";
import { TIPO_CONTA_LABEL } from "@/lib/contas";
import { useBancos, useContas, useDeleteConta } from "@/lib/queries";
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
import { ContaDialog } from "@/components/contas/conta-dialog";
import { cn } from "@/lib/utils";

export default function ContasPage() {
  const contasQ = useContas();
  const bancosQ = useBancos();
  const del = useDeleteConta();

  const contas = React.useMemo(() => contasQ.data ?? [], [contasQ.data]);
  const bancos = React.useMemo(() => bancosQ.data ?? [], [bancosQ.data]);
  const bancoNome = React.useCallback(
    (id: number | null) => bancos.find((b) => b.id_banco === id)?.nome_banco ?? null,
    [bancos],
  );

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Conta | null>(null);
  const [toDelete, setToDelete] = React.useState<Conta | null>(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (c: Conta) => {
    setEditing(c);
    setDialogOpen(true);
  };

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id_conta);
      toast.success("Conta excluída");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erro ao excluir");
    } finally {
      setToDelete(null);
    }
  }

  const offline = contasQ.error instanceof ApiError && contasQ.error.status === 0;
  const loading = contasQ.isLoading || bancosQ.isLoading;
  const total = contas.reduce((acc, c) => acc + parseFloat(c.saldo_atual ?? "0"), 0);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contas</h1>
          <p className="text-sm text-muted-foreground">
            Saldo total:{" "}
            <span className="font-medium text-foreground tabular-nums">{brl(total)}</span>
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus />
          Nova conta
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

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : contas.length === 0 && !offline ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma conta ainda. Clique em <strong>Nova conta</strong> para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contas.map((c) => {
            const saldo = parseFloat(c.saldo_atual ?? "0");
            return (
              <Card key={c.id_conta}>
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {c.nome_conta ?? `Conta #${c.id_conta}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bancoNome(c.id_banco) ?? "Sem banco"}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="-mr-2 -mt-1 size-8"
                            aria-label="Ações"
                          />
                        }
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(c)}>
                          <Pencil className="size-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setToDelete(c)}
                        >
                          <Trash2 className="size-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <Badge variant="secondary" className="w-fit">
                    {TIPO_CONTA_LABEL[c.tipo]}
                  </Badge>

                  <div className="mt-auto">
                    <p className="text-xs text-muted-foreground">Saldo atual</p>
                    <p
                      className={cn(
                        "text-xl font-semibold tabular-nums",
                        saldo < 0 && "text-destructive",
                      )}
                    >
                      {brl(saldo)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ContaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bancos={bancos}
        conta={editing}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.nome_conta
                ? `"${toDelete.nome_conta}" será removida.`
                : "Esta conta será removida."}{" "}
              Apenas contas sem movimentações podem ser excluídas.
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
