'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, CheckCircle2, Clock, AlertTriangle, MoreHorizontal, Send, CreditCard, Trash2 } from 'lucide-react';
import { Invoice } from '@/core/domain/types';
import { formatMoney } from '@/core/domain/money';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface RecentInvoicesTableProps {
  invoices: Invoice[];
  onRecordPayment?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoice: Invoice) => void;
}

export const RecentInvoicesTable: React.FC<RecentInvoicesTableProps> = ({
  invoices,
  onRecordPayment,
  onDeleteInvoice,
}) => {
  const invoiceList = Array.isArray(invoices) ? invoices : [];

  const getStatusBadge = (invoice: Invoice) => {
    if (invoice.status === 'CANCELLED') {
      return <Badge variant="cancelled">Annulée</Badge>;
    }
    if (invoice.status === 'DRAFT') {
      return <Badge variant="draft">Brouillon</Badge>;
    }
    switch (invoice.paymentStatus) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0E7A55] bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Soldée 100%
          </span>
        );
      case 'PARTIALLY_PAID':
        const percent = Math.round((invoice.paidAmount / (invoice.totalAmount || 1)) * 100);
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B00] bg-orange-50 dark:bg-orange-950/60 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800">
            <Clock className="w-3.5 h-3.5" /> Acompte ({percent}%)
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#B22C22] bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-3.5 h-3.5" /> En retard
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            En attente
          </span>
        );
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-7 py-5 border-b border-border gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-[#FF6B00]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground font-display">Factures Récentes & Recouvrements</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Dernières émissions fiscales et état des soldes clients</p>
          </div>
        </div>
        <Link href="/invoices">
          <Button variant="ghost" size="sm" className="text-xs text-[#FF6B00] font-bold hover:bg-orange-50 dark:hover:bg-orange-950/40">
            Voir toutes les factures <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider font-bold border-b border-border">
            <tr>
              <th className="px-7 py-4">N° Facture</th>
              <th className="px-7 py-4">Client / Entreprise</th>
              <th className="px-7 py-4">Date d'Émission</th>
              <th className="px-7 py-4">Échéance</th>
              <th className="px-7 py-4">Montant TTC</th>
              <th className="px-7 py-4">Encaissé</th>
              <th className="px-7 py-4">Statut</th>
              <th className="px-7 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoiceList.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-7 py-12 text-center text-muted-foreground text-sm">
                  Aucune facture enregistrée pour le moment. Cliquez sur « Nouvelle Facture » pour commencer.
                </td>
              </tr>
            ) : (
              invoiceList.map((inv) => (
                <tr key={inv.id} className="hover:bg-orange-500/5 transition-colors group">
                  <td className="px-7 py-4.5 font-mono font-bold text-foreground">
                    <Link href={`/invoices/${inv.id}`} className="text-[#FF6B00] hover:underline flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-7 py-4.5">
                    <div className="font-bold text-foreground">{inv.client?.name || 'Client'}</div>
                    {inv.client?.companyName && (
                      <div className="text-xs text-muted-foreground">{inv.client.companyName}</div>
                    )}
                  </td>
                  <td className="px-7 py-4.5 text-muted-foreground text-xs font-medium">
                    {new Date(inv.issueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-7 py-4.5 text-muted-foreground text-xs font-medium">
                    {new Date(inv.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-7 py-4.5 font-mono font-extrabold text-foreground text-base">
                    {formatMoney(inv.totalAmount, inv.currency)}
                  </td>
                  <td className="px-7 py-4.5 font-mono text-xs">
                    <span className="text-[#0E7A55] font-extrabold text-sm block">
                      {formatMoney(inv.paidAmount, inv.currency)}
                    </span>
                    {inv.remainingBalance > 0 && (
                      <span className="text-muted-foreground text-[11px] block mt-0.5">
                        Reste : <strong className="text-foreground">{formatMoney(inv.remainingBalance, inv.currency)}</strong>
                      </span>
                    )}
                  </td>
                  <td className="px-7 py-4.5">
                    {getStatusBadge(inv)}
                  </td>
                  <td className="px-7 py-4.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {inv.remainingBalance > 0 && onRecordPayment && (
                        <Button
                          size="sm"
                          onClick={() => onRecordPayment(inv)}
                          className="text-xs font-bold bg-[#0E7A55] hover:bg-[#0c6b4b] text-white shadow-xs"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" /> Encaisser
                        </Button>
                      )}
                      <Link href={`/invoices/${inv.id}`}>
                        <Button variant="outline" size="sm" className="text-xs font-semibold">
                          Détails
                        </Button>
                      </Link>
                      {onDeleteInvoice && (
                        <button
                          type="button"
                          onClick={() => onDeleteInvoice(inv)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-[#B22C22] hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="Supprimer la facture"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
