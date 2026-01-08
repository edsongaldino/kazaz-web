import { FinalidadeImovel } from '../../models/enums.model';

export const FINALIDADE_IMOVEL_LABEL: Record<number, string> = {
  [FinalidadeImovel.Venda]: 'Venda',
  [FinalidadeImovel.Aluguel]: 'Aluguel',
  [FinalidadeImovel.Temporada]: 'Temporada',
  [FinalidadeImovel.UsoProprio]: 'Uso próprio',
};

export function getFinalidadeImovelLabel(
  valor: number | FinalidadeImovel | null | undefined
): string {
  return FINALIDADE_IMOVEL_LABEL[Number(valor)] ?? '-';
}
