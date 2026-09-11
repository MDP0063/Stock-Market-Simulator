import React, { useState } from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  PlusCircle,
  TrendingUp,
  LayoutDashboard,
  LineChart,
  Briefcase,
  PieChart,
  ClipboardList,
  Sparkles,
  Layers
} from 'lucide-react';

export type ViewTab = 'DASHBOARD' | 'MARKETS' | 'PORTFOLIO' | 'ANALYTICS' | 'ORDERS' | 'AI_ANALYST';

interface NavbarProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  totalEquity: number;
  cash: number;
  totalProfit: number;
  totalProfitPercent: number;
  isSimulating: boolean;
  onToggleSimulating: () => void;
  onResetPortfolio: () => void;
  onAddFunds: (amount: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  totalEquity,
  cash,
  totalProfit,
  totalProfitPercent,
  isSimulating,
  onToggleSimulating,
  onResetPortfolio,
  onAddFunds
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const isPositive = totalProfit >= 0;

  const navItems: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'DASHBOARD', label: 'Übersicht', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'MARKETS', label: 'Aktien & Märkte', icon: <LineChart className="w-4 h-4" /> },
    { id: 'PORTFOLIO', label: 'Mein Depot', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'ANALYTICS', label: 'Auswertungen', icon: <PieChart className="w-4 h-4" /> },
    { id: 'ORDERS', label: 'Orderbuch & Historie', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'AI_ANALYST', label: 'KI-Analyst', icon: <Sparkles className="w-4 h-4 text-indigo-400" /> },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Top Bar */}
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo and Live Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-950 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Aktien & Investment Simulator
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE TICKER
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Risikofreies Paper-Trading in Echtzeit mit 50.000 € Startguthaben
                </p>
              </div>
            </div>

            {/* Live Portfolio Equity Quick Stat */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-[11px] text-slate-400 font-medium">Gesamt-Depotwert</div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-base font-bold font-mono text-white">
                    {totalEquity.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-1.5 py-0.2 rounded ${
                      isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                    }`}
                  >
                    {isPositive ? '+' : ''}{totalProfitPercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Simulation Controls */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1">
                <button
                  id="toggle-simulation-button"
                  onClick={onToggleSimulating}
                  title={isSimulating ? 'Simulation anhalten' : 'Simulation fortsetzen'}
                  className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                    isSimulating
                      ? 'bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-800/40'
                      : 'bg-amber-950/60 text-amber-400 hover:bg-amber-900/40 border border-amber-800/40'
                  }`}
                >
                  {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span className="hidden md:inline">{isSimulating ? 'Live' : 'Pausiert'}</span>
                </button>

                <button
                  id="add-funds-button"
                  onClick={() => onAddFunds(10000)}
                  title="+10.000 € virtuelles Guthaben hinzufügen"
                  className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1 text-xs font-semibold"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">+10k €</span>
                </button>

                <button
                  id="reset-portfolio-button"
                  onClick={() => setShowResetConfirm(true)}
                  title="Depot zurücksetzen"
                  className="p-2 rounded-lg bg-slate-800/70 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <nav className="flex items-center gap-1 overflow-x-auto py-2.5 border-t border-slate-800/60 scrollbar-none">
            {navItems.map(item => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id.toLowerCase()}`}
                  onClick={() => onTabChange(item.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-rose-400" />
              Depot zurücksetzen?
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Möchtest du dein Depot wirklich auf das ursprüngliche Startkapital von <strong>50.000 €</strong> zurücksetzen? Alle bisherigen Aktienpositionen, offenen Limit-Orders und Transaktionen werden gelöscht.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  onResetPortfolio();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors shadow-lg shadow-rose-950"
              >
                Ja, Depot zurücksetzen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
