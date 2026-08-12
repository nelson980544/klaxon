import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

// Accès réservé à l'éditeur. Un seul mot de passe, défini par variable
// d'environnement — jamais dans le code, jamais dans le dépôt.
//
// ⚠️ Limite assumée et documentée : il n'y a pas de second facteur ici. Le
// back-office donne accès à TOUTES les entreprises clientes ; ce mot de passe
// doit donc être long, unique, et rangé dans un gestionnaire de mots de passe.
// L'ajout d'un second facteur est noté dans PROGRESS.md.

const COOKIE = 'klaxon_admin';

function signature(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error('ADMIN_PASSWORD absent de la configuration');
  return createHmac('sha256', secret).update('klaxon-backoffice-v1').digest('hex');
}

/** Comparaison à durée constante : ne laisse pas deviner le mot de passe caractère par caractère. */
export function motDePasseValide(saisi: string): boolean {
  const attendu = Buffer.from(process.env.ADMIN_PASSWORD ?? '');
  const recu = Buffer.from(saisi ?? '');
  if (attendu.length === 0 || attendu.length !== recu.length) return false;
  return timingSafeEqual(attendu, recu);
}

export async function ouvrirSession() {
  (await cookies()).set(COOKIE, signature(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 heures : une journée de travail, pas plus
  });
}

export async function fermerSession() {
  (await cookies()).delete(COOKIE);
}

export async function sessionOuverte(): Promise<boolean> {
  const valeur = (await cookies()).get(COOKIE)?.value;
  if (!valeur) return false;
  try {
    const attendu = Buffer.from(signature());
    const recu = Buffer.from(valeur);
    return attendu.length === recu.length && timingSafeEqual(attendu, recu);
  } catch {
    return false;
  }
}
