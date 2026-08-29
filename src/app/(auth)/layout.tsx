import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Zap, Globe2 } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background text-foreground">
      {/* Left / Top Form Area (7 cols on desktop) */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-12 md:p-16">
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#0E7A55] text-white flex items-center justify-center font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
              IZ
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-foreground font-display">
                Izi<span className="text-[#0E7A55]">Factures</span>
              </span>
              <span className="block text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                Afrique & UEMOA
              </span>
            </div>
          </Link>
          <div className="text-xs text-muted-foreground hidden sm:block">
            Facturation & Recouvrement Pro
          </div>
        </div>

        {/* Dynamic Auth Form Container */}
        <div className="my-8 max-w-md w-full mx-auto">
          {children}
        </div>

        {/* Footer info */}
        <div className="text-xs text-muted-foreground text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-border pt-4">
          <span>© 2026 Izi Factures — Tous droits réservés.</span>
          <div className="flex items-center gap-3">
            <span className="hover:underline cursor-pointer">Conditions</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Confidentialité</span>
          </div>
        </div>
      </div>

      {/* Right Side: Hero Visual & Testimonial (5 cols on desktop) */}
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#141E30] via-[#0E7A55]/90 to-[#2B49B8] p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Subtle background glow circles */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#0E7A55]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider mb-6">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Spécial PME & Indépendants Africains
          </div>
          <h2 className="text-3xl font-extrabold font-display leading-tight tracking-tight">
            Facturez en Francs CFA, encaissez via Wave & Orange Money en toute sérénité.
          </h2>
          <p className="text-white/80 text-sm mt-3 leading-relaxed">
            Rejoignez des milliers d'entrepreneurs à Dakar, Abidjan, Cotonou, Douala et Lomé qui accélèrent leurs encaissements grâce à Izi Factures.
          </p>
        </div>

        {/* Key Features Bullet List */}
        <div className="relative z-10 space-y-4 my-8">
          <div className="flex items-start gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-xs uppercase tracking-wide">TVA UEMOA 18% & Sans Centimes</div>
              <div className="text-[11px] text-white/75 mt-0.5">Calculs rigoureux au franc près, gestion des exonérations légales.</div>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-xs uppercase tracking-wide">Acomptes & Split Payments</div>
              <div className="text-[11px] text-white/75 mt-0.5">Échéanciers multi-tranches (30%/70%, 50%/50%) avec relances automatiques.</div>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-xs uppercase tracking-wide">Partages WhatsApp & Impression PDF</div>
              <div className="text-[11px] text-white/75 mt-0.5">Génération de liens instantanés et reçus fiscaux professionnels.</div>
            </div>
          </div>
        </div>

        {/* Testimonial Quote */}
        <div className="relative z-10 border-t border-white/20 pt-6">
          <p className="text-xs italic text-white/90 leading-relaxed">
            « Avec Izi Factures, nos délais de paiement ont été divisés par deux grâce au suivi des tranches et aux liens Wave intégrés ! »
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
              MT
            </div>
            <div>
              <div className="text-xs font-bold">Mamadou Traoré</div>
              <div className="text-[10px] text-white/70">Fondateur, Sahel Digital Agency — Dakar</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
