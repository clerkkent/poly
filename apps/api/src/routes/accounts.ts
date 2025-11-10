import { Router } from 'express';
import { AccountService } from '../services/account-service';

export const accountsRouter = Router();

// 获取所有账户
accountsRouter.get('/', (req, res) => {
  try {
    const accounts = AccountService.getAll();
    console.log(`[Accounts] 获取账户列表: 共 ${accounts.length} 个账户`);
    res.json(accounts);
  } catch (error: any) {
    console.error(`[Accounts] ❌ 获取账户列表失败:`, error.message || error);
    res.status(500).json({ error: '获取账户列表失败' });
  }
});

// 获取单个账户
accountsRouter.get('/:id', (req, res) => {
  try {
    const account = AccountService.get(req.params.id);
    if (!account) {
      return res.status(404).json({ error: '账户不存在' });
    }
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: '获取账户失败' });
  }
});

// 创建账户
accountsRouter.post('/', (req, res) => {
  try {
    const { name, apiKey, secret, passphrase, enabled } = req.body;
    console.log(`[Accounts] 📝 创建账户: name=${name}`);
    if (!name || !apiKey) {
      return res.status(400).json({ error: '缺少必需字段（至少需要 name 和 apiKey/私钥）' });
    }
    const account = AccountService.create({
      name,
      apiKey,
      secret: secret || '',
      passphrase: passphrase || '',
      enabled: enabled !== false,
    });
    console.log(`[Accounts] ✅ 账户创建成功: id=${account.id}`);
    res.status(201).json(account);
  } catch (error: any) {
    console.error(`[Accounts] ❌ 创建账户失败:`, error.message || error);
    res.status(500).json({ error: error.message || '创建账户失败' });
  }
});

// 更新账户
accountsRouter.put('/:id', (req, res) => {
  try {
    const account = AccountService.update(req.params.id, req.body);
    if (!account) {
      return res.status(404).json({ error: '账户不存在' });
    }
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: '更新账户失败' });
  }
});

// 删除账户
accountsRouter.delete('/:id', (req, res) => {
  try {
    const success = AccountService.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '账户不存在' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除账户失败' });
  }
});

// 获取账户余额
accountsRouter.get('/:id/balance', async (req, res) => {
  try {
    console.log(`[Accounts] 💰 获取账户余额: accountId=${req.params.id}`);
    const client = AccountService.getClient(req.params.id);
    if (!client) {
      console.warn(`[Accounts] ⚠️  账户不存在或客户端未初始化: accountId=${req.params.id}`);
      return res.status(404).json({ error: '账户不存在或客户端未初始化' });
    }
    const balance = await client.getBalance();
    console.log(`[Accounts] ✅ 余额获取成功: available=${balance.available}, locked=${balance.locked}`);
    res.json(balance);
  } catch (error: any) {
    console.error(`[Accounts] ❌ 获取余额失败:`, error.message || error);
    res.status(500).json({ error: error.message || '获取余额失败' });
  }
});

