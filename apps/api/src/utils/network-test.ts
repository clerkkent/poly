import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';

export interface NetworkTestResult {
  success: boolean;
  message: string;
  latency?: number;
  error?: string;
}

export async function testPolymarketConnection(proxy?: string): Promise<NetworkTestResult> {
  const startTime = Date.now();
  
  try {
    const httpAgent = proxy ? new HttpProxyAgent(proxy) : undefined;
    const httpsAgent = proxy ? new HttpsProxyAgent(proxy) : undefined;
    console.log({
      httpAgent,
      httpsAgent,
      timeout: 10000,
      validateStatus: () => true, // 接受任何状态码
    })
    const response = await axios.get('https://clob.polymarket.com', {
      httpAgent,
      httpsAgent,
      timeout: 10000,
      validateStatus: () => true, // 接受任何状态码
    });

    const latency = Date.now() - startTime;

    if (response.status === 200 || response.status === 404) {
      return {
        success: true,
        message: `连接成功 (状态码: ${response.status})`,
        latency,
      };
    } else {
      return {
        success: false,
        message: `连接失败 (状态码: ${response.status})`,
        latency,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error: any) {
    const latency = Date.now() - startTime;
    
    if (error.code === 'ETIMEDOUT') {
      return {
        success: false,
        message: '连接超时 - 可能是网络问题或需要代理',
        latency,
        error: error.code,
      };
    } else if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        message: '连接被拒绝 - 请检查代理设置',
        latency,
        error: error.code,
      };
    } else if (error.code === 'ENOTFOUND') {
      return {
        success: false,
        message: 'DNS 解析失败 - 请检查网络连接',
        latency,
        error: error.code,
      };
    } else {
      return {
        success: false,
        message: `连接失败: ${error.message}`,
        latency,
        error: error.code || 'UNKNOWN',
      };
    }
  }
}

