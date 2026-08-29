'use client';

import React, { useState } from 'react';
import { Download, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PDFDownloadButtonProps {
  invoiceNumber: string;
  elementId?: string;
}

export const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  invoiceNumber,
  elementId = 'invoice-document-sheet',
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
      className="text-xs"
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
