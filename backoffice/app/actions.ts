'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db, rpc } from '@/lib/db';
import { motDePasseValide, ouvrirSession, fermerSession, sessionOuverte } from '@/lib/auth';

// Chaque action vérifie la session elle-même. Le middleware protège l'affichage
// des pages ; ceci protège les écritures, qui sont appelées directement par le
// navigateur et ne doivent jamais dépendre d'un contrôle fait ailleurs.
async function exigerSession() {
  if (!(await sessionOuverte())) throw new Error('Session expirée — reconnectez-vous.');
}

const AUTEUR = 'back-office';

export async function connexion(_etat: unknown, form: FormData) {
  if (!motDePasseValide(String(form.get('motdepasse') ?? ''))) {
    return { erreur: 'Mot de passe incorrect.' };
  }
  await ouvrirSession();
  redirect('/');
}

export async function deconnexion() {
  await fermerSession();
  redirect('/connexion');
}

// ---------------------------------------------------------------- entreprises

export async function creerEntreprise(_etat: unknown, form: FormData) {
  await exigerSession();
  const nom = String(form.get('nom') ?? '').trim();
  const domaines = String(form.get('domaines') ?? '')
    .split(/[\s,;]+/)
    .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean);

  if (!nom) return { erreur: 'Le nom est obligatoire.' };
  if (domaines.length === 0) return { erreur: 'Au moins un domaine email est nécessaire — c’est lui qui rattache les salariés.' };

  const { data: entreprise, error } = await db
    .from('entreprises')
    .insert({
      nom,
      contact_email: String(form.get('contact_email') ?? '').trim() || null,
      prix_mensuel: Number(form.get('prix_mensuel') ?? 0),
      bareme_km: Number(form.get('bareme_km') ?? 0.25),
      seuil_masquage: Number(form.get('seuil_masquage') ?? 5),
    })
    .select()
    .single();
  if (error) return { erreur: error.message };

  const { error: erreurDomaines } = await db
    .from('domaines_email')
    .insert(domaines.map((domaine) => ({ entreprise_id: entreprise.id, domaine })));
  if (erreurDomaines) {
    // Une entreprise sans domaine est inutilisable : on annule tout plutôt que
    // de laisser une coquille vide en base.
    await db.from('entreprises').delete().eq('id', entreprise.id);
    return { erreur: `Domaine refusé (${erreurDomaines.message}). Un domaine ne peut appartenir qu’à une seule entreprise.` };
  }

  redirect(`/entreprises/${entreprise.id}`);
}

