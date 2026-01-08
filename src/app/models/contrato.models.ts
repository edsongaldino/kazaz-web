export enum TipoContrato {
  Locacao = 1,
  Venda = 2,
  Compra = 3,
}

export enum StatusContrato {
  Rascunho = 1,
  Ativo = 2,
  Encerrado = 3,
  Cancelado = 4,
}

export enum PapelContrato {
  Locador = 1,
  Locatario = 2,
  Fiador = 3,
  Vendedor = 10,
  Comprador = 11,
}

export interface ContratoParteRequest {
  pessoaId: string;
  papel: number; // PapelContrato
  percentual?: number | null;
}

export interface CriarContratoRequest {
  tipo: number; // TipoContrato
  imovelId: string;
  inicioVigencia: string; // yyyy-MM-dd
  fimVigencia?: string | null; // yyyy-MM-dd
  partes: ContratoParteRequest[];
}

export interface ContratoParteResponse {
  pessoaId: string;
  pessoaNome: string;
  papel: number;
  percentual?: number | null;
}

export interface ContratoResponse {
  id: string;
  numero: string;
  tipo: number;
  status: number;
  imovelId: string;
  inicioVigencia: string;
  fimVigencia?: string | null;
  criadoEm: string;
  partes: ContratoParteResponse[];
}
