import React from 'react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { PortfolioHistoryPoint, Position, Stock, Transaction } from '../types';
import { TrendingUp, TrendingDown, PieChart as PieIcon, BarChart3, Award, AlertTriangle } from 'lucide-react';

interface PortfolioAnalyticsProps {
  portfolioHistory: PortfolioHistoryPoint[];
  positions: Record<string, Position>;
  stocks: Stock[];
  cash: number;
  transactions: Transaction[];
  initialCapital?: number;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#14b8a6', '#6366f1'];

export const PortfolioAnalytics: React.FC<PortfolioAnalyticsProps> = ({
  portfolioHistory,
  positions,
  stocks,
  cash,
  transactions,
  initialCapital = 50000
}) => {
  // 1. Calculate Asset Allocation for Pie Chart
  let totalInvested = 0;
  const allocationData: { name: string; value: number; color: string; percent: number }[] = [];
  const sectorMap: Record<string, number> = {};

  (Object.entries(positions) as [string, Position][]).forEach(([symbol, pos], index) => {
    const stock = stocks.find(s => s.symbol === symbol);
    const currentPrice = stock ? stock.price : pos.avgBuyPrice;
    const value = Number((pos.shares * currentPrice).toFixed(2));
    totalInvested += value;

    allocationData.push({
      name: stock ? stock.name : symbol,
      value,
      color: COLORS[index % COLORS.length],
      percent: 0
    });

    const sector = stock ? stock.sector : 'Sonstiges';
    sectorMap[sector] = (sectorMap[sector] || 0) + value;
  });

  const totalEquity = cash + totalInvested;

  // Add Cash to allocation
  if (cash > 0) {
    allocationData.push({
      name: 'Barreserve (Cash)',
      value: Number(cash.toFixed(2)),
      color: '#64748b',
      percent: 0
    });
  }

  // Calculate percentages
  allocationData.forEach(item => {
    item.percent = totalEquity > 0 ? Number(((item.value / totalEquity) * 100).toFixed(1)) : 0;
  });

  // Sector distribution data
  const sectorData = Object.entries(sectorMap).map(([sector, val]) => ({
    sector,
    value: Number(val.toFixed(2)),
    percent: totalInvested > 0 ? Number(((val / totalInvested) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.value - a.value);

  // 2. Win Rate & Trade Stats
  const sellTrades = transactions.filter(t => t.type === 'SELL' && t.realizedPnL !== undefined);
  const winningTrades = sellTrades.filter(t => (t.realizedPnL || 0) > 0);
  const losingTrades = sellTrades.filter(t => (t.realizedPnL || 0) < 0);
  const winRate = sellTrades.length > 0 ? Math.round((winningTrades.length / sellTrades.length) * 100) : 0;
  const totalRealizedPnL = transactions.reduce((acc, t) => acc + (t.realizedPnL || 0), 0);

  // Total Return metrics
  const totalGain = totalEquity - initialCapital;
  const totalGainPercent = (totalGain / initialCapital) * 100;
  const isPositiveGain = totalGain >= 0;

  // Diversification score (based on number of positions and max single position concentration)
  const posCount = Object.keys(positions).length;
  let maxWeight = 0;
  (Object.values(positions) as Position[]).forEach(p => {
    const s = stocks.find(st => st.symbol === p.symbol);
    const v = p.shares * (s ? s.price : p.avgBuyPrice);
    const weight = totalEquity > 0 ? v / totalEquity : 0;
    if (weight > maxWeight) maxWeight = weight;
  });

  let diversificationRating = 'Basis';
  let diversificationScore = 20;
  if (posCount >= 5 && maxWeight < 0.35) {
    diversificationScore = 90;
    diversificationRating = 'Sehr gut gestreut';
  } else if (posCount >= 3 && maxWeight < 0.5) {
    diversificationScore = 70;
    diversificationRating = 'Ausgewogen';
  } else if (posCount >= 2) {
    diversificationScore = 45;
    diversificationRating = 'Mäßig diversifiziert';
  } else if (posCount === 1) {
    diversificationScore = 25;
    diversificationRating = 'Klumpenrisiko (1 Position)';
  } else {
    diversificationScore = 10;
    diversificationRating = 'Nur Cash vorhanden';
  }

  return (
    <div className="space-y-6" id="portfolio-analytics-view">
      {/* Top High-level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Return */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gesamtrendite</div>
          <div className={`text-2xl font-bold font-mono mt-1 ${isPositiveGain ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositiveGain ? '+' : ''}{totalGain.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mt-1">
            {isPositiveGain ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
            <span className={isPositiveGain ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {isPositiveGain ? '+' : ''}{totalGainPercent.toFixed(2)} %
            </span>
            <span>seit Start</span>
          </div>
        </div>

        {/* Realized vs Unrealized */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Realisierter Gewinn</div>
          <div className={`text-2xl font-bold font-mono mt-1 ${totalRealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalRealizedPnL >= 0 ? '+' : ''}{totalRealizedPnL.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
          <div className="text-xs text-slate-400 mt-1">
            aus {sellTrades.length} geschlossenen Verkäufen
          </div>
        </div>

        {/* Win Rate */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gewinnquote (Trades)</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {sellTrades.length > 0 ? `${winRate} %` : '—'}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{winningTrades.length} Gewinner</span>
            <span>/</span>
            <span className="text-rose-400 font-semibold">{losingTrades.length} Verlierer</span>
          </div>
        </div>

        {/* Diversification Score */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Diversifikation</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {diversificationScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
          </div>
          <div className="text-xs text-emerald-400 font-medium mt-1">
            {diversificationRating}
          </div>
        </div>
      </div>

      {/* Main Graphical Visualizations: Performance Curve + Asset Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Equity Evolution (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Vermögensentwicklung (Gesamtdepot)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Echtzeit-Tracking von Barbestand und aktuellem Marktwert aller Positionen
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Aktueller Depotwert</span>
              <div className="text-lg font-bold font-mono text-white">
                {totalEquity.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="timeLabel"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(1)}k €`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const pt = payload[0].payload as PortfolioHistoryPoint;
                      return (
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl text-xs space-y-1">
                          <div className="text-slate-400 font-mono">{pt.timeLabel} Uhr</div>
                          <div className="font-bold text-sm text-white font-mono">
                            {pt.totalEquity.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                          </div>
                          <div className="text-slate-400 flex justify-between gap-4">
                            <span>Investiert:</span>
                            <span className="font-mono text-slate-200">{pt.invested.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                          </div>
                          <div className="text-slate-400 flex justify-between gap-4">
                            <span>Barbestand:</span>
                            <span className="font-mono text-slate-200">{pt.cash.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalEquity"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#equityGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Allocation Pie/Donut Chart (1 col) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <PieIcon className="w-5 h-5 text-indigo-400" />
              Vermögensaufteilung
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Allokation nach Einzelwerten & Barbestand
            </p>

            <div className="h-56 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`, 'Wert']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Inner Donut Summary */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] text-slate-400">Positionen</span>
                <span className="text-xl font-bold font-mono text-white">{posCount}</span>
              </div>
            </div>
          </div>

          {/* Allocation Legend */}
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-xs">
            {allocationData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate max-w-[140px]">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-slate-300">{item.name}</span>
                </div>
                <div className="font-mono text-right flex-shrink-0">
                  <span className="text-slate-200 font-semibold">{item.percent}%</span>
                  <span className="text-slate-500 text-[11px] ml-1.5">
                    ({item.value.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sector Distribution Horizontal Bars */}
      {sectorData.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-teal-400" />
            Branchen- & Sektorverteilung
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Gewichtung deines investierten Kapitals nach Industrie- und Anlageklassen
          </p>

          <div className="space-y-3">
            {sectorData.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">{sec.sector}</span>
                  <span className="font-mono text-slate-400">
                    {sec.value.toLocaleString('de-DE', { minimumFractionDigits: 2 })} € ({sec.percent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-teal-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(3, sec.percent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
