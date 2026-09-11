import React from 'react';
import { Stock, Position, PortfolioHistoryPoint } from '../types';
import { StockChart } from './StockChart';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Wallet,
  Coins,
  Layers,
  Sparkles,
  Star,
  LineChart,
  ArrowRight
} from 'lucide-react';

interface DashboardViewProps {
  portfolioHistory: PortfolioHistoryPoint[];
  stocks: Stock[];
  positions: Record<string, Position>;
  cash: number;
  totalEquity: number;
  totalProfit: number;
  totalProfitPercent: number;
  watchlist: string[];
  onSelectStock: (stock: Stock) => void;
  onNavigateTab: (tab: any) => void;
  lastTickDirection: Record<string, 'up' | 'down'>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  portfolioHistory,
  stocks,
  positions,
  cash,
  totalEquity,
  totalProfit,
  totalProfitPercent,
  watchlist,
  onSelectStock,
  onNavigateTab,
  lastTickDirection
}) => {
  const isPositive = totalProfit >= 0;

  // Compute invested value
  let investedValue = 0;
  (Object.entries(positions) as [string, Position][]).forEach(([sym, p]) => {
    const s = stocks.find(st => st.symbol === sym);
    investedValue += p.shares * (s ? s.price : p.avgBuyPrice);
  });

  // Top Gainers and Losers
  const sortedGainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
  const sortedLosers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);

  // Watchlist stocks
  const watchlistStocks = stocks.filter(s => watchlist.includes(s.symbol));

  return (
    <div className="space-y-6" id="dashboard-view">
      {/* 4 Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Equity */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Gesamt-Depotwert</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">
            {totalEquity.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
          <div className="flex items-center gap-1.5 text-xs mt-1">
            <span className={`font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? '+' : ''}{totalProfit.toLocaleString('de-DE', { minimumFractionDigits: 2 })} € ({isPositive ? '+' : ''}{totalProfitPercent.toFixed(2)}%)
            </span>
            <span className="text-slate-500">Gesamtrendite</span>
          </div>
        </div>

        {/* Cash Available */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Verfügbares Bargeld</span>
            <Wallet className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1.5">
            {cash.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Bereit für Sofortkäufe & Limit-Orders
          </div>
        </div>

        {/* Invested in Assets */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Investierter Marktwert</span>
            <Coins className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">
            {investedValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
          <div className="text-xs text-slate-400 mt-1">
            in {Object.keys(positions).length} gehaltenen Wertpapieren
          </div>
        </div>

        {/* Market Status */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Marktstatus</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-base font-bold text-white mt-1">
            Echtzeit-Simulation aktiv
          </div>
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <span>Alle 16 Werte ticken live</span>
          </div>
        </div>
      </div>

      {/* Main Chart Section & Side Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Live Chart (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <LineChart className="w-5 h-5 text-emerald-400" />
                Live-Depotverlauf
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Veränderung deines simulierten Gesamtvermögens mit jedem Tick
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('ANALYTICS')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
            >
              Vollständige Auswertung
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <StockChart
              data={portfolioHistory.map(p => ({ time: p.timeLabel, price: p.totalEquity }))}
              isPositive={isPositive}
              height={256}
              showAxes={true}
            />
          </div>
        </div>

        {/* Quick Movers (Gainers & Losers) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Börsentrends heute</h3>
            <button
              onClick={() => onNavigateTab('MARKETS')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Alle Werte
            </button>
          </div>

          {/* Top Gainers */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Top Gewinner
            </span>
            <div className="space-y-1.5">
              {sortedGainers.map(s => (
                <div
                  key={s.symbol}
                  onClick={() => onSelectStock(s)}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 transition-colors cursor-pointer text-xs"
                >
                  <div className="truncate max-w-[130px]">
                    <div className="font-bold text-white truncate">{s.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{s.symbol}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-white font-semibold">{s.price.toFixed(2)} €</div>
                    <div className="text-emerald-400 font-bold text-[11px]">+{s.changePercent.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="space-y-2 pt-1 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              Top Verlierer
            </span>
            <div className="space-y-1.5">
              {sortedLosers.map(s => (
                <div
                  key={s.symbol}
                  onClick={() => onSelectStock(s)}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 transition-colors cursor-pointer text-xs"
                >
                  <div className="truncate max-w-[130px]">
                    <div className="font-bold text-white truncate">{s.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{s.symbol}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-white font-semibold">{s.price.toFixed(2)} €</div>
                    <div className="text-rose-400 font-bold text-[11px]">{s.changePercent.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Watchlist & Active Positions Quick Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Watchlist */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" fill="currentColor" />
              Deine Beobachtungsliste
            </h3>
            <span className="text-xs text-slate-400 font-mono">{watchlistStocks.length} Werte</span>
          </div>

          {watchlistStocks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {watchlistStocks.map(stock => {
                const isPos = stock.change >= 0;
                const tickDir = lastTickDirection[stock.symbol];
                return (
                  <div
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock)}
                    className="p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white text-xs truncate max-w-[120px]">{stock.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{stock.symbol}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div
                        className={`text-xs font-bold transition-colors ${
                          tickDir === 'up'
                            ? 'text-emerald-400'
                            : tickDir === 'down'
                            ? 'text-rose-400'
                            : 'text-white'
                        }`}
                      >
                        {stock.price.toFixed(2)} €
                      </div>
                      <div className={`text-[11px] font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              Noch keine Aktien gemerkt. Klicke auf den Stern bei einer Aktie, um sie hier im Blick zu behalten.
            </div>
          )}
        </div>

        {/* Current Depot Glance */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                Aktuelle Positionen im Depot
              </h3>
              <button
                onClick={() => onNavigateTab('PORTFOLIO')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Zum Depot
              </button>
            </div>

            {Object.keys(positions).length > 0 ? (
              <div className="space-y-2">
                {(Object.entries(positions) as [string, Position][]).slice(0, 4).map(([symbol, pos]) => {
                  const stock = stocks.find(s => s.symbol === symbol);
                  const curPrice = stock ? stock.price : pos.avgBuyPrice;
                  const val = pos.shares * curPrice;
                  const profit = val - pos.totalInvested;
                  const isProfit = profit >= 0;

                  return (
                    <div
                      key={symbol}
                      onClick={() => stock && onSelectStock(stock)}
                      className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 transition-colors cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-mono font-bold text-emerald-400 text-[10px]">
                          {symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-white">{stock ? stock.name : symbol}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{pos.shares} Anteile</div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="font-bold text-white">{val.toFixed(2)} €</div>
                        <div className={`text-[10px] font-semibold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}{profit.toFixed(2)} €
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                Dein Depot ist aktuell noch leer. Kaufe Aktien im Marktbereich, um dein Portfolio aufzubauen!
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Verfügbares Barvermögen:</span>
            <span className="font-mono font-bold text-emerald-400">{cash.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
          </div>
        </div>
      </div>
    </div>
  );
};
