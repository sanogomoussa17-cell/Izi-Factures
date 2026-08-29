'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Zap, ArrowRight, Sparkles, Building2, UserPlus, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/core/domain/money';

export interface SavedActionItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  avatarBg: string;
}

const SAVED_ACTIONS: SavedActionItem[] = [
  {
    id: 'act_01',
    title: 'Prestation & Vente Boutique',
    category: 'Vente directe au comptoir',
    amount: 350000,
    avatarBg: 'bg-[#FF6B00]',
  },
  {
    id: 'act_02',
    title: 'Développement & Intégration Web',
    category: 'Contrat de service',
    amount: 1500000,
    avatarBg: 'bg-[#0E7A55]',
  },
  {
    id: 'act_03',
    title: 'Abonnement / Maintenance Mensuelle',
    category: 'Paiement récurrent',
    amount: 250000,
    avatarBg: 'bg-amber-600',
  },
];

export const QuickActions: React.FC = () => {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-card p-6 sm:p-7 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-[#FF6B00]">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground font-display">Actions Rapides</h3>
              <p className="text-xs text-muted-foreground">Créer une facture pré-remplie en 1 clic</p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {SAVED_ACTIONS.map((item) => (
            <Link
              key={item.id}
              href={`/invoices/new?template=${item.id}&amount=${item.amount}`}
              className="flex items-center justify-between p-3.5 rounded-xl border border-border hover:border-[#FF6B00]/40 hover:bg-orange-500/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${item.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-xs`}>
                  {item.title.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground group-hover:text-[#FF6B00] transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">{item.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-foreground">
                  {formatMoney(item.amount, 'XOF')}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#FF6B00] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-semibold">
        <Link href="/clients" className="text-muted-foreground hover:text-[#0E7A55] flex items-center gap-1.5 transition-colors">
          <UserPlus className="w-4 h-4 text-[#0E7A55]" /> Nouveau Client
        </Link>
        <Link href="/suppliers" className="text-muted-foreground hover:text-[#FF6B00] flex items-center gap-1.5 transition-colors">
          <Building2 className="w-4 h-4 text-[#FF6B00]" /> Fournisseurs
        </Link>
      </div>
    </div>
  );
};
