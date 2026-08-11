import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://klaxon-site.vercel.app'),
  title: {
    default: 'Klaxon — le covoiturage entre collègues, en deux appuis',
    template: '%s · Klaxon',
  },
  description:
    "Klaxon est l'application de covoiturage domicile-travail réservée aux salariés d'une même entreprise. Deux appuis le matin confirment le trajet et comptent les kilomètres du forfait mobilités durables.",
  openGraph: {
    title: 'Klaxon — le covoiturage entre collègues, en deux appuis',
    description:
      "Le covoiturage domicile-travail entre collègues d'une même entreprise. Kilomètres confirmés, forfait mobilités durables justifié, données RH toujours agrégées.",
    type: 'website',
    locale: 'fr_FR',
  },
  robots: { index: true, follow: true },
};

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 1024 1024" aria-hidden="true">
      <rect width="1024" height="1024" rx="220" fill="#F0A202" />
      <g fill="none" stroke="#141B22" strokeWidth="104" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 232 316 L 470 512" />
        <path d="M 232 708 L 470 512" />
        <path d="M 470 512 L 792 512" />
      </g>
    </svg>
  );
}

export default function RacineLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <header className="entete">
          <Link href="/" className="marque">
            <Logo />
            <span>Klaxon</span>
          </Link>
          <Link href="/support">Support</Link>
        </header>

        <main>{children}</main>

        <footer className="pied">
          <p>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/conditions">Conditions d’utilisation</Link>
            <Link href="/support">Support</Link>
          </p>
          <p>
            Klaxon — le covoiturage domicile-travail entre collègues. Données hébergées en France.
          </p>
        </footer>
      </body>
    </html>
  );
}
