import type { Metadata } from 'next';
import Link from 'next/link';
import { sessionOuverte } from '@/lib/auth';
import { deconnexion } from './actions';
import './globals.css';

export const metadata: Metadata = {
  title: 'Klaxon — administration',
  description: 'Back-office éditeur : entreprises, comptes RH, attestations, facturation.',
  robots: { index: false, follow: false },   // ce site ne doit jamais être référencé
};

export default async function RacineLayout({ children }: { children: React.ReactNode }) {
  const connecte = await sessionOuverte();

  return (
    <html lang="fr">
      <body>
        {connecte && (
          <nav className="barre">
            <Link href="/" className="marque">
              <svg width="24" height="24" viewBox="0 0 1024 1024" aria-hidden="true">
                <rect width="1024" height="1024" rx="220" fill="#F0A202" />
                <g fill="none" stroke="#141B22" strokeWidth="104" strokeLinecap="round">
                  <path d="M 232 316 L 470 512" />
                  <path d="M 232 708 L 470 512" />
                  <path d="M 470 512 L 792 512" />
                </g>
              </svg>
              <span>Administration</span>
            </Link>
            <Link href="/">Vue consolidée</Link>
            <Link href="/entreprises">Entreprises</Link>
            <form action={deconnexion}>
              <button className="discret" style={{ marginTop: 0, padding: '6px 12px', fontSize: 14 }}>
                Se déconnecter
              </button>
            </form>
          </nav>
        )}
        <main>{children}</main>
      </body>
    </html>
  );
}
