'use client';

import React from 'react';
import { formatMoney } from '@/core/domain/money';
import { CurrencyCode } from '@/core/domain/types';
import { BarChart3 } from 'lucide-react';

export interface RevenueChartProps {
  data: { month: string; invoiced: number; collected: number }[];
  currency: CurrencyCode;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, currency }) => {
  const chartData = Array.isArray(data) ? data : [];
  const maxVal = Math.max(
    ...chartData.map((d) => Math.max(d?.invoiced || 0, d?.collected || 0)),
    1
  );

  return (
    <div className="bg-card border border-border rounded-2xl shadow-card p-6 sm:p-7 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-[#FF6B00]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground font-display">Évolution des Flux & Recouvrements</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Comparatif Facturé vs Encaissé réel sur les 6 derniers mois</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-[#FF6B00] inline-block shadow-2xs" />
            <span className="text-foreground">Facturé (Orange)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-[#0E7A55] inline-block shadow-2xs" />
            <span className="text-foreground">Encaissé (Vert)</span>
          </div>
        </div>
      </div>

      <div className="mt-8 h-72 flex items-end justify-between gap-3 sm:gap-6 pt-6">
        {chartData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            Aucune donnée de facturation pour le moment
          </div>
        ) : (
          chartData.map((item, idx) => {
            const invoicedHeight = Math.round(((item?.invoiced || 0) / maxVal) * 100);
            const collectedHeight = Math.round(((item?.collected || 0) / maxVal) * 100);

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-2 sm:gap-3 h-56 relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-14 bg-slate-950 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-20 shadow-xl border border-slate-800">
                    <div className="text-orange-300 font-semibold">Facturé: {formatMoney(item?.invoiced || 0, currency)}</div>
                    <div className="text-emerald-300 font-semibold">Encaissé: {formatMoney(item?.collected || 0, currency)}</div>
                  </div>

                  {/* Invoiced Bar (ORANGE) */}
                  <div
                    style={{ height: `${Math.max(invoicedHeight, 4)}%` }}
                    className="w-full max-w-[32px] bg-gradient-to-t from-orange-500/80 to-[#FF6B00] hover:brightness-110 rounded-t-md transition-all duration-300 relative shadow-xs"
                  />
                  {/* Collected Bar (VERT ÉMERAUDE) */}
                  <div
                    style={{ height: `${Math.max(collectedHeight, 4)}%` }}
                    className="w-full max-w-[32px] bg-gradient-to-t from-emerald-600 to-[#0E7A55] hover:brightness-110 rounded-t-md transition-all duration-300 shadow-xs"
                  />
                </div>
                <span className="mt-4 text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors font-mono">
                  {item?.month || ''}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
