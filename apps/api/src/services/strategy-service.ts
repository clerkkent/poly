import { Strategy, Account } from '@poly/shared';
import { StrategyRegistry } from '@poly/strategies';
import { PolymarketClient } from '@poly/polymarket';
import { AccountService } from './account-service';

const strategies: Map<string, Strategy> = new Map();
const runningStrategies: Map<string, NodeJS.Timeout> = new Map();

export class StrategyService {
  static create(strategy: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'>): Strategy {
    const id = `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newStrategy: Strategy = {
      ...strategy,
      id,
      createdAt: now,
      updatedAt: now,
    };
    strategies.set(id, newStrategy);

    if (newStrategy.enabled) {
      this.start(id);
    }

    return newStrategy;
  }

  static get(id: string): Strategy | null {
    return strategies.get(id) || null;
  }

  static getAll(): Strategy[] {
    return Array.from(strategies.values());
  }

  static getByAccount(accountId: string): Strategy[] {
    return Array.from(strategies.values()).filter(s => s.accountId === accountId);
  }

  static update(id: string, updates: Partial<Strategy>): Strategy | null {
    const strategy = strategies.get(id);
    if (!strategy) {
      return null;
    }

    const updated = {
      ...strategy,
      ...updates,
      id,
      updatedAt: new Date(),
    };
    strategies.set(id, updated);

    // 如果启用状态改变，启动或停止策略
    if (updates.enabled !== undefined) {
      if (updates.enabled) {
        this.start(id);
      } else {
        this.stop(id);
      }
    }

    return updated;
  }

  static delete(id: string): boolean {
    this.stop(id);
    return strategies.delete(id);
  }

  static start(id: string): void {
    const strategy = strategies.get(id);
    if (!strategy || !strategy.enabled) {
      return;
    }

    // 停止已运行的策略
    this.stop(id);

    const account = AccountService.get(strategy.accountId);
    if (!account) {
      return;
    }

    const client = AccountService.getClient(strategy.accountId);
    if (!client) {
      return;
    }

    const strategyInstance = StrategyRegistry.create(
      strategy.type,
      {
        client,
        accountId: strategy.accountId,
        config: strategy.config,
      },
      id
    );

    if (!strategyInstance) {
      console.error(`未知的策略类型: ${strategy.type}`);
      return;
    }

    // 每 30 秒执行一次策略
    const interval = setInterval(async () => {
      try {
        const result = await strategyInstance.execute();
        console.log(`策略 ${id} 执行结果:`, result);
      } catch (error) {
        console.error(`策略 ${id} 执行错误:`, error);
      }
    }, 30000);

    runningStrategies.set(id, interval);
  }

  static stop(id: string): void {
    const interval = runningStrategies.get(id);
    if (interval) {
      clearInterval(interval);
      runningStrategies.delete(id);
    }
  }

  static listTypes(): string[] {
    return StrategyRegistry.list();
  }
}

