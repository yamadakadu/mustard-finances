import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import type { Movimentacao } from "@/lib/api";
import { brl, formatData } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  items: Movimentacao[];
}

export function RecentMovements({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="grid h-[200px] place-items-center text-sm text-muted-foreground">
        Nenhuma movimentação ainda.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((m) => {
        const isEntrada = m.tipo === "entrada";
        return (
          <li key={m.id_movimentacao} className="flex items-center gap-3 py-3">
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full",
                isEntrada
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive",
              )}
            >
              {isEntrada ? (
                <ArrowDownLeft className="size-4" />
              ) : (
                <ArrowUpRight className="size-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {m.descricao || (isEntrada ? "Entrada" : "Saída")}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatData(m.data_movimentacao)}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 text-sm font-semibold tabular-nums",
                isEntrada ? "text-success" : "text-destructive",
              )}
            >
              {isEntrada ? "+" : "−"} {brl(m.valor)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
