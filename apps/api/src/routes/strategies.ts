import { Router } from 'express';
import { StrategyService } from '../services/strategy-service';

export const strategiesRouter = Router();

// 获取所有策略
strategiesRouter.get('/', (req, res) => {
  try {
    const { accountId } = req.query;
    const strategies = accountId
      ? StrategyService.getByAccount(accountId as string)
      : StrategyService.getAll();
    res.json(strategies);
  } catch (error) {
    res.status(500).json({ error: '获取策略列表失败' });
  }
});

// 获取策略类型列表
strategiesRouter.get('/types', (req, res) => {
  try {
    const types = StrategyService.listTypes();
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: '获取策略类型失败' });
  }
});

// 获取单个策略
strategiesRouter.get('/:id', (req, res) => {
  try {
    const strategy = StrategyService.get(req.params.id);
    if (!strategy) {
      return res.status(404).json({ error: '策略不存在' });
    }
    res.json(strategy);
  } catch (error) {
    res.status(500).json({ error: '获取策略失败' });
  }
});

// 创建策略
strategiesRouter.post('/', (req, res) => {
  try {
    const { name, type, accountId, enabled, config } = req.body;
    if (!name || !type || !accountId || !config) {
      return res.status(400).json({ error: '缺少必需字段' });
    }
    const strategy = StrategyService.create({
      name,
      type,
      accountId,
      enabled: enabled !== false,
      config,
    });
    res.status(201).json(strategy);
  } catch (error) {
    res.status(500).json({ error: '创建策略失败' });
  }
});

// 更新策略
strategiesRouter.put('/:id', (req, res) => {
  try {
    const strategy = StrategyService.update(req.params.id, req.body);
    if (!strategy) {
      return res.status(404).json({ error: '策略不存在' });
    }
    res.json(strategy);
  } catch (error) {
    res.status(500).json({ error: '更新策略失败' });
  }
});

// 删除策略
strategiesRouter.delete('/:id', (req, res) => {
  try {
    const success = StrategyService.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '策略不存在' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除策略失败' });
  }
});

// 启动策略
strategiesRouter.post('/:id/start', (req, res) => {
  try {
    StrategyService.start(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '启动策略失败' });
  }
});

// 停止策略
strategiesRouter.post('/:id/stop', (req, res) => {
  try {
    StrategyService.stop(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '停止策略失败' });
  }
});

