export interface DashboardGraficoItem {
  label: string;
  quantidade: number;
}

export interface DashboardResumo {
  totalImoveis: number;
  totalClientes: number;
  totalContratos: number;
  totalConvites: number;

  imoveisAtivos: number;
  imoveisEmNegociacao: number;
  imoveisVendidos: number;
  imoveisAlugados: number;

  imoveisPorTipo: DashboardGraficoItem[];
  imoveisPorFinalidade: DashboardGraficoItem[];
  convitesPorStatus: DashboardGraficoItem[];
}