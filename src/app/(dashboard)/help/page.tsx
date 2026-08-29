'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  FileText,
  CreditCard,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FAQ_ITEMS = [
  {
    question: 'Comment créer une facture avec paiement par tranches (Acompte 30% / Solde 70%) ?',
    answer:
      'Dans le studio de création (/invoices/new), sélectionnez le type "Échelonné (Split)" en haut du formulaire. Vous pourrez alors choisir le modèle "Acompte 30% / Solde 70%" ou "30% / 40% / 30%". Les montants exacts et dates d’échéances seront calculés automatiquement.',
  },
  {
    question: 'Comment partager une facture directement sur WhatsApp ?',
    answer:
      'Sur la page de détail de votre facture (/invoices/[id]), cliquez sur le bouton vert "Partager sur WhatsApp". Un message formaté avec le montant total, le solde restant et vos coordonnées de paiement Wave / Orange Money sera automatiquement préparé pour votre client.',
  },
  {
    question: 'Comment fonctionne le calcul de la TVA 18% UEMOA ?',
    answer:
      'Izi Factures intègre un moteur fiscal calculé au centime près en points de base (1800 bps). Vous pouvez activer ou désactiver la TVA globalement ou sur chaque prestation. Si une opération est exonérée, vous pouvez spécifier la mention légale CGI obligatoire.',
  },
  {
    question: 'Comment enregistrer un paiement reçu par Wave ou Orange Money ?',
    answer:
      'Cliquez sur le bouton "Encaisser" en face de la facture concernée (sur le Tableau de bord ou la liste des factures). Choisissez le mode "Wave" ou "Orange Money", indiquez la référence de transaction (ex: WV-849204-DKR) et validez.',
  },
  {
    question: 'Que faire si une facture a été émise par erreur ?',
    answer:
      'Pour respecter la conformité fiscale, une facture émise ne doit pas être supprimée mais annulée. Sur la fiche de la facture, cliquez sur "Annuler la Facture", indiquez le motif d’annulation obligatoire. Le solde sera remis à 0 FCFA et la facture portera la mention officielle ANNULÉE.',
  },
];

