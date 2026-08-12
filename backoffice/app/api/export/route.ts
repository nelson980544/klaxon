import { NextRequest, NextResponse } from 'next/server';
import { db, rpc } from '@/lib/db';
import { sessionOuverte } from '@/lib/auth';

// Les exports contiennent des données nominatives : la session est revérifiée ici,
// le cookie seul (contrôlé par le middleware) ne suffit pas.
export async function GET(requete: NextRequest) {
  if (!(await sessionOuverte())) {
    return NextResponse.json({ erreur: 'non autorisé' }, { status: 401 });
  }

  const p = requete.nextUrl.searchParams;
  const entreprise = p.get('entreprise');
  const type = p.get('type');
  const mois = p.get('mois');
  if (!entreprise || !type) return NextResponse.json({ erreur: 'paramètres manquants' }, { status: 400 });

  const { data: ent } = await db.from('entreprises').select('nom').eq('id', entreprise).single();
  if (!ent) return NextResponse.json({ erreur: 'entreprise inconnue' }, { status: 404 });

  let entetes: string[] = [];
  let lignes: (string | number)[][] = [];

  if (type === 'attestations') {
    if (!mois) return NextResponse.json({ erreur: 'mois manquant' }, { status: 400 });
    const donnees = await rpc<{ prenom: string; nom: string; email: string; km: number; montant: number }[]>(
      'attestations_du_mois', { ent: entreprise, mois_cible: `${mois}-01` });
    entetes = ['Prénom', 'Nom', 'Email', 'Kilomètres', 'Montant (€)'];
    lignes = donnees.map((d) => [d.prenom ?? '', d.nom ?? '', d.email, d.km, d.montant]);
  }

  else if (type === 'salaries') {
    const { data } = await db.from('profils')
      .select('prenom, nom, email, role, cree_le, anonymise')
      .eq('entreprise_id', entreprise).order('nom');
    entetes = ['Prénom', 'Nom', 'Email', 'Rôle', 'Inscrit le'];
    lignes = (data ?? []).filter((s) => !s.anonymise)
      .map((s) => [s.prenom ?? '', s.nom ?? '', s.email, s.role, s.cree_le.slice(0, 10)]);
  }

  else if (type === 'confirmations') {
    const { data } = await db.from('confirmations')
      .select('jour, sens, km_valides, valide_le')
      .eq('entreprise_id', entreprise).gt('km_valides', 0).order('jour', { ascending: false });
    // Volontairement sans identité : cet export sert au contrôle de volumétrie,
    // pas au suivi individuel.
    entetes = ['Jour', 'Sens', 'Kilomètres', 'Validé le'];
    lignes = (data ?? []).map((c) => [c.jour, c.sens, c.km_valides, c.valide_le ?? '']);
  }

  else if (type === 'mensuel') {
    const { data } = await db.from('confirmations')
      .select('jour, km_valides, conducteur_id, passager_id')
      .eq('entreprise_id', entreprise).gt('km_valides', 0);
    const parMois = new Map<string, { km: number; trajets: number; gens: Set<string> }>();
    for (const c of data ?? []) {
      const cle = c.jour.slice(0, 7);
      const acc = parMois.get(cle) ?? { km: 0, trajets: 0, gens: new Set<string>() };
      acc.km += Number(c.km_valides);
      acc.trajets += 1;
      acc.gens.add(c.conducteur_id);
      acc.gens.add(c.passager_id);
      parMois.set(cle, acc);
    }
    entetes = ['Mois', 'Kilomètres', 'Trajets', 'Participants', 'CO2 évité (kg)'];
    lignes = [...parMois.entries()].sort().map(([m, v]) => [m, v.km, v.trajets, v.gens.size, Math.round(v.km * 0.218 * 10) / 10]);
  }

  else return NextResponse.json({ erreur: 'type inconnu' }, { status: 400 });

  // Point-virgule et BOM : c'est ce qu'attend Excel en français, sinon les
  // accents sont illisibles et tout atterrit dans une seule colonne.
  const echapper = (v: string | number) => {
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = '﻿' + [entetes, ...lignes].map((l) => l.map(echapper).join(';')).join('\r\n');
  const nomFichier = `klaxon-${type}-${ent.nom.toLowerCase().replace(/[^a-z0-9]+/g, '-')}${mois ? `-${mois}` : ''}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nomFichier}"`,
    },
  });
}
