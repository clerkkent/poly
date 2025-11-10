export interface PolymarketOrder {
  token_id: string;
  side: 'BUY' | 'SELL';
  price: string;
  size: string;
  order_type: 'GTC' | 'IOC' | 'FOK';
}

export interface PolymarketOrderResponse {
  order_id: string;
  status: string;
  filled_size: string;
  remaining_size: string;
}

