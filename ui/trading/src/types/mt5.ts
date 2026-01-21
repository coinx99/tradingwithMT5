export interface MT5AccountInfo {
  login: number;
  server: string;
  name: string;
  company: string;
  currency: string;
  balance: number;
  equity: number;
  margin: number;
  marginFree: number;
  leverage: number;
}

export interface MT5LivePosition {
  ticket: number;
  symbol: string;
  volume: number;
  type: number;
  priceOpen: number;
  priceCurrent: number;
  profit: number;
  magic: number;
  sl: number;
  tp: number;
}

export interface MT5LiveOrder {
  ticket: number;
  symbol: string;
  volumeCurrent: number;
  type: number;
  priceOpen: number;
  sl: number;
  tp: number;
  magic: number;
  state: number;
}

export interface MT5Trade {
  id: string;
  symbol: string;
  volume: number;
  type: string;
  price: number;
  profit: number;
  commission: number;
  swap: number;
  ticketId?: string | null;
  magic?: number | null;
  openTime: string;
  closeTime?: string | null;
}

export type OrderSide = 'BUY' | 'SELL';

export interface PlaceOrderInput {
  symbol: string;
  volume: number;
  type: OrderSide;
  price: number;
  sl?: number;
  tp?: number;
  ticketId?: string;
  magic?: number;
}
