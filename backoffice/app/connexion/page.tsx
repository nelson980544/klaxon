'use client';

import { useActionState } from 'react';
import { connexion } from '../actions';

export default function Connexion() {
  const [etat, action, enCours] = useActionState(connexion, null as { erreur?: string } | null);

  return (
    <div style={{ maxWidth: 380, margin: '18vh auto 0' }}>
      <h1 style={{ fontSize: 28 }}>Administration Klaxon</h1>
      <p className="aide" style={{ marginBottom: 24 }}>
        Accès réservé à l’éditeur. Cet espace donne accès aux données de toutes les entreprises
        clientes.
      </p>

      <form action={action} className="bloc">
        {etat?.erreur && <p className="erreur">{etat.erreur}</p>}
        <label htmlFor="motdepasse">Mot de passe</label>
        <input id="motdepasse" name="motdepasse" type="password" autoFocus autoComplete="current-password" />
        <button disabled={enCours}>{enCours ? 'Vérification…' : 'Entrer'}</button>
      </form>
    </div>
  );
}
