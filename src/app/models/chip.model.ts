export type ChipVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'primary'
  | 'purple';

export interface ChipConfig {
  label: string;
  variant: ChipVariant;
  icon?: string; 
}