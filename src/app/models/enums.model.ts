export enum EstadoCivil {
  NaoInformado = 'NaoInformado',
  Solteiro = 'Solteiro',
  Casado = 'Casado',
  Divorciado = 'Divorciado',
  Viuvo = 'Viuvo',
  UniaoEstavel = 'UniaoEstavel',
  Separado = 'Separado'
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