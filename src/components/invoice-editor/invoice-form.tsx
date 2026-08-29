'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Calendar, User, DollarSign, Percent, Shield, Layers, HelpCircle, UserPlus, Building, Phone, Mail } from 'lucide-react';
import { Invoice, InvoiceItem, Client, Organization, PaymentStructure } from '@/core/domain/types';
import { calculateInvoiceTotals } from '@/core/domain/tax-engine';
import { generatePaymentSchedules, SCHEDULE_PRESETS } from '@/core/domain/schedule-engine';
import { repository } from '@/core/adapters';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { formatMoney } from '@/core/domain/money';

export interface InvoiceFormProps {
  invoice: Partial<Invoice>;
  clients: Client[];
  organization: Organization;
  onChange: (updatedInvoice: Partial<Invoice>) => void;
  onSaveDraft: () => void;
  onIssueInvoice: () => void;
  onClientCreated?: (newClient: Client) => void;
  isSubmitting?: boolean;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  clients,
  organization,
  onChange,
  onSaveDraft,
  onIssueInvoice,
  onClientCreated,
  isSubmitting,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('split_30_70');

  // Quick Client Creation Modal State
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [quickClient, setQuickClient] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Dakar',
    country: 'Sénégal',
    taxIdNumber: '',
    notes: '',
  });

  // Handle client selection
  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    onChange({
      ...invoice,
      clientId,
      client: client || invoice.client,
    });
  };

  // Handle quick client creation
  const handleCreateQuickClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClient.name.trim()) return;

    setIsCreatingClient(true);
    try {
      const orgId = organization?.id || 'a0000000-0000-0000-0000-000000000001';
      const created = await repository.createClient({
        ...quickClient,
        name: quickClient.name.trim(),
        companyName: quickClient.companyName.trim(),
        orgId,
      });

      if (onClientCreated) {
        onClientCreated(created);
      }

      handleClientChange(created.id);
      setIsAddClientOpen(false);
      setQuickClient({
        name: '',
        companyName: '',
        email: '',
        phone: '',
        address: '',
        city: 'Dakar',
        country: 'Sénégal',
        taxIdNumber: '',
        notes: '',
      });
    } catch (err) {
      console.error('Erreur création client rapide:', err);
    } finally {
      setIsCreatingClient(false);
    }
  };

  // Handle Structure switch (Standard vs Split vs Recurring)
  const handleStructureChange = (structure: PaymentStructure) => {
    const updated: Partial<Invoice> = {
      ...invoice,
      paymentStructure: structure,
    };
    if (structure === 'SPLIT') {
      updated.schedules = generatePaymentSchedules({
        invoiceId: invoice.id || 'temp',
        totalAmount: invoice.totalAmount || 0,
        startDate: invoice.issueDate || new Date().toISOString().slice(0, 10),
        presetId: selectedPresetId,
      });
    } else {
      updated.schedules = [
        {
          id: `sched_single`,
          invoiceId: invoice.id || 'temp',
          installmentNumber: 1,
          label: 'Règlement standard',
          percentage: 100,
          expectedAmount: invoice.totalAmount || 0,
          dueDate: invoice.dueDate || new Date().toISOString().slice(0, 10),
          status: 'PENDING',
          paidAmount: 0,
        },
      ];
    }
    onChange(updated);
  };

  // Recalculate totals
  const updateItemsAndRecalculate = (newItems: Omit<InvoiceItem, 'totalAmount' | 'taxAmount'>[]) => {
    const calculation = calculateInvoiceTotals({
      items: newItems,
      isTaxEnabled: invoice.isTaxEnabled ?? organization.isTaxEnabled,
      isTaxExempt: invoice.isTaxExempt ?? false,
      discountFlatAmount: invoice.discountAmount ?? 0,
    });

    const updated: Partial<Invoice> = {
      ...invoice,
      items: calculation.items,
      subtotalAmount: calculation.subtotalAmount,
      taxAmount: calculation.taxAmount,
      totalAmount: calculation.totalAmount,
      remainingBalance: Math.max(0, calculation.totalAmount - (invoice.paidAmount || 0)),
    };

    if (invoice.paymentStructure === 'SPLIT') {
      updated.schedules = generatePaymentSchedules({
        invoiceId: invoice.id || 'temp',
        totalAmount: calculation.totalAmount,
        startDate: invoice.issueDate || new Date().toISOString().slice(0, 10),
        presetId: selectedPresetId,
      });
    }

    onChange(updated);
  };

  const handleAddItem = () => {
    const currentItems = (invoice.items || []).map((it) => ({
      id: it.id,
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      taxRateBps: it.taxRateBps,
      isTaxExempt: it.isTaxExempt,
    }));

    currentItems.push({
      id: `item_${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRateBps: 1800,
      isTaxExempt: false,
    });

    updateItemsAndRecalculate(currentItems);
  };

  const handleRemoveItem = (index: number) => {
    const currentItems = (invoice.items || []).map((it) => ({
      id: it.id,
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      taxRateBps: it.taxRateBps,
      isTaxExempt: it.isTaxExempt,
    }));
    currentItems.splice(index, 1);
    updateItemsAndRecalculate(currentItems);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const currentItems = (invoice.items || []).map((it) => ({
      id: it.id,
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      taxRateBps: it.taxRateBps,
      isTaxExempt: it.isTaxExempt,
    }));

    currentItems[index] = {
      ...currentItems[index],
      [field]: value,
    };

    updateItemsAndRecalculate(currentItems);
  };

  const handleTaxToggle = (enabled: boolean) => {
    const updated: Partial<Invoice> = {
      ...invoice,
      isTaxEnabled: enabled,
    };
    const calculation = calculateInvoiceTotals({
      items: invoice.items || [],
      isTaxEnabled: enabled,
      isTaxExempt: invoice.isTaxExempt ?? false,
      discountFlatAmount: invoice.discountAmount ?? 0,
    });
    updated.subtotalAmount = calculation.subtotalAmount;
    updated.taxAmount = calculation.taxAmount;
    updated.totalAmount = calculation.totalAmount;
    updated.remainingBalance = Math.max(0, calculation.totalAmount - (invoice.paidAmount || 0));
    onChange(updated);
  };

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (invoice.paymentStructure === 'SPLIT') {
      const schedules = generatePaymentSchedules({
        invoiceId: invoice.id || 'temp',
        totalAmount: invoice.totalAmount || 0,
        startDate: invoice.issueDate || new Date().toISOString().slice(0, 10),
        presetId,
      });
      onChange({ ...invoice, schedules });
    }
  };

  const currentSelectedClient = clients.find((c) => c.id === invoice.clientId);

  return (
    <div className="bg-card border border-border rounded-2xl shadow-card p-6 sm:p-8 space-y-6">
      {/* Structure Selector (Segmented tabs) */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Type de Facturation
        </label>
        <div className="grid grid-cols-3 gap-1 bg-muted/50 p-1.5 rounded-xl border border-border">
          {(['STANDARD', 'SPLIT', 'RECURRING'] as PaymentStructure[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => handleStructureChange(st)}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                invoice.paymentStructure === st
                  ? 'bg-card text-[#FF6B00] shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {st === 'STANDARD' && 'Standard (100%)'}
              {st === 'SPLIT' && 'Échelonné (Split)'}
              {st === 'RECURRING' && 'Récurrent'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Info: Client & Invoice Number */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Client Destinataire *
              </label>
              <button
                type="button"
                onClick={() => setIsAddClientOpen(true)}
                className="text-xs text-[#FF6B00] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Nouveau Client
              </button>
            </div>

            <select
              value={invoice.clientId || ''}
              onChange={(e) => handleClientChange(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B00] shadow-subtle font-medium"
            >
              <option value="">Sélectionner un client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName ? `${c.companyName} (${c.name})` : c.name}
                </option>
              ))}
            </select>

            {currentSelectedClient && (
              <div className="mt-2 p-2.5 bg-muted/30 border border-border rounded-lg text-xs space-y-1 text-muted-foreground">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#0E7A55]" />
                  {currentSelectedClient.name} {currentSelectedClient.companyName ? `• ${currentSelectedClient.companyName}` : ''}
                </div>
                {currentSelectedClient.phone && (
                  <div>Tél: {currentSelectedClient.phone}</div>
                )}
                {currentSelectedClient.address && (
                  <div>{currentSelectedClient.address}, {currentSelectedClient.city}</div>
                )}
              </div>
            )}
          </div>

          <Input
            label="Numéro de Facture"
            value={invoice.invoiceNumber || ''}
            onChange={(e) => onChange({ ...invoice, invoiceNumber: e.target.value })}
            placeholder="ex: FAC-2026-0001"
            className="rounded-xl h-11"
          />
        </div>

        {/* Dates d'émission et d'échéance garanties sur la même ligne */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            label="Date d’Émission"
            value={invoice.issueDate || ''}
            onChange={(e) => onChange({ ...invoice, issueDate: e.target.value })}
            className="rounded-xl"
          />

          <Input
            type="date"
            label="Date d’Échéance"
            value={invoice.dueDate || ''}
            onChange={(e) => onChange({ ...invoice, dueDate: e.target.value })}
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Articles & Prestations
          </h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddItem}
            className="text-xs text-[#FF6B00] font-bold hover:bg-orange-500/10"
          >
            <Plus className="w-4 h-4 mr-1" /> Ajouter une ligne
          </Button>
        </div>

        <div className="space-y-3">
          {(invoice.items || []).map((item, index) => (
            <div key={item.id || index} className="p-3.5 bg-muted/20 border border-border rounded-xl space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Description de la prestation ou de l'article"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="text-sm rounded-lg"
                  />
                </div>
                {(invoice.items || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 text-muted-foreground hover:text-[#B22C22] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  type="number"
                  label="Quantité"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                  min={1}
                  className="rounded-lg"
                />

                <Input
                  type="number"
                  label="Prix Unitaire (HT)"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(index, 'unitPrice', parseInt(e.target.value, 10) || 0)}
                  min={0}
                  step={100}
                  className="rounded-lg"
                />

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Total Ligne (TTC)
                  </label>
                  <div className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-mono font-black text-foreground">
                    <span>{formatMoney(item.totalAmount || 0, invoice.currency || 'XOF')}</span>
                    {item.taxAmount ? (
                      <span className="text-[10px] text-[#0E7A55] font-sans">
                        dont TVA : {formatMoney(item.taxAmount, invoice.currency || 'XOF')}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tax & Discount Options */}
      <div className="pt-4 border-t border-border space-y-4">
        <div className="flex items-center justify-between bg-muted/30 p-3.5 rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#0E7A55]" />
            <div>
              <span className="text-xs font-bold text-foreground block">TVA UEMOA (18%)</span>
              <span className="text-[11px] text-muted-foreground">Appliquer le taux fiscal standard de 18%</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={invoice.isTaxEnabled ?? organization.isTaxEnabled}
            onChange={(e) => handleTaxToggle(e.target.checked)}
            className="w-4 h-4 text-[#FF6B00] rounded focus:ring-[#FF6B00] cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="number"
            label="Remise Commerciale Globale"
            value={invoice.discountAmount || 0}
            onChange={(e) => {
              const disc = parseInt(e.target.value, 10) || 0;
              const calc = calculateInvoiceTotals({
                items: invoice.items || [],
                isTaxEnabled: invoice.isTaxEnabled ?? organization.isTaxEnabled,
                isTaxExempt: invoice.isTaxExempt ?? false,
                discountFlatAmount: disc,
              });
              onChange({
                ...invoice,
                discountAmount: disc,
                subtotalAmount: calc.subtotalAmount,
                taxAmount: calc.taxAmount,
                totalAmount: calc.totalAmount,
                remainingBalance: Math.max(0, calc.totalAmount - (invoice.paidAmount || 0)),
              });
            }}
            min={0}
            className="rounded-xl"
          />

          <Input
            label="Devise de la Facture"
            value={invoice.currency || 'XOF'}
            disabled
            className="rounded-xl bg-muted/50 font-mono font-bold"
          />
        </div>
      </div>

      {/* Split Payment Options if SPLIT */}
      {invoice.paymentStructure === 'SPLIT' && (
        <div className="pt-4 border-t border-border space-y-3 bg-orange-500/5 p-4 rounded-2xl border border-orange-500/20">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF6B00] flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Échéancier de Paiement (Tranches)
            </h4>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {SCHEDULE_PRESETS.map((pr) => (
              <button
                key={pr.id}
                type="button"
                onClick={() => handlePresetChange(pr.id)}
                className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                  selectedPresetId === pr.id
                    ? 'bg-card text-[#FF6B00] border-[#FF6B00] shadow-2xs'
                    : 'border-border text-muted-foreground hover:bg-card/50'
                }`}
              >
                {pr.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 pt-2">
            {(invoice.schedules || []).map((s, sIdx) => (
              <div key={s.id || sIdx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-card p-3 rounded-xl border border-border text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{s.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-mono">{s.percentage}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground font-semibold">Date d'échéance :</span>
                    <input
                      type="date"
                      value={s.dueDate || ''}
                      onChange={(e) => {
                        const updatedSchedules = (invoice.schedules || []).map((sc, idx) => {
                          if (idx === sIdx) {
                            return { ...sc, dueDate: e.target.value };
                          }
                          return sc;
                        });
                        onChange({ ...invoice, schedules: updatedSchedules });
                      }}
                      className="h-8 rounded-lg border border-input bg-card px-2 py-1 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                    />
                  </div>
                  <span className="font-extrabold font-mono text-[#0E7A55] shrink-0">
                    {formatMoney(s.expectedAmount, invoice.currency || 'XOF')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes and Terms */}
      <div className="space-y-3">
        <Input
          label="Conditions de Règlement & Pénalités"
          value={invoice.termsAndConditions || ''}
          onChange={(e) => onChange({ ...invoice, termsAndConditions: e.target.value })}
          placeholder="ex: Paiement sous 30 jours. Pénalités de retard 10% annuel."
          className="rounded-xl"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onSaveDraft}
          isLoading={isSubmitting}
          className="rounded-xl text-xs font-semibold"
        >
          Enregistrer en Brouillon
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onIssueInvoice}
          isLoading={isSubmitting}
          className="rounded-xl text-xs font-bold bg-[#FF6B00] hover:bg-[#EA580C] text-white shadow-md"
        >
          Enregistrer la Facture
        </Button>
      </div>

      {/* Modale Rapide Ajout Client depuis l'éditeur de facture */}
      <Modal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        title="Nouveau Client 👤"
        description="Ajoutez rapidement les coordonnées du client pour cette facture."
      >
        <form onSubmit={handleCreateQuickClient} className="space-y-4">
          <Input
            label="Nom du Contact Principal *"
            value={quickClient.name}
            onChange={(e) => setQuickClient({ ...quickClient, name: e.target.value })}
            placeholder="ex: Amadou Diallo"
            required
            className="rounded-xl"
          />

          <Input
            label="Raison Sociale / Entreprise"
            value={quickClient.companyName}
            onChange={(e) => setQuickClient({ ...quickClient, companyName: e.target.value })}
            placeholder="ex: Diallo Consulting SARL"
            className="rounded-xl"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="email"
              label="Email"
              value={quickClient.email}
              onChange={(e) => setQuickClient({ ...quickClient, email: e.target.value })}
              placeholder="contact@client.sn"
              className="rounded-xl"
            />
            <Input
              label="Téléphone *"
              value={quickClient.phone}
              onChange={(e) => setQuickClient({ ...quickClient, phone: e.target.value })}
              placeholder="+221 77 000 00 00"
              required
              className="rounded-xl"
            />
          </div>

          <Input
            label="Adresse & Siège"
            value={quickClient.address}
            onChange={(e) => setQuickClient({ ...quickClient, address: e.target.value })}
            placeholder="ex: Dakar Plateau"
            className="rounded-xl"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddClientOpen(false)}
              className="rounded-xl text-xs"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isCreatingClient}
              className="rounded-xl text-xs font-bold bg-[#FF6B00] hover:bg-[#EA580C] text-white shadow-sm"
            >
              Créer et Sélectionner
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
