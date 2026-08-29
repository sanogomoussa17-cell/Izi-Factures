'use client';

import React, { useState, useEffect } from 'react';
import { Invoice, PaymentMethod, PaymentRecord } from '@/core/domain/types';
import { formatMoney } from '@/core/domain/money';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, CreditCard } from 'lucide-react';
import { repository } from '@/core/adapters';

export interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  payment: PaymentRecord | null;
  onPaymentUpdated: (updatedInvoice: Invoice) => void;
}

export const EditPaymentModal: React.FC<EditPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  payment,
  onPaymentUpdated,
}) => {
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('WAVE');
  const [transactionReference, setTransactionReference] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount || 0);
      setPaymentMethod(payment.paymentMethod || 'WAVE');
      setTransactionReference(payment.transactionReference || '');
      setPaymentDate(payment.paymentDate || new Date().toISOString().slice(0, 10));
      setNotes(payment.notes || '');
    }
  }, [payment]);

  if (!invoice || !payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !paymentDate) return;

    setIsSubmitting(true);
    try {
      const result = await repository.updatePayment({
        paymentId: payment.id,
        invoiceId: invoice.id,
        amount,
        paymentMethod,
        transactionReference,
        paymentDate,
        notes,
      });

      onPaymentUpdated(result.updatedInvoice);
      onClose();
    } catch (err) {
      console.error('Erreur modification paiement:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier la Date et le Règlement 📅"
      description={`Facture ${invoice.invoiceNumber} • Réf : ${payment.transactionReference || payment.id}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Champ Date de Paiement / Valeur */}
        <div className="p-3.5 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/60 rounded-xl space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#FF6B00] flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> Date Effective du Paiement *
          </label>
          <Input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
            className="rounded-lg bg-card"
          />
          <p className="text-[11px] text-muted-foreground">
            Sélectionnez la date exacte à laquelle le montant a été reçu.
          </p>
        </div>

        <Input
          type="number"
          label="Montant Encaissé *"
          value={amount}
          onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
          min={1}
          helperText={`En ${invoice.currency} stricts`}
          required
          className="rounded-lg"
        />

        {/* Moyens de paiement africains et classiques */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Canal de Paiement *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'WAVE', label: 'Wave' },
              { id: 'ORANGE_MONEY', label: 'Orange Money' },
              { id: 'MTN_MOMO', label: 'MTN MoMo' },
              { id: 'BANK_TRANSFER', label: 'Virement' },
              { id: 'CASH', label: 'Espèces' },
              { id: 'CHECK', label: 'Chèque' },
            ].map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                className={`py-2 px-3 text-xs font-semibold rounded-md border text-center transition-all ${
                  paymentMethod === method.id
                    ? 'border-[#FF6B00] bg-orange-500/10 text-[#FF6B00] font-bold shadow-xs'
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
          className="rounded-lg"
        />

        <Input
          label="Notes ou Remarques internes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ex: Reçu sur compte SGBS Dakar ou validé par comptabilité"
          className="rounded-lg"
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
            Annuler
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="rounded-xl bg-[#FF6B00] hover:bg-[#EA580C] text-white">
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Enregistrer la Modification
          </Button>
        </div>
      </form>
    </Modal>
  );
};
