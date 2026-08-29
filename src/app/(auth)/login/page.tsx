'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  User,
  Building2,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  X,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  // Mode Onglet : 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>(initialMode);

  // Champs Formulaire
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Mot de passe oublié
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // États UI
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Synchronisation si le paramètre d'URL change
  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setAuthMode('register');
    }
  }, [searchParams]);

  // Réinitialiser les erreurs lors du changement d'onglet
  const handleSwitchTab = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setError('');
    setSuccessMessage('');
  };

  // --- Connexion ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(email, password);
  };

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const cleanEmail = loginEmail.trim();
      if (isSupabaseConfigured && supabase) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: loginPass,
        });

        if (authError) {
          console.warn('Erreur Supabase signIn:', authError.message);
          if (authError.message === 'Invalid login credentials') {
            setError('Identifiants incorrects (Email ou mot de passe invalide).');
          } else if (authError.message.toLowerCase().includes('email not confirmed')) {
            setError('Veuillez confirmer votre adresse email en cliquant sur le lien reçu, ou connectez-vous avec le compte Démo.');
          } else {
            setError(authError.message);
          }
          setIsLoading(false);
          return;
        }

        if (data?.user) {
          const meta = data.user.user_metadata || {};
          const sessionData = {
            id: data.user.id,
            email: data.user.email,
            name: meta.full_name || cleanEmail.split('@')[0],
            companyName: meta.company_name || 'Mon Entreprise',
            currency: meta.currency || 'XOF',
          };
          try {
            localStorage.setItem('izifactures_session', JSON.stringify(sessionData));
          } catch (e) {}
        }
      } else {
        const sessionData = {
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          companyName: 'Izi Factures Entreprise',
          currency: 'XOF',
        };
        try {
          localStorage.setItem('izifactures_session', JSON.stringify(sessionData));
        } catch (e) {}
      }

      // Succès -> Redirection Dashboard
      window.location.href = '/';
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue lors de la connexion');
      setIsLoading(false);
    }
  };

  // Connexion rapide compte démo
  const handleQuickDemoLogin = async () => {
    setEmail('demo@izifactures.sn');
    setPassword('IziFactures2026!');
    await executeLogin('demo@izifactures.sn', 'IziFactures2026!');
  };

  // --- Réinitialisation Mot de Passe ---
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const emailToSend = forgotEmail.trim() || email.trim();
      if (!emailToSend) {
        setForgotError('Veuillez renseigner votre adresse email.');
        setIsForgotLoading(false);
        return;
      }

      if (isSupabaseConfigured && supabase) {
        const redirectToUrl = `${window.location.origin}/auth/reset-password`;
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(emailToSend, {
          redirectTo: redirectToUrl,
        });

        if (resetErr) {
          setForgotError(resetErr.message);
          setIsForgotLoading(false);
          return;
        }
      }

      setForgotSuccess(
        `Un lien de réinitialisation sécurisé a été envoyé à ${emailToSend}. Veuillez vérifier votre boîte de réception pour définir votre nouveau mot de passe.`
      );
    } catch (err: any) {
      console.error(err);
      setForgotError(err.message || "Une erreur est survenue lors de l'envoi du lien de réinitialisation.");
    } finally {
      setIsForgotLoading(false);
    }
  };

  // --- Inscription ---
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsLoading(true);

    try {
      const cleanEmail = email.trim();
      if (isSupabaseConfigured && supabase) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              company_name: companyName.trim() || fullName.trim(),
              currency: 'XOF',
            },
          },
        });

        if (authError) {
          console.warn('SignUp error:', authError.message);
          setError(authError.message);
          setIsLoading(false);
          return;
        }

        if (data?.session) {
          const sessionData = {
            id: data.user?.id,
            email: cleanEmail,
            name: fullName.trim(),
            companyName: companyName.trim() || fullName.trim(),
            currency: 'XOF',
          };
          try {
            localStorage.setItem('izifactures_session', JSON.stringify(sessionData));
          } catch (e) {}
          window.location.href = '/';
          return;
        }

        if (data?.user) {
          const { data: signData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (!signInErr && signData?.session) {
            const sessionData = {
              id: signData.user.id,
              email: cleanEmail,
              name: fullName.trim(),
              companyName: companyName.trim() || fullName.trim(),
              currency: 'XOF',
            };
            try {
              localStorage.setItem('izifactures_session', JSON.stringify(sessionData));
            } catch (e) {}
            window.location.href = '/';
            return;
          }

          setSuccessMessage(
            `Compte créé avec succès ! Si un email de confirmation a été envoyé à ${cleanEmail}, veuillez vérifier votre boîte de réception pour valider votre compte, ou connectez-vous.`
          );
          setIsLoading(false);
          return;
        }
      }

      window.location.href = '/';
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue lors de la création du compte');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* 1. Onglets Switcher Haut : Connexion / Inscription */}
      <div className="p-1 bg-muted/60 rounded-xl border border-border flex items-center gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => handleSwitchTab('login')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
            authMode === 'login'
              ? 'bg-card text-foreground shadow-sm border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          Connexion
        </button>

        <button
          type="button"
          onClick={() => handleSwitchTab('register')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
            authMode === 'register'
              ? 'bg-card text-foreground shadow-sm border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#0E7A55]" />
          Inscription
        </button>
      </div>

      {/* Header texte selon mode */}
      <div>
        <h1 className="text-2xl font-bold text-foreground font-display tracking-tight">
          {authMode === 'login' ? 'Bon retour parmi nous 👋' : 'Créer un Compte Entreprise 🚀'}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {authMode === 'login'
            ? 'Connectez-vous pour piloter vos factures, créances et encaissements.'
            : 'Rejoignez Izi Factures et professionnalisez votre facturation en Francs CFA.'}
        </p>
      </div>

      {/* Alerte Erreur avec suggestion Mot de passe oublié */}
      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2 text-xs text-rose-900 dark:text-rose-200 animate-in fade-in-50">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#B22C22] shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          {authMode === 'login' && error.includes('Identifiants incorrects') && (
            <div className="pl-6 pt-1">
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setIsForgotPasswordOpen(true);
                }}
                className="text-xs font-bold text-[#FF6B00] hover:underline flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" /> Mot de passe oublié ? Réinitialisez-le ici
              </button>
            </div>
          )}
        </div>
      )}

      {/* Alerte Succès */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-start gap-2 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-[#0E7A55] shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FORMULAIRE DE CONNEXION */}
      {/* ========================================================================= */}
      {authMode === 'login' ? (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Adresse Email Professionnelle *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@votre-entreprise.com"
                className="flex h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-subtle"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mot de passe *
              </label>
              {/* Option Mot de passe oublié */}
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setIsForgotPasswordOpen(true);
                }}
                className="text-xs text-[#FF6B00] hover:underline font-bold transition-colors cursor-pointer"
              >
                Mot de passe oublié ?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex h-10 w-full rounded-md border border-input bg-card pl-9 pr-10 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-subtle"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full h-11 text-sm font-semibold justify-center shadow-md bg-[#FF6B00] hover:bg-[#EA580C] text-white mt-2"
            isLoading={isLoading}
          >
            Se Connecter <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {/* Bouton Démo Rapide */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full text-xs py-2.5 px-3 bg-primary/5 border border-primary/20 rounded-lg text-[#FF6B00] font-semibold hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              🚀 Connexion en 1 Clic (Compte Démo Entreprise)
            </button>
          </div>
        </form>
      ) : (
        /* ========================================================================= */
        /* 3. FORMULAIRE D'INSCRIPTION */
        /* ========================================================================= */
        <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
          {/* 1. Nom complet */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Nom Complet (Prénom & Nom) *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ex: Amadou Diallo"
                className="flex h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-subtle"
              />
            </div>
          </div>

          {/* 2. Nom de l'Entreprise */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Nom de l'Entreprise / Activité
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ex: Diallo Consulting SARL (Optionnel)"
                className="flex h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-subtle"
              />
            </div>
          </div>

          {/* 3. Adresse Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Adresse Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@entreprise.sn"
                className="flex h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-subtle"
              />
            </div>
          </div>

          {/* 4. Mot de passe */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Mot de passe (min. 6 caractères) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex h-10 w-full rounded-md border border-input bg-card pl-9 pr-10 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-subtle"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 5. Confirmation obligatoire du mot de passe */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Confirmer le Mot de passe *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`flex h-10 w-full rounded-md border bg-card pl-9 pr-10 py-2 text-sm text-foreground focus:outline-none focus:ring-2 shadow-subtle ${
                  confirmPassword && confirmPassword !== password
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-input focus:ring-primary'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <span className="text-[11px] text-[#B22C22] mt-1 block">
                ⚠️ Les mots de passe ne correspondent pas.
              </span>
            )}
            {confirmPassword && confirmPassword === password && (
              <span className="text-[11px] text-[#0E7A55] mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Les mots de passe correspondent.
              </span>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full h-11 text-sm font-semibold justify-center shadow-md bg-[#FF6B00] hover:bg-[#EA580C] text-white mt-3"
            isLoading={isLoading}
          >
            Créer Mon Compte <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      )}

      {/* Switch Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
        {authMode === 'login' ? (
          <>
            Vous n’avez pas encore de compte ?{' '}
            <button
              type="button"
              onClick={() => handleSwitchTab('register')}
              className="text-[#FF6B00] font-bold hover:underline"
            >
              Créer un compte
            </button>
          </>
        ) : (
          <>
            Vous avez déjà un compte ?{' '}
            <button
              type="button"
              onClick={() => handleSwitchTab('login')}
              className="text-[#FF6B00] font-bold hover:underline"
            >
              Se connecter
            </button>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODALE MODERNE DE RÉCUPÉRATION DU MOT DE PASSE                         */}
      {/* ========================================================================= */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF6B00] flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground font-display">
                    Mot de Passe Oublié ? 🔑
                  </h3>
                  <p className="text-xs text-muted-foreground">Récupération de compte sécurisée</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPasswordOpen(false);
                  setForgotError('');
                  setForgotSuccess('');
                }}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2 text-xs text-rose-900 dark:text-rose-200">
                <AlertCircle className="w-4 h-4 text-[#B22C22] shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess ? (
              <div className="space-y-4 py-2 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#0E7A55] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {forgotSuccess}
                </p>
                <Button
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="w-full bg-[#0E7A55] hover:bg-[#0c6b4b] text-white text-xs font-bold py-2.5"
                >
                  J'ai compris
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Saisissez l'adresse email associée à votre compte d'entreprise. Nous vous enverrons immédiatement un lien pour définir un nouveau mot de passe.
                </p>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Adresse Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="directeur@entreprise.sn"
                      className="flex h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-subtle"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="flex-1 text-xs"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isForgotLoading}
                    className="flex-1 text-xs font-bold bg-[#FF6B00] hover:bg-[#EA580C] text-white"
                  >
                    Envoyer le Lien
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12 min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00]"></div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
