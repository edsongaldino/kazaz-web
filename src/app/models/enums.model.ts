export enum EstadoCivil {
  NaoInformado = 0,
  Solteiro = 1,
  Casado = 2,
  Divorciado = 3,
  Viuvo = 4,
  UniaoEstavel = 5,
  Separado = 6
}

export enum FinalidadeImovel {
  Venda = 1,
  Aluguel = 2,
  Temporada = 3,
  UsoProprio = 4,
}

export enum StatusImovel {
  Ativo = 1,
  Inativo = 2,
  EmNegociacao = 3,
  Vendido = 4,
  Alugado = 5,
}

export type TipoValorCaracteristica = 'bool' | 'int' | 'decimal' | 'texto' | 'data' | 'moeda';