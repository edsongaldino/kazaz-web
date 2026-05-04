import { PessoaDto } from "./pessoa.model";

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ConvitePublicInfoResponse {
  valido: boolean;
  motivo?: string | null;
  contratoId?: string | null;
  numeroContrato?: string | null;
  tipo?: number | null;
  papel?: number | null;
  expiraEm?: string | null;
  imovelId?: string | null;
}

export interface PessoaDocumentoInput {
  tipoDocumentoId: string;
  documentoId: string;
  observacao?: string | null;
}

export interface FinalizarCadastroPublicoRequest {
  nome: string;
  enderecoId?: string | null;
  documentos: PessoaDocumentoInput[];
}

export interface FinalizarCadastroPublicoResponse {
  contratoId: string;
  pessoaId: string;
  papel: number;
}

export interface UploadArquivoResponse {
  nome: string;
  caminho: string;
  contentType?: string | null;
  tamanhoBytes: number;
}

export interface DocumentoCreateDto {
  nome: string;
  caminho: string;
  contentType?: string | null;
  tamanhoBytes?: number | null;
  alvo: number;   // 1 Pessoa
  alvoId: string; // PessoaId
  tipoDocumentoId: string;
  contratoId: string;
  observacao?: string | null;
  multiplicidadeIndex?: number | null;
}

export interface DocumentoRequeridoDto {
  tipoDocumentoId: string;
  nome: string;
  obrigatorio: boolean;
  ordem: number;
  multiplicidadeIndex?: number | null;
}

export interface DocumentosRequeridosResponse {
  contratoId: string;
  pessoaId: string | null;
  tipoContrato: number;
  papelContrato: number;
  tipoPessoa: 'PF' | 'PJ';
  itens: DocumentoRequeridoDto[];
}

export interface CadastroPublicoDetalhesDto {
  pessoa: PessoaDto | null;
  documentos: DocumentoVisualizacaoDto[];
}

export interface DocumentoVisualizacaoDto {
  id: string;
  nome: string;
  tipoDocumentoId: string;
  tipoDocumentoNome: string;
  url: string;
  contentType?: string | null;
}


export interface ConviteCadastroListItemResponse {
  id: string;
  contratoId: string;
  numeroContrato: string;
  tipoContrato: number;
  statusContrato: number;
  imovelId: string;
  nomeImovel?: string;

  papel: number;
  status: number;

  token: string;
  link: string;

  criadoEm: string;
  expiraEm?: string;
  usadoEm?: string;
  preenchidoEm?: string;

  pessoaId?: string;
  nomePessoa?: string;
  documento?: string;

  ultimoComentarioAnalise?: string;
}

export interface ListarConvitesCadastroQuery {
  page: number;
  pageSize: number;

  contratoId?: string;
  imovelId?: string;
  status?: number;
  papel?: number;

  nome?: string;
  documento?: string;
  imovel?: string;

  preenchidoDe?: string | null;
  preenchidoAte?: string | null;
}

export interface AnalisarConviteRequest {
  resultado: number;
  comentario?: string;
}