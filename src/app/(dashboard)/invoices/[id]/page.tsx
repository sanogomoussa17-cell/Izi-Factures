'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Download,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Smartphone,
  Landmark,
  Layers,
  FileText,
  CreditCard,
  Edit3,
  Pencil,
  Ban,
  Trash2,
} from 'lucide-react';
import { Invoice, Organization, PaymentRecord } from '@/core/domain/types';
import { repository } from '@/core/adapters';
import { formatMoney } from '@/core/domain/money';
import { InvoicePreview } from '@/components/invoice-editor/invoice-preview';
import { PDFDownloadButton } from '@/components/export/pdf-download-button';
import { WhatsAppShareButton } from '@/components/export/whatsapp-share-button';
import { RecordPaymentModal } from '@/components/payments/record-payment-modal';
import { EditPaymentModal } from '@/components/payments/edit-payment-modal';
import { CancelInvoiceModal } from '@/components/invoices/cancel-invoice-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentToEdit, setSelectedPaymentToEdit] = useState<PaymentRecord | null>(null);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleDeleteInvoice = async () => {
    if (!invoice) return;
    setIsDeleting(true);
    try {
      await repository.deleteInvoice(invoice.id);
      router.push('/invoices');
    } catch (err) {
      console.error('Erreur suppression facture:', err);
      setIsDeleting(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const org = await repository.getOrganization();
      const inv = await repository.getInvoiceById(invoiceId);
      setOrganization(org);
      setInvoice(inv);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [invoiceId]);

  if (isLoading || !organization) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-lg font-bold text-foreground">Facture non trouvée</h2>
        <Link href="/invoices">
          <Button variant="outline">Retour aux factures</Button>
        </Link>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (invoice.status === 'CANCELLED') {
      return <Badge variant="cancelled">Facture Annulée</Badge>;
    }
    switch (invoice.paymentStatus) {
      case 'PAID':
        return <Badge variant="paid">Facture Soldée (100%)</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="partial">Paiement Partiel</Badge>;
      case 'OVERDUE':
        return <Badge variant="overdue">Créance en Retard</Badge>;
      default:
        return <Badge variant="issued">En Attente de Paiement</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/invoices">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-foreground font-display font-mono">
                {invoice.invoiceNumber}
              </h1>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Émise le {invoice.issueDate} • Échéance : {invoice.dueDate} • Client : {invoice.client.name}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Edit Button */}
          {invoice.status !== 'CANCELLED' && (
            <Link href={`/invoices/${invoice.id}/edit`}>
              <Button variant="outline" size="sm" className="text-xs">
                <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Modifier
              </Button>
            </Link>
          )}

          {/* Record Payment Button */}
          {invoice.status !== 'CANCELLED' && invoice.remainingBalance > 0 && (
            <Button
              variant="success"
              size="sm"
              onClick={() => setIsPaymentModalOpen(true)}
              className="text-xs"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Enregistrer un Paiement
            </Button>
          )}

          {/* Cancel Invoice Button */}
          {invoice.status !== 'CANCELLED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCancelModalOpen(true)}
              className="text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-amber-300/60"
            >
              <Ban className="w-3.5 h-3.5 mr-1.5" /> Annuler
            </Button>
          )}

          {/* Delete Invoice Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            className="text-xs text-[#B22C22] hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Supprimer
          </Button>

          <WhatsAppShareButton invoice={invoice} organization={organization} />
          <PDFDownloadButton
            invoice={invoice}
            organization={organization}
            client={invoice.client}
          />
        </div>
      </div>

      {/* Cancellation Notice Banner */}
      {invoice.status === 'CANCELLED' && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 dark:text-rose-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-[#B22C22]">
              <Ban className="w-4 h-4" /> Facture Annulée
            </div>
            <div>
              <strong>Motif d'annulation :</strong> {invoice.cancellationReason || 'Non précisé'}
            </div>
            {invoice.cancelledAt && (
              <div className="text-muted-foreground text-[11px]">
                Annulée le {new Date(invoice.cancelledAt).toLocaleString('fr-FR')}
              </div>
            )}
          </div>
          <div className="shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(true)}
              className="text-xs text-[#B22C22] hover:bg-rose-100 dark:hover:bg-rose-900/60 border-rose-300"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Supprimer Définitivement
            </Button>
          </div>
        </div>
      )}

      {/* Main Grid: Info + Live Paper Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Summary Cards & Payment Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Montants Clés */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Facturé TTC
              </span>
              <span className="text-xl font-extrabold font-mono text-foreground">
                {formatMoney(invoice.totalAmount, invoice.currency)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
              <div>
                <span className="text-[11px] text-muted-foreground block">Montant Hors Taxe (HT)</span>
                <span className="text-sm font-bold font-mono text-foreground">
                  {formatMoney(invoice.subtotalAmount, invoice.currency)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">TVA (18% UEMOA)</span>
                <span className="text-sm font-bold font-mono text-foreground">
                  {invoice.isTaxExempt ? 'Exonérée (0 FCFA)' : formatMoney(invoice.taxAmount, invoice.currency)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
              <div>
                <span className="text-[11px] text-muted-foreground block">Total Déjà Encaissé</span>
                <span className="text-sm font-black font-mono text-[#0E7A55]">
                  {formatMoney(invoice.paidAmount, invoice.currency)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Solde Restant Dû</span>
                <span
                  className={`text-sm font-black font-mono ${
                    invoice.remainingBalance > 0 && invoice.status !== 'CANCELLED'
                      ? 'text-[#B22C22]'
                      : 'text-muted-foreground'
                  }`}
                >
                  {formatMoney(invoice.remainingBalance, invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Tranches d'Échéancier (si split payment) */}
          {invoice.paymentStructure === 'SPLIT' && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#FF6B00]" />
                  <h3 className="font-bold text-sm text-foreground font-display">
                    Échéancier de Paiement Multi-Tranches
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground font-bold">
                  {(invoice.schedules || []).length} Tranches
                </span>
              </div>

              <div className="space-y-3">
                {(invoice.schedules || []).map((sc, index) => (
                  <div
                    key={sc.id || index}
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                      sc.status === 'PAID'
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-2">
                        <span>{sc.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-mono">
                          {sc.percentage}%
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Échéance : {sc.dueDate}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-foreground">
                        {formatMoney(sc.expectedAmount, invoice.currency)}
                      </div>
                      {sc.status === 'PAID' ? (
                        <span className="text-[#0E7A55] font-bold text-[10px] flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3 h-3" /> Payée
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">
                          En attente
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card 3: Historique des Règlements Reçus */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#0E7A55]" />
                <h3 className="font-bold text-sm text-foreground font-display">
                  Historique des Règlements Reçus
                </h3>
              </div>
              <span className="text-xs text-muted-foreground font-mono font-bold">
                {(invoice.payments || []).length} Encaissement(s)
              </span>
            </div>

            {(invoice.payments || []).length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">
                Aucun paiement n'a encore été enregistré pour cette facture.
              </p>
            ) : (
              <div className="space-y-2.5">
                {(invoice.payments || []).map((pay) => (
                  <div
                    key={pay.id}
                    className="p-3.5 bg-muted/40 rounded-xl border border-border text-xs space-y-2 group hover:border-orange-500/40 transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-foreground flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-[#0E7A55]" />
                        {pay.paymentMethod.toUpperCase()} • Ref: {pay.transactionReference}
                      </span>
                      <span className="text-[#0E7A55] font-mono font-black text-sm">
                        +{formatMoney(pay.amount, invoice.currency)}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t border-border/50">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-[#FF6B00]" /> Reçu le <strong>{pay.paymentDate}</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        {pay.notes && <span className="italic truncate max-w-[120px]">{pay.notes}</span>}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPaymentToEdit(pay);
                            setIsEditPaymentModalOpen(true);
                          }}
                          className="text-[11px] text-[#FF6B00] hover:text-[#EA580C] font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900/60 shadow-2xs transition-colors"
                          title="Modifier la date ou les détails de ce règlement"
                        >
                          <Pencil className="w-3 h-3" /> Modifier Date / Infos
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: The Paper Invoice Document Sheet (7 cols) */}
        <div className="lg:col-span-7">
          <InvoicePreview
            invoice={invoice}
            organization={organization}
            client={invoice.client}
          />
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={invoice}
        onPaymentSuccess={() => loadData()}
      />

      {/* Edit Payment Modal (Date, Montant, Réf, Notes) */}
      <EditPaymentModal
        isOpen={isEditPaymentModalOpen}
        onClose={() => {
          setIsEditPaymentModalOpen(false);
          setSelectedPaymentToEdit(null);
        }}
        invoice={invoice}
        payment={selectedPaymentToEdit}
        onPaymentUpdated={(updated) => {
          setInvoice(updated);
          loadData();
        }}
      />

      {/* Cancel Invoice Modal */}
      <CancelInvoiceModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        invoice={invoice}
        onCancelled={(updated) => setInvoice(updated)}
      />

      {/* Delete Invoice Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Supprimer la Facture 🗑️"
        description="Attention : cette action supprimera définitivement cette facture."
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200">
            <AlertTriangle className="w-5 h-5 text-[#B22C22] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Action irréversible</p>
              <p className="mt-1 leading-relaxed">
                Êtes-vous certain de vouloir supprimer la facture{' '}
                <strong>« {invoice.invoiceNumber} »</strong> pour le client{' '}
                <strong>{invoice.client?.name}</strong> ?
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
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
