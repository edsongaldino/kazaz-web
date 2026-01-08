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
}

export interface UsuarioCreateDto {
  nome: string;
  email: string;
  senha: string;
  ativo: boolean;
  perfilId: string;
}

export interface UsuarioUpdateDto {
  nome: string;
  email: string;
  ativo: boolean;
  perfilId: string;
}

export interface PerfilDto {
  id: string;
  nome: string;
}
