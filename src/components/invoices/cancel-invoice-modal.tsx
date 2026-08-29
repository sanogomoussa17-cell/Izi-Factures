'use client';

import React, { useState } from 'react';
import { AlertTriangle, Ban, X } from 'lucide-react';
import { Invoice } from '@/core/domain/types';
import { repository } from '@/core/adapters';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface CancelInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onCancelled: (updatedInvoice: Invoice) => void;
}

const PREDEFINED_REASONS = [
  'Erreur sur les montants, quantités ou prestations',
  'Demande formelle d’annulation du client',
  'Émission d’un avoir rectificatif',
  'Défaut de paiement / Litige commercial',
  'Doublon ou facture test',
  'Autre motif personnalisé',
];

export const CancelInvoiceModal: React.FC<CancelInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onCancelled,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(PREDEFINED_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Autre motif personnalisé' ? customReason.trim() : selectedReason;

    if (!finalReason) {
      setError('Veuillez spécifier le motif d’annulation');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const updated = await repository.cancelInvoice(invoice.id, finalReason);
      onCancelled(updated);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Une erreur est survenue lors de l’annulation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Annuler la Facture ${invoice.invoiceNumber}`}
      description="Cette opération marquera la facture comme annulée et déduira le solde de la créance client."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-start gap-3 text-xs text-rose-900 dark:text-rose-200">
          <AlertTriangle className="w-5 h-5 text-[#B22C22] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Attention : Action définitive</span>
            <span>
              L'annulation fige le document avec mention légale d'annulation et annule le solde restant dû (aucun paiement ne pourra plus être reçu sur cette facture).
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Motif d’Annulation *
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-destructive shadow-subtle"
          >
            {PREDEFINED_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {selectedReason === 'Autre motif personnalisé' && (
          <Input
            label="Préciser le motif personnalisé *"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="ex: Changement de contrat intervenu le 12/03..."
            required
          />
        )}

        {error && <p className="text-xs text-destructive font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button type="submit" variant="danger" isLoading={isSubmitting}>
            <Ban className="w-4 h-4 mr-1.5" /> Confirmer l’Annulation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
