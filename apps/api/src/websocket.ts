import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { AccountService } from './services/account-service';
import { MarketService } from './services/market-service';
import { AlertService } from './services/alert-service';

export function createWebSocketServer(server: Server): void {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] 新的连接');

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe_price') {
          const { accountId, tokenId, interval = 5000 } = data;
          
          if (!tokenId) {
            ws.send(JSON.stringify({ error: '缺少 tokenId' }));
            return;
          }

          // 定期发送价格更新
          const priceInterval = setInterval(async () => {
            try {
              let priceData;
              
              // 如果提供了 accountId，使用账户客户端
              if (accountId) {
                const client = AccountService.getClient(accountId);
                if (!client) {
                  ws.send(JSON.stringify({ error: '账户不存在' }));
                  clearInterval(priceInterval);
                  return;
                }
                priceData = await client.getPriceData(tokenId);
                AlertService.updatePriceCache(tokenId, priceData);
              } else {
                // 使用只读客户端（行情数据与 chainId 无关）
                priceData = await MarketService.getPriceData(tokenId);
              }
              
              ws.send(JSON.stringify({
                type: 'price_update',
                data: priceData,
              }));

              // 检查报警（仅在有账户时）
              if (accountId) {
                const triggered = AlertService.checkAlerts(priceData);
                if (triggered.length > 0) {
                  ws.send(JSON.stringify({
                    type: 'alert_triggered',
                    data: triggered,
                  }));
                }
              }
            } catch (error: any) {
              console.error('[WebSocket] 获取价格失败:', error.message || error);
            }
          }, interval);

          ws.on('close', () => {
            clearInterval(priceInterval);
            console.log('[WebSocket] 连接关闭，停止价格订阅');
          });
          
          console.log(`[WebSocket] 订阅价格: tokenId=${tokenId.substring(0, 20)}..., accountId=${accountId || 'none'}`);
        }
      } catch (error: any) {
        console.error('[WebSocket] 消息处理错误:', error.message || error);
        ws.send(JSON.stringify({ error: '消息处理失败' }));
      }
    });

    ws.on('close', () => {
      console.log('[WebSocket] 连接关闭');
    });
  });
}

