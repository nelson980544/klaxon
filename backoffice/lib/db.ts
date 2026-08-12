import { createClient } from '@supabase/supabase-js';

// Le back-office est le SEUL endroit où vit la clé de service — celle qui ignore
// toutes les règles d'isolation de la base. Elle n'est jamais envoyée au
// navigateur : ce fichier n'est importé que par du code serveur.
// C'est aussi pour ça que le back-office est une application séparée de l'app
// mobile et du site public, sur son propre domaine.
if (typeof window !== 'undefined') {
  throw new Error('lib/db.ts ne doit jamais être chargé côté navigateur');
}

export const db = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export type Entreprise = {
  id: string;
  nom: string;
  actif: boolean;
  seuil_masquage: number;
  bareme_km: number;
  co2_g_par_km: number;
  demo: boolean;
  prix_mensuel: number;
  statut_abonnement: 'essai' | 'actif' | 'suspendu' | 'resilie';
  debut_abonnement: string | null;
  contact_email: string | null;
  cree_le: string;
};

/** Exécute une fonction SQL et renvoie son résultat, en remontant l'erreur telle quelle. */
export async function rpc<T>(nom: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await db.rpc(nom, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const euros = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

export const nombre = (n: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

export const moisLisible = (iso: string) =>
  new Date(iso + (iso.length === 7 ? '-01' : '')).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
