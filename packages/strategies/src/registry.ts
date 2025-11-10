import { BaseStrategy, StrategyContext } from './base';
import { MarketMakerStrategy } from './strategies/market-maker';
import { MomentumStrategy } from './strategies/momentum';

export type StrategyConstructor = new (context: StrategyContext, strategyId: string) => BaseStrategy;

export class StrategyRegistry {
  private static strategies: Map<string, StrategyConstructor> = new Map();

  static register(name: string, constructor: StrategyConstructor): void {
    this.strategies.set(name, constructor);
  }

  static create(name: string, context: StrategyContext, strategyId: string): BaseStrategy | null {
    const Constructor = this.strategies.get(name);
    if (!Constructor) {
      return null;
    }
    return new Constructor(context, strategyId);
  }

  static list(): string[] {
    return Array.from(this.strategies.keys());
  }
}

// 注册内置策略
StrategyRegistry.register('market-maker', MarketMakerStrategy);
StrategyRegistry.register('momentum', MomentumStrategy);

