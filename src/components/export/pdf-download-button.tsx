'use client';

import React, { useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Invoice, Organization, Client } from '@/core/domain/types';

export interface PDFDownloadButtonProps {
  invoiceNumber?: string;
  invoice?: Invoice;
  organization?: Organization | null;
  client?: Client | null;
  elementId?: string;
  className?: string;
}

export const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  invoiceNumber,
  invoice,
  organization,
  client,
  elementId = 'invoice-document-sheet',
  className = 'text-xs',
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handlePrint}
      disabled={isPrinting}
      className={className}
    >
      {isPrinting ? (
        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
      ) : (
        <Printer className="w-3.5 h-3.5 mr-1.5" />
      )}
      Imprimer / PDF
    </Button>
  );
};
