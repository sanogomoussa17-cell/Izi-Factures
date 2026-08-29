'use client';

import React from 'react';
import { TrendingUp, ArrowUpRight, Clock, AlertCircle, CheckCircle2, Wallet, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { DashboardMetrics } from '@/core/domain/types';
import { formatMoney } from '@/core/domain/money';

export interface MetricsGridProps {
  metrics: DashboardMetrics;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
      {/* 1. Total Encaissé (VERT ÉMERAUDE) */}
      <div className="bg-card border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl p-6 sm:p-7 shadow-card hover:shadow-elevated transition-all duration-200 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0E7A55]">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Encaissé</span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-black text-[#0E7A55] bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <ArrowUpRight className="w-3.5 h-3.5" /> +12.5%
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="text-3xl sm:text-4xl font-extrabold text-[#0E7A55] font-mono tracking-tight">
            {formatMoney(metrics.totalCollected, metrics.currency)}
          </div>
        </div>

        {/* Jauge / Taux de recouvrement */}
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold">Taux de recouvrement</span>
          <span className="font-extrabold text-foreground font-mono text-sm bg-emerald-50 dark:bg-emerald-950/50 text-[#0E7A55] px-2 py-0.5 rounded-md">
            {metrics.collectionRate}%
          </span>
        </div>

        <div className="mt-2 h-7 w-full">
          <svg className="w-full h-full stroke-[#0E7A55] fill-none" viewBox="0 0 100 25" preserveAspectRatio="none">
            <path
              d="M0,20 Q15,5 30,18 T60,10 T85,15 T100,5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* 2. Chiffre d'Affaires Total (ORANGE MANDARINE) */}
      <div className="bg-card border border-orange-200/80 dark:border-orange-900/50 rounded-2xl p-6 sm:p-7 shadow-card hover:shadow-elevated transition-all duration-200 group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-[#FF6B00]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chiffre d’Affaires Total</span>
          </div>
          <span className="text-xs font-bold text-[#FF6B00] bg-orange-50 dark:bg-orange-950/80 px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-800">
            TTC
          </span>
        </div>

        <div className="mt-4 text-3xl sm:text-4xl font-extrabold text-foreground font-mono tracking-tight">
          {formatMoney(metrics.totalRevenue, metrics.currency)}
        </div>

        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold">Factures émises</span>
          <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">
            {metrics.invoiceCount} document{metrics.invoiceCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* 3. En attente d'échéance (ORANGE DORÉ / AMBRE) */}
      <div className="bg-card border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-6 sm:p-7 shadow-card hover:shadow-elevated transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-[#9A6608]">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">En Attente de Paiement</span>
          </div>
        </div>

        <div className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#9A6608] font-mono tracking-tight">
          {formatMoney(metrics.totalPending, metrics.currency)}
        </div>

        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold">Factures en cours</span>
          <span className="font-bold text-[#9A6608] bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
            {metrics.pendingInvoiceCount} en attente
          </span>
        </div>
      </div>

      {/* 4. Créances en retard (ROUGE BORDEAUX) */}
      <div className="bg-card border border-rose-200/80 dark:border-rose-900/50 rounded-2xl p-6 sm:p-7 shadow-card hover:shadow-elevated transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-[#B22C22]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Créances en Retard</span>
          </div>
        </div>

        <div className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#B22C22] font-mono tracking-tight">
          {formatMoney(metrics.totalOverdue, metrics.currency)}
        </div>

        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold">Échues non soldées</span>
          <span className="font-bold text-[#B22C22] bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md">
            {metrics.overdueInvoiceCount} alerte{metrics.overdueInvoiceCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};
