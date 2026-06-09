"use client";

import * as React from "react";
import {
  Landmark,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

import { ApiError, type Conta } from "@/lib/api";
import { brl } from "@/lib/format";
import { TIPO_CONTA_LABEL } from "@/lib/contas";
import { useBancos, useContas, useDeleteConta } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { BankQuickAdd } from "@/components/contas/bank-quick-add";
import { cn } from "@/lib/utils";

const ALL = "all";
const NO_BANK = "none";

export default function ContasPage() {
  const contasQ = useContas();
  const bancosQ = useBancos();
  const del = useDeleteConta();

  const contas = React.useMemo(() => contasQ.data ?? [], [contasQ.data]);
  const bancos = React.useMemo(() => bancosQ.data ?? [], [bancosQ.data]);

  const [sel, setSel] = React.useState<string>(ALL); // ALL | NO_BANK | bankId
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Conta | null>(null);
  const [toDelete, setToDelete] = React.useState<Conta | null>(null);
  const [bankAddOpen, setBankAddOpen] = React.useState(false);

  const matches = React.useCallback(
    (c: Conta) =>
      sel === ALL
        ? true
        : sel === NO_BANK
          ? c.id_banco == null
          : String(c.id_banco) === sel,
    [sel],
  );
  const filtered = React.useMemo(() => contas.filter(matches), [contas, matches]);

  const countFor = (key: string) =>
    contas.filter((c) =>
      key === ALL ? true : key === NO_BANK ? c.id_banco == null : String(c.id_banco) === key,
    ).length;

  const total = filtered.reduce((acc, c) => acc + parseFloat(c.saldo_atual ?? "0"), 0);

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

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contas</h1>
          <p className="text-sm text-muted-foreground">
            Saldo {sel === ALL ? "total" : "do filtro"}:{" "}
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

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        {/* Bank menu */}
        <aside className="space-y-1">
          <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Bancos
          </p>
          <BankItem label="Todas as contas" count={countFor(ALL)} active={sel === ALL} onClick={() => setSel(ALL)} />
          {bancos.map((b) => (
            <BankItem
              key={b.id_banco}
              label={b.nome_banco ?? `Banco #${b.id_banco}`}
              count={countFor(String(b.id_banco))}
              active={sel === String(b.id_banco)}
              onClick={() => setSel(String(b.id_banco))}
            />
          ))}
          <BankItem label="Sem banco" count={countFor(NO_BANK)} active={sel === NO_BANK} onClick={() => setSel(NO_BANK)} />
          <Separator className="my-2" />
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setBankAddOpen(true)}
          >
            <Plus />
            Novo banco
          </Button>
        </aside>

        {/* Accounts */}
        <section>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                {offline
                  ? "Não foi possível carregar as contas."
                  : contas.length === 0
                    ? "Nenhuma conta ainda. Clique em Nova conta para começar."
                    : "Nenhuma conta neste filtro."}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((c) => {
                const saldo = parseFloat(c.saldo_atual ?? "0");
                const bancoNome = bancos.find((b) => b.id_banco === c.id_banco)?.nome_banco;
                return (
                  <Card key={c.id_conta}>
                    <CardContent className="flex h-full flex-col gap-3 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {c.nome_conta ?? `Conta #${c.id_conta}`}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Landmark className="size-3" />
                            {bancoNome ?? "Sem banco"}
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
                            <DropdownMenuItem variant="destructive" onClick={() => setToDelete(c)}>
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
        </section>
      </div>

      <ContaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bancos={bancos}
        conta={editing}
      />
      <BankQuickAdd
        open={bankAddOpen}
        onOpenChange={setBankAddOpen}
        onCreated={(b) => setSel(String(b.id_banco))}
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

function BankItem({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        active
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-foreground hover:bg-sidebar-accent/60",
      )}
    >
      <span className="truncate">{label}</span>
      <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
    </button>
  );
}
