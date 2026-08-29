import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Izi Factures - Le SaaS de Facturation & Recouvrement pour Entrepreneurs Africains',
  description: 'Gérez vos factures, TVA 18%, acomptes échelonnés (30/70), paiements Wave, Orange Money et trésorerie sans stress.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&family=Public+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-foreground font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}
