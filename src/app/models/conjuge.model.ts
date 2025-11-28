export interface Conjuge {
nome: string | null;
cpf: string | null;
dataNascimento: Date | null;
telefone?: string | null;
email?: string | null;
}

export interface ConjugeDto {
  nome: string | null;
  cpf: string | null;
  dataNascimento?: string | null;
  telefone?: string | null;
  email?: string | null;
}