export default function HelpPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [ticketSubject, setTicketSubject] = useState('Facturation & Échéanciers');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSenderName, setTicketSenderName] = useState('');
  const [ticketSenderEmail, setTicketSenderEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSentSuccess, setIsSentSuccess] = useState(false);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketMessage.trim()) return;

    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIsSentSuccess(true);
      setTicketMessage('');
    }, 1000);
  };

  return (
    <div className="space-y-8 w-full">
      {/* 🌟 Bannière Centre d'Aide Orange • Blanc • Vert */}
      <div className="bg-gradient-to-r from-orange-500/15 via-amber-500/5 to-emerald-500/10 border border-orange-300/40 dark:border-orange-800/40 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-card">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-[#0E7A55] dark:text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-300/60 shadow-2xs">
            <Sparkles className="w-4 h-4 fill-current text-amber-500" />
            Support Client & Assistance Dédiée
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-foreground font-display tracking-tight">
            Centre d'Aide & Support <span className="text-[#FF6B00]">Izi Factures</span> 🎧
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Une question sur vos factures, la TVA 18%, les encaissements Wave / Orange Money ou besoin d'aide pour configurer votre entreprise ? Notre équipe d'assistance est à vos côtés.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <a
            href="https://wa.me/221778492040?text=Bonjour%20l'équipe%20Izi%20Factures,%20j'ai%20besoin%20d'assistance%20concernant%20mon%20compte."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#0E7A55] hover:bg-[#0c6b4b] text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
          >
            <MessageSquare className="w-4 h-4" />
            Support WhatsApp Direct
            <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </a>
        </div>
      </div>

      {/* 3 Canaux de Contact Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. WhatsApp */}
        <a
          href="https://wa.me/221778492040?text=Bonjour%20l'équipe%20Izi%20Factures,%20j'ai%20besoin%20d'aide."
          target="_blank"
          rel="noopener noreferrer"
          className="bg-card border border-border hover:border-[#0E7A55]/50 p-6 rounded-2xl shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-[#0E7A55] flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground font-display">Assistance WhatsApp</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Échangez directement avec un conseiller technique en temps réel sur WhatsApp.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs font-bold text-[#0E7A55]">
            <span>+221 77 849 20 40</span>
            <span className="bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full text-[10px]">En ligne</span>
          </div>
        </a>

        {/* 2. Téléphone */}
        <a
          href="tel:+221778492040"
          className="bg-card border border-border hover:border-[#FF6B00]/50 p-6 rounded-2xl shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#FF6B00] flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 transition-transform">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground font-display">Appel Téléphonique</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Joignez notre service client par appel vocal du Lundi au Samedi (8h - 20h GMT).
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs font-bold text-[#FF6B00]">
            <span>+221 77 849 20 40</span>
            <span className="text-muted-foreground text-[11px] font-normal">Gratuit</span>
          </div>
        </a>

        {/* 3. Email */}
        <a
          href="mailto:support@izifactures.sn"
          className="bg-card border border-border hover:border-indigo-500/50 p-6 rounded-2xl shadow-card hover:shadow-elevated transition-all flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground font-display">Support par Email</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pour toute question administrative ou demande de partenariat commercial.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs font-bold text-indigo-600">
            <span>support@izifactures.sn</span>
            <span className="text-muted-foreground text-[11px] font-normal">24h/24</span>
          </div>
        </a>
      </div>

      {/* Grille Formulaire de Message & FAQ Interactive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulaire de Contact Direct (5 cols) */}
        <div className="lg:col-span-5 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-[#FF6B00]">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground font-display">Envoyer un Message</h3>
              <p className="text-xs text-muted-foreground">Nous vous répondrons dans les plus brefs délais</p>
            </div>
          </div>

          {isSentSuccess ? (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-[#0E7A55] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-foreground">Message envoyé avec succès !</h4>
              <p className="text-xs text-muted-foreground">
                Votre demande a bien été transmise à notre équipe technique. Nous vous recontacterons très rapidement.
              </p>
              <Button
                onClick={() => setIsSentSuccess(false)}
                className="text-xs font-bold bg-[#0E7A55] hover:bg-[#0c6b4b] text-white mt-2"
              >
                Envoyer un autre message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Sujet de votre demande *
                </label>
                <select
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B00] shadow-subtle font-medium"
                >
                  <option value="Facturation & Échéanciers">Facturation & Échéanciers</option>
                  <option value="Paiements Wave / Orange Money">Paiements Wave / Orange Money</option>
                  <option value="TVA 18% & Paramètres Fiscaux">TVA 18% & Paramètres Fiscaux</option>
                  <option value="Gestion des Clients & Fournisseurs">Gestion des Clients & Fournisseurs</option>
                  <option value="Autre demande">Autre demande</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Votre Nom *"
                  required
                  placeholder="ex: Amadou Diallo"
                  value={ticketSenderName}
                  onChange={(e) => setTicketSenderName(e.target.value)}
                  className="rounded-xl"
                />
                <Input
                  type="email"
                  label="Votre Email *"
                  required
                  placeholder="contact@entreprise.sn"
                  value={ticketSenderEmail}
                  onChange={(e) => setTicketSenderEmail(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Détail de votre message ou problème rencontré *
                </label>
                <textarea
                  required
                  rows={4}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Décrivez précisément votre besoin pour que nous puissions vous assister efficacement..."
                  className="w-full rounded-xl border border-input bg-card p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#FF6B00] shadow-subtle resize-none"
                />
              </div>

              <Button
                type="submit"
                isLoading={isSending}
                className="w-full h-11 bg-[#FF6B00] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl shadow-md"
              >
                <Send className="w-4 h-4 mr-2" /> Envoyer la Demande
              </Button>
            </form>
          )}
        </div>

        {/* FAQ Interactive Accordéon (7 cols) */}
        <div className="lg:col-span-7 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-[#0E7A55]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground font-display">Foire Aux Questions (FAQ)</h3>
              <p className="text-xs text-muted-foreground">Réponses instantanées aux interrogations fréquentes</p>
            </div>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`border rounded-2xl transition-all overflow-hidden ${
                    isOpen ? 'border-[#FF6B00]/40 bg-orange-500/5' : 'border-border bg-card'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-foreground cursor-pointer"
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-[#FF6B00]' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/50 animate-in fade-in-50">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
