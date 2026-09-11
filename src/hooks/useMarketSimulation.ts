import { useState, useEffect, useCallback, useRef } from 'react';
import { Stock, Position, Transaction, LimitOrder, PortfolioHistoryPoint, Timeframe } from '../types';
import { INITIAL_STOCKS } from '../data/stocksData';

const STORAGE_KEY = 'aktien_sim_portfolio_v2';
const INITIAL_CASH = 50000;
const FLAT_FEE = 1.0; // 1 € flat fee per order

export function useMarketSimulation() {
  const [stocks, setStocks] = useState<Stock[]>(() => {
    return INITIAL_STOCKS;
  });

  const [cash, setCash] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.cash === 'number') return parsed.cash;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CASH;
  });

  const [positions, setPositions] = useState<Record<string, Position>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.positions) return parsed.positions;
      }
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.transactions)) return parsed.transactions;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [limitOrders, setLimitOrders] = useState<LimitOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.limitOrders)) return parsed.limitOrders;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.watchlist)) return parsed.watchlist;
      }
    } catch (e) {
      console.error(e);
    }
    return ['NVDA', 'AAPL', 'SAP.DE', 'BTC-EUR'];
  });

  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryPoint[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.portfolioHistory) && parsed.portfolioHistory.length > 0) {
          return parsed.portfolioHistory;
        }
      }
    } catch (e) {
      console.error(e);
    }
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return [{
      timestamp: now.toISOString(),
      timeLabel,
      totalEquity: INITIAL_CASH,
      cash: INITIAL_CASH,
      invested: 0,
      profit: 0,
      profitPercent: 0
    }];
  });

  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [lastTickDirection, setLastTickDirection] = useState<Record<string, 'up' | 'down'>>({});
  const [notification, setNotification] = useState<{ id: string; message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const stocksRef = useRef(stocks);
  stocksRef.current = stocks;
  const cashRef = useRef(cash);
  cashRef.current = cash;
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const limitOrdersRef = useRef(limitOrders);
  limitOrdersRef.current = limitOrders;

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        cash,
        positions,
        transactions,
        limitOrders,
        watchlist,
        portfolioHistory: portfolioHistory.slice(-100) // retain last 100 points
      }));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [cash, positions, transactions, limitOrders, watchlist, portfolioHistory]);

  const showNotification = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setNotification({
      id: Date.now().toString(),
      message,
      type
    });
  }, []);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Compute live portfolio metrics
  const portfolioSummary = (() => {
    let investedValue = 0;
    let totalCostBasis = 0;

    (Object.entries(positions) as [string, Position][]).forEach(([symbol, pos]) => {
      const stock = stocks.find(s => s.symbol === symbol);
      const currentPrice = stock ? stock.price : pos.avgBuyPrice;
      investedValue += pos.shares * currentPrice;
      totalCostBasis += pos.totalInvested;
    });

    const totalEquity = cash + investedValue;
    const totalProfit = totalEquity - INITIAL_CASH;
    const totalProfitPercent = (totalProfit / INITIAL_CASH) * 100;
    const unrealizedProfit = investedValue - totalCostBasis;
    const unrealizedProfitPercent = totalCostBasis > 0 ? (unrealizedProfit / totalCostBasis) * 100 : 0;

    return {
      totalEquity,
      cash,
      investedValue,
      totalCostBasis,
      totalProfit,
      totalProfitPercent,
      unrealizedProfit,
      unrealizedProfitPercent,
      positionsCount: Object.keys(positions).length
    };
  })();

  // Execute Market Buy
  const buyStock = useCallback((symbol: string, sharesToBuy: number) => {
    const stock = stocksRef.current.find(s => s.symbol === symbol);
    if (!stock) return { success: false, error: 'Aktie nicht gefunden' };

    if (sharesToBuy <= 0) return { success: false, error: 'Ungültige Stückzahl' };

    const totalCost = (sharesToBuy * stock.price) + FLAT_FEE;
    if (cashRef.current < totalCost) {
      return { success: false, error: `Unzureichendes Guthaben. Benötigt: ${totalCost.toFixed(2)} €, Verfügbar: ${cashRef.current.toFixed(2)} €` };
    }

    const currentCash = cashRef.current - totalCost;
    setCash(currentCash);

    const now = new Date().toISOString();
    const existing = positionsRef.current[symbol];

    let updatedPositions: Record<string, Position>;
    if (existing) {
      const newShares = existing.shares + sharesToBuy;
      const newTotalInvested = existing.totalInvested + (sharesToBuy * stock.price);
      const newAvgBuyPrice = newTotalInvested / newShares;

      updatedPositions = {
        ...positionsRef.current,
        [symbol]: {
          ...existing,
          shares: newShares,
          avgBuyPrice: Number(newAvgBuyPrice.toFixed(2)),
          totalInvested: Number(newTotalInvested.toFixed(2)),
          lastBoughtAt: now
        }
      };
    } else {
      updatedPositions = {
        ...positionsRef.current,
        [symbol]: {
          symbol,
          shares: sharesToBuy,
          avgBuyPrice: stock.price,
          totalInvested: Number((sharesToBuy * stock.price).toFixed(2)),
          firstBoughtAt: now,
          lastBoughtAt: now
        }
      };
    }
    setPositions(updatedPositions);

    const newTx: Transaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: now,
      symbol,
      name: stock.name,
      type: 'BUY',
      shares: sharesToBuy,
      pricePerShare: stock.price,
      fee: FLAT_FEE,
      totalAmount: Number(totalCost.toFixed(2))
    };
    setTransactions(prev => [newTx, ...prev]);

    showNotification(`${sharesToBuy}x ${stock.name} zu je ${stock.price.toFixed(2)} € erfolgreich gekauft!`, 'success');
    return { success: true };
  }, [showNotification]);

  // Execute Market Sell
  const sellStock = useCallback((symbol: string, sharesToSell: number) => {
    const stock = stocksRef.current.find(s => s.symbol === symbol);
    const pos = positionsRef.current[symbol];

    if (!stock || !pos) return { success: false, error: 'Keine Position für diese Aktie vorhanden' };
    if (sharesToSell <= 0 || sharesToSell > pos.shares + 0.00001) {
      return { success: false, error: `Maximal ${pos.shares} Anteile verfügbar` };
    }

    const actualSharesToSell = Math.min(sharesToSell, pos.shares);
    const grossProceeds = actualSharesToSell * stock.price;
    const netProceeds = grossProceeds - FLAT_FEE;
    const costBasis = actualSharesToSell * pos.avgBuyPrice;
    const realizedPnL = grossProceeds - costBasis - FLAT_FEE;

    setCash(prev => prev + netProceeds);

    const now = new Date().toISOString();
    const remainingShares = pos.shares - actualSharesToSell;

    const nextPositions = { ...positionsRef.current };
    if (remainingShares <= 0.0001) {
      delete nextPositions[symbol];
    } else {
      nextPositions[symbol] = {
        ...pos,
        shares: Number(remainingShares.toFixed(4)),
        totalInvested: Number((remainingShares * pos.avgBuyPrice).toFixed(2))
      };
    }
    setPositions(nextPositions);

    const newTx: Transaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: now,
      symbol,
      name: stock.name,
      type: 'SELL',
      shares: actualSharesToSell,
      pricePerShare: stock.price,
      fee: FLAT_FEE,
      totalAmount: Number(netProceeds.toFixed(2)),
      realizedPnL: Number(realizedPnL.toFixed(2))
    };
    setTransactions(prev => [newTx, ...prev]);

    const pnlSign = realizedPnL >= 0 ? '+' : '';
    showNotification(
      `${actualSharesToSell}x ${stock.name} verkauft. Realisierter Gewinn/Verlust: ${pnlSign}${realizedPnL.toFixed(2)} €`,
      realizedPnL >= 0 ? 'success' : 'warning'
    );
    return { success: true, realizedPnL };
  }, [showNotification]);

  // Create Limit Order
  const createLimitOrder = useCallback((symbol: string, type: 'LIMIT_BUY' | 'LIMIT_SELL', shares: number, targetPrice: number) => {
    const stock = stocksRef.current.find(s => s.symbol === symbol);
    if (!stock) return { success: false, error: 'Aktie nicht gefunden' };
    if (shares <= 0 || targetPrice <= 0) return { success: false, error: 'Ungültige Werte' };

    if (type === 'LIMIT_BUY') {
      const estimatedCost = (shares * targetPrice) + FLAT_FEE;
      if (cashRef.current < estimatedCost) {
        return { success: false, error: `Unzureichendes Guthaben für Limit-Kauf (benötigt: ~${estimatedCost.toFixed(2)} €)` };
      }
    } else {
      const pos = positionsRef.current[symbol];
      if (!pos || pos.shares < shares) {
        return { success: false, error: `Nicht genügend Anteile für Limit-Verkauf vorhanden` };
      }
    }

    const order: LimitOrder = {
      id: 'ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      symbol,
      name: stock.name,
      type,
      shares,
      targetPrice,
      status: 'PENDING',
      createdAtPrice: stock.price
    };

    setLimitOrders(prev => [order, ...prev]);
    showNotification(`Limit-Order (${type === 'LIMIT_BUY' ? 'Kauf' : 'Verkauf'}) für ${stock.name} bei ${targetPrice.toFixed(2)} € platziert.`, 'info');
    return { success: true };
  }, [showNotification]);

  const cancelLimitOrder = useCallback((orderId: string) => {
    setLimitOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
    showNotification('Limit-Order storniert.', 'info');
  }, [showNotification]);

  // Toggle Watchlist
  const toggleWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => {
      const exists = prev.includes(symbol);
      const next = exists ? prev.filter(s => s !== symbol) : [...prev, symbol];
      showNotification(exists ? `${symbol} von Beobachtungsliste entfernt.` : `${symbol} zur Beobachtungsliste hinzugefügt.`, 'info');
      return next;
    });
  }, [showNotification]);

  // Reset Portfolio to default
  const resetPortfolio = useCallback(() => {
    setCash(INITIAL_CASH);
    setPositions({});
    setTransactions([]);
    setLimitOrders([]);
    const now = new Date();
    setPortfolioHistory([{
      timestamp: now.toISOString(),
      timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalEquity: INITIAL_CASH,
      cash: INITIAL_CASH,
      invested: 0,
      profit: 0,
      profitPercent: 0
    }]);
    localStorage.removeItem(STORAGE_KEY);
    showNotification('Depot auf 50.000 € Startguthaben zurückgesetzt!', 'success');
  }, [showNotification]);

  // Add Cash funds
  const addFunds = useCallback((amount: number) => {
    if (amount <= 0) return;
    setCash(prev => prev + amount);
    showNotification(`+${amount.toLocaleString('de-DE')} € virtuelles Guthaben gutgeschrieben!`, 'success');
  }, [showNotification]);

  // Core Simulation Loop: Updates ticks & checks limit orders
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setStocks(prevStocks => {
        // Pick 2-4 stocks to tick this cycle
        const countToUpdate = 2 + Math.floor(Math.random() * 3);
        const indices = new Set<number>();
        while (indices.size < Math.min(countToUpdate, prevStocks.length)) {
          indices.add(Math.floor(Math.random() * prevStocks.length));
        }

        const newDirectionMap: Record<string, 'up' | 'down'> = {};

        const updated = prevStocks.map((stock, idx) => {
          if (!indices.has(idx)) return stock;

          // Volatility factor based on category
          let volScale = 0.0018; // default ~0.18%
          if (stock.category === 'Krypto & Rohstoffe') volScale = 0.004;
          if (stock.category === 'Tech') volScale = 0.0025;
          if (stock.category === 'ETFs') volScale = 0.0008;

          // Random percentage delta with slight mean-reverting drift
          const randomFactor = (Math.random() - 0.495);
          const delta = stock.price * randomFactor * volScale;
          const newPrice = Math.max(0.5, Number((stock.price + delta).toFixed(2)));

          const isUp = newPrice >= stock.price;
          newDirectionMap[stock.symbol] = isUp ? 'up' : 'down';

          const newChange = Number((newPrice - stock.previousClose).toFixed(2));
          const newChangePercent = Number(((newChange / stock.previousClose) * 100).toFixed(2));
          const newDayHigh = Math.max(stock.dayHigh, newPrice);
          const newDayLow = Math.min(stock.dayLow, newPrice);

          // Append to 1T history occasionally
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const current1THistory = stock.history['1T'] || [];
          const updated1T = [...current1THistory];
          if (updated1T.length > 35) {
            updated1T.shift();
          }
          updated1T.push({
            time: nowStr,
            price: newPrice,
            volume: Math.floor(1000 + Math.random() * 5000)
          });

          return {
            ...stock,
            price: newPrice,
            change: newChange,
            changePercent: newChangePercent,
            dayHigh: newDayHigh,
            dayLow: newDayLow,
            history: {
              ...stock.history,
              '1T': updated1T
            }
          };
        });

        setLastTickDirection(newDirectionMap);

        // Check Limit Orders execution against updated prices
        const pendingOrders = limitOrdersRef.current.filter(o => o.status === 'PENDING');
        if (pendingOrders.length > 0) {
          pendingOrders.forEach(order => {
            const currentStock = updated.find(s => s.symbol === order.symbol);
            if (!currentStock) return;

            if (order.type === 'LIMIT_BUY' && currentStock.price <= order.targetPrice) {
              // Execute Limit Buy!
              const totalCost = (order.shares * currentStock.price) + FLAT_FEE;
              if (cashRef.current >= totalCost) {
                setCash(c => c - totalCost);
                setPositions(prevPos => {
                  const existing = prevPos[order.symbol];
                  const newShares = (existing ? existing.shares : 0) + order.shares;
                  const newTotalInvested = (existing ? existing.totalInvested : 0) + (order.shares * currentStock.price);
                  return {
                    ...prevPos,
                    [order.symbol]: {
                      symbol: order.symbol,
                      shares: newShares,
                      avgBuyPrice: Number((newTotalInvested / newShares).toFixed(2)),
                      totalInvested: Number(newTotalInvested.toFixed(2)),
                      firstBoughtAt: existing ? existing.firstBoughtAt : new Date().toISOString(),
                      lastBoughtAt: new Date().toISOString()
                    }
                  };
                });
                setTransactions(t => [{
                  id: 'tx_limit_' + Date.now(),
                  timestamp: new Date().toISOString(),
                  symbol: order.symbol,
                  name: order.name,
                  type: 'BUY',
                  shares: order.shares,
                  pricePerShare: currentStock.price,
                  fee: FLAT_FEE,
                  totalAmount: Number(totalCost.toFixed(2))
                }, ...t]);
                setLimitOrders(orders => orders.map(o => o.id === order.id ? { ...o, status: 'EXECUTED' } : o));
                showNotification(`Limit-Kauf ausgeführt! ${order.shares}x ${order.name} zu ${currentStock.price.toFixed(2)} €`, 'success');
              }
            } else if (order.type === 'LIMIT_SELL' && currentStock.price >= order.targetPrice) {
              // Execute Limit Sell!
              const pos = positionsRef.current[order.symbol];
              if (pos && pos.shares >= order.shares) {
                const gross = order.shares * currentStock.price;
                const net = gross - FLAT_FEE;
                const pnl = gross - (order.shares * pos.avgBuyPrice) - FLAT_FEE;
                setCash(c => c + net);
                setPositions(prevPos => {
                  const nextPos = { ...prevPos };
                  const rem = pos.shares - order.shares;
                  if (rem <= 0.0001) {
                    delete nextPos[order.symbol];
                  } else {
                    nextPos[order.symbol] = {
                      ...pos,
                      shares: rem,
                      totalInvested: Number((rem * pos.avgBuyPrice).toFixed(2))
                    };
                  }
                  return nextPos;
                });
                setTransactions(t => [{
                  id: 'tx_limit_sell_' + Date.now(),
                  timestamp: new Date().toISOString(),
                  symbol: order.symbol,
                  name: order.name,
                  type: 'SELL',
                  shares: order.shares,
                  pricePerShare: currentStock.price,
                  fee: FLAT_FEE,
                  totalAmount: Number(net.toFixed(2)),
                  realizedPnL: Number(pnl.toFixed(2))
                }, ...t]);
                setLimitOrders(orders => orders.map(o => o.id === order.id ? { ...o, status: 'EXECUTED' } : o));
                showNotification(`Limit-Verkauf ausgeführt! ${order.shares}x ${order.name} zu ${currentStock.price.toFixed(2)} € (Gewinn: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} €)`, 'success');
              }
            }
          });
        }

        return updated;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isSimulating, showNotification]);

  // Periodic Portfolio History Sampling (every 8 seconds)
  useEffect(() => {
    const historyInterval = setInterval(() => {
      let investedVal = 0;
      (Object.entries(positionsRef.current) as [string, Position][]).forEach(([sym, p]) => {
        const s = stocksRef.current.find(st => st.symbol === sym);
        investedVal += p.shares * (s ? s.price : p.avgBuyPrice);
      });
      const equity = cashRef.current + investedVal;
      const profit = equity - INITIAL_CASH;
      const profitPercent = (profit / INITIAL_CASH) * 100;
      const now = new Date();
      const point: PortfolioHistoryPoint = {
        timestamp: now.toISOString(),
        timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        totalEquity: Number(equity.toFixed(2)),
        cash: Number(cashRef.current.toFixed(2)),
        invested: Number(investedVal.toFixed(2)),
        profit: Number(profit.toFixed(2)),
        profitPercent: Number(profitPercent.toFixed(2))
      };

      setPortfolioHistory(prev => {
        const next = [...prev, point];
        return next.length > 80 ? next.slice(next.length - 80) : next;
      });
    }, 8000);

    return () => clearInterval(historyInterval);
  }, []);

  return {
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
    addFunds,
    showNotification
  };
}
