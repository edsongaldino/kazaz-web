export type TipoContato = 'EMAIL' | 'TELEFONE' | 'SITE' | 'OUTRO';

export interface ContatoDto {
  id?: string;
  tipo: TipoContato;
  valor: string;
  principal: boolean;
}
