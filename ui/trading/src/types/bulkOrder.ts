export interface BulkOrderForm {
  symbol: string;
  orderType: 'BUY' | 'SELL';
  priceRange: {
    min: number;
    max: number;
  };
  orderCount: number;
  volumePerOrder: number;
  distribution: 'EQUAL' | 'PROGRESSIVE' | 'REGRESSIVE';
  priceStep: 'AUTO' | 'MANUAL';
  manualStep?: number;
}

export interface CalculatedOrder {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  price: number;
  volume: number;
  expectedMargin?: number;
}

export interface BulkOrderSummary {
  totalOrders: number;
  totalVolume: number;
  totalMargin: number;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface BulkOrderResponse {
  status: 'SUCCESS' | 'PARTIAL' | 'ERROR';
  message: string;
  summary?: {
    totalOrders: number;
    successfulOrders: number;
    failedOrders: number;
    totalVolume: number;
    totalMargin: number;
  };
  orders?: CalculatedOrder[];
  errors?: string[];
}
