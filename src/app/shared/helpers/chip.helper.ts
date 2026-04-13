import { ChipConfig } from '../../models/chip.model';

type ChipCategory = 'status' | 'finalidade' | 'tipo' | 'tipoCadastro' | 'papel';

const CHIP_MAP: Record<ChipCategory, Record<string, ChipConfig>> = {
  status: {
    pendente: { label: 'Pendente', variant: 'warning', icon: 'schedule' },
    usado: { label: 'Usado', variant: 'success', icon: 'check_circle' },
    expirado: { label: 'Expirado', variant: 'danger', icon: 'cancel' },
    cancelado: { label: 'Cancelado', variant: 'neutral', icon: 'block' }
  },
  finalidade: {
    venda: { label: 'Venda', variant: 'info', icon: 'sell' },
    aluguel: { label: 'Aluguel', variant: 'warning', icon: 'key' }
  },
  tipo: {
    casa: { label: 'Casa', variant: 'success', icon: 'home' },
    apartamento: { label: 'Apartamento', variant: 'purple', icon: 'apartment' },
    terreno: { label: 'Terreno', variant: 'warning', icon: 'landscape' }
  },
  tipoCadastro: {
    fisica: { label: 'Física', variant: 'info', icon: 'person' },
    juridica: { label: 'Jurídica', variant: 'purple', icon: 'business' }
  },
  papel: {
    '1': { label: 'Locador', variant: 'info', icon: 'home' },
    '2': { label: 'Locatário', variant: 'primary', icon: 'person' },
    '3': { label: 'Fiador', variant: 'warning', icon: 'security' },
    '10': { label: 'Vendedor', variant: 'success', icon: 'sell' },
    '11': { label: 'Comprador', variant: 'purple', icon: 'shopping_cart' }
  }
};

export function getChipConfig(
  category: ChipCategory,
  value: string | number | null | undefined
): ChipConfig {
  const key = String(value ?? '').trim().toLowerCase();

  return CHIP_MAP[category]?.[key] ?? {
    label: String(value ?? '-'),
    variant: 'default'
  };
}