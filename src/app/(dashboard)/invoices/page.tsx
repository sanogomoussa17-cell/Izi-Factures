'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FilePlus,
  RefreshCw,
} from 'lucide-react';
import { Invoice, Organization, PaymentRecord } from '@/core/domain/types';
import { repository } from '@/core/adapters';
import { RecentInvoicesTable } from '@/components/dashboard/recent-invoices-table';
import { RecordPaymentModal } from '@/components/payments/record-payment-modal';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney } from '@/core/domain/money';

export default function InvoicesListPage() {
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Suppression de facture
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toasts
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const [org, list] = await Promise.all([
        repository.getOrganization(),
        repository.getInvoices(),
      ]);
      setOrganization(org);
      setAllInvoices(list || []);
    } catch (err) {
      console.error('Erreur chargement factures:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // Filtrage côté client pour réactivité instantanée et comptage des onglets
  useEffect(() => {
    let result = [...allInvoices];

    if (activeTab !== 'ALL') {
      result = result.filter(
        (inv) => inv.status === activeTab || inv.paymentStatus === activeTab
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.client?.name?.toLowerCase().includes(q) ||
          inv.client?.companyName?.toLowerCase().includes(q)
      );
    }

    setFilteredInvoices(result);
  }, [allInvoices, activeTab, searchQuery]);

  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoiceForPayment(inv);
    setIsPaymentModalOpen(true);
  };

  const handleOpenDelete = (inv: Invoice) => {
    setInvoiceToDelete(inv);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    setIsDeleting(true);
    setErrorToast(null);

    try {
      await repository.deleteInvoice(invoiceToDelete.id);
      setAllInvoices((prev) => prev.filter((i) => i.id !== invoiceToDelete.id));
      setSuccessToast(`La facture « ${invoiceToDelete.invoiceNumber} » a été supprimée avec succès.`);
      setTimeout(() => setSuccessToast(null), 5000);
      setIsDeleteModalOpen(false);
      setInvoiceToDelete(null);
    } catch (err: any) {
      console.error('Erreur suppression facture:', err);
      setErrorToast(err?.message || 'Erreur lors de la suppression de la facture.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Compteurs dynamiques
  const counts = {
    ALL: allInvoices.length,
    PARTIALLY_PAID: allInvoices.filter((i) => i.paymentStatus === 'PARTIALLY_PAID' && i.status !== 'CANCELLED').length,
    PAID: allInvoices.filter((i) => i.paymentStatus === 'PAID' && i.status !== 'CANCELLED').length,
    OVERDUE: allInvoices.filter((i) => i.paymentStatus === 'OVERDUE' && i.status !== 'CANCELLED').length,
    DRAFT: allInvoices.filter((i) => i.status === 'DRAFT').length,
    CANCELLED: allInvoices.filter((i) => i.status === 'CANCELLED').length,
  };

  const tabs = [
    { id: 'ALL', label: 'Toutes les Factures', count: counts.ALL },
    { id: 'PARTIALLY_PAID', label: 'Acomptes / Partielles', count: counts.PARTIALLY_PAID },
    { id: 'PAID', label: 'Soldées (100%)', count: counts.PAID },
    { id: 'OVERDUE', label: 'En Retard', count: counts.OVERDUE },
    { id: 'DRAFT', label: 'Brouillons', count: counts.DRAFT },
    { id: 'CANCELLED', label: 'Annulées', count: counts.CANCELLED },
  ];

  const currency = organization?.currency || 'XOF';

  return (
    <div className="space-y-6 w-full">
      {/* Toast Succès */}
      {successToast && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-2xl flex items-center justify-between gap-3 text-sm text-emerald-900 dark:text-emerald-200 shadow-md animate-in fade-in-50">
          <div className="flex items-center gap-2.5 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-[#0E7A55] shrink-0" />
            <span>{successToast}</span>
          </div>
        </div>
      )}

      {/* Toast Erreur */}
      {errorToast && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 rounded-2xl flex items-center gap-2.5 text-sm text-rose-900 dark:text-rose-200 shadow-md animate-in fade-in-50">
          <AlertCircle className="w-5 h-5 text-[#B22C22] shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Top Bar with Search & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-card">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground font-display tracking-tight">
            Factures & Échéanciers ({allInvoices.length})
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Gérez l'ensemble de vos documents de facturation, suivez les encaissements échelonnés et les créances clients.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadInvoices}
            className="text-xs font-bold rounded-xl"
            title="Rafraîchir les factures"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" /> Actualiser
          </Button>

          <Link href="/invoices/new">
            <Button className="text-xs sm:text-sm font-bold bg-[#FF6B00] hover:bg-[#EA580C] text-white shadow-md shadow-orange-500/20 px-5 py-3 h-auto rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Nouvelle Facture
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs and Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border overflow-x-auto">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-card text-[#FF6B00] shadow-xs border border-border font-extrabold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    isActive
                      ? 'bg-orange-500/10 text-[#FF6B00] font-black'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-full lg:w-80">
          <Input
            placeholder="Rechercher par N°, client, entreprise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
            className="rounded-xl shadow-xs"
          />
        </div>
      </div>

      {/* Invoices Table */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6B00]"></div>
        </div>
      ) : (
        <RecentInvoicesTable
          invoices={filteredInvoices}
          onRecordPayment={handleOpenPayment}
          onDeleteInvoice={handleOpenDelete}
        />
      )}

      {/* Payment Record Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={selectedInvoiceForPayment}
        onPaymentSuccess={() => loadInvoices()}
      />

      {/* Confirmation Modal Suppression Facture */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setInvoiceToDelete(null);
        }}
        title="Supprimer la Facture 🗑️"
        description="Attention : confirmation de suppression définitive du document comptable."
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200">
            <AlertTriangle className="w-5 h-5 text-[#B22C22] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Action irréversible</p>
              <p className="mt-1 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer définitivement la facture{' '}
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
              isLoading={isDeleting}
              className="rounded-xl text-xs font-bold bg-[#B22C22] hover:bg-[#8e231b] text-white shadow-md"
            >
              Supprimer Définitivement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
