import { Router } from 'express';
import { AlertService } from '../services/alert-service';

export const alertsRouter = Router();

// 获取所有报警
alertsRouter.get('/', (req, res) => {
  try {
    const { accountId } = req.query;
    const alerts = accountId
      ? AlertService.getByAccount(accountId as string)
      : AlertService.getAll();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: '获取报警列表失败' });
  }
});

// 获取单个报警
alertsRouter.get('/:id', (req, res) => {
  try {
    const alert = AlertService.get(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: '报警不存在' });
    }
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: '获取报警失败' });
  }
});

// 创建报警
alertsRouter.post('/', (req, res) => {
  try {
    const { accountId, marketId, tokenId, condition, threshold, enabled } = req.body;
    if (!accountId || !tokenId || !condition || threshold === undefined) {
      return res.status(400).json({ error: '缺少必需字段' });
    }
    const alert = AlertService.create({
      accountId,
      marketId,
      tokenId,
      condition,
      threshold: parseFloat(threshold),
      enabled: enabled !== false,
    });
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ error: '创建报警失败' });
  }
});

// 更新报警
alertsRouter.put('/:id', (req, res) => {
  try {
    const alert = AlertService.update(req.params.id, req.body);
    if (!alert) {
      return res.status(404).json({ error: '报警不存在' });
    }
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: '更新报警失败' });
  }
});

// 删除报警
alertsRouter.delete('/:id', (req, res) => {
  try {
    const success = AlertService.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '报警不存在' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除报警失败' });
  }
});

