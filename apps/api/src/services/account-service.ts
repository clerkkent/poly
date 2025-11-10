import { Account } from '@poly/shared';
import { PolymarketClient } from '@poly/polymarket';

// 内存存储（生产环境应使用数据库）
const accounts: Map<string, Account> = new Map();
const clients: Map<string, PolymarketClient> = new Map();

export class AccountService {
  static create(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Account {
    const id = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newAccount: Account = {
      ...account,
      id,
      createdAt: now,
      updatedAt: now,
    };
    accounts.set(id, newAccount);

    // 创建客户端（使用官方 CLOB 客户端）
    // 注意：现在使用 privateKey 而不是 apiKey/secret/passphrase
    const chainId = account.chainId || 137; // 默认 Polygon 主网
    const client = new PolymarketClient({
      privateKey: account.apiKey, // 使用 apiKey 字段存储私钥
      chainId, // 使用账户配置的 chainId
      signatureType: account.secret ? parseInt(account.secret) as 1 | 2 : undefined, // 使用 secret 字段存储 signatureType
      funder: account.passphrase || undefined, // 使用 passphrase 字段存储 funder 地址
      proxy: process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.PROXY,
      timeout: parseInt(process.env.API_TIMEOUT || '30000'),
      retries: parseInt(process.env.API_RETRIES || '3'),
    });
    clients.set(id, client);

    return newAccount;
  }

  static get(id: string): Account | null {
    return accounts.get(id) || null;
  }

  static getAll(): Account[] {
    return Array.from(accounts.values());
  }

  static update(id: string, updates: Partial<Account>): Account | null {
    const account = accounts.get(id);
    if (!account) {
      return null;
    }
    const updated = {
      ...account,
      ...updates,
      id,
      updatedAt: new Date(),
    };
    accounts.set(id, updated);

    // 如果凭证或 chainId 更新，重新创建客户端
    if (updates.apiKey || updates.secret || updates.passphrase || updates.chainId !== undefined) {
      const chainId = updated.chainId || 137;
      const client = new PolymarketClient({
        privateKey: updated.apiKey, // 使用 apiKey 字段存储私钥
        chainId,
        signatureType: updated.secret ? parseInt(updated.secret) as 1 | 2 : undefined,
        funder: updated.passphrase || undefined,
        proxy: process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.PROXY,
        timeout: parseInt(process.env.API_TIMEOUT || '30000'),
        retries: parseInt(process.env.API_RETRIES || '3'),
      });
      clients.set(id, client);
    }

    return updated;
  }

  static delete(id: string): boolean {
    accounts.delete(id);
    clients.delete(id);
    return true;
  }

  static getClient(id: string): PolymarketClient | null {
    return clients.get(id) || null;
  }
}

