'use client';

import { useActionState } from 'react';
import { importerSalaries } from '../../actions';

type Rapport = { ligne: string; resultat: string };

export function ImportSalaries({ entrepriseId }: { entrepriseId: string }) {
  const [etat, action, enCours] = useActionState(
    importerSalaries,
    null as { erreur?: string; rapport?: Rapport[] } | null,
  );

  return (
    <form action={action} className="bloc">
      <input type="hidden" name="entreprise_id" value={entrepriseId} />
      {etat?.erreur && <p className="erreur">{etat.erreur}</p>}

      <label htmlFor="csv">Liste des salariés</label>
      <textarea
        id="csv"
        name="csv"
        placeholder={'marc.durand@lafabrique.fr;Marc;Durand\njulie.petit@lafabrique.fr;Julie;Petit'}
      />
      <p className="aide">
        Une ligne par salarié : <code>email;prénom;nom</code>. Vous pouvez coller directement une
        colonne exportée d’un tableur. Les emails dont le domaine n’est pas déclaré sont refusés,
        et les comptes déjà existants sont simplement ignorés — l’import est rejouable sans risque.
      </p>

      <button disabled={enCours}>{enCours ? 'Import en cours…' : 'Importer'}</button>

      {etat?.rapport && (
        <>
          <h3>Rapport d’import</h3>
          <table>
            <thead><tr><th>Ligne</th><th>Résultat</th></tr></thead>
            <tbody>
              {etat.rapport.map((r, i) => (
                <tr key={i}><td><code>{r.ligne}</code></td><td>{r.resultat}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </form>
  );
}
