import React, { useState } from 'react';
import { Stock, Timeframe, Position, AIAnalysisResult } from '../types';
import { StockChart } from './StockChart';
import { X, Star, TrendingUp, TrendingDown, Sparkles, ShieldAlert, CheckCircle2, ArrowRightLeft, DollarSign, Clock } from 'lucide-react';

interface StockDetailModalProps {
  stock: Stock;
  onClose: () => void;
  cash: number;
  position?: Position;
  isWatchlisted: boolean;
  onToggleWatchlist: (symbol: string) => void;
  onBuy: (symbol: string, shares: number) => { success: boolean; error?: string };
  onSell: (symbol: string, shares: number) => { success: boolean; error?: string; realizedPnL?: number };
  onCreateLimitOrder: (symbol: string, type: 'LIMIT_BUY' | 'LIMIT_SELL', shares: number, targetPrice: number) => { success: boolean; error?: string };
  tickDirection?: 'up' | 'down';
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  stock,
  onClose,
  cash,
  position,
  isWatchlisted,
  onToggleWatchlist,
  onBuy,
  onSell,
  onCreateLimitOrder,
  tickDirection
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1T');
  const [activeTab, setActiveTab] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [orderAction, setOrderAction] = useState<'BUY' | 'SELL'>('BUY');

  // Order input state
  const [sharesInput, setSharesInput] = useState<string>('1');
  const [euroInput, setEuroInput] = useState<string>(stock.price.toFixed(2));
  const [inputMode, setInputMode] = useState<'SHARES' | 'EURO'>('SHARES');
  const [limitTargetPrice, setLimitTargetPrice] = useState<string>((stock.price * 0.98).toFixed(2));

  // AI analysis state
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const isPositive = stock.change >= 0;
  const currentShares = parseFloat(sharesInput) || 0;
  const flatFee = 1.00;
  const totalCost = (currentShares * stock.price) + (orderAction === 'BUY' ? flatFee : -flatFee);
  const remainingCash = cash - totalCost;

