'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Eye, FileText, Save, ArrowLeft, Ban, AlertCircle } from 'lucide-react';
import { Invoice, Client, Organization } from '@/core/domain/types';
import { repository } from '@/core/adapters';
import { InvoiceForm } from '@/components/invoice-editor/invoice-form';
import { InvoicePreview } from '@/components/invoice-editor/invoice-preview';
import { PDFDownloadButton } from '@/components/export/pdf-download-button';
import { WhatsAppShareButton } from '@/components/export/whatsapp-share-button';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      try {
        const [org, cliList, inv] = await Promise.all([
          repository.getOrganization(),
          repository.getClients(),
          repository.getInvoiceById(invoiceId),
        ]);
        setOrganization(org);
        setClients(cliList);
        if (!inv) {
          setError('Facture introuvable');
        } else {
          setInvoice(inv);
        }
      } catch (err) {
        console.error(err);
        setError('Erreur lors du chargement de la facture');
      }
    }
    if (invoiceId) {
      loadData();
    }
  }, [invoiceId]);

  const handleUpdateInvoice = async () => {
    if (!invoice || !organization) return;
    setIsSubmitting(true);
    try {
      const selectedClient = clients.find((c) => c.id === invoice.clientId) || invoice.client;
      await repository.updateInvoice(invoice.id, {
        ...invoice,
        client: selectedClient,
      });
      router.push(`/invoices/${invoice.id}`);
    } catch (err) {
      console.error(err);
      setError('Erreur lors de l’enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error || !invoice || !organization) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        {error ? (
          <>
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-lg font-bold text-foreground">{error}</h2>
            <Link href="/invoices">
              <Button variant="outline">Retour aux Factures</Button>
            </Link>
          </>
        ) : (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        )}
      </div>
    );
  }

  const selectedClient = clients.find((c) => c.id === invoice.clientId) || invoice.client;

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/invoices/${invoice.id}`}>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground font-display">
              Modifier la Facture {invoice.invoiceNumber}
            </h1>
            <p className="text-xs text-muted-foreground">
              Ajustez les prestations, montants, taux de TVA ou le calendrier d'échéances
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Mobile Switch Preview/Form */}
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden text-xs"
            onClick={() => setShowMobilePreview(!showMobilePreview)}
          >
            {showMobilePreview ? (
              <>
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Formulaire
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Aperçu Papier
              </>
            )}
          </Button>

          <PDFDownloadButton
            invoice={invoice}
            organization={organization}
            client={selectedClient}
          />

          <WhatsAppShareButton
            invoice={invoice}
            organization={organization}
            client={selectedClient}
          />

          <Button
            variant="primary"
            size="sm"
            onClick={handleUpdateInvoice}
            isLoading={isSubmitting}
            className="text-xs"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" /> Enregistrer les Modifications
          </Button>
        </div>
      </div>

      {invoice.status === 'CANCELLED' && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs flex items-center justify-between text-rose-900 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 text-[#B22C22]" />
            <span>
              <strong>Attention :</strong> Cette facture est actuellement <strong>Annulée</strong> (Motif : {invoice.cancellationReason || 'Non précisé'}).
            </span>
          </div>
        </div>
      )}

      {/* Split-Screen Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Invoice Form Editor (7 cols) */}
        <div className={`lg:col-span-7 ${showMobilePreview ? 'hidden lg:block' : 'block'}`}>
          <InvoiceForm
            invoice={invoice}
            organization={organization}
            clients={clients}
            onChange={(updated) => setInvoice(updated as Invoice)}
            onSaveDraft={handleUpdateInvoice}
            onIssueInvoice={handleUpdateInvoice}
            onClientCreated={(newClient) => {
              setClients((prev) => [newClient, ...prev.filter((c) => c.id !== newClient.id)]);
              setInvoice((prev) => (prev ? { ...prev, clientId: newClient.id, client: newClient } : prev));
            }}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Right Side: Live Paper Sheet Preview (5 cols) */}
        <div className={`lg:col-span-5 ${!showMobilePreview ? 'hidden lg:block' : 'block'}`}>
          <div className="sticky top-20">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-primary" /> Aperçu Papier Direct
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {invoice.currency} • TVA {invoice.isTaxEnabled && !invoice.isTaxExempt ? '18%' : '0%'}
              </span>
            </div>

            <InvoicePreview
              invoice={invoice}
              organization={organization}
              client={selectedClient}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
