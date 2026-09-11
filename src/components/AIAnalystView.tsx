import React, { useState } from 'react';
import { Stock, Position, AIAnalysisResult } from '../types';
import { Sparkles, BrainCircuit, ShieldAlert, TrendingUp, CheckCircle, HelpCircle, Loader2 } from 'lucide-react';

interface AIAnalystViewProps {
  positions: Record<string, Position>;
  stocks: Stock[];
  cash: number;
}

export const AIAnalystView: React.FC<AIAnalystViewProps> = ({
  positions,
  stocks,
  cash
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('');

  const analyzePortfolio = async () => {
    setLoading(true);
    setError(null);

    const portfolioSummary = (Object.entries(positions) as [string, Position][]).map(([symbol, pos]) => {
      const stock = stocks.find(s => s.symbol === symbol);
      return {
        symbol,
        name: stock ? stock.name : symbol,
        sector: stock ? stock.sector : 'Sonstiges',
        shares: pos.shares,
        avgBuyPrice: pos.avgBuyPrice,
        currentPrice: stock ? stock.price : pos.avgBuyPrice,
        currentValue: Number((pos.shares * (stock ? stock.price : pos.avgBuyPrice)).toFixed(2))
      };
    });

    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryType: 'portfolio',
          portfolio: {
            cash,
            positionsCount: Object.keys(positions).length,
            holdings: portfolioSummary
          }
        })
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || 'Analyse fehlgeschlagen');
      }
    } catch (err: any) {
      setError('Verbindung zum KI-Server unterbrochen.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeSingleStock = async (symbol: string) => {
    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryType: 'stock',
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          changePercent: stock.changePercent
        })
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || 'Analyse fehlgeschlagen');
      }
    } catch (err: any) {
      setError('Verbindung zum KI-Server unterbrochen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="ai-analyst-view">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-900/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            Gemini KI-Marktberater
          </div>
          <h2 className="text-xl font-bold text-white">Intelligente Portfolio- & Aktienanalyse</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Lass dein simuliertes Depot von modernster KI analysieren, um Klumpenrisiken aufzudecken, Chancen zu identifizieren und Handelsentscheidungen fundiert zu treffen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={analyzePortfolio}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
            Gesamtdepot analysieren
          </button>
        </div>
      </div>

      {/* Stock Selection for single asset analysis */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-300">Einzelwert-Diagnose</div>
          <div className="text-[11px] text-slate-500">Wähle eine bestimmte Aktie für eine fundamentale Analyse</div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStockSymbol}
            onChange={(e) => setSelectedStockSymbol(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">Aktie auswählen...</option>
            {stocks.map(s => (
              <option key={s.symbol} value={s.symbol}>
                {s.name} ({s.symbol}) - {s.price.toFixed(2)} €
              </option>
            ))}
          </select>

          <button
            onClick={() => selectedStockSymbol && analyzeSingleStock(selectedStockSymbol)}
            disabled={!selectedStockSymbol || loading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors disabled:opacity-40"
          >
            Analysieren
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      {analysis && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Ergebnis</span>
              <h3 className="text-lg font-bold text-white mt-0.5">{analysis.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-300 font-semibold text-xs">
                Urteil: {analysis.verdict}
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs">
                Risikostufe: {analysis.riskLevel}
              </span>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Zusammenfassung & Marktstimmung
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Key factors */}
          {analysis.keyFactors && analysis.keyFactors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-200">Schlüsselfaktoren & Beobachtungspunkte</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {analysis.keyFactors.map((factor, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
                    <span className="font-mono font-bold text-indigo-400 mr-1.5">#{idx + 1}</span>
                    {factor}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strategic Recommendation */}
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
            <h4 className="text-xs font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Handlungsempfehlung für den Simulator
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {analysis.recommendation}
            </p>
          </div>
        </div>
      )}

      {/* Initial Educational Guidance if no analysis yet */}
      {!analysis && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs mb-3">
              01
            </div>
            <h4 className="font-bold text-white text-sm mb-1">Diversifikation messen</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Erfahre, ob dein simuliertes Kapital zu stark in einer einzelnen Branche konzentriert ist.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs mb-3">
              02
            </div>
            <h4 className="font-bold text-white text-sm mb-1">Sentiment & Trends</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Prüfe die aktuelle Dynamik von Tech-Schwergewichten, DAX-Konzernen und Krypto-Werten.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs mb-3">
              03
            </div>
            <h4 className="font-bold text-white text-sm mb-1">Risikofreies Üben</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Teste unterschiedliche Anlagestrategien mit virtuellem Geld und optimiere deine Trefferquote.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
