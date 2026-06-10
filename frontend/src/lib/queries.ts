"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  api,
  type CategoriaInput,
  type ContaInput,
  type MovimentacaoInput,
  type TransferenciaInput,
} from "@/lib/api";

export const keys = {
  movimentacoes: ["movimentacoes"] as const,
  contas: ["contas"] as const,
  categorias: ["categorias"] as const,
  bancos: ["bancos"] as const,
};

export function useContas() {
  return useQuery({ queryKey: keys.contas, queryFn: () => api.contas() });
}

export function useBancos() {
  return useQuery({ queryKey: keys.bancos, queryFn: () => api.bancos() });
}

export function useCreateBanco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nome: string) => api.createBanco(nome),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.bancos }),
  });
}

export function useDeleteBanco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteBanco(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.bancos });
      qc.invalidateQueries({ queryKey: keys.contas }); // accounts lose their bank
    },
  });
}

export function useCreateConta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ContaInput) => api.createConta(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.contas }),
  });
}

export function useUpdateConta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ContaInput> }) =>
      api.updateConta(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.contas }),
  });
}

export function useDeleteConta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteConta(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.contas }),
  });
}

export function useCategorias() {
  return useQuery({ queryKey: keys.categorias, queryFn: () => api.categorias() });
}

export function useCreateCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CategoriaInput) => api.createCategoria(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.categorias }),
  });
}

export function useUpdateCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CategoriaInput> }) =>
      api.updateCategoria(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.categorias }),
  });
}

export function useDeleteCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteCategoria(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.categorias }),
  });
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
