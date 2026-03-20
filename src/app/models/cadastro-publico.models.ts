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
