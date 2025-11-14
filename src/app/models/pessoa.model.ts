import { EnderecoResponseDto } from './endereco.model';
import { Origem } from './origem.model';

export type TipoPessoa = 'PF' | 'PJ';

interface PessoaBaseDto {
  id: string;
  tipoPessoa: TipoPessoa;
  nome: string;
  documento: string;
  endereco: EnderecoResponseDto; // caso venha sem endereço
  origemId?: string;
}

export interface PessoaPFDto extends PessoaBaseDto {
  tipoPessoa: 'PF';
  dataNascimento: string | null; // "1984-11-24" (ISO) — parseie para Date se preferir
  razaoSocial?: null;            // não se aplica a PF
}

export interface PessoaPJDto extends PessoaBaseDto {
  tipoPessoa: 'PJ';
  dataNascimento?: null;         // não se aplica a PJ
  razaoSocial: string;           // obrigatório para PJ
}

export type PessoaDto = PessoaPFDto | PessoaPJDto;

export interface PessoaListItem {
  id: string;
  tipo: TipoPessoa
  nome: string;
  razaoSocial?: string | null; 
  documento?: string | null;    // CPF
  dataNascimento?: string | null;   // "YYYY-MM-DD"
  enderecoId?: string | null;
  origemId?: string;
}

export interface PessoasPageResponse {
  page: number;
  pageSize: number;
  total: number;
  items: PessoaListItem[];
}

export interface PessoaCreateRequest {
  tipo: TipoPessoa;
  nome?: string | null;
  razaoSocial?: string | null;
  documento: string;
  dataNascimento?: string | null; 
  endereco?: any | null; 
  enderecoId?: string | null;
  origemId?: string | null; 
}

export interface PessoaUpdateRequest extends PessoaCreateRequest {
  id: string;
}