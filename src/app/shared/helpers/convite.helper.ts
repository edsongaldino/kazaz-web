export const conviteStatusOptions = [
  { value: 1, label: 'Pendente preenchimento' },
  { value: 2, label: 'Preenchido' },
  { value: 3, label: 'Em análise' },
  { value: 4, label: 'Aprovado' },
  { value: 5, label: 'Reprovado' },
  { value: 6, label: 'Correção solicitada' },
  { value: 7, label: 'Expirado' },
  { value: 8, label: 'Cancelado' }
];

export const convitePapelOptions = [
  { value: 1, label: 'Locador' },
  { value: 2, label: 'Locatário' },
  { value: 3, label: 'Fiador' },
  { value: 10, label: 'Vendedor' },
  { value: 11, label: 'Comprador' }
];

export function getConviteStatusLabel(status: number): string {
  return conviteStatusOptions.find(x => x.value === status)?.label ?? String(status);
}

export function getConvitePapelLabel(papel: number): string {
  return convitePapelOptions.find(x => x.value === papel)?.label ?? String(papel);
}