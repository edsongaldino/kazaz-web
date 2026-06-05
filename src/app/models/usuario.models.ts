export interface PagedResult<T> {
  items: T[];
  total: number;
}

export interface UsuarioListDto {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  perfilId: string;
  perfilNome?: string; // recomendado vir da API
  imobiliariaId?: string | null;
  imobiliariaNome?: string | null;
}

export interface UsuarioCreateDto {
  nome: string;
  email: string;
  senha: string;
  ativo: boolean;
  perfilId: string;
  imobiliariaId?: string | null;
}

export interface UsuarioUpdateDto {
  nome: string;
  email: string;
  senha?: string;
  ativo: boolean;
  perfilId: string;
  imobiliariaId?: string | null;
}

export interface PerfilDto {
  id: string;
  nome: string;
}

export interface UsuariosQuery {
  page?: number;
  pageSize?: number;

  termo?: string | null;
  perfilId?: string | null;
  ativo?: boolean | null;
}

export interface UsuariosPageResponse {
  items: UsuarioListDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LoginResponse {
  token: string;
  usuarioId: string;
  nome: string;
  email: string;
  perfilId?: number;
  perfilNome?: string;
  imobiliariaId?: string;
}