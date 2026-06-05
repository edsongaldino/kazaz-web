import { EnderecoResponseDto } from './endereco.model';

export interface ImobiliariaResponseDto {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  creci: string;
  dataFundacao?: string | null;
  logoUrl?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: EnderecoResponseDto | null;
}

export interface ImobiliariaUpdateDto {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  creci: string;
  dataFundacao?: string | null;
  logoUrl?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string | null;
    bairro: string;
    cidadeId?: string | null;
  } | null;
}

export interface ImobiliariaCriarDto extends ImobiliariaUpdateDto {
  adminNome: string;
  adminEmail: string;
  adminSenha: string;
}