export async function modifierEntreprise(form: FormData) {
  await exigerSession();
  const id = String(form.get('id'));
  const { error } = await db
    .from('entreprises')
    .update({
      nom: String(form.get('nom')).trim(),
      contact_email: String(form.get('contact_email') ?? '').trim() || null,
      prix_mensuel: Number(form.get('prix_mensuel')),
      bareme_km: Number(form.get('bareme_km')),
      seuil_masquage: Number(form.get('seuil_masquage')),
      statut_abonnement: String(form.get('statut_abonnement')),
      actif: form.get('actif') === 'on',
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/entreprises/${id}`);
}

export async function ajouterDomaine(form: FormData) {
  await exigerSession();
  const id = String(form.get('entreprise_id'));
  const domaine = String(form.get('domaine')).trim().toLowerCase().replace(/^@/, '');
  const { error } = await db.from('domaines_email').insert({ entreprise_id: id, domaine });
  if (error) throw new Error(`Domaine refusé : ${error.message}`);
  revalidatePath(`/entreprises/${id}`);
}

export async function retirerDomaine(form: FormData) {
  await exigerSession();
  const id = String(form.get('entreprise_id'));
  await db.from('domaines_email').delete().eq('id', String(form.get('domaine_id')));
  revalidatePath(`/entreprises/${id}`);
}

// ---------------------------------------------------------------- salariés

export async function changerRole(form: FormData) {
  await exigerSession();
  const entreprise = String(form.get('entreprise_id'));
  const salarie = String(form.get('salarie_id'));
  const role = String(form.get('role')) === 'rh' ? 'rh' : 'salarie';

  const { error } = await db.from('profils').update({ role }).eq('id', salarie);
  if (error) throw new Error(error.message);

  await db.from('journal_corrections').insert({
    entreprise_id: entreprise,
    auteur: AUTEUR,
    cible: `profil ${salarie}`,
    action: role === 'rh' ? 'désignation comme RH' : 'retrait du rôle RH',
    motif: String(form.get('motif') ?? 'décision éditeur'),
  });
  revalidatePath(`/entreprises/${entreprise}`);
}

export async function importerSalaries(_etat: unknown, form: FormData) {
  await exigerSession();
  const entreprise = String(form.get('entreprise_id'));
  const brut = String(form.get('csv') ?? '').trim();
  if (!brut) return { erreur: 'Collez au moins une ligne.' };

  // Format attendu : email;prénom;nom — le séparateur peut être ; ou ,
  const lignes = brut.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const domaines = (await db.from('domaines_email').select('domaine').eq('entreprise_id', entreprise))
    .data?.map((d) => d.domaine) ?? [];

  const rapport: { ligne: string; resultat: string }[] = [];

  for (const ligne of lignes) {
    const [email, prenom, nom] = ligne.split(/[;,\t]/).map((c) => (c ?? '').trim());
    if (!email || !email.includes('@')) {
      rapport.push({ ligne, resultat: '⛔ email absent ou invalide' });
      continue;
    }
    const domaine = email.split('@')[1].toLowerCase();
    if (!domaines.includes(domaine)) {
      rapport.push({ ligne, resultat: `⛔ domaine « ${domaine} » non déclaré pour cette entreprise` });
      continue;
    }

    // On crée le compte : le déclencheur de la base rattache le profil tout seul.
    const { data, error } = await db.auth.admin.createUser({
      email: email.toLowerCase(),
      email_confirm: true,
    });
    if (error) {
      rapport.push({ ligne, resultat: error.message.includes('already') ? '↷ compte déjà existant' : `⛔ ${error.message}` });
      continue;
    }
    if (prenom || nom) {
      await db.from('profils').update({ prenom: prenom || null, nom: nom || null }).eq('id', data.user!.id);
    }
    rapport.push({ ligne, resultat: '✅ créé' });
  }

  revalidatePath(`/entreprises/${entreprise}`);
  return { rapport };
}

// ---------------------------------------------------------------- attestations

export async function genererAttestations(form: FormData) {
  await exigerSession();
  const entreprise = String(form.get('entreprise_id'));
  const mois = String(form.get('mois'));
  const nb = await rpc<number>('generer_attestations', { ent: entreprise, mois_cible: `${mois}-01` });

  await db.from('journal_corrections').insert({
    entreprise_id: entreprise,
    auteur: AUTEUR,
    cible: `attestations ${mois}`,
    action: `génération de ${nb} attestation(s)`,
    motif: 'demande RH ou décision éditeur',
  });
  revalidatePath(`/entreprises/${entreprise}`);
}

export async function annulerConfirmation(form: FormData) {
  await exigerSession();
  const entreprise = String(form.get('entreprise_id'));
  const motif = String(form.get('motif') ?? '').trim();
  if (!motif) throw new Error('Un motif est obligatoire : c’est lui qui tient devant un contrôle.');
  await rpc('corriger_confirmation', {
    confirmation_id: String(form.get('confirmation_id')),
    auteur: AUTEUR,
    motif,
  });
  revalidatePath(`/entreprises/${entreprise}`);
}

// ---------------------------------------------------------------- facturation

export async function emettreFacture(form: FormData) {
  await exigerSession();
  const entreprise = String(form.get('entreprise_id'));
  const mois = String(form.get('mois'));
  await rpc('emettre_facture', { ent: entreprise, periode_cible: `${mois}-01` });
  revalidatePath(`/entreprises/${entreprise}`);
}

export async function marquerFacturePayee(form: FormData) {
  await exigerSession();
  const entreprise = String(form.get('entreprise_id'));
  await db
    .from('factures')
    .update({ statut: 'payee', payee_le: new Date().toISOString() })
    .eq('id', String(form.get('facture_id')));
  revalidatePath(`/entreprises/${entreprise}`);
}
