"use client";

import * as React from "react";
import {
  Landmark,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
  WifiOff,
} from "lucide-react";

import { api, type GastoCategoria, type Movimentacao, type Resumo } from "@/lib/api";
import { brl, nomeMes } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { RecentMovements } from "@/components/dashboard/recent-movements";

export default function DashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [offline, setOffline] = React.useState(false);
  const [resumo, setResumo] = React.useState<Resumo | null>(null);
  const [gastos, setGastos] = React.useState<GastoCategoria[]>([]);
  const [recentes, setRecentes] = React.useState<Movimentacao[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    const [r, g, m] = await Promise.allSettled([
      api.resumo(),
      api.gastosPorCategoria(),
      api.movimentacoesRecentes(8),
    ]);
    setOffline(r.status === "rejected");
    if (r.status === "fulfilled") setResumo(r.value);
    if (g.status === "fulfilled") setGastos(g.value);
    if (m.status === "fulfilled") setRecentes(m.value);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const now = new Date();
  const periodo = resumo
    ? `${nomeMes(resumo.mes)} de ${resumo.ano}`
    : `${nomeMes(now.getMonth() + 1)} de ${now.getFullYear()}`;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
          <p className="text-sm capitalize text-muted-foreground">{periodo}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Atualizar
        </Button>
      </div>

      {offline && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <WifiOff className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">API indisponível</p>
              <p className="text-muted-foreground">
                Não foi possível conectar em{" "}
                <code className="rounded bg-muted px-1">
                  {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}
                </code>
                . Verifique se o backend (FastAPI) e o MySQL estão rodando.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[108px] rounded-xl" />
          ))
        ) : (
          <>
            <KpiCard
              title="Saldo total"
              value={brl(resumo?.saldo_total ?? 0)}
              icon={Wallet}
              highlight
              hint="Somando todas as contas"
            />
            <KpiCard
              title="Entradas no mês"
              value={brl(resumo?.entradas_mes ?? 0)}
              icon={TrendingUp}
              valueClassName="text-success"
            />
            <KpiCard
              title="Saídas no mês"
              value={brl(resumo?.saidas_mes ?? 0)}
              icon={TrendingDown}
              valueClassName="text-destructive"
            />
            <KpiCard
              title="Contas"
              value={String(resumo?.num_contas ?? 0)}
              icon={Landmark}
              hint="Ativas"
            />
          </>
        )}
      </div>

      {/* Chart + recent */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Gastos por categoria</CardTitle>
            <CardDescription>Saídas do mês, transferências excluídas</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] rounded-xl" />
            ) : (
              <SpendingChart data={gastos} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Movimentações recentes</CardTitle>
            <CardDescription>Últimos lançamentos</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : (
              <RecentMovements items={recentes} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
