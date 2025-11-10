import { PolymarketClient } from '@poly/polymarket';
import { Strategy, Order } from '@poly/shared';

export interface StrategyContext {
  client: PolymarketClient;
  accountId: string;
  config: Record<string, any>;
}

export interface StrategyResult {
  success: boolean;
  orders?: Order[];
  message?: string;
  error?: Error;
}

export abstract class BaseStrategy {
  protected context: StrategyContext;
  protected strategyId: string;
  protected name: string;

  constructor(context: StrategyContext, strategyId: string, name: string) {
    this.context = context;
    this.strategyId = strategyId;
    this.name = name;
  }

  abstract execute(): Promise<StrategyResult>;
  abstract validate(): boolean;
  abstract getDescription(): string;

  protected log(message: string, data?: any): void {
    console.log(`[${this.name}] ${message}`, data || '');
  }

  protected error(message: string, error?: Error): StrategyResult {
    return {
      success: false,
      message,
      error,
    };
  }

  protected success(orders: Order[], message?: string): StrategyResult {
    return {
      success: true,
      orders,
      message,
    };
  }
}

