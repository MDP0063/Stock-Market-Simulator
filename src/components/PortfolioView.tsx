import React from 'react';
import { Position, Stock } from '../types';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet, DollarSign, Layers } from 'lucide-react';

interface PortfolioViewProps {
  positions: Record<string, Position>;
  stocks: Stock[];
  cash: number;
  onSelectStock: (stock: Stock) => void;
  onNavigateToMarkets: () => void;
  lastTickDirection: Record<string, 'up' | 'down'>;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  positions,
  stocks,
  cash,
  onSelectStock,
  onNavigateToMarkets,
  lastTickDirection
}) => {
  const positionEntries = Object.entries(positions) as [string, Position][];

  let totalInvested = 0;
  let totalCurrentValue = 0;
  let totalDayChangeEuro = 0;

  positionEntries.forEach(([symbol, pos]) => {
    const stock = stocks.find(s => s.symbol === symbol);
    const currentPrice = stock ? stock.price : pos.avgBuyPrice;
    const posVal = pos.shares * currentPrice;
    totalInvested += pos.totalInvested;
    totalCurrentValue += posVal;

    if (stock) {
      totalDayChangeEuro += pos.shares * stock.change;
    }
  });

  const totalEquity = cash + totalCurrentValue;
  const unrealizedPnL = totalCurrentValue - totalInvested;
  const unrealizedPnLPercent = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;
  const isPositivePnL = unrealizedPnL >= 0;
  const isPositiveDay = totalDayChangeEuro >= 0;

  return (
    <div className="space-y-6" id="portfolio-depot-view">
      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-emerald-400" />
            Depot-Gesamtwert
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {totalEquity.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
          <div className="text-xs text-slate-400 mt-1">
            inkl. {cash.toLocaleString('de-DE', { minimumFractionDigits: 2 })} € Barreserve
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Unveräußerter Buchgewinn
          </div>
          <div className={`text-2xl font-bold font-mono mt-1 ${isPositivePnL ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositivePnL ? '+' : ''}{unrealizedPnL.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
          <div className="text-xs font-semibold mt-1 flex items-center gap-1">
            <span className={isPositivePnL ? 'text-emerald-400' : 'text-rose-400'}>
              {isPositivePnL ? '+' : ''}{unrealizedPnLPercent.toFixed(2)} %
            </span>
            <span className="text-slate-500 font-normal">auf investiertes Kapital</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <DollarSign className="w-4 h-4 text-indigo-400" />
            Investiertes Kapital
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {totalInvested.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
          <div className="text-xs text-slate-400 mt-1">
            in {positionEntries.length} aktive Positionen
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <ArrowUpRight className="w-4 h-4 text-teal-400" />
            Heutige Wertänderung
          </div>
          <div className={`text-2xl font-bold font-mono mt-1 ${isPositiveDay ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositiveDay ? '+' : ''}{totalDayChangeEuro.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
          <div className="text-xs text-slate-400 mt-1">
            über alle gehaltenen Aktien
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      {positionEntries.length > 0 ? (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Gehaltene Positionen</h3>
            <span className="text-xs text-slate-400 font-mono">{positionEntries.length} Werte</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4 text-right">Anteile</th>
                  <th className="py-3 px-4 text-right">Ø Kaufkurs</th>
                  <th className="py-3 px-4 text-right">Aktueller Kurs</th>
                  <th className="py-3 px-4 text-right">Gesamtwert</th>
                  <th className="py-3 px-4 text-right">Gewinn / Verlust (€ & %)</th>
                  <th className="py-3 px-4 text-right">Heute</th>
                  <th className="py-3 px-4 text-center">Handel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {positionEntries.map(([symbol, pos]) => {
                  const stock = stocks.find(s => s.symbol === symbol);
                  const currentPrice = stock ? stock.price : pos.avgBuyPrice;
                  const totalVal = pos.shares * currentPrice;
                  const pnl = totalVal - pos.totalInvested;
                  const pnlPct = (pnl / pos.totalInvested) * 100;
                  const isGain = pnl >= 0;
                  const dayChangeVal = stock ? pos.shares * stock.change : 0;
                  const isDayPositive = dayChangeVal >= 0;
                  const tickDir = lastTickDirection[symbol];

                  return (
                    <tr
                      key={symbol}
                      onClick={() => stock && onSelectStock(stock)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold font-mono text-emerald-400 text-xs">
                            {symbol.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{stock ? stock.name : symbol}</div>
                            <div className="text-slate-400 font-mono text-[11px]">{symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-200 font-semibold">
                        {pos.shares.toLocaleString('de-DE', { maximumFractionDigits: 4 })} Stk.
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {pos.avgBuyPrice.toFixed(2)} €
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                        <span
                          className={`transition-colors duration-500 ${
                            tickDir === 'up'
                              ? 'text-emerald-400'
                              : tickDir === 'down'
                              ? 'text-rose-400'
                              : 'text-white'
                          }`}
                        >
                          {currentPrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-100 text-sm">
                        {totalVal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <div className={`font-bold ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isGain ? '+' : ''}{pnl.toFixed(2)} €
                        </div>
                        <div className={`text-[11px] ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ({isGain ? '+' : ''}{pnlPct.toFixed(2)} %)
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <div className={`text-xs ${isDayPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isDayPositive ? '+' : ''}{dayChangeVal.toFixed(2)} €
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => stock && onSelectStock(stock)}
                            className="px-2.5 py-1 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-[11px] transition-colors"
                          >
                            Kaufen
                          </button>
                          <button
                            onClick={() => stock && onSelectStock(stock)}
                            className="px-2.5 py-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-[11px] transition-colors"
                          >
                            Verkaufen
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty Portfolio State */
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 shadow-xl max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Noch keine Aktien im Depot</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Dein virtuelles Startguthaben von {cash.toLocaleString('de-DE', { minimumFractionDigits: 2 })} € steht bereit. Wähle eine Aktie aus, um deine erste Simulation risikofrei zu starten!
          </p>
          <button
            onClick={onNavigateToMarkets}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950 inline-flex items-center gap-2"
          >
            Zu den Aktien & Märkten
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
