import { api } from './api';

export interface DashboardMetrics {
  success: boolean;
  metrics: {
    sales: {
      total_orders: number;
      total_revenue: number;
      total_items_sold: number;
      total_profit: number;
      order_at_list: Array<{
        order_at: string;
        total_revenue: number;
        total_profit: number;
      }>;
    };
    imports: {
      total_imports: number;
      total_cost: number;
      total_items_imported: number;
    };
    products: {
      total_products: number;
      low_stock_products: number;
      out_of_stock_products: number;
    };
  };
}

export const getDashboardMetrics = async (startDate: string, endDate: string): Promise<DashboardMetrics> => {
  const response = await api.get<DashboardMetrics>(`/api/v1/dashboard/metrics`, {
    params: {
      start_date: startDate,
      end_date: endDate,
    },
  });
  return response.data;
}; 