'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Send,
  MessageCircle,
  CheckCircle2,
  TrendingUp,
  Wallet,
  Clock,
  Shield,
  Layers,
  FileText,
  Smartphone,
  CreditCard,
  Menu,
  X,
  ChevronRight,
  DollarSign,
  Building2,
  Users,
  Check,
  Zap,
  Globe,
  LayoutDashboard,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userFullName, setUserFullName] = useState<string>('');
  const [userCompanyName, setUserCompanyName] = useState<string>('');
  const [paymentSentToast, setPaymentSentToast] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'business'>('pro');

  useEffect(() => {
    async function checkAuth() {
      // 1. Vérifier Supabase Auth
      try {
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            setIsAuthenticated(true);
            const meta = data.user.user_metadata || {};
            if (meta.full_name) setUserFullName(meta.full_name);
            if (meta.company_name) setUserCompanyName(meta.company_name);
            return;
          }
        }
      } catch (e) {}

      // 2. Vérifier Session locale
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('izifactures_session') : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.email || parsed.id) {
            setIsAuthenticated(true);
            if (parsed.name) setUserFullName(parsed.name);
            if (parsed.companyName) setUserCompanyName(parsed.companyName);
          }
        }
      } catch (e) {}
    }

    checkAuth();
  }, []);

  const handleSimulatePaymentLink = () => {
    setPaymentSentToast(true);
    setTimeout(() => {
      setPaymentSentToast(false);
    }, 4000);
  };

  return (
    <div className="bg-[#f8f9fa] dark:bg-[#0f141a] text-[#191c1d] dark:text-[#f0f1f2] font-sans min-h-screen flex flex-col selection:bg-orange-500/20 selection:text-[#FF6B00]">
      {/* ========================================================================= */}
      {/* 📱 TOP APP BAR (MOBILE)                                                   */}
      {/* ========================================================================= */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 sm:px-6 h-16 bg-[#ffffff]/95 dark:bg-[#131922]/95 backdrop-blur-md border-b border-[#e1e3e4] dark:border-[#222c3a] shadow-xs md:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B00] via-[#FF8A00] to-[#0E7A55] flex items-center justify-center text-white font-black text-sm shadow-sm">
            iZ
          </div>
          <span className="text-lg font-black font-display tracking-tight text-[#FF6B00]">
            Izi<span className="text-[#0E7A55]">Factures</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Link
              href="/dashboard"
              className="text-xs font-bold bg-orange-50 dark:bg-orange-950/60 text-[#FF6B00] border border-orange-200 dark:border-orange-900/60 px-3 py-1.5 rounded-full"
            >
              Dashboard
            </Link>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-foreground p-2 rounded-lg hover:bg-muted/80 transition-colors"
            aria-label="Ouvrir le menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-black/50 backdrop-blur-xs md:hidden flex flex-col justify-between p-6 bg-[#ffffff] dark:bg-[#131922] border-b border-border animate-in fade-in duration-200">
          <div className="flex flex-col gap-4 text-base font-semibold">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-4 rounded-xl bg-orange-500/10 text-[#FF6B00] font-bold"
            >
              Accueil
            </Link>
            <a
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-4 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              Fonctionnalités
            </a>
            <a
              href="#demo"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-4 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              Tableau de Bord
            </a>
            <a
              href="#pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-4 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              Tarifs
            </a>
          </div>

          <div className="flex flex-col gap-3 pt-6 border-t border-border">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 text-center rounded-xl font-bold bg-[#FF6B00] text-white shadow-md flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" /> Accéder à mon Espace
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 text-center rounded-xl font-bold border border-[#006d40] text-[#006d40] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                >
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 text-center rounded-xl font-bold bg-[#FF6B00] text-white shadow-md hover:bg-[#ea580c] transition-colors"
                >
                  Essayer Gratuitement
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💻 TOP NAVIGATION (DESKTOP)                                              */}
      {/* ========================================================================= */}
      <nav className="hidden md:flex items-center justify-between px-8 lg:px-24 py-4 bg-[#ffffff]/90 dark:bg-[#131922]/90 backdrop-blur-md sticky top-0 z-50 border-b border-[#e1e3e4] dark:border-[#222c3a] transition-all">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6B00] via-[#FF8A00] to-[#0E7A55] flex items-center justify-center text-white font-black text-lg shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            iZ
          </div>
          <div>
            <span className="text-2xl font-black font-display tracking-tight text-[#FF6B00]">
              Izi<span className="text-[#0E7A55]">Factures</span>
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Facturation UEMOA
            </span>
          </div>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-8 text-sm font-semibold">
          <Link
            href="/"
            className="text-[#FF6B00] font-bold bg-orange-500/10 dark:bg-orange-950/50 px-4 py-2 rounded-full transition-colors"
          >
            Accueil
          </Link>
          <a
            href="#features"
            className="text-muted-foreground hover:text-[#FF6B00] transition-colors"
          >
            Fonctionnalités
          </a>
          <a
            href="#demo"
            className="text-muted-foreground hover:text-[#FF6B00] transition-colors"
          >
            Tableau de Bord
          </a>
          <a
            href="#pricing"
            className="text-muted-foreground hover:text-[#FF6B00] transition-colors"
          >
            Tarifs
          </a>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3.5">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-bold bg-[#FF6B00] hover:bg-[#ea580c] text-white px-5 py-2.5 rounded-full shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <LayoutDashboard className="w-4 h-4" /> Mon Tableau de bord
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-bold text-[#006d40] dark:text-emerald-400 border border-[#006d40] dark:border-emerald-500/50 px-5 py-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all"
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                className="text-sm font-bold text-white bg-[#FF6B00] hover:bg-[#ea580c] px-6 py-2.5 rounded-full shadow-md shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all btn-shimmer"
              >
                Essayer Gratuitement
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 🚀 MAIN CONTENT CANVAS                                                    */}
      {/* ========================================================================= */}
      <main className="flex-grow w-full pt-16 md:pt-0 pb-20 md:pb-0">
        {/* ======================================================================= */}
        {/* 🌟 HERO SECTION                                                         */}
        {/* ======================================================================= */}
        <section className="px-4 sm:px-8 lg:px-24 pt-8 sm:pt-12 md:pt-16 pb-12 sm:pb-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative overflow-hidden">
          {/* Subtle Background Glows */}
          <div className="absolute top-10 left-10 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Left Column: Copy & CTAs */}
          <div className="flex-1 flex flex-col gap-6 text-center lg:text-left z-10 relative">
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 text-[#006d40] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-4 py-1.5 rounded-full self-center lg:self-start w-fit text-xs sm:text-sm font-bold shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-500 fill-current" />
              <span>La référence de facturation pour indépendants & PME</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black font-display tracking-tight text-foreground leading-[1.15] max-w-2xl">
              Facturez en Francs CFA, encaissez via{' '}
              <span className="text-[#0055ff] inline-block hover:scale-105 transition-transform">Wave</span> &{' '}
              <span className="text-[#ff7900] inline-block hover:scale-105 transition-transform">Orange Money</span>{' '}
              en toute sérénité.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Conçu pour les entrepreneurs et PME à Dakar, Abidjan, Cotonou, Bamako, Lomé et Ouagadougou. Simplifiez votre gestion financière, gérez la TVA UEMOA (18%) et accélérez vos encaissements.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-2">
              <Link
                href="/register"
                className="btn-shimmer text-white text-base font-bold px-8 py-4 rounded-xl shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 min-h-[52px] animate-pulse-glow"
              >
                <span>Essayer Gratuitement</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#demo"
                className="bg-card hover:bg-muted/80 text-foreground border border-border text-base font-bold px-7 py-4 rounded-xl shadow-2xs hover:scale-[1.02] transition-all flex items-center justify-center gap-2 min-h-[52px]"
              >
                Voir le Tableau de Bord
              </a>
            </div>

            {/* Trust Proof Metrics */}
            <div className="flex items-center justify-center lg:justify-start gap-8 mt-6 border-t border-border pt-6">
              <div className="flex flex-col">
                <span className="text-2xl font-black font-mono text-foreground">10k+</span>
                <span className="text-xs font-semibold text-muted-foreground">Factures payées</span>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="flex flex-col">
                <span className="text-2xl font-black font-mono text-foreground">98%</span>
                <span className="text-xs font-semibold text-muted-foreground">Clients satisfaits</span>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="flex flex-col">
                <span className="text-2xl font-black font-mono text-[#0E7A55]">0 FCFA</span>
                <span className="text-xs font-semibold text-muted-foreground">Erreur d'arrondi TVA</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Smartphone Mockup */}
          <div className="flex-1 relative w-full max-w-md mt-6 lg:mt-0 flex justify-center">
            {/* Toast Feedback */}
            {paymentSentToast && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 bg-[#0E7A55] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-in slide-in-from-top duration-300">
                <CheckCircle2 className="w-4 h-4" /> Lien Wave / OM copié & prêt à envoyer !
              </div>
            )}

            {/* Smartphone Shell */}
            <div className="relative w-full aspect-[9/16] max-w-[320px] bg-card rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-4 border-slate-800 dark:border-slate-700 overflow-hidden flex flex-col">
              {/* Speaker / Camera Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 dark:bg-slate-700 rounded-full z-20" />

              {/* App Header Inside Phone */}
              <div className="pt-7 px-4 pb-3 border-b border-border flex justify-between items-center bg-muted/40">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]" />
                  <span className="text-xs font-black font-mono">Facture #FAC-2026-089</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  UEMOA
                </span>
              </div>

              {/* App Body Inside Phone */}
              <div className="p-4 flex-grow bg-background flex flex-col gap-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Client Destinataire</p>
                    <p className="font-bold text-foreground text-sm">Agence Digitale Dakar</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Total TTC</p>
                    <p className="font-mono font-extrabold text-[#FF6B00] text-base">1 450 000 F</p>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="bg-card rounded-xl border border-border p-3 shadow-2xs space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-border/60">
                    <span className="font-medium text-foreground">Refonte Site E-Commerce</span>
                    <span className="font-mono font-bold">1 000 000</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="font-medium text-foreground">Maintenance Annuelle Cloud</span>
                    <span className="font-mono font-bold">450 000</span>
                  </div>
                </div>

                {/* Payment Channels Supported */}
                <div className="bg-muted/30 p-2.5 rounded-xl border border-border space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Canaux d'encaissement</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 font-bold text-[10px]">Wave</span>
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 font-bold text-[10px]">Orange Money</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">Virement</span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="mt-auto">
                  <div className="bg-orange-50 dark:bg-orange-950/40 rounded-xl p-2.5 flex justify-between items-center border border-orange-200 dark:border-orange-900/60">
                    <span className="text-xs font-semibold text-orange-900 dark:text-orange-200">Statut Recouvrement</span>
                    <span className="bg-[#ffe8cc] text-[#cc5500] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      Acompte 30% Reçu
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick-Pay CTA in Phone */}
              <div className="p-3 bg-muted/40 border-t border-border">
                <button
                  type="button"
                  onClick={handleSimulatePaymentLink}
                  className="w-full bg-[#FF6B00] hover:bg-[#ea580c] active:scale-95 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer le lien de paiement</span>
                </button>
              </div>
            </div>

            {/* Floating WhatsApp Bubble */}
            <div className="absolute -right-2 sm:-right-4 top-1/4 bg-card p-3.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.12)] border border-border flex items-center gap-3 animate-float z-30">
              <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-sm">
                <MessageCircle className="w-5 h-5 fill-current" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold">Partage en 1 clic</p>
                <p className="text-xs font-extrabold text-foreground">WhatsApp Direct</p>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================================= */}
        {/* 📊 SECTION TABLEAU DE BORD EN DIRECT & METRIQUES (#demo)                */}
        {/* ======================================================================= */}
        <section id="demo" className="px-4 sm:px-8 lg:px-24 py-16 bg-[#ffffff] dark:bg-[#131922] border-y border-border relative z-10">
          <div className="max-w-6xl mx-auto flex flex-col gap-10">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#FF6B00] text-xs font-bold uppercase tracking-wider mb-2">
                <LayoutDashboard className="w-3.5 h-3.5" /> Démonstration Interactive
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-display text-foreground mb-2">
                Suivez vos finances en temps réel
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
                Un tableau de bord complet pour piloter votre activité, maîtriser votre trésorerie et éliminer les impayés.
              </p>
            </div>

            {/* Realtime KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="bg-card p-6 rounded-2xl border border-border shadow-xs flex flex-col gap-3 hover:border-[#0E7A55]/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-bold uppercase tracking-wider text-xs">Total Encaissé</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-[#0E7A55]">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-foreground">
                  12 450 000 <span className="text-sm font-normal text-muted-foreground font-sans">FCFA</span>
                </div>
                <div className="text-[11px] font-bold text-[#0E7A55] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 82% du chiffre d'affaires recouvré
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-card p-6 rounded-2xl border border-border shadow-xs flex flex-col gap-3 hover:border-amber-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-bold uppercase tracking-wider text-xs">Factures en Attente</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-300">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-foreground">
                  3 200 000 <span className="text-sm font-normal text-muted-foreground font-sans">FCFA</span>
                </div>
                <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  3 factures sous échéancier de paiement
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-card p-6 rounded-2xl border border-border shadow-xs flex flex-col gap-3 hover:border-[#FF6B00]/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-bold uppercase tracking-wider text-xs">Croissance Mensuelle</span>
                  <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-[#FF6B00]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-foreground flex items-baseline gap-2">
                  +15%
                  <span className="text-xs font-normal text-[#0E7A55] font-sans flex items-center gap-0.5">
                    ↑ vs mois précédent
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-muted-foreground">
                  Trésorerie saine & encaissements stables
                </div>
              </div>
            </div>

            {/* Chart and Table Preview */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Chart Area */}
              <div className="flex-1 bg-card p-6 rounded-2xl border border-border shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-foreground font-display">Évolution des Revenus (FCFA)</h3>
                  <span className="text-xs font-bold text-[#0E7A55] bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
                    S1 2026
                  </span>
                </div>

                <div className="relative w-full h-56 bg-muted/20 rounded-xl flex items-end px-4 pt-8 pb-6 gap-2">
                  <svg className="w-full h-full overflow-visible absolute top-0 left-0 pt-8 pb-6 px-4" preserveAspectRatio="none" viewBox="0 0 100 40">
                    <defs>
                      <linearGradient id="chart-grad-landing" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,35 C10,30 20,38 30,25 C40,12 50,28 60,15 C70,2 80,10 100,5 L100,40 L0,40 Z" fill="url(#chart-grad-landing)" />
                    <path d="M0,35 C10,30 20,38 30,25 C40,12 50,28 60,15 C70,2 80,10 100,5" fill="none" stroke="#FF6B00" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                    <circle cx="30" cy="25" fill="#ffffff" r="1.8" stroke="#FF6B00" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                    <circle cx="60" cy="15" fill="#ffffff" r="1.8" stroke="#FF6B00" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                    <circle cx="100" cy="5" fill="#ffffff" r="1.8" stroke="#FF6B00" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <div className="absolute bottom-2 left-4 right-4 flex justify-between text-[11px] text-muted-foreground font-mono font-medium">
                    <span>Jan</span>
                    <span>Fév</span>
                    <span>Mar</span>
                    <span>Avr</span>
                    <span>Mai</span>
                    <span>Juin</span>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="flex-[1.4] bg-card p-6 rounded-2xl border border-border shadow-xs flex flex-col gap-4 overflow-x-auto">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-foreground font-display">Transactions Récentes</h3>
                  <Link href="/register" className="text-[#FF6B00] text-xs font-bold hover:underline">
                    Explorer la Démo →
                  </Link>
                </div>
                <div className="min-w-[450px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                        <th className="pb-3">Client</th>
                        <th className="pb-3">Montant</th>
                        <th className="pb-3">Date</th>
                        <th className="pb-3 text-right">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 font-semibold text-foreground flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#0E7A55] flex items-center justify-center font-black">
                            S
                          </div>
                          Startup Côte d'Ivoire
                        </td>
                        <td className="py-3 font-mono font-bold">850 000 FCFA</td>
                        <td className="py-3 text-muted-foreground">12 Oct 2026</td>
                        <td className="py-3 text-right">
                          <span className="bg-emerald-100 text-[#0E7A55] dark:bg-emerald-950 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            Payé Wave
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 font-semibold text-foreground flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-orange-100 text-[#FF6B00] flex items-center justify-center font-black">
                            C
                          </div>
                          Consulting Dakar
                        </td>
                        <td className="py-3 font-mono font-bold">1 200 000 FCFA</td>
                        <td className="py-3 text-muted-foreground">10 Oct 2026</td>
                        <td className="py-3 text-right">
                          <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            En attente
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 font-semibold text-foreground flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#0E7A55] flex items-center justify-center font-black">
                            B
                          </div>
                          Boutique Sahel
                        </td>
                        <td className="py-3 font-mono font-bold">450 000 FCFA</td>
                        <td className="py-3 text-muted-foreground">08 Oct 2026</td>
                        <td className="py-3 text-right">
                          <span className="bg-emerald-100 text-[#0E7A55] dark:bg-emerald-950 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            Payé OM
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 font-semibold text-foreground flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                            A
                          </div>
                          Agence Marketing Bénin
                        </td>
                        <td className="py-3 font-mono font-bold">2 100 000 FCFA</td>
                        <td className="py-3 text-muted-foreground">05 Oct 2026</td>
                        <td className="py-3 text-right">
                          <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            En attente
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================================= */}
        {/* ⚡ SECTION FONCTIONNALITÉS CLÉS (#features)                             */}
        {/* ======================================================================= */}
        <section id="features" className="px-4 sm:px-8 lg:px-24 py-20 bg-[#f8f9fa] dark:bg-[#0f141a]">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#0E7A55] text-xs font-bold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" /> Avantages Exclusifs Afrique
              </div>
              <h2 className="text-3xl sm:text-4xl font-black font-display text-foreground">
                Tout ce dont vous avez besoin pour vos factures
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Une suite complète conçue pour lever les contraintes de paiement et de fiscalité propres aux marchés d'Afrique de l'Ouest.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-card p-6 rounded-2xl border border-border shadow-xs hover:border-[#FF6B00]/50 hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#FF6B00] flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-foreground font-display">TVA UEMOA 18% & Exonérations</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Calculs automatiques stricts sans arrondis flottants. Prise en charge des exonérations légales obligatoires (Art. 35 CGI).
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-card p-6 rounded-2xl border border-border shadow-xs hover:border-[#0E7A55]/50 hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-[#0E7A55] flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-foreground font-display">Wave & Orange Money</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Génération automatique de liens et coordonnées d'encaissement mobile directes avec références de transaction obligatoires.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-card p-6 rounded-2xl border border-border shadow-xs hover:border-[#FF6B00]/50 hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#FF6B00] flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-foreground font-display">Acomptes & Split Payments</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Divisez vos factures en tranches (30% / 70%, 50% / 50%) avec suivi granulaire de chaque date d'échéance.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-card p-6 rounded-2xl border border-border shadow-xs hover:border-[#0E7A55]/50 hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-[#0E7A55] flex items-center justify-center">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-foreground font-display">Partage WhatsApp en 1 Clic</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Envoyez des messages de factures polis et formatés directement sur WhatsApp avec le solde restant et le lien PDF.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-card p-6 rounded-2xl border border-border shadow-xs hover:border-[#FF6B00]/50 hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#FF6B00] flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-foreground font-display">CRM Clients & Fournisseurs</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Annuaire avec suivi des créances, historique d'achats, numéro IFU / RCCM et relances de paiement rapides.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-card p-6 rounded-2xl border border-border shadow-xs hover:border-[#0E7A55]/50 hover:shadow-md transition-all space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-[#0E7A55] flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-foreground font-display">Zéro Donnée Virtuelle</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Votre espace démarre 100% vierge et sécurisé sur Supabase PostgreSQL. Seules vos données réelles sont enregistrées.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================================= */}
        {/* 🏷️ SECTION TARIFS SIMPLES & TRANSPARENTS (#pricing)                     */}
        {/* ======================================================================= */}
        <section id="pricing" className="px-4 sm:px-8 lg:px-24 py-20 bg-[#ffffff] dark:bg-[#131922] border-t border-border">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950 text-[#FF6B00] text-xs font-bold uppercase tracking-wider">
                <CreditCard className="w-3.5 h-3.5" /> Tarifs Accessibles
              </div>
              <h2 className="text-3xl sm:text-4xl font-black font-display text-foreground">
                Des tarifs simples pour booster votre activité
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Sans engagement, sans frais cachés. Démarrez gratuitement et évoluez selon vos besoins.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {/* Gratuit */}
              <div className="bg-card p-7 rounded-2xl border border-border flex flex-col justify-between shadow-xs hover:border-border/80 transition-all">
                <div className="space-y-4">
                  <h3 className="font-bold text-xl text-foreground font-display">Gratuit</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black font-mono text-foreground">0 FCFA</span>
                    <span className="text-xs text-muted-foreground">/mois</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Idéal pour débuter et émettre vos premières factures.</p>

                  <ul className="space-y-3 pt-4 border-t border-border text-xs">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0E7A55] shrink-0" />
                      <span>5 factures / mois</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0E7A55] shrink-0" />
                      <span>Partage WhatsApp</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0E7A55] shrink-0" />
                      <span>Exportation PDF Standard</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-muted-foreground">
                      <X className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                      <span>Acomptes multi-tranches</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register?plan=free"
                  className="mt-8 w-full py-3 text-center border border-[#FF6B00] text-[#FF6B00] hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-xl font-bold text-xs transition-colors"
                >
                  Commencer Gratuitement
                </Link>
              </div>

              {/* Pro (Populaire) */}
              <div className="bg-card p-7 rounded-2xl border-2 border-[#FF6B00] shadow-xl flex flex-col justify-between relative scale-[1.02] z-10">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md">
                  Le Plus Populaire
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-xl text-foreground font-display">Pro</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black font-mono text-[#FF6B00]">5 000 FCFA</span>
                    <span className="text-xs text-muted-foreground">/mois</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Pour les freelances actifs et prestataires de services.</p>

                  <ul className="space-y-3 pt-4 border-t border-border text-xs">
                    <li className="flex items-center gap-2.5 font-semibold">
                      <Check className="w-4 h-4 text-[#0E7A55] shrink-0" />
                      <span>Factures illimitées</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-semibold">
                      <Check className="w-4 h-4 text-[#0E7A55] shrink-0" />
                      <span>Wave & Orange Money direct</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-semibold">
                      <Check className="w-4 h-4 text-[#0E7A55] shrink-0" />
                      <span>Acomptes & Split Payments</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-semibold">
                      <Check className="w-4 h-4 text-[#0E7A55] shrink-0" />
                      <span>Relances WhatsApp automatiques</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-semibold">
                      <Check className="w-4 h-4 text-[#0E7A55] shrink-0" />
                      <span>TVA UEMOA 18% & Exonérations</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register?plan=pro"
                  className="mt-8 w-full py-3.5 text-center bg-[#FF6B00] hover:bg-[#ea580c] text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/25 transition-all btn-shimmer"
                >
                  Choisir Pro
                </Link>
              </div>

              {/* Business */}
              <div className="bg-card p-7 rounded-2xl border border-border flex flex-col justify-between shadow-xs hover:border-border/80 transition-all">
                <div className="space-y-4">
                  <h3 className="font-bold text-xl text-foreground font-display">Business</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black font-mono text-foreground">15 000 FCFA</span>
                    <span className="text-xs text-muted-foreground">/mois</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Pour les PME établies et équipes commerciales.</p>

                  <ul className="space-y-3 pt-4 border-t border-border text-xs">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0E7A55] shrink-0" />
                      <span>Tout le plan Pro</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0E7A55] shrink-0" />
                      <span>Multi-utilisateurs & Rôles</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0E7A55] shrink-0" />
                      <span>Export Comptable OHADA</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#0E7A55] shrink-0" />
                      <span>Support prioritaire WhatsApp 24/7</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register?plan=business"
                  className="mt-8 w-full py-3 text-center border border-border hover:border-foreground text-foreground rounded-xl font-bold text-xs transition-colors"
                >
                  Choisir Business
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================================= */}
        {/* 🌟 FINAL CALL TO ACTION                                                 */}
        {/* ======================================================================= */}
        <section className="px-4 sm:px-8 lg:px-24 py-16 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-emerald-500/10 border-t border-border text-center relative overflow-hidden">
          <div className="max-w-3xl mx-auto space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black font-display text-foreground">
              Prêt à simplifier vos encaissements dès aujourd'hui ?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Rejoignez les entrepreneurs africains qui gagnent du temps et sécurisent leur trésorerie avec Izi Factures.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="btn-shimmer text-white text-sm font-bold px-8 py-4 rounded-xl shadow-lg shadow-orange-500/30 hover:scale-[1.02] transition-all"
              >
                Créer mon compte Gratuitement
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 📄 FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="bg-[#ffffff] dark:bg-[#131922] border-t border-border px-4 sm:px-8 lg:px-24 py-10 text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF6B00] via-[#FF8A00] to-[#0E7A55] flex items-center justify-center text-white font-black text-xs">
              iZ
            </div>
            <span className="font-bold text-foreground">Izi Factures © 2026</span>
            <span>• Conçu pour l'Afrique de l'Ouest (UEMOA & CEMAC)</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-foreground transition-colors">
              Fonctionnalités
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Tarifs
            </a>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Connexion
            </Link>
            <Link href="/register" className="hover:text-[#FF6B00] font-bold transition-colors">
              Inscription
            </Link>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 📱 BOTTOM NAV BAR (MOBILE)                                                */}
      {/* ========================================================================= */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2.5 bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.06)] md:hidden">
        <Link
          href="/"
          className="flex flex-col items-center justify-center text-[#FF6B00] font-bold"
        >
          <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#FF6B00]" />
          </div>
          <span className="text-[10px] mt-0.5">Accueil</span>
        </Link>

        <a
          href="#features"
          className="flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5">Avantages</span>
        </a>

        <a
          href="#pricing"
          className="flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5">Tarifs</span>
        </a>

        {isAuthenticated ? (
          <Link
            href="/dashboard"
            className="flex flex-col items-center justify-center text-[#0E7A55] font-bold"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-[#0E7A55]" />
            </div>
            <span className="text-[10px] mt-0.5">Dashboard</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5">Connexion</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
