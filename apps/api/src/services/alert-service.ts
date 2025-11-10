import { Alert, PriceData } from '@poly/shared';
import { AccountService } from './account-service';

const alerts: Map<string, Alert> = new Map();
const priceCache: Map<string, PriceData> = new Map();

export class AlertService {
  static create(alert: Omit<Alert, 'id' | 'createdAt' | 'triggered'>): Alert {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const newAlert: Alert = {
      ...alert,
      id,
      triggered: false,
      createdAt: now,
    };
    alerts.set(id, newAlert);
    return newAlert;
  }

  static get(id: string): Alert | null {
    return alerts.get(id) || null;
  }

  static getAll(): Alert[] {
    return Array.from(alerts.values());
  }

  static getByAccount(accountId: string): Alert[] {
    return Array.from(alerts.values()).filter(a => a.accountId === accountId);
  }

  static update(id: string, updates: Partial<Alert>): Alert | null {
    const alert = alerts.get(id);
    if (!alert) {
      return null;
    }
    const updated = { ...alert, ...updates, id };
    alerts.set(id, updated);
    return updated;
  }

  static delete(id: string): boolean {
    return alerts.delete(id);
  }

  static checkAlerts(priceData: PriceData): Alert[] {
    const triggered: Alert[] = [];
    const currentPrice = priceData.price;

    for (const alert of alerts.values()) {
      if (!alert.enabled || alert.triggered || alert.tokenId !== priceData.tokenId) {
        continue;
      }

      let shouldTrigger = false;

      switch (alert.condition) {
        case 'PRICE_ABOVE':
          shouldTrigger = currentPrice > alert.threshold;
          break;
        case 'PRICE_BELOW':
          shouldTrigger = currentPrice < alert.threshold;
          break;
        case 'VOLUME_ABOVE':
          shouldTrigger = priceData.volume24h > alert.threshold;
          break;
        case 'VOLUME_BELOW':
          shouldTrigger = priceData.volume24h < alert.threshold;
          break;
      }

      if (shouldTrigger) {
        alert.triggered = true;
        alert.triggeredAt = new Date();
        alerts.set(alert.id, alert);
        triggered.push(alert);
      }
    }

    return triggered;
  }

  static updatePriceCache(tokenId: string, data: PriceData): void {
    priceCache.set(tokenId, data);
    this.checkAlerts(data);
  }
}

