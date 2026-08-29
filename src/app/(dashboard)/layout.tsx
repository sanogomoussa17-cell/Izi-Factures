'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  Settings,
  Plus,
  Bell,
  Menu,
  X,
  CreditCard,
  CheckCircle2,
  LogOut,
  User,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { repository } from '@/core/adapters';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');

  useEffect(() => {
    async function checkUserAndOrg() {
      // 1. Récupération prioritaire depuis Supabase Auth
      try {
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            const email = data.user.email || null;
            setUserEmail(email);

            const meta = data.user.user_metadata || {};
            if (meta.full_name) setUserName(meta.full_name);
            if (meta.company_name) setCompanyName(meta.company_name);
            else if (email) {
              setUserName(meta.full_name || email.split('@')[0]);
            }
          }
        }
      } catch (authErr) {
        console.warn('Auth user check:', authErr);
      }

      // 2. Fallback session locale
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('izifactures_session') : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.email) setUserEmail((prev) => prev || parsed.email);
          if (parsed.name) setUserName((prev) => prev || parsed.name);
          if (parsed.companyName) setCompanyName((prev) => prev || parsed.companyName);
        }
      } catch (e) {}

      // 3. Fallback organisation repository
      try {
        const org = await repository.getOrganization();
        if (org?.name) {
          setCompanyName((prev) => prev || org.name);
        }
      } catch (e) {}
    }
    checkUserAndOrg();

    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          if (meta.full_name) setUserName(meta.full_name);
          if (meta.company_name) setCompanyName(meta.company_name);
          setUserEmail(session.user.email || null);
        }
      });
      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, []);

  const handleSignOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('izifactures_session');
      }
    } catch (e) {}
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
    window.location.href = '/login';
  };

  const navigation = [
    { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    { name: 'Factures & Échéanciers', href: '/invoices', icon: FileText },
    { name: 'Clients & Créances', href: '/clients', icon: Users },
    { name: 'Fournisseurs & Achats', href: '/suppliers', icon: Building2 },
    { name: 'Paramètres & TVA', href: '/settings', icon: Settings },
    { name: 'Aide & Support', href: '/help', icon: HelpCircle },
  ];

  const displayName = userName || 'SANOGO MOUSSA';
  const displayCompany = companyName || 'RIPA BOUTIQUE';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B00] via-[#FF8A00] to-[#0E7A55] flex items-center justify-center text-white font-black text-base shadow-sm">
            iZ
          </div>
          <div>
            <span className="font-display font-black text-lg text-[#FF6B00]">
              Izi<span className="text-[#0E7A55]">Factures</span>
            </span>
            <span className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Afrique Pro</span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen w-72 bg-card border-r border-border p-5 flex flex-col justify-between transition-transform duration-200 shadow-xs ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Brand */}
          <div className="flex items-center justify-between px-1">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6B00] via-[#FF8A00] to-[#0E7A55] flex items-center justify-center text-white font-black text-lg shadow-md shadow-orange-500/20">
                iZ
              </div>
              <div>
                <span className="font-display font-black text-xl tracking-tight text-[#FF6B00]">
                  Izi<span className="text-[#0E7A55]">Factures</span>
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Facturation UEMOA
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Create CTA (Vibrant Orange Button) */}
          <div className="px-1">
            <Link href="/invoices/new">
              <Button className="w-full justify-center text-xs font-bold py-2.5 bg-[#FF6B00] hover:bg-[#EA580C] text-white shadow-md shadow-orange-500/20 border-0 transition-all hover:scale-[1.01]">
                <Plus className="w-4 h-4 mr-1.5" /> Nouvelle Facture
              </Button>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5 px-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-500/10 text-[#FF6B00] font-bold shadow-xs border-r-3 border-[#FF6B00]'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF6B00]' : 'text-muted-foreground'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Org Status & User */}
        <div className="pt-4 border-t border-border space-y-3 px-1">
          <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 text-xs">
            <div className="flex items-center justify-between font-bold text-foreground">
              <span className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#0E7A55] animate-pulse" />
                Cloud Supabase
              </span>
              <span className="text-[10px] text-[#0E7A55] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                Connecté
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Base PostgreSQL synchronisée avec RLS.
            </p>
          </div>

          {/* Profil Utilisateur / Boutique */}
          <div className="flex items-center justify-between pt-1 px-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-[#FF6B00] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-foreground truncate" title={displayName}>
                  {displayName}
                </div>
                <div className="text-[10px] text-muted-foreground truncate" title={displayCompany}>
                  {displayCompany}
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              title="Se déconnecter"
              className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-muted-foreground hover:text-destructive transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen bg-background">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card/90 backdrop-blur-md px-6 sm:px-10 lg:px-12 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-4">
            <h2 className="text-base sm:text-lg font-bold text-foreground font-display">
              {pathname === '/' && 'Tableau de Bord & Trésorerie'}
              {pathname === '/invoices' && 'Gestion des Factures'}
              {pathname === '/invoices/new' && 'Studio de Création de Facture'}
              {pathname.startsWith('/invoices/') && pathname !== '/invoices/new' && 'Détail de la Facture'}
              {pathname === '/clients' && 'Répertoire des Clients'}
              {pathname === '/suppliers' && 'Fournisseurs & Dépenses'}
              {pathname === '/settings' && 'Paramètres & Configuration Fiscale'}
              {pathname === '/help' && 'Centre d’Aide & Support Client'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/help"
              className="p-2 rounded-xl border border-border bg-card hover:bg-orange-500/10 text-muted-foreground hover:text-[#FF6B00] transition-colors flex items-center gap-1.5 text-xs font-bold shadow-2xs"
              title="Besoin d'aide ? Ouvrir le Support"
            >
              <HelpCircle className="w-4 h-4 text-[#FF6B00]" />
              <span className="hidden sm:inline">Aide & Support</span>
            </Link>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-[#0E7A55] border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" /> TVA 18% UEMOA Active
            </div>

            <Link href="/invoices/new">
              <Button size="sm" className="text-xs font-bold bg-[#FF6B00] hover:bg-[#EA580C] text-white shadow-xs rounded-xl">
                <Plus className="w-3.5 h-3.5 mr-1" /> Créer
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Container */}
        <div className="p-6 sm:p-10 lg:p-12 flex-1 w-full max-w-[1920px] mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
