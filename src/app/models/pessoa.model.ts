import { EnderecoResponseDto } from './endereco.model';
import { ContatoDto } from './contato.model';

export type TipoPessoa = 'PF' | 'PJ';

export type EstadoCivil = 'SOLTEIRO' | 'CASADO' | 'DIVORCIADO' | 'VIUVO' | 'SEPARADO';

export interface ConjugeDto {
  nome: string | null;
  cpf: string | null;
  dataNascimento?: string | null;
  telefone?: string | null;
  email?: string | null;
}

export interface DadosComplementaresDto {
  profissao?: string | null;
  escolaridade?: string | null;
  rendaMensal?: number | null;
  observacoes?: string | null;
}

export interface DadosPessoaFisicaDto {
  cpf: string;
  dataNascimento?: string | null;
  rg?: string | null;
  orgaoExpedidor?: string | null;
  nacionalidade?: string | null;
  estadoCivil: EstadoCivil;
  conjuge?: ConjugeDto | null;
  dadosComplementares?: DadosComplementaresDto | null;
}

export interface DadosPessoaJuridicaDto {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string | null;
  dataAbertura?: string | null;
}

interface PessoaBaseDto {
  id: string;
  tipoPessoa: TipoPessoa;
  nome: string;
  documento: string;
  endereco?: EnderecoResponseDto | null;
  origemId?: string;
}

// 👇 DTO de detalhe
export interface PessoaDto extends PessoaBaseDto {
  dadosPessoaFisica?: DadosPessoaFisicaDto | null;
  dadosPessoaJuridica?: DadosPessoaJuridicaDto | null;
  contatos?: ContatoDto[] | null;          // 👈 vale para PF e PJ
}

// 👇 Requests
export interface PessoaCreateRequest {
  tipo: TipoPessoa;
  nome: string;
  documento: string;
  origemId?: string | null;
  endereco?: any | null;
  dadosPessoaFisica?: DadosPessoaFisicaDto | null;
  dadosPessoaJuridica?: DadosPessoaJuridicaDto | null;
  contatos?: ContatoDto[] | null;          // 👈 idem aqui
}

export interface PessoaUpdateRequest extends PessoaCreateRequest {
  id: string;
}

export interface PessoaListItem {
  id: string;
  tipo: TipoPessoa
  nome: string;
  razaoSocial?: string | null; 
  documento?: string | null;    // CPF
  dataNascimento?: string | null;   // "YYYY-MM-DD"
  dataAbertura?: string | null;   // "YYYY-MM-DD"
  enderecoId?: string | null;
  origemId?: string;
}

export interface PessoasPageResponse {
  page: number;
  pageSize: number;
  total: number;
  items: PessoaListItem[];
}