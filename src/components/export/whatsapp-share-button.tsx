'use client';

import React from 'react';
import { MessageSquareShare } from 'lucide-react';
import { Invoice, Organization } from '@/core/domain/types';
import { formatMoney } from '@/core/domain/money';
import { Button } from '@/components/ui/button';

export interface WhatsAppShareButtonProps {
  invoice: Invoice;
  organization: Organization;
}

export const WhatsAppShareButton: React.FC<WhatsAppShareButtonProps> = ({
  invoice,
  organization,
}) => {
  const handleShare = () => {
    const clientPhone = invoice.client.phone.replace(/[^0-9]/g, '');
    const currency = invoice.currency;

    const message = `Bonjour ${invoice.client.name},

Voici votre facture *${invoice.invoiceNumber}* émise par *${organization.name}*.

*Détails du document :*
• Montant total TTC : *${formatMoney(invoice.totalAmount, currency)}*
• Montant réglé : *${formatMoney(invoice.paidAmount, currency)}*
• Reste à payer : *${formatMoney(invoice.remainingBalance, currency)}*
• Date d'échéance : *${invoice.dueDate}*

${organization.waveNumber ? `*Paiement Wave direct :* ${organization.waveNumber}\n` : ''}${organization.orangeMoneyNumber ? `*Orange Money :* ${organization.orangeMoneyNumber}\n` : ''}${organization.bankDetails ? `*Coordonnées Bancaires :* ${organization.bankDetails}\n` : ''}
Merci pour votre confiance.
_${organization.name}_`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = clientPhone 
      ? `https://wa.me/${clientPhone}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleShare}
      className="text-xs bg-[#25D366]/10 text-[#075E54] border-[#25D366]/30 hover:bg-[#25D366]/20 font-semibold"
    >
      <MessageSquareShare className="w-4 h-4 mr-1.5 text-[#25D366]" />
      Partager via WhatsApp
    </Button>
  );
};
