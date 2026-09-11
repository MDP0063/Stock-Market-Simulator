export type Timeframe = '1T' | '1W' | '1M' | '1J' | '5J';

export type AssetCategory = 'Alle' | 'Tech' | 'DAX' | 'ETFs' | 'Krypto & Rohstoffe';

export interface PricePoint {
  time: string;
  price: number;
  volume?: number;
}

export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  category: 'Tech' | 'DAX' | 'ETFs' | 'Krypto & Rohstoffe';
  price: number;
  previousClose: number;
  openPrice: number;
  dayHigh: number;
  dayLow: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  peRatio?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  description: string;
  history: Record<Timeframe, PricePoint[]>;
}

export interface Position {
  symbol: string;
  shares: number;
  avgBuyPrice: number;
  totalInvested: number;
  firstBoughtAt: string;
  lastBoughtAt: string;
}

export type OrderType = 'MARKET_BUY' | 'MARKET_SELL' | 'LIMIT_BUY' | 'LIMIT_SELL';

export interface Transaction {
  id: string;
  timestamp: string;
  symbol: string;
  name: string;
  type: 'BUY' | 'SELL';
  shares: number;
  pricePerShare: number;
  fee: number;
  totalAmount: number;
  realizedPnL?: number;
}

export interface LimitOrder {
  id: string;
  timestamp: string;
  symbol: string;
  name: string;
  type: 'LIMIT_BUY' | 'LIMIT_SELL';
  shares: number;
  targetPrice: number;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
  createdAtPrice: number;
}

export interface PortfolioHistoryPoint {
  timestamp: string;
  timeLabel: string;
  totalEquity: number;
  cash: number;
  invested: number;
  profit: number;
  profitPercent: number;
}

export interface AIAnalysisResult {
  title: string;
  verdict: string;
  summary: string;
  keyFactors: string[];
  riskLevel: 'Niedrig' | 'Moderat' | 'Hoch' | string;
  recommendation: string;
}
