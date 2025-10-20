export interface Cidade {
  id: string;
  nome: string;
  estado: {
    id: string;
    nome: string;
    sigla: string;
  };
}
