import React, { useState } from 'react';
import { Stock, AssetCategory } from '../types';
import { StockChart } from './StockChart';
import { Search, Star, TrendingUp, TrendingDown, ArrowUpDown, Filter, Sparkles } from 'lucide-react';

interface MarketsViewProps {
  stocks: Stock[];
  watchlist: string[];
  onToggleWatchlist: (symbol: string) => void;
  onSelectStock: (stock: Stock) => void;
  lastTickDirection: Record<string, 'up' | 'down'>;
}

export const MarketsView: React.FC<MarketsViewProps> = ({
  stocks,
  watchlist,
  onToggleWatchlist,
  onSelectStock,
  lastTickDirection
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'Merkliste'>('Alle');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'POPULAR' | 'GAINERS' | 'LOSERS' | 'NAME'>('POPULAR');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Filter stocks
  const filteredStocks = stocks.filter(stock => {
    // Search match
    const matchesSearch =
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.sector.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Category match
    if (selectedCategory === 'Alle') return true;
    if (selectedCategory === 'Merkliste') return watchlist.includes(stock.symbol);
    return stock.category === selectedCategory;
  });

  // Sort stocks
  const sortedStocks = [...filteredStocks].sort((a, b) => {
    if (sortBy === 'GAINERS') return b.changePercent - a.changePercent;
    if (sortBy === 'LOSERS') return a.changePercent - b.changePercent;
    if (sortBy === 'NAME') return a.name.localeCompare(b.name);
    return 0; // default order
  });

  const categories: (AssetCategory | 'Merkliste')[] = ['Alle', 'Tech', 'DAX', 'ETFs', 'Krypto & Rohstoffe', 'Merkliste'];

  return (
    <div className="space-y-6" id="markets-view">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            id="stock-search-input"
            type="text"
            placeholder="Aktie, Symbol oder Branche suchen (z.B. Nvidia, Apple, DAX)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300"
            >
              Löschen
            </button>
          )}
        </div>

        {/* Sort and View Mode */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="POPULAR" className="bg-slate-900">Standard-Sortierung</option>
              <option value="GAINERS" className="bg-slate-900">Top Gewinner (%)</option>
              <option value="LOSERS" className="bg-slate-900">Top Verlierer (%)</option>
              <option value="NAME" className="bg-slate-900">Name (A-Z)</option>
            </select>
          </div>

          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setViewMode('GRID')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'GRID' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Karten
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'TABLE' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tabelle
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => {
          const isSelected = selectedCategory === cat;
          const count = cat === 'Alle'
            ? stocks.length
            : cat === 'Merkliste'
            ? watchlist.length
            : stocks.filter(s => s.category === cat).length;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat === 'Merkliste' && <Star className="w-3.5 h-3.5" fill={isSelected ? 'currentColor' : 'none'} />}
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-800 text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid View */}
      {viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedStocks.map(stock => {
            const isPositive = stock.change >= 0;
            const isWatchlisted = watchlist.includes(stock.symbol);
            const tickDir = lastTickDirection[stock.symbol];

            return (
              <div
                key={stock.symbol}
                id={`stock-card-${stock.symbol}`}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all hover:shadow-xl group flex flex-col justify-between"
              >
                {/* Card Top */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold font-mono text-emerald-400 text-sm">
                        {stock.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors line-clamp-1">
                          {stock.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="font-mono">{stock.symbol}</span>
                          <span>•</span>
                          <span className="text-[11px] truncate max-w-[90px]">{stock.sector}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist(stock.symbol);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isWatchlisted
                          ? 'text-amber-400 hover:text-amber-300'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      <Star className="w-4 h-4" fill={isWatchlisted ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Price & Change */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <span
                      className={`text-xl font-bold font-mono transition-colors duration-500 ${
                        tickDir === 'up'
                          ? 'text-emerald-400'
                          : tickDir === 'down'
                          ? 'text-rose-400'
                          : 'text-white'
                      }`}
                    >
                      {stock.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>

                    <span
                      className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-md ${
                        isPositive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)} %
                    </span>
                  </div>

                  {/* Sparkline chart */}
                  <div className="mt-3 h-16 w-full -mx-1">
                    <StockChart
                      data={stock.history['1T'] || []}
                      isPositive={isPositive}
                      height={64}
                      showAxes={false}
                    />
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => onSelectStock(stock)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    Details & Chart
                  </button>
                  <button
                    onClick={() => onSelectStock(stock)}
                    className="px-4 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-xs font-bold text-white transition-colors shadow-sm shadow-emerald-950"
                  >
                    Handeln
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Wertpapier</th>
                  <th className="py-3 px-4">Sektor</th>
                  <th className="py-3 px-4 text-right">Kurs</th>
                  <th className="py-3 px-4 text-right">Änderung (€ / %)</th>
                  <th className="py-3 px-4 text-right">Tageshoch / -tief</th>
                  <th className="py-3 px-4 text-right">Marktkapitalisierung</th>
                  <th className="py-3 px-4 text-center">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {sortedStocks.map(stock => {
                  const isPositive = stock.change >= 0;
                  const isWatchlisted = watchlist.includes(stock.symbol);
                  const tickDir = lastTickDirection[stock.symbol];

                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => onSelectStock(stock)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWatchlist(stock.symbol);
                            }}
                            className={`p-1 rounded transition-colors ${
                              isWatchlisted ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                            }`}
                          >
                            <Star className="w-4 h-4" fill={isWatchlisted ? 'currentColor' : 'none'} />
                          </button>
                          <div>
                            <div className="font-bold text-white text-sm">{stock.name}</div>
                            <div className="text-slate-400 font-mono text-[11px]">{stock.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px]">
                          {stock.sector}
                        </span>
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
                          {stock.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        <div className={isPositive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                          {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)} %
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {isPositive ? '+' : ''}{stock.change.toFixed(2)} €
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        <div>{stock.dayHigh.toFixed(2)} €</div>
                        <div className="text-[11px] text-slate-500">{stock.dayLow.toFixed(2)} €</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {stock.marketCap}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStock(stock);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-colors"
                        >
                          Handeln
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sortedStocks.length === 0 && (
        <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
          <p className="text-sm font-semibold">Keine Wertpapiere gefunden</p>
          <p className="text-xs text-slate-500 mt-1">Überprüfe deine Suchbegriffe oder wähle eine andere Kategorie.</p>
        </div>
      )}
    </div>
  );
};
