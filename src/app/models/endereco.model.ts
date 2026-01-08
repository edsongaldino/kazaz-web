import { Cidade } from './cidade.model';

export interface EnderecoDto {
  id: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  estadoId: number | null;
  cidadeId: number | null;
  cidadeNome?: string;
  estadoSigla?: string;
}

export interface EnderecoCreateRequest extends Omit<EnderecoDto, 'id'> {}
export interface EnderecoUpdateRequest extends Omit<EnderecoDto, 'id'> {}

export interface EnderecoResponseDto {
  id: string;
  cidadeId: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
}
