"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, type MovimentacaoInput, type TransferenciaInput } from "@/lib/api";

export const keys = {
  movimentacoes: ["movimentacoes"] as const,
  contas: ["contas"] as const,
  categorias: ["categorias"] as const,
};

export function useContas() {
  return useQuery({ queryKey: keys.contas, queryFn: () => api.contas() });
}

export function useCategorias() {
  return useQuery({ queryKey: keys.categorias, queryFn: () => api.categorias() });
}

export function useMovimentacoes() {
  return useQuery({ queryKey: keys.movimentacoes, queryFn: () => api.movimentacoes() });
}

export function useCreateMovimentacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MovimentacaoInput) => api.createMovimentacao(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.movimentacoes }),
  });
}

export function useUpdateMovimentacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MovimentacaoInput> }) =>
      api.updateMovimentacao(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.movimentacoes }),
  });
}

export function useDeleteMovimentacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteMovimentacao(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.movimentacoes }),
  });
}

export function useCriarTransferencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TransferenciaInput) => api.criarTransferencia(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.movimentacoes }),
  });
}
