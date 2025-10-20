export type TipoPessoa = 'FISICA' | 'JURIDICA';

export interface PessoaListItem {
  id: string;
  tipo: TipoPessoa
  nome: string;
  razaoSocial?: string | null; 
  documento?: string | null;    // CPF
  nascimento?: string | null;   // "YYYY-MM-DD"
  enderecoId?: string | null;
}

export interface PessoasPageResponse {
  page: number;
  pageSize: number;
  total: number;
  items: PessoaListItem[];
}


export interface PessoaCreateRequest {
  tipo: TipoPessoa;
  nome?: string | null;         // PF: obrigatório, PJ: opcional (nome fantasia)
  razaoSocial?: string | null;  // PJ: obrigatório
  documento: string;            // CPF/CNPJ (só dígitos)
  nascimento?: string | null;   // PF
  endereco?: any | null;        // se seu <app-endereco> devolver objeto, envie aqui
  enderecoId?: string | null;   // ou envie só o Id se já existir
}

export interface PessoaUpdateRequest extends PessoaCreateRequest {
  id: string;
}