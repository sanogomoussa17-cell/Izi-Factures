'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, FileText, Send, Save, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { Invoice, Client, Organization, InvoiceItem } from '@/core/domain/types';
import { repository } from '@/core/adapters';
import { formatInvoiceNumber } from '@/core/domain/numbering';
import { calculateInvoiceTotals } from '@/core/domain/tax-engine';
import { InvoiceForm } from '@/components/invoice-editor/invoice-form';
import { InvoicePreview } from '@/components/invoice-editor/invoice-preview';
import { PDFDownloadButton } from '@/components/export/pdf-download-button';
import { WhatsAppShareButton } from '@/components/export/whatsapp-share-button';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function NewInvoiceStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  // Query params
  const templateId = searchParams.get('template');
  const templateAmount = searchParams.get('amount');
  const queryClientId = searchParams.get('clientId');

  // New invoice state
  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    invoiceNumber: formatInvoiceNumber(Math.floor(Math.random() * 900) + 100),
    status: 'DRAFT',
    paymentStatus: 'UNPAID',
    paymentStructure: 'STANDARD',
    currency: 'XOF',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    isTaxEnabled: true,
    isTaxExempt: false,
    discountAmount: 0,
    items: [
      {
        id: 'item_1',
        description:
          templateId === 'act_01'
            ? 'Vente & Prestation directe en boutique'
            : templateId === 'act_02'
            ? 'Développement & Intégration Plateforme Web'
            : 'Prestation de Services & Conseil',
        quantity: 1,
        unitPrice: templateAmount ? parseInt(templateAmount, 10) : 350000,
        taxRateBps: 1800,
        isTaxExempt: false,
        totalAmount: templateAmount ? parseInt(templateAmount, 10) : 350000,
        taxAmount: Math.round(((templateAmount ? parseInt(templateAmount, 10) : 350000) * 1800) / 10000),
      },
    ],
  });

  useEffect(() => {
    async function init() {
      const [org, cliList] = await Promise.all([
        repository.getOrganization(),
        repository.getClients(),
      ]);
      setOrganization(org);
      const availableClients = cliList || [];
      setClients(availableClients);

      if (availableClients.length > 0) {
        const initialClient = queryClientId
          ? availableClients.find((c) => c.id === queryClientId) || availableClients[0]
          : availableClients[0];

        setInvoice((prev) => ({
          ...prev,
          clientId: initialClient.id,
          client: initialClient,
          currency: org.currency,
          isTaxEnabled: org.isTaxEnabled,
        }));
      }
    }
    init();
  }, [queryClientId]);

  const handleClientCreated = (newClient: Client) => {
    setClients((prev) => [newClient, ...prev.filter((c) => c.id !== newClient.id)]);
    setInvoice((prev) => ({
      ...prev,
      clientId: newClient.id,
      client: newClient,
    }));
  };

  const handleSaveDraft = async () => {
    if (!invoice.clientId || !organization) return;
    setIsSubmitting(true);
    try {
      const created = await repository.createInvoice({
        ...(invoice as any),
        status: 'DRAFT',
        orgId: organization.id,
        paidAmount: 0,
        remainingBalance: invoice.totalAmount || 0,
        payments: [],
      });
      router.push(`/invoices/${created.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssueInvoice = async () => {
    if (!invoice.clientId || !organization) return;
    setIsSubmitting(true);
    try {
      const created = await repository.createInvoice({
        ...(invoice as any),
        status: 'ISSUED',
        orgId: organization.id,
        paidAmount: 0,
        remainingBalance: invoice.totalAmount || 0,
        payments: [],
      });
      router.push(`/invoices/${created.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedClient = clients.find((c) => c.id === invoice.clientId) || clients[0] || null;

  return (
    <div className="space-y-6 w-full">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/invoices">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground font-display">
              Créer une Facture (Studio Split-Screen)
            </h1>
            <p className="text-xs text-muted-foreground">
              Saisie dynamique à gauche • Rendu papier fiscal haute fidélité à droite
            </p>
          </div>
        </div>

        {/* Mobile Toggle Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="text-xs rounded-xl"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            {showMobilePreview ? 'Modifier le Formulaire' : 'Voir la Prévisualisation'}
          </Button>
        </div>
      </div>

      {/* Split-Screen Studio Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Left Side: Invoice Form (6 cols on lg) */}
        <div className={`lg:col-span-6 space-y-6 ${showMobilePreview ? 'hidden lg:block' : 'block'}`}>
          <InvoiceForm
            invoice={invoice}
            clients={clients}
            organization={organization}
            onChange={(updated) => setInvoice(updated)}
            onSaveDraft={handleSaveDraft}
            onIssueInvoice={handleIssueInvoice}
            onClientCreated={handleClientCreated}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Right Side: Live Visual Preview & Actions (6 cols on lg) */}
        <div className={`lg:col-span-6 space-y-4 ${!showMobilePreview ? 'hidden lg:block' : 'block'}`}>
          {/* Action Bar */}
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">
                Aperçu Direct
              </span>
              <PDFDownloadButton invoiceNumber={invoice.invoiceNumber || 'BROUILLON'} />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                isLoading={isSubmitting}
                className="text-xs rounded-xl font-semibold"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Brouillon
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleIssueInvoice}
                isLoading={isSubmitting}
                className="text-xs rounded-xl font-bold bg-[#FF6B00] hover:bg-[#EA580C] text-white shadow-xs"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" /> Enregistrer la Facture
              </Button>
            </div>
          </div>

          {/* Paper Invoice Sheet */}
          <div className="sticky top-20">
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

export default function NewInvoiceStudioPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00]"></div>
      </div>
    }>
      <NewInvoiceStudioContent />
    </Suspense>
  );
}
