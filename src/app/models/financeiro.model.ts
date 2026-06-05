export enum TipoLancamento {
  Receita = 1,
  Despesa = 2
}

export enum StatusLancamento {
  Pendente = 1,
  Pago = 2
}

export interface FinanceiroLancamentoResponseDto {
  id: string;
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  status: StatusLancamento;
  dataVencimento: string;
  dataPagamento?: string | null;
  categoria: string;
  clienteId?: string | null;
  clienteNome?: string | null;
  contratoId?: string | null;
  contratoNumero?: string | null;
}

export interface FinanceiroLancamentoCreateDto {
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  status: StatusLancamento;
  dataVencimento: string;
  dataPagamento?: string | null;
  categoria: string;
  clienteId?: string | null;
  contratoId?: string | null;
}

export interface FinanceiroLancamentoUpdateDto {
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  status: StatusLancamento;
  dataVencimento: string;
  dataPagamento?: string | null;
  categoria: string;
  clienteId?: string | null;
  contratoId?: string | null;
}

export interface FinanceiroLancamentoSearchFilterDto {
  tipo?: TipoLancamento | null;
  status?: StatusLancamento | null;
  categoria?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  page?: number;
  pageSize?: number;
}

export interface FinanceiroResumoDto {
  totalReceberPendente: number;
  totalPagarPendente: number;
  totalRecebido: number;
  totalPago: number;
  saldoLiquido: number;
}
