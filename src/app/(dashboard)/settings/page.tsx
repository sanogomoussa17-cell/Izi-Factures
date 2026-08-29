'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Landmark, Smartphone, Building, Check, Save, Sparkles } from 'lucide-react';
import { Organization, CurrencyCode } from '@/core/domain/types';
import { repository } from '@/core/adapters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await repository.getOrganization();
      setOrg(data);
      setIsLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    try {
      await repository.updateOrganization(org);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !org) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground font-display tracking-tight">
          Paramètres & Configuration Fiscale
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Gérez l’assujettissement TVA (18%), vos numéros de compte Wave / Orange Money et mentions légales.
        </p>
      </div>

      {isSaved && (
        <div className="p-4 rounded-lg bg-emerald-50 text-[#0E7A55] border border-emerald-200 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <Check className="w-4 h-4" /> Paramètres mis à jour avec succès.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Details */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Building className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground font-display">Identité de l’Entreprise</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nom Commercial / Raison Sociale *"
              value={org.name}
              onChange={(e) => setOrg({ ...org, name: e.target.value })}
              required
            />
            <Input
              label="N° Fiscal (NINEA / IFU / RCCM) *"
              value={org.taxIdNumber}
              onChange={(e) => setOrg({ ...org, taxIdNumber: e.target.value })}
              required
            />
            <Input
              label="Email de Facturation"
              type="email"
              value={org.email}
              onChange={(e) => setOrg({ ...org, email: e.target.value })}
              required
            />
            <Input
              label="Téléphone Officiel"
              value={org.phone}
              onChange={(e) => setOrg({ ...org, phone: e.target.value })}
              required
            />
            <Input
              label="Adresse du Siège"
              value={org.address}
              onChange={(e) => setOrg({ ...org, address: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Ville"
                value={org.city}
                onChange={(e) => setOrg({ ...org, city: e.target.value })}
                required
              />
              <Input
                label="Pays"
                value={org.country}
                onChange={(e) => setOrg({ ...org, country: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* TVA & Fiscal Settings */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground font-display">Régime Fiscal & TVA</h2>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border">
            <div>
              <div className="text-xs font-bold text-foreground">Entreprise Assujettie à la TVA</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Active le calcul automatique du taux normal de TVA de 18% (UEMOA / CEDEAO) par défaut.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={org.isTaxEnabled}
                onChange={(e) => setOrg({ ...org, isTaxEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Devise Principale
              </label>
              <select
                value={org.currency}
                onChange={(e) => setOrg({ ...org, currency: e.target.value as CurrencyCode })}
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-subtle font-medium"
              >
                <option value="XOF">XOF - Franc CFA (UEMOA - Sénégal, CI, Bénin...)</option>
                <option value="XAF">XAF - Franc CFA (CEMAC - Cameroun, Gabon...)</option>
                <option value="GNF">GNF - Franc Guinéen</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="USD">USD - Dollar US ($)</option>
              </select>
            </div>

            <Input
              label="Taux de TVA Standard (%)"
              type="number"
              value={org.defaultTaxRateBps / 100}
              onChange={(e) => setOrg({ ...org, defaultTaxRateBps: (parseFloat(e.target.value) || 18) * 100 })}
              disabled={!org.isTaxEnabled}
            />
          </div>
        </div>

        {/* African Mobile Money & Banking Channels */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Smartphone className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground font-display">Canaux d’Encaissement Direct (Wave / OM / Banque)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Numéro Wave Business / Direct"
              value={org.waveNumber || ''}
              onChange={(e) => setOrg({ ...org, waveNumber: e.target.value })}
              placeholder="ex: +221 77 845 20 10"
            />
            <Input
              label="Numéro Orange Money / MoMo"
              value={org.orangeMoneyNumber || ''}
              onChange={(e) => setOrg({ ...org, orangeMoneyNumber: e.target.value })}
              placeholder="ex: +225 07 48 92 10 33"
            />
          </div>

          <Input
            label="Coordonnées Bancaires (IBAN / RIB pour factures)"
            value={org.bankDetails || ''}
            onChange={(e) => setOrg({ ...org, bankDetails: e.target.value })}
            placeholder="ex: SGBS Dakar - SN08 0100 1200 4829 1000 24"
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="lg" className="text-sm">
            <Save className="w-4 h-4 mr-2" /> Enregistrer les Paramètres
          </Button>
        </div>
      </form>
    </div>
  );
}
