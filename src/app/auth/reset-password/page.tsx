'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff, ArrowRight, KeyRound } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          setError(updateError.message);
          setIsLoading(false);
          return;
        }
      }

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue lors de la mise à jour du mot de passe.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 sm:p-10 shadow-elevated space-y-6">
        {/* Header Icon */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#FF6B00] shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground font-display">
              Nouveau Mot de Passe 🔑
            </h1>
            <p className="text-xs text-muted-foreground">
              Définissez votre nouveau mot de passe sécurisé.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200">
            <AlertCircle className="w-4 h-4 text-[#B22C22] shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#0E7A55] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Mot de passe mis à jour avec succès ! 🎉
            </h2>
            <p className="text-xs text-muted-foreground">
              Vous pouvez maintenant vous connecter à votre compte avec votre nouveau mot de passe.
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button className="w-full bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold text-xs py-3">
                  Se Connecter <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Nouveau Mot de passe (min. 6 caractères) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex h-11 w-full rounded-xl border border-input bg-card pl-9 pr-10 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-subtle"
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

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Confirmer le Nouveau Mot de passe *
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
                  className={`flex h-11 w-full rounded-xl border bg-card pl-9 pr-10 py-2 text-sm text-foreground focus:outline-none focus:ring-2 shadow-subtle ${
                    confirmPassword && confirmPassword !== newPassword
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
              {confirmPassword && confirmPassword !== newPassword && (
                <span className="text-[11px] text-[#B22C22] mt-1 block">
                  ⚠️ Les mots de passe ne correspondent pas.
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 text-sm font-bold justify-center shadow-md bg-[#FF6B00] hover:bg-[#EA580C] text-white mt-2"
              isLoading={isLoading}
            >
              Enregistrer le Nouveau Mot de Passe <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="text-center pt-2">
              <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground font-semibold">
                ← Retour à la connexion
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
