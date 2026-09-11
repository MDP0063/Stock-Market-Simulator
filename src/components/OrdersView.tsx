import React, { useState } from 'react';
import { Transaction, LimitOrder, Stock } from '../types';
import { Clock, CheckCircle2, XCircle, ArrowDownLeft, ArrowUpRight, Ban, FileSpreadsheet } from 'lucide-react';

interface OrdersViewProps {
  transactions: Transaction[];
  limitOrders: LimitOrder[];
  stocks: Stock[];
  onCancelLimitOrder: (orderId: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  transactions,
  limitOrders,
  stocks,
  onCancelLimitOrder
}) => {
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'LIMITS'>('TRANSACTIONS');
  const [filterType, setFilterType] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');

  const pendingLimits = limitOrders.filter(o => o.status === 'PENDING');

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'BUY') return t.type === 'BUY';
    if (filterType === 'SELL') return t.type === 'SELL';
    return true;
  });

  const exportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['Datum', 'Typ', 'Symbol', 'Name', 'Anteile', 'Kurs', 'Gebuehr', 'Gesamtbetrag', 'Realisierter_Gewinn'];
    const rows = transactions.map(t => [
      new Date(t.timestamp).toLocaleString('de-DE'),
      t.type,
      t.symbol,
      `"${t.name.replace(/"/g, '""')}"`,
      t.shares,
      t.pricePerShare.toFixed(2),
      t.fee.toFixed(2),
      t.totalAmount.toFixed(2),
      t.realizedPnL !== undefined ? t.realizedPnL.toFixed(2) : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `boersensim_transaktionen_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="orders-history-view">
      {/* Top Switcher & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'TRANSACTIONS' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Transaktionshistorie</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-700 text-[10px] text-slate-300">
              {transactions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('LIMITS')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'LIMITS' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Offene Limit-Orders</span>
            {pendingLimits.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                {pendingLimits.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'TRANSACTIONS' && (
          <div className="flex items-center gap-3">
            {/* Filter pills */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1 rounded-md transition-all ${filterType === 'ALL' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Alle
              </button>
              <button
                onClick={() => setFilterType('BUY')}
                className={`px-3 py-1 rounded-md transition-all ${filterType === 'BUY' ? 'bg-emerald-600/30 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Käufe
              </button>
              <button
                onClick={() => setFilterType('SELL')}
                className={`px-3 py-1 rounded-md transition-all ${filterType === 'SELL' ? 'bg-rose-600/30 text-rose-400 font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Verkäufe
              </button>
            </div>

            {/* CSV export */}
            {transactions.length > 0 && (
              <button
                onClick={exportCSV}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors flex items-center gap-1.5"
                title="Als CSV-Tabelle exportieren"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                CSV Export
              </button>
            )}
          </div>
        )}
      </div>

      {/* View Content: Transactions vs Limits */}
      {activeTab === 'TRANSACTIONS' ? (
        transactions.length > 0 ? (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Zeitpunkt</th>
                    <th className="py-3 px-4">Typ</th>
                    <th className="py-3 px-4">Wertpapier</th>
                    <th className="py-3 px-4 text-right">Anteile</th>
                    <th className="py-3 px-4 text-right">Ausführungskurs</th>
                    <th className="py-3 px-4 text-right">Gebühr</th>
                    <th className="py-3 px-4 text-right">Gesamtbetrag</th>
                    <th className="py-3 px-4 text-right">Realisierter Gewinn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredTransactions.map(t => {
                    const isBuy = t.type === 'BUY';
                    const dateStr = new Date(t.timestamp).toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {dateStr}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isBuy
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {isBuy ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {isBuy ? 'Kauf' : 'Verkauf'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{t.name}</div>
                          <div className="text-slate-400 font-mono text-[10px]">{t.symbol}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-200">
                          {t.shares.toLocaleString('de-DE', { maximumFractionDigits: 4 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-200">
                          {t.pricePerShare.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">
                          {t.fee.toFixed(2)} €
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                          {t.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {t.realizedPnL !== undefined ? (
                            <span
                              className={`font-bold ${
                                t.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {t.realizedPnL >= 0 ? '+' : ''}
                              {t.realizedPnL.toFixed(2)} €
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
            <p className="text-sm font-semibold">Bisher noch keine Transaktionen getätigt</p>
            <p className="text-xs text-slate-500 mt-1">
              Sobald du Aktien kaufst oder verkaufst, werden alle Details hier protokolliert.
            </p>
          </div>
        )
      ) : (
        /* Limit Orders Section */
        limitOrders.length > 0 ? (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Erstellt am</th>
                    <th className="py-3 px-4">Wertpapier</th>
                    <th className="py-3 px-4">Orderart</th>
                    <th className="py-3 px-4 text-right">Anteile</th>
                    <th className="py-3 px-4 text-right">Limit-Zielkurs</th>
                    <th className="py-3 px-4 text-right">Aktueller Kurs</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {limitOrders.map(order => {
                    const currentStock = stocks.find(s => s.symbol === order.symbol);
                    const currentPrice = currentStock ? currentStock.price : order.createdAtPrice;
                    const isPending = order.status === 'PENDING';
                    const isExecuted = order.status === 'EXECUTED';
                    const isBuy = order.type === 'LIMIT_BUY';

                    return (
                      <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Uhr
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{order.name}</div>
                          <div className="text-slate-400 font-mono text-[10px]">{order.symbol}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              isBuy ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {isBuy ? 'Limit-Kauf' : 'Limit-Verkauf'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-200">
                          {order.shares}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                          {order.targetPrice.toFixed(2)} €
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300">
                          {currentPrice.toFixed(2)} €
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-semibold border border-amber-500/20">
                              <Clock className="w-3 h-3 animate-pulse" />
                              Wartet
                            </span>
                          )}
                          {isExecuted && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Ausgeführt
                            </span>
                          )}
                          {order.status === 'CANCELLED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-semibold">
                              <XCircle className="w-3 h-3" />
                              Storniert
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isPending && (
                            <button
                              onClick={() => onCancelLimitOrder(order.id)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                            >
                              <Ban className="w-3 h-3" />
                              Stornieren
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
            <p className="text-sm font-semibold">Keine Limit-Orders angelegt</p>
            <p className="text-xs text-slate-500 mt-1">
              Setze in der Aktien-Detailansicht eine Limit-Order, um automatisch bei deinem Wunschpreis ein- oder auszusteigen.
            </p>
          </div>
        )
      )}
    </div>
  );
};
