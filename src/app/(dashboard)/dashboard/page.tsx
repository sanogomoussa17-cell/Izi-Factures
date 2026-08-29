'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Download,
  Sparkles,
  Building2,
  Store,
  Users,
  FileText,
  Calendar,
  RotateCcw,
  Filter,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { DashboardMetrics, Invoice, PaymentRecord, Organization, CurrencyCode } from '@/core/domain/types';
import { repository } from '@/core/adapters';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { MetricsGrid } from '@/components/dashboard/metrics-grid';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { RecentInvoicesTable } from '@/components/dashboard/recent-invoices-table';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecordPaymentModal } from '@/components/payments/record-payment-modal';
import { Modal } from '@/components/ui/modal';
import { formatMoney } from '@/core/domain/money';
import {
  DateRangeFilter,
  DateRange,
  getDateRangeFromPreset,
} from '@/components/dashboard/date-range-filter';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [org, setOrg] = useState<Organization | null>(null);
  const [userFullName, setUserFullName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('izifactures_session');
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.name || '';
        }
      } catch (e) {}
    }
    return '';
  });

  const [userCompanyName, setUserCompanyName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('izifactures_session');
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.companyName || '';
        }
      } catch (e) {}
    }
    return '';
  });
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // État du filtre de date / calendrier (Par défaut : Tout l'historique ou Ce mois-ci)
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromPreset('ALL_TIME'));

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invoicesData, orgData] = await Promise.all([
        repository.getInvoices(),
        repository.getOrganization(),
      ]);
      setAllInvoices(invoicesData || []);
      setOrg(orgData);

      let resolvedName = '';
      let resolvedCompany = '';

      // 1. Priorité Supabase Auth
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) {
            const meta = authData.user.user_metadata || {};
            if (meta.full_name) resolvedName = meta.full_name;
            if (meta.company_name) resolvedCompany = meta.company_name;
            if (!resolvedName && authData.user.email) {
              resolvedName = authData.user.email.split('@')[0];
            }
          }
        } catch (e) {
          console.warn('Auth user fetch error:', e);
        }
      }

      // 2. Fallback Session Locale
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('izifactures_session') : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.name && !resolvedName) resolvedName = parsed.name;
          if (parsed.companyName && !resolvedCompany) resolvedCompany = parsed.companyName;
        }
      } catch (e) {}

      // 3. Fallback Organisation
      if (!resolvedCompany && orgData?.name) resolvedCompany = orgData.name;
      if (!resolvedName && orgData?.legalName) resolvedName = orgData.legalName;

      if (resolvedName) setUserFullName(resolvedName);
      if (resolvedCompany) setUserCompanyName(resolvedCompany);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleFocusOrVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadData();
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    window.addEventListener('visibilitychange', handleFocusOrVisible);

    let unsubscribeAuth: (() => void) | undefined;
    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          const name = meta.full_name || session.user.email?.split('@')[0] || '';
          const comp = meta.company_name || '';
          if (name) setUserFullName(name);
          if (comp) setUserCompanyName(comp);
          try {
            const stored = localStorage.getItem('izifactures_session');
            const parsed = stored ? JSON.parse(stored) : {};
            localStorage.setItem('izifactures_session', JSON.stringify({
              ...parsed,
              id: session.user.id,
              email: session.user.email,
              name: name || parsed.name,
              companyName: comp || parsed.companyName,
            }));
          } catch (e) {}
        }
      });
      unsubscribeAuth = () => {
        authListener?.subscription?.unsubscribe();
      };
    }

    return () => {
      window.removeEventListener('focus', handleFocusOrVisible);
      window.removeEventListener('visibilitychange', handleFocusOrVisible);
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  // --- Calcul des Métriques Filtrées en Temps Réel selon la Plage de Dates ---
  const filteredMetrics = useMemo<DashboardMetrics>(() => {
    const currency: CurrencyCode = org?.currency || 'XOF';
    const today = new Date().toISOString().split('T')[0];

    // 1. Filtrer les factures comprises dans la plage de dates
    const invoices = allInvoices.filter((inv) => {
      if (!dateRange.startDate || !dateRange.endDate) return true;
      return inv.issueDate >= dateRange.startDate && inv.issueDate <= dateRange.endDate;
    });

    let totalRevenue = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let paidCount = 0;
    let overdueCount = 0;
    let pendingCount = 0;

    const allPayments: PaymentRecord[] = [];

    for (const inv of invoices) {
      if (inv.status === 'CANCELLED') continue;

      totalRevenue += inv.totalAmount;
      totalCollected += inv.paidAmount;

      if (inv.paymentStatus === 'PAID') {
        paidCount++;
      } else if (inv.remainingBalance > 0) {
        if (inv.dueDate < today && inv.paymentStatus !== 'PAID') {
          totalOverdue += inv.remainingBalance;
          overdueCount++;
        } else {
          totalPending += inv.remainingBalance;
          pendingCount++;
        }
      }

      if (inv.payments && inv.payments.length > 0) {
        allPayments.push(...inv.payments);
      }
    }

    const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;

    // Tendances mensuelles des 6 derniers mois
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentDate = new Date();
    const monthlyRevenueChart: { month: string; invoiced: number; collected: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const mLabel = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      const mYear = d.getFullYear();
      const mMonth = d.getMonth();

      let monthInvoiced = 0;
      let monthCollected = 0;

      for (const inv of invoices) {
        if (inv.status === 'CANCELLED') continue;
        const invDate = new Date(inv.issueDate);
        if (invDate.getFullYear() === mYear && invDate.getMonth() === mMonth) {
          monthInvoiced += inv.totalAmount;
        }
      }

      for (const pay of allPayments) {
        const payDate = new Date(pay.paymentDate);
        if (payDate.getFullYear() === mYear && payDate.getMonth() === mMonth) {
          monthCollected += pay.amount;
        }
      }

      for (const inv of invoices) {
        if (inv.status === 'CANCELLED') continue;
        const invDate = new Date(inv.issueDate);
        if (invDate.getFullYear() === mYear && invDate.getMonth() === mMonth && (!inv.payments || inv.payments.length === 0)) {
          monthCollected += inv.paidAmount;
        }
      }

      monthlyRevenueChart.push({
        month: mLabel,
        invoiced: monthInvoiced,
        collected: monthCollected,
      });
    }

    allPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    return {
      totalRevenue,
      totalCollected,
      totalPending,
      totalOverdue,
      collectionRate,
      invoiceCount: invoices.length,
      paidInvoiceCount: paidCount,
      overdueInvoiceCount: overdueCount,
      pendingInvoiceCount: pendingCount,
      clientCount: new Set(invoices.map((i) => i.clientId)).size,
      currency,
      recentInvoices: invoices.slice(0, 10),
      recentPayments: allPayments.slice(0, 5),
      monthlyRevenueChart,
    };
  }, [allInvoices, dateRange, org]);

  const handleOpenPaymentModal = (invoice: Invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (payment: PaymentRecord) => {
    loadData();
  };

  const handleOpenDeleteModal = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);
    try {
      await repository.deleteInvoice(invoiceToDelete.id);
      setAllInvoices((prev) => prev.filter((i) => i.id !== invoiceToDelete.id));
      setIsDeleteModalOpen(false);
      setInvoiceToDelete(null);
    } catch (err) {
      console.error('Erreur suppression facture dashboard:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6B00]"></div>
      </div>
    );
  }

  const greetingName = userFullName || org?.legalName || 'Entrepreneur';
  const shopName = userCompanyName || org?.name || 'Mon Entreprise';
  const currency = org?.currency || 'XOF';

  return (
    <div className="space-y-8 w-full">
      {/* ========================================================================= */}
      {/* 🌟 BANNIÈRE PLEIN ÉCRAN BIENVENUE ORANGE • BLANC • VERT                   */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-emerald-500/10 border border-orange-300/40 dark:border-orange-800/40 rounded-3xl p-8 sm:p-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8 relative overflow-hidden shadow-card">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3.5 max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-[#0E7A55] dark:text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-300/60 dark:border-emerald-700/60 shadow-2xs">
            <Sparkles className="w-4 h-4 fill-current text-amber-500" />
            Espace Facturation — {shopName}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground font-display tracking-tight leading-tight">
            Bienvenue, <span className="text-[#FF6B00]">{greetingName}</span> 👋
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed">
            Votre espace de pilotage pour <strong>{shopName}</strong> est prêt. Suivez vos créances en temps réel, encaissez vos paiements via Wave & Orange Money et émettez des factures fiscales conformes UEMOA (TVA 18%).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 relative z-10 shrink-0">
          <Link href="/invoices/new">
            <Button size="lg" className="text-sm font-bold bg-[#FF6B00] hover:bg-[#EA580C] text-white shadow-lg shadow-orange-500/25 px-6 py-3.5 h-auto rounded-xl">
              <Plus className="w-5 h-5 mr-2" /> Créer une Facture
            </Button>
          </Link>
          <Link href="/clients">
            <Button variant="outline" size="lg" className="text-sm font-bold bg-card hover:bg-muted/80 px-6 py-3.5 h-auto rounded-xl border-border">
              <Users className="w-5 h-5 mr-2 text-[#0E7A55]" /> Gérer les Clients
            </Button>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📅 BARRE D'OUTILS DU TABLEAU DE BORD : FILTRE CALENDRIER & PÉRIODE        */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 sm:p-5 rounded-2xl shadow-card">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-[#FF6B00]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground font-display">
              Période d'Analyse Financière
            </h3>
            <p className="text-xs text-muted-foreground">
              {dateRange.preset === 'ALL_TIME' ? (
                <span>Affichage de toutes vos données enregistrées</span>
              ) : (
                <span>
                  Filtré du <strong>{new Date(dateRange.startDate).toLocaleDateString('fr-FR')}</strong> au <strong>{new Date(dateRange.endDate).toLocaleDateString('fr-FR')}</strong> ({filteredMetrics.invoiceCount} facture{filteredMetrics.invoiceCount > 1 ? 's' : ''})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Sélecteur de Calendrier & Raccourcis */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <DateRangeFilter
            activeRange={dateRange}
            onRangeChange={(newRange) => setDateRange(newRange)}
          />

          {dateRange.preset !== 'ALL_TIME' && (
            <button
              type="button"
              onClick={() => setDateRange(getDateRangeFromPreset('ALL_TIME'))}
              title="Voir tout l'historique"
              className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tout afficher</span>
            </button>
          )}
        </div>
      </div>

      {/* Cartes KPI Élargies et Filtrées */}
      <MetricsGrid metrics={filteredMetrics} />

      {/* Grille Graphique & Actions Rapides Élargie */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 w-full">
        <div className="xl:col-span-8">
          <RevenueChart data={filteredMetrics.monthlyRevenueChart} currency={filteredMetrics.currency} />
        </div>
        <div className="xl:col-span-4">
          <QuickActions />
        </div>
      </div>

      {/* Tableau des Factures Récentes Plein Écran */}
      <RecentInvoicesTable
        invoices={filteredMetrics.recentInvoices}
        onRecordPayment={handleOpenPaymentModal}
        onDeleteInvoice={handleOpenDeleteModal}
      />

      {/* Modale d'Encaissement */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={selectedInvoiceForPayment}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Confirmation Modal Suppression Facture */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setInvoiceToDelete(null);
        }}
        title="Supprimer la Facture 🗑️"
        description="Attention : confirmation de suppression définitive."
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200">
            <AlertTriangle className="w-5 h-5 text-[#B22C22] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Action irréversible</p>
              <p className="mt-1 leading-relaxed">
                Êtes-vous certain de vouloir supprimer la facture{' '}
                <strong>« {invoiceToDelete?.invoiceNumber} »</strong> d'un montant de{' '}
                <strong>{formatMoney(invoiceToDelete?.totalAmount || 0, currency)}</strong> pour le client{' '}
                <strong>{invoiceToDelete?.client?.name}</strong> ?
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setInvoiceToDelete(null);
              }}
              className="rounded-xl text-xs"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleDeleteInvoice}
              disabled={isDeleting}
              className="rounded-xl text-xs font-bold bg-[#B22C22] hover:bg-[#8e231b] text-white shadow-md"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer Définitivement'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
