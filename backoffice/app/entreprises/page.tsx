'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { creerEntreprise } from '../actions';

export default function NouvelleEntreprise() {
  const [etat, action, enCours] = useActionState(creerEntreprise, null as { erreur?: string } | null);

  return (
    <>
      <h1 style={{ marginTop: 32 }}>Nouvelle entreprise</h1>
      <p className="chapo">
        Créer l’espace d’un client. Dès que ses domaines email sont déclarés, ses salariés peuvent
        s’inscrire seuls — vous n’avez rien d’autre à faire.
      </p>

      <form action={action} className="bloc">
        {etat?.erreur && <p className="erreur">{etat.erreur}</p>}

        <label htmlFor="nom">Nom de l’entreprise</label>
        <input id="nom" name="nom" type="text" placeholder="La Fabrique" required />

        <label htmlFor="domaines">Domaines email</label>
        <input id="domaines" name="domaines" type="text" placeholder="lafabrique.fr, lafabrique.com" />
        <p className="aide">
          Séparés par des virgules. C’est le rattachement : un salarié qui s’inscrit avec
          <code> prenom@lafabrique.fr</code> rejoint automatiquement cette entreprise, et personne
          d’autre ne peut le faire. Un domaine ne peut appartenir qu’à une seule entreprise.
        </p>

        <label htmlFor="contact_email">Contact chez le client (facultatif)</label>
        <input id="contact_email" name="contact_email" type="email" placeholder="drh@lafabrique.fr" />

        <div className="champs">
          <div>
            <label htmlFor="prix_mensuel">Prix par salarié actif et par mois</label>
            <input id="prix_mensuel" name="prix_mensuel" type="number" step="0.5" defaultValue="2" />
            <p className="aide">Facturé uniquement pour les salariés ayant réellement covoituré.</p>
          </div>
          <div>
            <label htmlFor="bareme_km">Barème kilométrique (€/km)</label>
            <input id="bareme_km" name="bareme_km" type="number" step="0.01" defaultValue="0.25" />
            <p className="aide">Sert au montant indicatif du forfait mobilités durables.</p>
          </div>
          <div>
            <label htmlFor="seuil_masquage">Seuil de masquage RH</label>
            <input id="seuil_masquage" name="seuil_masquage" type="number" min="3" defaultValue="5" />
            <p className="aide">
              En dessous de ce nombre de participants, les chiffres RH sont masqués. Ne descendez
              pas sous 5 sans raison : c’est le seuil défendable devant un délégué à la protection
              des données.
            </p>
          </div>
        </div>

        <button disabled={enCours}>{enCours ? 'Création…' : 'Créer l’entreprise'}</button>
      </form>

      <p><Link href="/">← Retour à la vue consolidée</Link></p>
    </>
  );
}
