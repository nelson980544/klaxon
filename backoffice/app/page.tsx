import Link from 'next/link';
import { db, euros, nombre } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function VueConsolidee() {
  const [entreprises, profils, confirmations, factures] = await Promise.all([
    db.from('entreprises').select('id, nom, actif, demo, statut_abonnement, prix_mensuel'),
    db.from('profils').select('id, entreprise_id, role, anonymise'),
    db.from('confirmations').select('entreprise_id, km_valides, jour').gt('km_valides', 0),
    db.from('factures').select('montant_ht, statut'),
  ]);

  const toutes = entreprises.data ?? [];
  const clientes = toutes.filter((e) => !e.demo);
  const conf = confirmations.data ?? [];

  const km = conf.reduce((t, c) => t + Number(c.km_valides), 0);
  const co2 = (km * 218) / 1000;
  const salaries = (profils.data ?? []).filter((p) => !p.anonymise).length;
  const impayé = (factures.data ?? [])
    .filter((f) => f.statut === 'emise')
    .reduce((t, f) => t + Number(f.montant_ht), 0);
  const revenuMensuel = clientes
    .filter((e) => e.statut_abonnement === 'actif')
    .reduce((t, e) => t + Number(e.prix_mensuel), 0);

  // Kilomètres par entreprise, pour classer les clients par usage réel.
  const parEntreprise = new Map<string, number>();
  for (const c of conf) parEntreprise.set(c.entreprise_id, (parEntreprise.get(c.entreprise_id) ?? 0) + Number(c.km_valides));

  return (
    <>
      <h1 style={{ marginTop: 32 }}>Vue consolidée</h1>
      <p className="chapo">Tous clients confondus. Les entreprises de démonstration sont exclues des chiffres commerciaux.</p>

      <div className="chiffres">
        <div className="chiffre"><div className="valeur">{clientes.length}</div><div className="libelle">entreprises clientes</div></div>
        <div className="chiffre"><div className="valeur">{nombre(salaries)}</div><div className="libelle">salariés inscrits</div></div>
        <div className="chiffre"><div className="valeur">{nombre(conf.length)}</div><div className="libelle">trajets confirmés</div></div>
        <div className="chiffre"><div className="valeur">{nombre(km)}</div><div className="libelle">kilomètres covoiturés</div></div>
        <div className="chiffre"><div className="valeur">{nombre(co2)} kg</div><div className="libelle">CO₂ évité</div></div>
      </div>

      <div className="chiffres">
        <div className="chiffre"><div className="valeur">{euros(revenuMensuel)}</div><div className="libelle">revenu mensuel récurrent</div></div>
        <div className="chiffre"><div className="valeur">{euros(impayé)}</div><div className="libelle">factures émises non payées</div></div>
      </div>

      <h2>Les entreprises</h2>
      {toutes.length === 0 ? (
        <div className="vide">
          <p>Aucune entreprise pour l’instant.</p>
          <Link href="/entreprises">En créer une</Link>
        </div>
      ) : (
        <table>
          <thead>
            <tr><th>Entreprise</th><th>Abonnement</th><th>Salariés</th><th>Kilomètres</th><th /></tr>
          </thead>
          <tbody>
            {toutes
              .sort((a, b) => (parEntreprise.get(b.id) ?? 0) - (parEntreprise.get(a.id) ?? 0))
              .map((e) => {
                const effectif = (profils.data ?? []).filter((p) => p.entreprise_id === e.id && !p.anonymise);
                return (
                  <tr key={e.id}>
                    <td>
                      <Link href={`/entreprises/${e.id}`}>{e.nom}</Link>{' '}
                      {e.demo && <span className="etiquette demo">démo</span>}
                      {!e.actif && <span className="etiquette suspendu">désactivée</span>}
                    </td>
                    <td><span className={`etiquette ${e.statut_abonnement}`}>{e.statut_abonnement}</span></td>
                    <td>{effectif.length}{effectif.some((p) => p.role === 'rh') ? '' : ' (aucun RH)'}</td>
                    <td>{nombre(parEntreprise.get(e.id) ?? 0)} km</td>
                    <td><Link href={`/entreprises/${e.id}`}>Ouvrir</Link></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      )}
    </>
  );
}
