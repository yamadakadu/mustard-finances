// Typed client for the FastAPI backend.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ----- types (mirror backend schemas; money fields are strings) -----
export type TipoConta = "corrente" | "caixinha" | "cartao_credito" | "saldo_separado";
export type TipoMovimentacao = "entrada" | "saida";

export interface Conta {
  id_conta: number;
  nome_conta: string | null;
  tipo: TipoConta;
  moeda: string;
  saldo_inicial: string;
  id_banco: number | null;
  created_at: string | null;
  saldo_atual?: string; // present on list/get responses
}

export interface Banco {
  id_banco: number;
  nome_banco: string | null;
}

export interface ContaInput {
  nome_conta?: string | null;
  tipo: TipoConta;
  moeda?: string;
  saldo_inicial?: string;
  id_banco?: number | null;
}

export interface Movimentacao {
  id_movimentacao: number;
  id_conta: number | null;
  id_categoria: number | null;
  id_fatura: number | null;
  id_movimentacao_par: number | null;
  tipo: TipoMovimentacao;
  valor: string;
  descricao: string | null;
  recorrencia: "fixo" | "variavel" | null;
  data_movimentacao: string | null;
  created_at: string | null;
}

export interface Resumo {
  saldo_total: string;
  entradas_mes: string;
  saidas_mes: string;
  num_contas: number;
  ano: number;
  mes: number;
}

export interface GastoCategoria {
  id_categoria: number;
  nome_categoria: string;
  total: string;
}

export interface Categoria {
  id_categoria: number;
  nome_categoria: string | null;
  id_pai: number | null;
  created_at: string | null;
}

export interface MovimentacaoInput {
  id_conta: number;
  id_categoria?: number | null;
  id_fatura?: number | null;
  tipo: TipoMovimentacao;
  valor: string;
  descricao?: string | null;
  recorrencia?: "fixo" | "variavel" | null;
  data_movimentacao?: string | null;
}

export interface TransferenciaInput {
  id_conta_origem: number;
  id_conta_destino: number;
  valor: string;
  descricao?: string | null;
  id_categoria?: number | null;
  data_movimentacao?: string | null;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function apiGet<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    // network error / server down
    throw new ApiError(0, "Não foi possível conectar à API.");
  }
  if (!res.ok) {
    throw new ApiError(res.status, `Erro ${res.status} ao buscar ${path}`);
  }
  return res.json() as Promise<T>;
}

async function apiSend<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API.");
  }
  if (!res.ok) {
    let detail = `Erro ${res.status}`;
    try {
      const data = await res.json();
      if (data?.detail) {
        detail =
          typeof data.detail === "string"
            ? data.detail
            : "Dados inválidos. Verifique os campos.";
      }
    } catch {
      // body wasn't JSON; keep the generic message
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  resumo: (ano?: number, mes?: number) => {
    const qs = new URLSearchParams();
    if (ano) qs.set("ano", String(ano));
    if (mes) qs.set("mes", String(mes));
    const suffix = qs.toString() ? `?${qs}` : "";
    return apiGet<Resumo>(`/relatorios/resumo${suffix}`);
  },
  gastosPorCategoria: (ano?: number, mes?: number) => {
    const qs = new URLSearchParams();
    if (ano) qs.set("ano", String(ano));
    if (mes) qs.set("mes", String(mes));
    const suffix = qs.toString() ? `?${qs}` : "";
    return apiGet<GastoCategoria[]>(`/relatorios/gastos-por-categoria${suffix}`);
  },
  movimentacoesRecentes: (limit = 8) =>
    apiGet<Movimentacao[]>(`/movimentacoes?limit=${limit}`),
  movimentacoes: (limit?: number) =>
    apiGet<Movimentacao[]>(`/movimentacoes${limit ? `?limit=${limit}` : ""}`),
  contas: () => apiGet<Conta[]>("/contas"),
  categorias: () => apiGet<Categoria[]>("/categorias"),
  bancos: () => apiGet<Banco[]>("/bancos"),

  createConta: (data: ContaInput) => apiSend<Conta>("POST", "/contas", data),
  updateConta: (id: number, data: Partial<ContaInput>) =>
    apiSend<Conta>("PATCH", `/contas/${id}`, data),
  deleteConta: (id: number) => apiSend<void>("DELETE", `/contas/${id}`),

  createMovimentacao: (data: MovimentacaoInput) =>
    apiSend<Movimentacao>("POST", "/movimentacoes", data),
  updateMovimentacao: (id: number, data: Partial<MovimentacaoInput>) =>
    apiSend<Movimentacao>("PATCH", `/movimentacoes/${id}`, data),
  deleteMovimentacao: (id: number) =>
    apiSend<void>("DELETE", `/movimentacoes/${id}`),
  criarTransferencia: (data: TransferenciaInput) =>
    apiSend<Movimentacao[]>("POST", "/movimentacoes/transferencia", data),
};
