import { Cidade } from './cidade.model';

export interface Endereco {
  id: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cep: string;
  cidadeId: string;
  cidade?: Cidade; // opcional: incluído quando já vier populado da API
  estado?: string;
}
