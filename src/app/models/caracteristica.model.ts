import { TipoValorCaracteristica } from "./enums.model";

export interface ImovelCaracteristicaUpsertRequest {
  caracteristicaId: string; // Guid
  valorBool?: boolean | null;
  valorInt?: number | null;
  valorDecimal?: number | null;
  valorTexto?: string | null;
  valorData?: string | null; // yyyy-mm-dd
  observacao?: string | null;
}

export interface CaracteristicaCatalogoDto {
  id: string;
  nome: string;
  tipoValor: TipoValorCaracteristica;
  unidade?: string | null;
  grupo?: string | null;
  ordem?: number | null;
  ativo?: boolean | null;
}

export interface ImovelCaracteristicaDto {
  id: string;
  caracteristicaId: string;
  caracteristicaNome: string;
  tipoValor: TipoValorCaracteristica;
  unidade?: string | null;
  grupo?: string | null;

  valorBool?: boolean | null;
  valorInt?: number | null;
  valorDecimal?: number | null;
  valorTexto?: string | null;
  valorData?: string | null; // yyyy-mm-dd
  observacao?: string | null;
}