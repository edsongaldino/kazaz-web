import { EnderecoResponseDto } from './endereco.model';

export enum EspecialidadePrestador {
  Pintor = 1,
  Encanador = 2,
  Eletricista = 3,
  Pedreiro = 4,
  Jardineiro = 5,
  Limpeza = 6,
  Chaveiro = 7,
  Gesseiro = 8,
  Outro = 9
}

export const EspecialidadePrestadorLabels: Record<EspecialidadePrestador, string> = {
  [EspecialidadePrestador.Pintor]: 'Pintor',
  [EspecialidadePrestador.Encanador]: 'Encanador',
  [EspecialidadePrestador.Eletricista]: 'Eletricista',
  [EspecialidadePrestador.Pedreiro]: 'Pedreiro',
  [EspecialidadePrestador.Jardineiro]: 'Jardineiro',
  [EspecialidadePrestador.Limpeza]: 'Limpeza',
  [EspecialidadePrestador.Chaveiro]: 'Chaveiro',
  [EspecialidadePrestador.Gesseiro]: 'Gesseiro',
  [EspecialidadePrestador.Outro]: 'Outro'
};

export interface PrestadorServicoResponseDto {
  id: string;
  nome: string;
  especialidade: EspecialidadePrestador;
  cpfCnpj: string;
  telefone: string;
  email?: string | null;
  ativo: boolean;
  observacoes?: string | null;
  endereco?: EnderecoResponseDto | null;
}

export interface PrestadorServicoCreateDto {
  nome: string;
  especialidade: EspecialidadePrestador;
  cpfCnpj: string;
  telefone: string;
  email?: string | null;
  ativo: boolean;
  observacoes?: string | null;
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string | null;
    bairro: string;
    cidadeId?: string | null;
  } | null;
}

export interface PrestadorServicoUpdateDto {
  nome: string;
  especialidade: EspecialidadePrestador;
  cpfCnpj: string;
  telefone: string;
  email?: string | null;
  ativo: boolean;
  observacoes?: string | null;
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string | null;
    bairro: string;
    cidadeId?: string | null;
  } | null;
}

export interface PrestadorServicoSearchFilterDto {
  termo?: string;
  especialidade?: EspecialidadePrestador | null;
  ativo?: boolean | null;
  page?: number;
  pageSize?: number;
}
