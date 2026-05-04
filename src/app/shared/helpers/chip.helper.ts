import { ChipConfig } from '../../models/chip.model';

export type ChipCategory =
  | 'status'
  | 'statusContrato'
  | 'statusImovel'
  | 'tipoContrato'
  | 'finalidadeImovel'
  | 'tipo'
  | 'tipoCadastro'
  | 'statusUsuario'
  | 'papel';

const CHIP_MAP: Record<ChipCategory, Record<string, ChipConfig>> = {
  status: {
    '1': { label: 'Pendente preenchimento', variant: 'warning', icon: 'schedule' },
    '2': { label: 'Preenchido', variant: 'info', icon: 'check_circle' },
    '3': { label: 'Em análise', variant: 'primary', icon: 'manage_search' },
    '4': { label: 'Aprovado', variant: 'success', icon: 'verified' },
    '5': { label: 'Reprovado', variant: 'danger', icon: 'cancel' },
    '6': { label: 'Correção solicitada', variant: 'warning', icon: 'edit_note' },
    '7': { label: 'Expirado', variant: 'neutral', icon: 'event_busy' },
    '8': { label: 'Cancelado', variant: 'neutral', icon: 'block' }
  },
  finalidadeImovel: {
    '1': { label: 'Venda', variant: 'success', icon: 'sell' },
    '2': { label: 'Aluguel', variant: 'info', icon: 'home' },
    '3': { label: 'Temporada', variant: 'warning', icon: 'beach_access' },
    '4': { label: 'Uso próprio', variant: 'neutral', icon: 'person' }
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
  statusContrato: {
    '1': { label: 'Rascunho', variant: 'neutral', icon: 'edit_document' },
    '2': { label: 'Ativo', variant: 'success', icon: 'check_circle' },
    '3': { label: 'Encerrado', variant: 'info', icon: 'task_alt' },
    '4': { label: 'Cancelado', variant: 'danger', icon: 'block' }
  },

  statusUsuario: {
    true: { label: 'Ativo', variant: 'success', icon: 'check_circle' },
    false: { label: 'Inativo', variant: 'neutral', icon: 'block' }
  },

  statusImovel: {
    '1': { label: 'Ativo', variant: 'success', icon: 'check_circle' },
    '2': { label: 'Inativo', variant: 'neutral', icon: 'pause_circle' },
    '3': { label: 'Em negociação', variant: 'warning', icon: 'handshake' },
    '4': { label: 'Vendido', variant: 'danger', icon: 'sell' },
    '5': { label: 'Alugado', variant: 'info', icon: 'key' }
  },

  tipoContrato: {
    '1': { label: 'Locação', variant: 'warning', icon: 'key' },
    '2': { label: 'Venda', variant: 'success', icon: 'sell' }
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