  // Handle shares change
  const handleSharesChange = (val: string) => {
    setSharesInput(val);
    setInputMode('SHARES');
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setEuroInput((num * stock.price).toFixed(2));
    } else {
      setEuroInput('');
    }
  };

  // Handle euro change
  const handleEuroChange = (val: string) => {
    setEuroInput(val);
    setInputMode('EURO');
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      const computedShares = Number((num / stock.price).toFixed(4));
      setSharesInput(computedShares.toString());
    } else {
      setSharesInput('');
    }
  };

  // Set percentage of available cash/shares
  const setPercentage = (pct: number) => {
    if (orderAction === 'BUY') {
      const usableCash = Math.max(0, cash - flatFee);
      const targetAmount = usableCash * (pct / 100);
      const computedShares = Math.floor((targetAmount / stock.price) * 1000) / 1000;
      setSharesInput(computedShares > 0 ? computedShares.toString() : '1');
      setEuroInput((computedShares * stock.price).toFixed(2));
    } else {
      if (!position) return;
      const sharesToSell = Math.floor((position.shares * (pct / 100)) * 1000) / 1000;
      setSharesInput(sharesToSell > 0 ? sharesToSell.toString() : position.shares.toString());
      setEuroInput((sharesToSell * stock.price).toFixed(2));
    }
  };

  const handleExecuteOrder = () => {
    const sharesNum = parseFloat(sharesInput);
    if (isNaN(sharesNum) || sharesNum <= 0) return;

    if (activeTab === 'MARKET') {
      if (orderAction === 'BUY') {
        onBuy(stock.symbol, sharesNum);
      } else {
        onSell(stock.symbol, sharesNum);
      }
    } else {
      // Limit order
      const targetPriceNum = parseFloat(limitTargetPrice);
      if (isNaN(targetPriceNum) || targetPriceNum <= 0) return;
      onCreateLimitOrder(
        stock.symbol,
        orderAction === 'BUY' ? 'LIMIT_BUY' : 'LIMIT_SELL',
        sharesNum,
        targetPriceNum
      );
    }
  };

  // Request AI Analysis
  const fetchAiAnalysis = async () => {
    setIsLoadingAI(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          changePercent: stock.changePercent,
          queryType: 'stock'
        })
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        setAiError(data.error || 'Analyse konnte nicht geladen werden.');
      }
    } catch (err: any) {
      setAiError('Verbindungsfehler zur Analyse-Schnittstelle.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Calculate 52w range progress percentage
  const fiftyTwoRange = stock.fiftyTwoWeekHigh - stock.fiftyTwoWeekLow;
  const fiftyTwoProgress = fiftyTwoRange > 0
    ? Math.min(100, Math.max(0, ((stock.price - stock.fiftyTwoWeekLow) / fiftyTwoRange) * 100))
    : 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div
        id="stock-detail-modal"
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold font-mono text-emerald-400 text-lg">
              {stock.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white">{stock.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {stock.symbol}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
                  {stock.sector}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl line-clamp-1">{stock.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleWatchlist(stock.symbol)}
              title={isWatchlisted ? 'Von Beobachtungsliste entfernen' : 'Zur Beobachtungsliste hinzufügen'}
              className={`p-2 rounded-lg border transition-colors ${
                isWatchlisted
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className="w-5 h-5" fill={isWatchlisted ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Live Price & Change Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-baseline gap-4">
              <span
                className={`text-3xl font-bold font-mono transition-colors duration-500 ${
                  tickDirection === 'up'
                    ? 'text-emerald-400'
                    : tickDirection === 'down'
                    ? 'text-rose-400'
                    : 'text-white'
                }`}
              >
                {stock.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </span>
              <div
                className={`flex items-center text-sm font-semibold px-2.5 py-1 rounded-md ${
                  isPositive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {isPositive ? '+' : ''}
                {stock.change.toFixed(2)} € ({isPositive ? '+' : ''}
                {stock.changePercent.toFixed(2)}%)
              </div>
            </div>

            {/* Timeframe selector pills */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
              {(['1T', '1W', '1M', '1J', '5J'] as Timeframe[]).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    timeframe === tf
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chart */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
            <StockChart data={stock.history[timeframe] || []} isPositive={isPositive} height={260} />
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400">Tageshoch / Tagestief</div>
              <div className="text-sm font-mono font-semibold text-slate-200 mt-1">
                {stock.dayHigh.toFixed(2)} € / {stock.dayLow.toFixed(2)} €
              </div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400">Marktkapitalisierung</div>
              <div className="text-sm font-mono font-semibold text-slate-200 mt-1">{stock.marketCap}</div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400">KGV (P/E Ratio)</div>
              <div className="text-sm font-mono font-semibold text-slate-200 mt-1">
                {stock.peRatio ? stock.peRatio.toFixed(1) : '-'}
              </div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400">Dividendenrendite</div>
              <div className="text-sm font-mono font-semibold text-slate-200 mt-1">
                {stock.dividendYield ? `${stock.dividendYield.toFixed(2)} %` : '0,00 %'}
              </div>
            </div>
          </div>

          {/* 52-Week Range Bar */}
          <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>52W Tief: {stock.fiftyTwoWeekLow.toFixed(2)} €</span>
              <span className="text-slate-200 font-semibold">52-Wochen-Spanne</span>
              <span>52W Hoch: {stock.fiftyTwoWeekHigh.toFixed(2)} €</span>
            </div>
            <div className="w-full bg-slate-700/60 rounded-full h-2 relative overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${fiftyTwoProgress}%` }}
              />
            </div>
          </div>

          {/* Current Position Banner if user owns this stock */}
          {position && position.shares > 0 && (
            <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Dein aktueller Bestand</div>
                <div className="text-lg font-bold text-white font-mono mt-0.5">
                  {position.shares} Anteile im Wert von {(position.shares * stock.price).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Ø Kaufkurs: {position.avgBuyPrice.toFixed(2)} € | Investiert: {position.totalInvested.toFixed(2)} €
                </div>
              </div>
              {(() => {
                const curVal = position.shares * stock.price;
                const gain = curVal - position.totalInvested;
                const gainPct = (gain / position.totalInvested) * 100;
                const isGain = gain >= 0;
                return (
                  <div className={`text-right ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <div className="text-xs font-semibold">Buchgewinn / -verlust</div>
                    <div className="text-lg font-bold font-mono">
                      {isGain ? '+' : ''}{gain.toFixed(2)} € ({isGain ? '+' : ''}{gainPct.toFixed(2)}%)
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Trading Execution Console */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              {/* Order Mode: Market vs Limit */}
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                <button
                  onClick={() => setActiveTab('MARKET')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'MARKET' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sofort-Order (Market)
                </button>
                <button
                  onClick={() => setActiveTab('LIMIT')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    activeTab === 'LIMIT' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Limit-Order
                </button>
              </div>

              {/* Order Action: Kaufen vs Verkaufen */}
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                <button
                  onClick={() => setOrderAction('BUY')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                    orderAction === 'BUY' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-400'
                  }`}
                >
                  Kaufen
                </button>
                <button
                  onClick={() => setOrderAction('SELL')}
                  disabled={!position || position.shares <= 0}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                    orderAction === 'SELL'
                      ? 'bg-rose-600 text-white'
                      : position && position.shares > 0
                      ? 'text-slate-400 hover:text-rose-400'
                      : 'text-slate-600 cursor-not-allowed'
                  }`}
                >
                  Verkaufen {position && `(${position.shares})`}
                </button>
              </div>
            </div>

            {/* Input fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Anzahl Anteile
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    value={sharesInput}
                    onChange={(e) => handleSharesChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="1"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">Stk.</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Gegenwert in Euro
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={euroInput}
                    onChange={(e) => handleEuroChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="100.00"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">€</span>
                </div>
              </div>
            </div>

            {/* If Limit Order: Target Price input */}
            {activeTab === 'LIMIT' && (
              <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl">
                <label className="block text-xs font-semibold text-amber-400 mb-1.5">
                  Zielkurs (Limit-Preis in €)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={limitTargetPrice}
                    onChange={(e) => setLimitTargetPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                    placeholder={stock.price.toFixed(2)}
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400">€</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {orderAction === 'BUY'
                    ? 'Wird automatisch ausgeführt, sobald der Kurs auf oder unter diesen Wert fällt.'
                    : 'Wird automatisch ausgeführt, sobald der Kurs diesen Wert erreicht oder übersteigt.'}
                </p>
              </div>
            )}

            {/* Quick Percentage Presets */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold mr-1">Schnellwahl:</span>
              {[25, 50, 75, 100].map(pct => (
                <button
                  key={pct}
                  onClick={() => setPercentage(pct)}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  {pct === 100 ? 'Max' : `${pct}%`}
                </button>
              ))}
            </div>

            {/* Order Summary calculations */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Verfügbares virtuelles Guthaben:</span>
                <span className="font-mono text-slate-200">{cash.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Ordergebühr (simuliert):</span>
                <span className="font-mono text-slate-200">{flatFee.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-200 pt-1 border-t border-slate-800">
                <span>{orderAction === 'BUY' ? 'Gesamt-Kaufsumme:' : 'Netto-Verkaufserlös:'}</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {totalCost.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
              </div>
            </div>

            {/* Execute Button */}
            <button
              id="execute-trade-button"
              onClick={handleExecuteOrder}
              disabled={orderAction === 'BUY' ? remainingCash < 0 || currentShares <= 0 : !position || currentShares <= 0 || currentShares > (position.shares + 0.0001)}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                orderAction === 'BUY'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              {activeTab === 'MARKET'
                ? orderAction === 'BUY'
                  ? `${currentShares} Anteile jetzt kaufen (${totalCost.toFixed(2)} €)`
                  : `${currentShares} Anteile jetzt verkaufen`
                : orderAction === 'BUY'
                ? `Limit-Kauforder platzieren (${currentShares} Stk. @ ${limitTargetPrice} €)`
                : `Limit-Verkaufsorder platzieren (${currentShares} Stk. @ ${limitTargetPrice} €)`}
            </button>
          </div>

          {/* AI Fundamental & Trend Analysis Section */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-slate-900 to-slate-950 border border-indigo-900/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">KI-Marktanalyst & Einschätzung</h3>
              </div>
              <button
                id="fetch-ai-stock-analysis"
                onClick={fetchAiAnalysis}
                disabled={isLoadingAI}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isLoadingAI ? 'animate-spin' : ''}`} />
                {isLoadingAI ? 'Analysiere Marktdaten...' : 'Aktie analysieren'}
              </button>
            </div>

            {aiError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {aiError}
              </div>
            )}

            {aiAnalysis ? (
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-indigo-900/20 border border-indigo-800/30">
                  <span className="font-semibold text-indigo-200">Urteil: {aiAnalysis.verdict}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                    Risiko: {aiAnalysis.riskLevel}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">{aiAnalysis.summary}</p>
                {aiAnalysis.keyFactors && aiAnalysis.keyFactors.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-200">Wichtigste Marktfaktoren:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                      {aiAnalysis.keyFactors.map((kf, i) => (
                        <li key={i}>{kf}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
                  <span className="font-semibold">Simulations-Tipp: </span>
                  {aiAnalysis.recommendation}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                Erhalte eine fundierte KI-Bewertung zu Geschäftsmodell, Markttrends und Strategietipps für deine simulierte Investition.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
