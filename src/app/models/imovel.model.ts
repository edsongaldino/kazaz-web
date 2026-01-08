import { ImovelCaracteristicaDto, ImovelCaracteristicaUpsertRequest } from "./caracteristica.model";
import { EnderecoCreateRequest, EnderecoDto } from "./endereco.model";
import { FinalidadeImovel, StatusImovel, TipoValorCaracteristica } from "./enums.model";


export interface VinculoPessoaImovelUpsertRequest {
  pessoaId: string; // Guid
  perfilVinculoImovelId: string; // Guid
}

// ✅ DTO único para create/update (Upsert)
export interface ImovelUpsertRequest {
  codigo: string;
  titulo?: string | null;
  finalidade: FinalidadeImovel;
  status: StatusImovel;
  tipoImovelId: string; // Guid
  endereco: EnderecoCreateRequest;
  observacoes?: string | null;
  caracteristicas: ImovelCaracteristicaUpsertRequest[];
  vinculos: VinculoPessoaImovelUpsertRequest[];
}

// ---- retorno do GET detalhado ----

export interface TipoImovelDto {
  id: string;
  nome: string;
}

export interface VinculoPessoaImovelDto {
  id: string;
  pessoaId: string;
  pessoaNome: string;
  perfilVinculoImovelId: string;
  perfilNome: string;
}

export interface ImovelFotoDto {
  id: string;
  url: string;
  ordem: number;
  principal: boolean;
}

export interface ImovelDocumentoDto {
  id: string;
  nome: string;
  url: string;
}

export interface ImovelDto {
  id: string;
  codigo: string;
  titulo?: string | null;
  finalidade: FinalidadeImovel;
  status: StatusImovel;

  tipoImovelId: string;
  tipoImovelNome?: string | null;

  enderecoId?: string | null;
  endereco: {
    cep?: string | null;
    logradouro?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    estadoId?: string | null; // se seu front usa estadoId no componente
    cidadeId?: string | null;
  } | null;

  observacoes?: string | null;

  caracteristicas: ImovelCaracteristicaDto[];
  vinculos: VinculoPessoaImovelDto[];

  fotos?: ImovelFotoDto[];
  documentos?: ImovelDocumentoDto[];
}

// listagem simples (se você usa)
export interface ImovelListDto {
  id: string;
  codigo: string;
  titulo: string;
  finalidade: FinalidadeImovel;
  status: StatusImovel;
  tipoImovel: string;
  endereco: EnderecoDto;
}

export interface ImovelFiltro {
  codigo?: string | null;
  tipoImovelId?: string | null;
  finalidade?: number | null;
  cidadeId?: string | null;
  status?: number | null;
  page?: number;
  pageSize?: number;
}