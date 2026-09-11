import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { PricePoint } from '../types';

interface StockChartProps {
  data: PricePoint[];
  color?: string;
  isPositive?: boolean;
  height?: number;
  showAxes?: boolean;
}

export const StockChart: React.FC<StockChartProps> = ({
  data,
  isPositive = true,
  height = 280,
  showAxes = true
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        Keine Kursdaten verfügbar
      </div>
    );
  }

  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1 || 1;
  const yDomain: [number, number] = [Math.max(0, minPrice - padding), maxPrice + padding];

  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  const fillColor = isPositive ? 'url(#greenGradient)' : 'url(#redGradient)';

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: showAxes ? -15 : 0, bottom: 0 }}>
          <defs>
            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {showAxes && (
            <>
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={6}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                domain={yDomain}
                tickLine={false}
                axisLine={false}
                dx={-4}
                tickFormatter={(val) => `${val.toFixed(0)} €`}
              />
            </>
          )}

          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as PricePoint;
                return (
                  <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 shadow-xl text-xs">
                    <div className="text-slate-400 font-mono mb-1">{item.time}</div>
                    <div className="font-semibold text-sm text-slate-100 font-mono">
                      {item.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </div>
                    {item.volume && (
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Volumen: {item.volume.toLocaleString('de-DE')}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />

          {showAxes && (
            <ReferenceLine
              y={minPrice}
              stroke="#475569"
              strokeDasharray="3 3"
              strokeOpacity={0.4}
            />
          )}

          <Area
            type="monotone"
            dataKey="price"
            stroke={strokeColor}
            strokeWidth={2}
            fillOpacity={1}
            fill={fillColor}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
