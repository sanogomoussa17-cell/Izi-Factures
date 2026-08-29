'use client';

import React, { useState } from 'react';
import { Invoice, PaymentMethod, PaymentRecord } from '@/core/domain/types';
import { formatMoney } from '@/core/domain/money';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Smartphone, Landmark, Banknote, FileCheck, CheckCircle2 } from 'lucide-react';

export interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onPaymentSuccess: (payment: PaymentRecord) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('WAVE');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (invoice) {
      // Pré-remplir avec le solde restant ou la prochaine tranche
      const pendingSchedule = invoice.schedules.find((s) => s.status !== 'PAID');
      if (pendingSchedule) {
        setAmount(pendingSchedule.expectedAmount - pendingSchedule.paidAmount);
        setSelectedScheduleId(pendingSchedule.id);
      } else {
        setAmount(invoice.remainingBalance);
      }
      setTransactionReference(`${paymentMethod}-${Date.now().toString().slice(-6)}`);
    }
  }, [invoice, paymentMethod]);

  if (!invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    setIsSubmitting(true);
    try {
      // Appeler le repository
      const { repository } = await import('@/core/adapters');
      const result = await repository.recordPayment({
        invoiceId: invoice.id,
        amount,
        paymentMethod,
        transactionReference,
        paymentDate,
        scheduleId: selectedScheduleId || undefined,
        notes,
      });

      onPaymentSuccess(result.payment);
      onClose();
    } catch (err) {
      console.error('Erreur encaissement', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enregistrer un Encaissement"
      description={`Facture ${invoice.invoiceNumber} • Client : ${invoice.client.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-muted/40 rounded-lg border border-border flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Solde Restant Dû :</span>
          <span className="font-mono font-bold text-foreground text-sm">
            {formatMoney(invoice.remainingBalance, invoice.currency)}
          </span>
        </div>

        {/* Tranche de l'échéancier */}
        {invoice.schedules && invoice.schedules.length > 1 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Affecter à une tranche d’échéancier
            </label>
            <select
              value={selectedScheduleId}
              onChange={(e) => {
                setSelectedScheduleId(e.target.value);
                const sched = (invoice.schedules || []).find((s) => s.id === e.target.value);
                if (sched) setAmount(sched.expectedAmount - sched.paidAmount);
              }}
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-subtle"
            >
              <option value="">Règlement libre / global</option>
              {(invoice.schedules || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} ({formatMoney(s.expectedAmount, invoice.currency)}) - {s.status === 'PAID' ? 'Soldée' : 'En attente'}
                </option>
              ))}
            </select>
          </div>
        )}

        <Input
          type="number"
          label="Montant Encaissé *"
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
          min={1}
          max={invoice.remainingBalance}
          helperText={`En ${invoice.currency} stricts`}
          required
        />

        {/* Moyens de paiement africains et classiques */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Canal de Paiement *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'WAVE', label: 'Wave', color: 'text-blue-500 border-blue-200' },
              { id: 'ORANGE_MONEY', label: 'Orange Money', color: 'text-orange-500 border-orange-200' },
              { id: 'MTN_MOMO', label: 'MTN MoMo', color: 'text-yellow-600 border-yellow-200' },
              { id: 'BANK_TRANSFER', label: 'Virement', color: 'text-indigo-600 border-indigo-200' },
              { id: 'CASH', label: 'Espèces', color: 'text-emerald-600 border-emerald-200' },
              { id: 'CHECK', label: 'Chèque', color: 'text-slate-600 border-slate-200' },
            ].map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                className={`py-2 px-3 text-xs font-semibold rounded-md border text-center transition-all ${
                  paymentMethod === method.id
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="N° de Référence de Transaction *"
          value={transactionReference}
          onChange={(e) => setTransactionReference(e.target.value)}
          placeholder="ex: WAVE-SN-98214820 ou Réf Virement"
          required
        />

        <Input
          type="date"
          label="Date de Valeur / Réception"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          required
        />

        <Input
          label="Notes ou Remarques internes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ex: Reçu sur compte SGBS Dakar ou validé par comptabilité"
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="success" isLoading={isSubmitting}>
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Valider l’Encaissement
          </Button>
        </div>
      </form>
    </Modal>
  );
};
