export enum LeadStatus {
  Novo = 1,
  EmAtendimento = 2,
  Convertido = 3,
  Descartado = 4
}

export const LeadStatusLabels: Record<LeadStatus, string> = {
  [LeadStatus.Novo]: 'Novo',
  [LeadStatus.EmAtendimento]: 'Em Atendimento',
  [LeadStatus.Convertido]: 'Convertido',
  [LeadStatus.Descartado]: 'Descartado'
};

export interface LeadListItem {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  origemId?: string | null;
  origemNome?: string | null;
  imovelId?: string | null;
  imovelCodigo?: string | null;
  status: LeadStatus;
  mensagem?: string | null;
  pessoaId?: string | null;
  dataCriacao: string;
  dataAtualizacao?: string | null;
}

export interface LeadsPageResponse {
  page: number;
  pageSize: number;
  total: number;
  items: LeadListItem[];
  totalNovo: number;
  totalEmAtendimento: number;
  totalConvertido: number;
  totalDescartado: number;
}

export interface LeadsFiltro {
  page: number;
  pageSize: number;
  nome?: string | null;
  email?: string | null;
  telefone?: string | null;
  status?: LeadStatus | null;
  origemId?: string | null;
}

export interface LeadCreateRequest {
  nome: string;
  email?: string | null;
  telefone?: string | null;
  origemId?: string | null;
  imovelId?: string | null;
  mensagem?: string | null;
  status?: LeadStatus;
}

export interface LeadUpdateRequest extends LeadCreateRequest {
  id: string;
}

export interface ConvertLeadRequest {
  tipoPessoa: 'PF' | 'PJ';
  documento?: string | null;
}
