export interface ColaboradorDocumentoResponseDto {
  id: string;
  nome: string;
  documentoId: string;
  documentoNome: string;
  caminho: string;
  contentType?: string | null;
  tamanhoBytes?: number | null;
  dataAnexo: string;
}

export interface ColaboradorDocumentoInputDto {
  id?: string | null;
  nome: string;
  documentoId?: string | null;
  caminho?: string | null;
  documentoNome?: string | null;
  contentType?: string | null;
  tamanhoBytes?: number | null;
}

export enum CargoColaborador {
  Corretor = 1,
  Gerente = 2,
  Recepcionista = 3,
  Administrativo = 4,
  Diretor = 5,
  Outro = 6
}

export const CargoColaboradorLabels: Record<CargoColaborador, string> = {
  [CargoColaborador.Corretor]: 'Corretor',
  [CargoColaborador.Gerente]: 'Gerente',
  [CargoColaborador.Recepcionista]: 'Recepcionista',
  [CargoColaborador.Administrativo]: 'Administrativo',
  [CargoColaborador.Diretor]: 'Diretor',
  [CargoColaborador.Outro]: 'Outro'
};

export interface ColaboradorResponseDto {
  id: string;
  nome: string;
  cpf: string;
  cargo: CargoColaborador;
  email: string;
  telefone?: string | null;
  ativo: boolean;
  dataAdmissao?: string | null;
  usuarioId?: string | null;
  usuarioEmail?: string | null;
  documentos: ColaboradorDocumentoResponseDto[];
}

export interface ColaboradorCreateDto {
  nome: string;
  cpf: string;
  cargo: CargoColaborador;
  email: string;
  telefone?: string | null;
  ativo: boolean;
  dataAdmissao?: string | null;
  criarUsuario: boolean;
  senha?: string | null;
  perfilId?: string | null;
  documentos?: ColaboradorDocumentoInputDto[] | null;
}

export interface ColaboradorUpdateDto {
  nome: string;
  cpf: string;
  cargo: CargoColaborador;
  email: string;
  telefone?: string | null;
  ativo: boolean;
  dataAdmissao?: string | null;
  documentos?: ColaboradorDocumentoInputDto[] | null;
}

export interface ColaboradorSearchFilterDto {
  termo?: string;
  ativo?: boolean | null;
  page?: number;
  pageSize?: number;
}
