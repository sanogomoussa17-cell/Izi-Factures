# 📄 Izi Factures — Guide de Référence & Documentation Système

> **Projet :** Izi Factures — SaaS de Facturation & Recouvrement pour Entrepreneurs Africains  
> **Auteur / Mainteneur :** Équipe d'Ingénierie Izi Factures  
> **Dernière mise à jour :** Août 2026  
> **Environnement cible :** UEMOA (Sénégal, Côte d'Ivoire, Bénin, Togo, Mali, Burkina Faso, Niger, Guinée-Bissau) & CEMAC (Cameroun, Gabon, Congo, etc.)

---

## 🎯 1. Vision & Fonctionnalités Clés

**Izi Factures** est un SaaS de facturation moderne, réactif et optimisé pour les réalités des PME et indépendants africains. L'application résout les points de friction spécifiques aux marchés africains (devises sans centimes comme le Franc CFA, TVA UEMOA 18%, acomptes/paiements échelonnés par tranches, paiements mobiles Wave/Orange Money/MTN MoMo, partages de factures WhatsApp et exportations PDF imprimables).

### ✅ Fonctionnalités Implémentées

1. **Dashboard & Pilotage Financier** :
   - Cartes KPI en temps réel (Total Facturé, Total Encaissé, Reste à Recouvrer, Factures en Retard).
   - Taux de recouvrement avec jauge dynamique et indicateur de performance.
   - Graphique d'évolution du chiffre d'affaires mensuel.
   - Actions rapides pré-configurées (« Saved Actions ») pour créer des factures en 1 clic.
   - Tableau interactif des factures récentes avec filtres par statut.

2. **Studio de Création & Édition Split-Screen** (`/invoices/new` et `/invoices/[id]/edit`) :
   - Saisie dynamique à gauche (sélection client, articles, prix, TVA 18%, remises, échéanciers).
   - Aperçu papier fiscal en direct à droite avec badge logo, coordonnées, mentions légales et QR code.
   - Alignement parfait de la Date d'Émission et de la Date d'Échéance sur la même ligne.
   - Bouton principal unifié **« Enregistrer la Facture »** avec redirection automatique.

3. **Moteur Fiscal (TVA 18% & Exonérations)** :
   - TVA standard UEMOA à 18% calculée en points de base (`1800 bps`) évitant toute erreur d'arrondi.
   - Activation/Désactivation de la TVA au niveau organisation, facture ou article.
   - Gestion des exonérations légales obligatoires (e.g. *Exonération art. 35 CGI - Régime exportateur*).

4. **Paiements Échelonnés (Split Payments / Acomptes Multi-Tranches)** :
   - Modèles de tranches intégrés : Acompte 30% / Solde 70%, 50% / 50%, 30% / 40% / 30% ou personnalisé.
   - Suivi granulaire par tranche (statuts : Payée / En attente, montant attendu, date d'échéance).

5. **Gestion des Règlements & Canaux Africains** :
   - Modale d'encaissement dédiée avec sélection de mode : **Wave Mobile Money**, **Orange Money**, **MTN MoMo**, **Virement Bancaire**, **Espèces**, **Chèque**.
   - Saisie obligatoire de la référence de transaction de paiement (e.g. `WV-849204-DKR`).

6. **Cycle de Vie & Statuts de Facture** :
   - Statuts : `DRAFT` (Brouillon), `ISSUED` (Enregistrée/Émise), `PAID` (Soldée 100%), `PARTIALLY_PAID` (Partiellement payée), `OVERDUE` (En retard), `CANCELLED` (Annulée).
   - **Annulation avec Motif Obligatoire** : Modale d'annulation enregistrant le motif, annulant le solde dû (créance à 0 FCFA) et apposant un tampon visuel et bandeau d'annulation `ANNULÉE`.
   - **Modification complète** : Recalcul automatique des totaux, de la TVA et des soldes restants.

7. **Export & Communication** :
   - **Partage WhatsApp en 1 clic** (`wa.me`) avec texte formaté professionnel (numéro de facture, montant, solde, lien et coordonnées Wave/OM).
   - **Téléchargement PDF / Impression** via feuille de style vectorielle dédiée (`@media print`).

8. **Répertoire Clients (CRM) & Fournisseurs (Achats)** :
   - Fiches clients avec coordonnées, numéro IFU/RCCM, téléphone et suivi des créances.
   - Fiches fournisseurs avec suivi des achats et des factures fournisseurs.

---

## 🏗️ 2. Architecture & Organisation des Fichiers

Le projet suit les principes de la **Clean Architecture** (Ports & Adapters) afin de séparer strictement la logique métier des couches de persistance et de présentation :

```
izi-factures/
├── src/
│   ├── app/                                # Next.js 14 App Router
│   │   ├── (auth)/                         # Pages d'authentification
│   │   │   ├── layout.tsx                  # Layout visuel Auth & Témoignages
│   │   │   ├── login/page.tsx              # Connexion avec Supabase Auth
│   │   │   └── register/page.tsx           # Inscription entreprise & sélection devise
│   │   ├── (dashboard)/                    # Layout & Pages protégées
│   │   │   ├── layout.tsx                  # Sidebar, état Cloud & Déconnexion
│   │   │   ├── page.tsx                    # Dashboard principal & KPI
│   │   │   ├── invoices/
│   │   │   │   ├── page.tsx                # Liste & Filtres des Factures
│   │   │   │   ├── new/page.tsx            # Studio Split-Screen Création Facture
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx            # Détail & Historique de Facture
│   │   │   │       └── edit/page.tsx       # Studio Split-Screen Modification Facture
│   │   │   ├── clients/page.tsx            # CRM Clients & Suivi des Créances
│   │   │   ├── suppliers/page.tsx          # Gestion des Fournisseurs
│   │   │   └── settings/page.tsx           # Paramètres Entreprise & Fiscalité
│   │   ├── auth/
│   │   │   ├── callback/route.ts           # Route d'échange de code OAuth / Session
│   │   │   └── signout/route.ts            # Route de déconnexion
│   │   ├── globals.css                     # Tokens CSS, Couleurs HSL & Print styles
│   │   └── layout.tsx                      # Layout Racine HTML / Polices
│   │
│   ├── components/                         # Composants UI modulaires
│   ├── core/                               # Couche Domaine & Métier
│   │   ├── adapters/
│   │   │   ├── index.ts                    # Point d'accès unifié repository (Supabase prioritaire)
│   │   │   ├── local-mock-repository.ts    # Adaptateur Stockage Local
│   │   │   └── supabase-repository.ts      # Adaptateur PostgreSQL Supabase Full-Stack
│   │   ├── domain/                         # Moteurs TVA 18%, Devises sans flottant, Échéanciers
│   │   └── ports/                          # Contrat IInvoiceRepository
│   │
│   ├── lib/
│   │   ├── supabase/                       # Clients Supabase SSR (client, server, middleware)
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   └── utils.ts
│   │
│   ├── middleware.ts                       # Middleware Next.js de gestion de session
│   └── supabase/                           # Scripts SQL pour la BDD Supabase
│       ├── 01_auth_trigger.sql             # Trigger auto-création d'organisation à l'inscription
│       ├── schema.sql                      # Tables, clés étrangères et index PostgreSQL
│       ├── rls-policies.sql                # Politiques Row Level Security multi-tenant
│       └── functions.sql                   # Triggers d'immuabilité et calculs automatiques
│
├── package.json                            # Dépendances du projet
├── tailwind.config.js                      # Configuration Tailwind CSS & Thème
├── tsconfig.json                           # Configuration TypeScript
└── GEMINI.md                               # Ce fichier de référence
```

---

## 💻 3. Stack Technologique & Dépendances

- **Framework :** [Next.js 14](https://nextjs.org/) (App Router, React Server/Client Components).
- **Langage :** [TypeScript](https://www.typescriptlang.org/) (Mode strict activé).
- **Styling :** [Tailwind CSS](https://tailwindcss.com/) avec variables CSS / tokens HSL (Palette personnalisée, mode sombre, `@media print`).
- **Icônes :** [Lucide React](https://lucide.dev/) (icônes vectorielles cohérentes).
- **Stockage & Base de Données :**
  - *Phase locale / MVP :* LocalStorage + In-Memory repository via `LocalMockRepository` implémentant `IInvoiceRepository`.
  - *Phase Production :* [Supabase](https://supabase.com/) (PostgreSQL 15+, Auth, Row Level Security, Triggers SQL).

---

## 🎨 4. Décisions de Design & Charte Graphique

1. **Palette de Couleurs** :
   - **Primaire (Bleu Cobalt / Confiance) :** `#2B49B8` (Actions, boutons principaux, focus).
   - **Vert Succès / Encaissement (Émeraude Africaine) :** `#0E7A55` (Montants encaissés, badges payés, logo).
   - **Ambre Acompte / Partiel :** `#9A6608` (Paiements partiels, tranches en cours).
   - **Rouge Alerte / Annulation :** `#B22C22` (Factures en retard, documents annulés).
   - **Fond & Cartes :** Nuances subtiles de blanc/ardoise en mode clair et noir/ardoise en mode sombre (`background`, `card`, `border`).

2. **Typographie** :
   - **Interface :** `Inter`, `system-ui`, sans-serif.
   - **Titres & Chiffres :** `Plus Jakarta Sans` ou `Outfit`.
   - **Montants & Numéros de Factures :** `JetBrains Mono`, monospace pour un alignement comptable irréprochable.

3. **Formatage Monétaire Spécifique (XOF / FCFA)** :
   - Le Franc CFA (`XOF` / `XAF`) ne possède **pas de centimes** (exposant 0). Formaté : `12 500 000 FCFA`.
   - Les devises internationales (`EUR`, `USD`) affichent 2 décimales : `14 480,25 €`, `$14,480.25`.
   - Tous les calculs utilisent des entiers (centimes ou unités XOF) pour bannir les erreurs d'imprécision en virgule flottante (`0.1 + 0.2 != 0.3`).

---

## 🗄️ 5. Schéma de Base de Données Supabase (PostgreSQL)

Le dossier `src/supabase/` contient l'intégralité du modèle relationnel prêt pour le déploiement cloud :

- **`organizations`** : Données de l'entreprise (nom, RCCM/IFU, logo, devise par défaut, coordonnées Wave/Orange Money, statut TVA).
- **`clients` & `suppliers`** : Annuaire des tiers avec coordonnées et totaux facturés/payés.
- **`invoices`** : Factures émises avec numérotation unique, statut fiscal, type de structure de paiement, dates, totaux HT/TVA/TTC, solde restant, motif d'annulation.
- **`invoice_items`** : Lignes de prestation avec description, quantité, prix unitaire, taux TVA bps.
- **`payment_schedules`** : Tranches de paiement échelonné (pourcentage, montant attendu, date d'échéance, statut).
- **`payments`** : Historique des encaissements reçus avec canal (Wave, OM, MoMo, Virement) et référence de transaction.
- **`rls-policies.sql`** : Isolation multi-tenant stricte (`auth.uid() = org_id`).
- **`functions.sql`** : Triggers de recalcul automatique du solde et verrouillage d'immuabilité sur les factures émises.

---

## 🤖 6. Instructions pour les Futurs Modèles IA & Développeurs

Lors de vos interventions sur cette codebase, veuillez respecter scrupuleusement les règles suivantes :

### 📏 Règles de Développement & Bonnes Pratiques

1. **Respecter la Couche Domaine (`src/core/domain/`)** :
   - Toute formule mathématique (TVA, remises, tranches, conversions) doit être implémentée ou appelée depuis `tax-engine.ts`, `schedule-engine.ts` ou `money.ts`.
   - Ne jamais introduire de calcul de monnaie avec des nombres flottants non arrondis. Toujours utiliser `formatMoney()`.

2. **Immuabilité & Cycle de Vie des Factures** :
   - Une facture ayant le statut `CANCELLED` ne doit plus accepter de nouveaux paiements et son `remainingBalance` doit être fixé à 0.
   - Toujours exiger un motif d'annulation (`cancellationReason`).

3. **Alignement Formulaire & Aperçu Papier** :
   - Toute modification de champ dans `src/components/invoice-editor/invoice-form.tsx` doit avoir sa contrepartie visuelle immédiate dans `src/components/invoice-editor/invoice-preview.tsx`.
   - Conserver la Date d'Émission et la Date d'Échéance sur la **même ligne** (`grid grid-cols-2 gap-4`).
   - Le bouton principal d'enregistrement est nommé **« Enregistrer la Facture »**.

4. **Sécurité des Rendus & Gardes TypeScript** :
   - Toujours sécuriser les itérations sur les tableaux optionnels avec des fallbacks : `(invoice.schedules || []).map(...)`, `(invoice.payments || []).map(...)`, `(invoice.items || []).map(...)`.

5. **Déploiement & Serveur Local** :
   - Pour lancer le serveur de développement : `npm run dev` (sur le port 3000).
   - Pour tester le moteur de calcul : `node test_domain.js`.

---

## 🚀 7. Règle Obligatoire & Automatisée : Synchronisation & Push GitHub

> **Règle absolue :** À chaque fois que l'utilisateur demande de « pousser », « mettre à jour », « synchroniser » ou « envoyer » le code sur GitHub (ex: *« pousse sur github »*, *« mets le code sur github »*, *« sauvegarde »*), l'agent **DOIT EXÉCUTER LE PUSH LUI-MÊME DE MANIÈRE 100% AUTONOME, SÉCURISÉE ET IMMÉDIATE**.

### 🔒 Protocole d'Exécution Strict & Automatique :
1. **Initialisation de l'environnement Git** :
   - Toujours inclure Git dans le PATH : `$env:PATH = "$env:LOCALAPPDATA\Programs\Git\cmd;" + $env:PATH`
2. **Contrôle Sécurité & Anti-Fuite de Secrets** :
   - Vérifier que `.gitignore` protège strictement `.env*`, `.agents*`, `node_modules/`, `.next/`, et les clés secrètes (`sb_secret_*`).
   - Ne jamais commiter de jetons d'accès ou clés d'API sensibles en clair.
3. **Commit & Push Autonome** :
   - Exécuter automatiquement :
     ```powershell
     $env:PATH = "$env:LOCALAPPDATA\Programs\Git\cmd;" + $env:PATH
     git add .
     git commit -m "feat/fix: <description claire des changements>"
     git push origin main
     ```
   - Ne **JAMAIS** demander à l'utilisateur de taper lui-même les commandes ou de faire des manipulations manuelles superflues si l'agent peut l'exécuter directement.
4. **Validation & Confirmation Visuelle** :
   - Confirmer le succès à l'utilisateur avec le lien direct vers le dépôt :
     👉 **`https://github.com/sanogomoussa17-cell/Izi-Factures`**
   - Fournir un récapitulatif clair et structuré des modifications poussées.
