"use client";

import { ArrowLeftRight, Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Movimentacao } from "@/lib/api";
import { brl, formatData } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  items: Movimentacao[];
  contaNome: (id: number | null) => string;
  categoriaNome: (id: number | null) => string;
  onEdit: (m: Movimentacao) => void;
  onDuplicate: (m: Movimentacao) => void;
  onDelete: (m: Movimentacao) => void;
}

export function MovementsTable({
  items,
  contaNome,
  categoriaNome,
  onEdit,
  onDuplicate,
  onDelete,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="grid h-40 place-items-center text-sm text-muted-foreground">
        Nenhuma movimentação encontrada.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((m) => {
            const isEntrada = m.tipo === "entrada";
            const isTransfer = m.id_movimentacao_par !== null;
            return (
              <TableRow key={m.id_movimentacao}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatData(m.data_movimentacao)}
                </TableCell>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    {m.descricao || (isEntrada ? "Entrada" : "Saída")}
                    {isTransfer && (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <ArrowLeftRight className="size-3" />
                        transf.
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {contaNome(m.id_conta)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {categoriaNome(m.id_categoria)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold tabular-nums",
                    isEntrada ? "text-success" : "text-destructive",
                  )}
                >
                  {isEntrada ? "+" : "−"} {brl(m.valor)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Ações"
                        />
                      }
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(m)}>
                        <Pencil className="size-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate(m)}>
                        <Copy className="size-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDelete(m)}
                      >
                        <Trash2 className="size-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
