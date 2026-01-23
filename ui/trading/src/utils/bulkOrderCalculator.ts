import type { BulkOrderForm, CalculatedOrder, BulkOrderSummary } from '../types/bulkOrder';

/**
 * Calculate bulk orders based on form parameters
 */
export class BulkOrderCalculator {
  /**
   * Generate orders based on distribution strategy
   */
  static calculateOrders(form: BulkOrderForm): CalculatedOrder[] {
    const { priceRange, orderCount, volumePerOrder, distribution, symbol, orderType } = form;
    
    // Calculate price steps
    const prices = this.calculatePrices(priceRange.min, priceRange.max, orderCount, form.priceStep, form.manualStep);
    
    // Calculate volumes based on distribution
    const volumes = this.calculateVolumes(orderCount, volumePerOrder, distribution);
    
    // Generate orders
    return prices.map((price, index) => ({
      id: `bulk_${Date.now()}_${index}`,
      symbol,
      type: orderType,
      price: parseFloat(price.toFixed(5)),
      volume: volumes[index],
      expectedMargin: this.estimateMargin(price, volumes[index])
    }));
  }

  /**
   * Calculate price points
   */
  private static calculatePrices(
    minPrice: number,
    maxPrice: number,
    orderCount: number,
    stepType: 'AUTO' | 'MANUAL',
    manualStep?: number
  ): number[] {
    const prices: number[] = [];
    
    if (stepType === 'AUTO') {
      const step = (maxPrice - minPrice) / (orderCount - 1);
      for (let i = 0; i < orderCount; i++) {
        prices.push(minPrice + i * step);
      }
    } else if (manualStep && stepType === 'MANUAL') {
      let currentPrice = minPrice;
      while (currentPrice <= maxPrice && prices.length < orderCount) {
        prices.push(currentPrice);
        currentPrice += manualStep;
      }
    }
    
    return prices;
  }

  /**
   * Calculate volume distribution
   */
  private static calculateVolumes(
    orderCount: number,
    volumePerOrder: number,
    distribution: 'EQUAL' | 'PROGRESSIVE' | 'REGRESSIVE'
  ): number[] {
    const volumes: number[] = [];
    
    switch (distribution) {
      case 'EQUAL':
        for (let i = 0; i < orderCount; i++) {
          volumes.push(volumePerOrder);
        }
        break;
        
      case 'PROGRESSIVE':
        // More volume at lower prices (for BUY) or higher prices (for SELL)
        const progressiveFactor = 1.5; // Volume multiplier
        for (let i = 0; i < orderCount; i++) {
          const factor = 1 + (progressiveFactor - 1) * ((orderCount - 1 - i) / (orderCount - 1));
          volumes.push(volumePerOrder * factor);
        }
        break;
        
      case 'REGRESSIVE':
        // Less volume at lower prices (for BUY) or higher prices (for SELL)
        const regressiveFactor = 1.5;
        for (let i = 0; i < orderCount; i++) {
          const factor = 1 + (regressiveFactor - 1) * (i / (orderCount - 1));
          volumes.push(volumePerOrder * factor);
        }
        break;
    }
    
    return volumes;
  }

  /**
   * Estimate margin requirement (simplified)
   */
  private static estimateMargin(price: number, volume: number): number {
    // Simplified margin calculation - in real implementation, 
    // this would use symbol-specific margin requirements
    const contractSize = 100000; // Standard lot size
    const leverage = 100; // 1:100 leverage
    const notionalValue = price * volume * contractSize;
    return notionalValue / leverage;
  }

  /**
   * Generate summary statistics
   */
  static generateSummary(orders: CalculatedOrder[]): BulkOrderSummary {
    if (orders.length === 0) {
      return {
        totalOrders: 0,
        totalVolume: 0,
        totalMargin: 0,
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        riskLevel: 'LOW'
      };
    }

    const totalVolume = orders.reduce((sum, order) => sum + order.volume, 0);
    const totalMargin = orders.reduce((sum, order) => sum + (order.expectedMargin || 0), 0);
    const prices = orders.map(order => order.price);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    // Risk assessment based on total margin and order count
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (totalMargin > 1000 || orders.length > 10) {
      riskLevel = 'HIGH';
    } else if (totalMargin > 500 || orders.length > 5) {
      riskLevel = 'MEDIUM';
    }

    return {
      totalOrders: orders.length,
      totalVolume,
      totalMargin,
      averagePrice,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      },
      riskLevel
    };
  }

  /**
   * Validate bulk order parameters
   */
  static validateForm(form: BulkOrderForm): string[] {
    const errors: string[] = [];

    if (!form.symbol) {
      errors.push('Symbol is required');
    }

    if (form.priceRange.min >= form.priceRange.max) {
      errors.push('Minimum price must be less than maximum price');
    }

    if (form.orderCount < 1 || form.orderCount > 50) {
      errors.push('Order count must be between 1 and 50');
    }

    if (form.volumePerOrder <= 0) {
      errors.push('Volume per order must be greater than 0');
    }

    if (form.priceStep === 'MANUAL' && (!form.manualStep || form.manualStep <= 0)) {
      errors.push('Manual step must be greater than 0');
    }

    return errors;
  }
}
