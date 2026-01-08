import { StatusImovel } from '../../models/enums.model';

export type StatusUi = {
  icon: string;
  color: string;
  label: string;
};

export const STATUS_IMOVEL_UI_MAP: Record<StatusImovel, StatusUi> = {
  [StatusImovel.Ativo]: {
    icon: 'check_circle',
    color: '#2e7d32',
    label: 'Ativo',
  },
  [StatusImovel.Inativo]: {
    icon: 'cancel',
    color: '#616161',
    label: 'Inativo',
  },
  [StatusImovel.EmNegociacao]: {
    icon: 'hourglass_top',
    color: '#ef6c00',
    label: 'Em negociação',
  },
  [StatusImovel.Vendido]: {
    icon: 'paid',
    color: '#c62828',
    label: 'Vendido',
  },
  [StatusImovel.Alugado]: {
    icon: 'home_work',
    color: '#1565c0',
    label: 'Alugado',
  },
};

const FALLBACK_STATUS_UI: StatusUi = {
  icon: 'help_outline',
  color: '#424242',
  label: 'Não informado',
};

export function getStatusImovelUi(
  status: StatusImovel | number | null | undefined
): StatusUi {
  return STATUS_IMOVEL_UI_MAP[status as StatusImovel] ?? FALLBACK_STATUS_UI;
}
