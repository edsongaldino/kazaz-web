export interface TipoDocumento {
  id: string;
  nome: string;
  alvo: number; // 1 = Pessoa, 2 = Imovel
  obrigatorio: boolean;
  ordem: number;
  ativo: boolean;
  descricao?: string | null;
}

export interface RegraDocumentoCadastro {
  id: string;
  tipoPessoa: number; // 0 = Any, 1 = PF, 2 = PJ
  tipoContrato: number; // 0 = Any, 1 = Locacao, 2 = Venda, 3 = Compra
  papelContrato: number; // 0 = Any, 1 = Locador, 2 = Locatario, 3 = Fiador, 10 = Vendedor, 11 = Comprador
  tipoDocumentoId: string;
  tipoDocumentoNome: string;
  obrigatorio: boolean;
  ordem: number;
  multiplicidade: number;
  rotulo?: string | null;
  ativo: boolean;
}
