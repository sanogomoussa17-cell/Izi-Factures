import React from 'react';
import { Invoice, Organization, Client } from '@/core/domain/types';
import { formatMoney, formatTaxRate } from '@/core/domain/money';

export interface InvoicePreviewProps {
  invoice: Partial<Invoice>;
  organization: Organization;
  client?: Client | null;
}

export const InvoicePreview = React.forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ invoice, organization, client }, ref) => {
    const currency = invoice.currency || organization.currency || 'XOF';
    const items = invoice.items || [];
    const subtotal = invoice.subtotalAmount || 0;
    const tax = invoice.taxAmount || 0;
    const discount = invoice.discountAmount || 0;
    const total = invoice.totalAmount || 0;

    return (
      <div
        ref={ref}
        id="invoice-document-sheet"
        className="invoice-sheet w-full max-w-[760px] mx-auto bg-white text-[#141829] p-8 sm:p-12 rounded-lg border border-slate-200/80 font-sans select-text shadow-paper"
      >
        {/* Cancellation Notice Banner */}
        {invoice.status === 'CANCELLED' && (
          <div className="mb-6 p-4 rounded-lg bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs flex items-start gap-3">
            <div className="px-2 py-0.5 bg-[#B22C22] text-white text-[10px] font-black uppercase rounded-xs tracking-wider shrink-0 mt-0.5">
              ANNULÉE
            </div>
            <div>
              <div className="font-bold text-sm text-[#B22C22]">Document Annulé & Non Recouvrable</div>
              <div className="text-slate-700 mt-0.5">
                <strong>Motif :</strong> {invoice.cancellationReason || 'Annulation administrative'}
              </div>
              {invoice.cancelledAt && (
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Date d’effet : {new Date(invoice.cancelledAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Header with Brand & Invoice Label */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-8 relative">
          {invoice.status === 'CANCELLED' && (
            <div className="absolute right-36 top-6 -rotate-12 border-4 border-[#B22C22]/40 text-[#B22C22]/40 text-2xl font-black px-4 py-1 uppercase tracking-widest pointer-events-none select-none">
              ANNULÉE
            </div>
          )}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">FACTURE</h1>
            <div className="mt-1 font-mono text-sm text-slate-500 font-medium">
              N° {invoice.invoiceNumber || 'FAC-2026-XXXX'}
            </div>
            {invoice.paymentStructure === 'SPLIT' && (
              <span className="inline-block mt-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm bg-blue-50 text-primary border border-blue-200">
                Paiement Échelonné
              </span>
            )}
            {invoice.status === 'CANCELLED' && (
              <span className="inline-block mt-2 ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm bg-rose-100 text-[#B22C22] border border-rose-300">
                Statut : Annulée
              </span>
            )}
          </div>

          {/* Logo Badge (Faithful to Official Brand design) */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-xs flex items-center justify-center bg-white border border-slate-200">
              <img
                src={organization.logoUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnutGX6vR0ugy7nbbNfbLAy-l5Fk_VgRmXVQ0kNinsbtIvjWjgM1YvQOD7-5WSOoyRGr63azA6c7PbmFx0ANuD-bsiVzSeb3UNINbbVLnUcW46MCCgLate2W3ydZf9WC_m_QRqd5mNGDqpN6mSYRAo8RcYS8w7yiAmuRd7kO2UL5TgZjH6GFpcXChafzk49bm7L6AOkQtNqeVpjGDvVtKvGBJQwlzmwUnKnH2D7wNhDvxzSRncKOY'}
                alt={organization.name}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerHTML = `<div class="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#0E7A55] text-white font-black text-base flex items-center justify-center">iZ</div>`;
                  }
                }}
              />
            </div>
            <div className="text-right hidden sm:block">
              <div className="font-bold text-sm text-slate-900">{organization.name}</div>
              <div className="text-xs text-slate-500">RCCM / IFU: {organization.taxIdNumber}</div>
            </div>
          </div>
        </div>

        {/* Billed By & Billed To Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 my-8 text-xs leading-relaxed">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Émetteur (Billed By):
            </span>
            <div className="font-bold text-slate-900 text-sm">{organization.name}</div>
            <div className="text-slate-600">{organization.email}</div>
            <div className="text-slate-600">{organization.phone}</div>
            <div className="text-slate-600">{organization.address}, {organization.city} ({organization.country})</div>
            {organization.waveNumber && (
              <div className="text-primary font-medium mt-1">Wave / OM : {organization.waveNumber}</div>
            )}
          </div>

          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Destinataire (Billed To):
            </span>
            <div className="font-bold text-slate-900 text-sm">
              {client?.companyName ? `${client.companyName} (${client.name})` : client?.name || 'Client à renseigner'}
            </div>
            <div className="text-slate-600">{client?.email || 'email@client.com'}</div>
            <div className="text-slate-600">{client?.phone || '+221 -- -- --'}</div>
            <div className="text-slate-600">{client?.address || 'Adresse du client'}</div>
            {client?.taxIdNumber && (
              <div className="text-slate-500 mt-1">N° Fiscal : {client.taxIdNumber}</div>
            )}
          </div>
        </div>

        {/* Dates Bar */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 rounded-md p-4 mb-8 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block">Date d’Émission :</span>
            <span className="font-bold text-slate-800 font-mono text-sm mt-0.5 block">
              {invoice.issueDate || new Date().toISOString().slice(0, 10)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block">Date d’Échéance :</span>
            <span className="font-bold text-slate-800 font-mono text-sm mt-0.5 block">
              {invoice.dueDate || new Date().toISOString().slice(0, 10)}
            </span>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Prestations / Services</h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-2.5 pr-4">Description</th>
                <th className="py-2.5 px-3 text-center">Qté</th>
                <th className="py-2.5 px-3 text-right">TVA</th>
                <th className="py-2.5 pl-4 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                    Aucun article ajouté pour le moment.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-slate-800 text-sm">{item.description || 'Prestation'}</div>
                      <div className="text-slate-400 text-[11px] font-mono">
                        {formatMoney(item.unitPrice, currency)} / unité
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-medium text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                      {invoice.isTaxEnabled && !invoice.isTaxExempt && !item.isTaxExempt
                        ? formatTaxRate(item.taxRateBps)
                        : '0%'}
                    </td>
                    <td className="py-3.5 pl-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatMoney(item.totalAmount || item.quantity * item.unitPrice, currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t border-slate-200 gap-6">
          <div className="text-xs text-slate-500 max-w-[320px]">
            {invoice.isTaxExempt ? (
              <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-amber-800 text-[11px]">
                <strong>Exonération de TVA :</strong> {invoice.taxExemptionReason || 'Régime d’exonération légale.'}
              </div>
            ) : (
              <div>TVA 18% calculée conformément aux normes UEMOA / fiscales en vigueur.</div>
            )}
            
            {/* Echéancier preview if split */}
            {invoice.schedules && invoice.schedules.length > 1 && (
              <div className="mt-3 p-3 bg-slate-50 rounded-md border border-slate-200/80">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700 block mb-2">
                  Calendrier des versements :
                </span>
                <ul className="space-y-1 font-mono text-[11px]">
                  {(invoice.schedules || []).map((s, i) => (
                    <li key={s.id || i} className="flex justify-between text-slate-600">
                      <span>• {s.label} ({s.dueDate}) :</span>
                      <span className="font-semibold text-slate-900">{formatMoney(s.expectedAmount, currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="w-full sm:w-[280px] space-y-2 text-xs">
            <div className="flex justify-between py-1 text-slate-600">
              <span>Sous-total HT :</span>
              <span className="font-mono font-medium text-slate-800">{formatMoney(subtotal, currency)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between py-1 text-emerald-600 font-medium">
                <span>Remise commerciale :</span>
                <span className="font-mono">- {formatMoney(discount, currency)}</span>
              </div>
            )}

            {invoice.isTaxEnabled && !invoice.isTaxExempt && (
              <div className="flex justify-between py-1 text-slate-600">
                <span>TVA (18%) :</span>
                <span className="font-mono font-medium text-slate-800">{formatMoney(tax, currency)}</span>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t-2 border-slate-900 text-sm font-bold text-slate-900">
              <span className="font-display">Total TTC à Payer :</span>
              <span className="font-mono text-base">{formatMoney(total, currency)}</span>
            </div>

            {invoice.paidAmount !== undefined && invoice.paidAmount > 0 && (
              <div className="flex justify-between pt-1 text-xs text-[#0E7A55] font-semibold">
                <span>Montant Encaissé :</span>
                <span className="font-mono">{formatMoney(invoice.paidAmount, currency)}</span>
              </div>
            )}

            {invoice.remainingBalance !== undefined && invoice.remainingBalance > 0 && (
              <div className="flex justify-between pt-1 text-xs text-[#B22C22] font-semibold">
                <span>Solde Restant Dû :</span>
                <span className="font-mono">{formatMoney(invoice.remainingBalance, currency)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Terms & Legal Notice */}
        <div className="mt-12 pt-6 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
          <p className="font-medium text-slate-600">
            {invoice.termsAndConditions || 'Note: Les paiements en retard entraîneront des pénalités légales au taux annuel de 10%, calculées au prorata temporis.'}
          </p>
          <div className="flex flex-wrap justify-between pt-2">
            <span>{organization.name} — Siège : {organization.city}</span>
            <span>Règlement par Wave / OM / Virement bancaire</span>
          </div>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = 'InvoicePreview';
