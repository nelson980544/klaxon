// Toutes les entrées de la base, en un seul endroit.
// L'app n'écrit jamais l'entreprise ni l'auteur d'un trajet : la base les déduit
// du compte connecté et refuse tout le reste.
import { rpc, supabase } from './supabase';

export type Role = 'salarie' | 'rh';
export type RoleTrajet = 'conducteur' | 'passager';
export type Sens = 'aller' | 'retour';

export type Profil = {
  id: string;
  email: string;
  prenom: string | null;
  nom: string | null;
  commune_code: string | null;
  site_travail: string | null;
  role: Role;
  entreprise: string;
  profil_complet: boolean;
};

export type Trajet = {
  id: string;
  auteur: string;
  est_le_mien: boolean;
  role: RoleTrajet;
  depart: string;
  arrivee: string;
  jours: number[];
  heure_aller: string;
  heure_retour: string | null;
  places: number;
  places_restantes: number;
  distance_km: number;
  deja_demande: boolean;
};

export type Demande = {
  id: string;
  trajet_id: string;
  passager: string;
  depart: string;
  arrivee: string;
  heure_aller: string;
  statut: string;
};

export type ConfirmationDuJour = {
  id: string;
  sens: Sens;
  avec: string;
  depart: string;
  arrivee: string;
  heure: string;
  distance_km: number;
  je_suis_conducteur: boolean;
  j_ai_confirme: boolean;
  l_autre_a_confirme: boolean;
  valide: boolean;
};

export type Stats = {
  km_mois: number;
  km_annee: number;
  trajets_mois: number;
  co2_kg: number;
  montant_estime: number;
};

export type StatRh = {
  mois: string;
  km: number | null;
  trajets: number | null;
  participants_actifs: number | null;
  co2_evite_kg: number | null;
  masque: boolean;
};

export type Commune = { code: string; nom: string; code_postal: string; departement: string };

export const api = {
  verifierDomaine: (adresse: string) =>
    rpc<{ autorise: boolean; entreprise: string | null }[]>('verifier_domaine', { adresse }),

  monProfil: async () => (await rpc<Profil[]>('mon_profil'))[0] ?? null,

  majProfil: async (champs: Partial<Pick<Profil, 'prenom' | 'nom' | 'commune_code' | 'site_travail'>>) => {
    const { data: session } = await supabase.auth.getUser();
    const id = session.user?.id;
    if (!id) throw new Error('Non connecté');
    const { error } = await supabase.from('profils').update(champs).eq('id', id);
    if (error) throw new Error(error.message);
  },

  chercherCommune: (recherche: string) => rpc<Commune[]>('chercher_commune', { recherche }),

  trajetsCollegues: (filtres: {
    filtre_depart?: string | null;
    filtre_arrivee?: string | null;
    filtre_heure_min?: string | null;
    filtre_heure_max?: string | null;
  } = {}) => rpc<Trajet[]>('trajets_collegues', filtres),

  publierTrajet: async (trajet: {
    role: RoleTrajet;
    commune_depart: string;
    commune_arrivee: string;
    jours: number[];
    heure_aller: string;
    heure_retour: string | null;
    places: number;
  }) => {
    const { error } = await supabase.from('trajets').insert(trajet);
    if (error) throw new Error(error.message);
  },

  desactiverTrajet: async (id: string) => {
    const { error } = await supabase.from('trajets').update({ actif: false }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  demanderPlace: async (trajet_id: string) => {
    const { error } = await supabase.from('participations').insert({ trajet_id });
    if (error) throw new Error(error.message);
  },

  mesDemandes: () => rpc<Demande[]>('mes_demandes'),

  repondreDemande: async (id: string, accepte: boolean) => {
    const { error } = await supabase
      .from('participations')
      .update({ statut: accepte ? 'acceptee' : 'refusee' })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  genererConfirmations: () => rpc<number>('generer_confirmations_du_jour'),
  confirmationsDuJour: () => rpc<ConfirmationDuJour[]>('mes_confirmations_du_jour'),
  confirmer: (confirmation_id: string) => rpc<boolean>('confirmer', { confirmation_id }),

  mesStats: async () =>
    (await rpc<Stats[]>('mes_stats'))[0] ??
    { km_mois: 0, km_annee: 0, trajets_mois: 0, co2_kg: 0, montant_estime: 0 },

  statsRh: (nb_mois = 12) => rpc<StatRh[]>('rh_stats_mensuels', { nb_mois }),

  demanderAttestations: (mois_demande: string | null = null) =>
    rpc<string>('demander_attestations', { mois_demande }),

  demandesAttestations: () =>
    rpc<{ mois: string; statut: string; demande_le: string }[]>('mes_demandes_attestations'),

  supprimerMonCompte: async () => {
    await rpc('supprimer_mon_compte');
    await supabase.auth.signOut();
  },
};
