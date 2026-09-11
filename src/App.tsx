import React, { useState } from 'react';
import { useMarketSimulation } from './hooks/useMarketSimulation';
import { Navbar, ViewTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { MarketsView } from './components/MarketsView';
import { PortfolioView } from './components/PortfolioView';
import { PortfolioAnalytics } from './components/PortfolioAnalytics';
import { OrdersView } from './components/OrdersView';
import { AIAnalystView } from './components/AIAnalystView';
import { StockDetailModal } from './components/StockDetailModal';
import { ToastNotification } from './components/ToastNotification';
import { Stock } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('DASHBOARD');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  const {
    stocks,
    cash,
    positions,
    transactions,
    limitOrders,
    watchlist,
    portfolioHistory,
    portfolioSummary,
    isSimulating,
    setIsSimulating,
    lastTickDirection,
    notification,
    dismissNotification,
    buyStock,
    sellStock,
    createLimitOrder,
    cancelLimitOrder,
    toggleWatchlist,
    resetPortfolio,
    addFunds
  } = useMarketSimulation();

  // If a stock is currently open in modal, keep its data synced with live tick updates
  const activeStockData = selectedStock
    ? stocks.find(s => s.symbol === selectedStock.symbol) || selectedStock
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        totalEquity={portfolioSummary.totalEquity}
        cash={cash}
        totalProfit={portfolioSummary.totalProfit}
        totalProfitPercent={portfolioSummary.totalProfitPercent}
        isSimulating={isSimulating}
        onToggleSimulating={() => setIsSimulating(prev => !prev)}
        onResetPortfolio={resetPortfolio}
        onAddFunds={addFunds}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'DASHBOARD' && (
          <DashboardView
            portfolioHistory={portfolioHistory}
            stocks={stocks}
            positions={positions}
            cash={cash}
            totalEquity={portfolioSummary.totalEquity}
            totalProfit={portfolioSummary.totalProfit}
            totalProfitPercent={portfolioSummary.totalProfitPercent}
            watchlist={watchlist}
            onSelectStock={setSelectedStock}
            onNavigateTab={setCurrentTab}
            lastTickDirection={lastTickDirection}
          />
        )}

        {currentTab === 'MARKETS' && (
          <MarketsView
            stocks={stocks}
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
            onSelectStock={setSelectedStock}
            lastTickDirection={lastTickDirection}
          />
        )}

        {currentTab === 'PORTFOLIO' && (
          <PortfolioView
            positions={positions}
            stocks={stocks}
            cash={cash}
            onSelectStock={setSelectedStock}
            onNavigateToMarkets={() => setCurrentTab('MARKETS')}
            lastTickDirection={lastTickDirection}
          />
        )}

        {currentTab === 'ANALYTICS' && (
          <PortfolioAnalytics
            portfolioHistory={portfolioHistory}
            positions={positions}
            stocks={stocks}
            cash={cash}
            transactions={transactions}
          />
        )}

        {currentTab === 'ORDERS' && (
          <OrdersView
            transactions={transactions}
            limitOrders={limitOrders}
            stocks={stocks}
            onCancelLimitOrder={cancelLimitOrder}
          />
        )}

        {currentTab === 'AI_ANALYST' && (
          <AIAnalystView
            positions={positions}
            stocks={stocks}
            cash={cash}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          <p>
            Börsensimulator für Bildungs- und Übungszwecke. Alle Transaktionen werden mit virtuellem Kapital (Paper Trading) simuliert. Keine reale Anlageberatung.
          </p>
        </div>
      </footer>

      {/* Stock Trading & Detail Modal */}
      {activeStockData && (
        <StockDetailModal
          stock={activeStockData}
          onClose={() => setSelectedStock(null)}
          cash={cash}
          position={positions[activeStockData.symbol]}
          isWatchlisted={watchlist.includes(activeStockData.symbol)}
          onToggleWatchlist={toggleWatchlist}
          onBuy={buyStock}
          onSell={sellStock}
          onCreateLimitOrder={createLimitOrder}
          tickDirection={lastTickDirection[activeStockData.symbol]}
        />
      )}

      {/* Floating Notifications */}
      <ToastNotification
        notification={notification}
        onDismiss={dismissNotification}
      />
    </div>
  );
}
