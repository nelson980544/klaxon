import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db, euros, nombre, moisLisible, type Entreprise } from '@/lib/db';
import {
  modifierEntreprise, ajouterDomaine, retirerDomaine, changerRole,
  genererAttestations, annulerConfirmation, emettreFacture, marquerFacturePayee,
} from '../../actions';
import { ImportSalaries } from './import-salaries';

export const dynamic = 'force-dynamic';

const moisPrecedent = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
};

export default async function FicheEntreprise({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: entreprise } = await db.from('entreprises').select('*').eq('id', id).single<Entreprise>();
  if (!entreprise) notFound();

  const [domaines, salaries, demandes, factures, corrections, confirmations, attestations] = await Promise.all([
    db.from('domaines_email').select('id, domaine').eq('entreprise_id', id).order('domaine'),
    db.from('profils').select('id, email, prenom, nom, role, anonymise, cree_le').eq('entreprise_id', id).order('nom'),
    db.from('demandes_attestations').select('mois, statut, demande_le').eq('entreprise_id', id).order('mois', { ascending: false }),
    db.from('factures').select('*').eq('entreprise_id', id).order('periode', { ascending: false }),
    db.from('journal_corrections').select('*').eq('entreprise_id', id).order('fait_le', { ascending: false }).limit(15),
    db.from('confirmations').select('id, jour, sens, km_valides, conducteur_id, passager_id')
      .eq('entreprise_id', id).gt('km_valides', 0).order('jour', { ascending: false }).limit(12),
    db.from('attestations').select('mois, km, montant').eq('entreprise_id', id),
  ]);

  const effectif = (salaries.data ?? []).filter((p) => !p.anonymise);
  const nomDe = (idProfil: string) => {
    const p = effectif.find((x) => x.id === idProfil);
    return p ? `${p.prenom ?? ''} ${p.nom ?? ''}`.trim() || p.email : 'compte supprimé';
  };

  const attestationsParMois = new Map<string, { n: number; km: number; montant: number }>();
  for (const a of attestations.data ?? []) {
    const cle = a.mois.slice(0, 7);
    const acc = attestationsParMois.get(cle) ?? { n: 0, km: 0, montant: 0 };
    attestationsParMois.set(cle, { n: acc.n + 1, km: acc.km + Number(a.km), montant: acc.montant + Number(a.montant) });
  }

  return (
    <>
      <p style={{ marginTop: 24 }}><Link href="/">← Vue consolidée</Link></p>
      <h1>
        {entreprise.nom}{' '}
        <span className={`etiquette ${entreprise.statut_abonnement}`}>{entreprise.statut_abonnement}</span>
        {entreprise.demo && <span className="etiquette demo"> démo</span>}
      </h1>

      {/* ---------------------------------------------------------------- réglages */}
      <h2>Réglages</h2>
      <form action={modifierEntreprise} className="bloc">
        <input type="hidden" name="id" value={entreprise.id} />
        <div className="champs">
          <div>
            <label htmlFor="nom">Nom</label>
            <input id="nom" name="nom" type="text" defaultValue={entreprise.nom} />
          </div>
          <div>
            <label htmlFor="contact_email">Contact client</label>
            <input id="contact_email" name="contact_email" type="email" defaultValue={entreprise.contact_email ?? ''} />
          </div>
          <div>
            <label htmlFor="statut_abonnement">Abonnement</label>
            <select id="statut_abonnement" name="statut_abonnement" defaultValue={entreprise.statut_abonnement}>
              <option value="essai">essai</option>
              <option value="actif">actif</option>
              <option value="suspendu">suspendu</option>
              <option value="resilie">résilié</option>
            </select>
          </div>
          <div>
            <label htmlFor="prix_mensuel">Prix / salarié actif / mois</label>
            <input id="prix_mensuel" name="prix_mensuel" type="number" step="0.5" defaultValue={entreprise.prix_mensuel} />
          </div>
          <div>
            <label htmlFor="bareme_km">Barème (€/km)</label>
            <input id="bareme_km" name="bareme_km" type="number" step="0.01" defaultValue={entreprise.bareme_km} />
          </div>
          <div>
            <label htmlFor="seuil_masquage">Seuil de masquage RH</label>
            <input id="seuil_masquage" name="seuil_masquage" type="number" min="3" defaultValue={entreprise.seuil_masquage} />
          </div>
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16 }}>
          <input type="checkbox" name="actif" defaultChecked={entreprise.actif} style={{ width: 'auto' }} />
          Entreprise active (décochée, plus aucun salarié ne peut s’inscrire ni se connecter)
        </label>
        <button>Enregistrer</button>
      </form>

      {/* ---------------------------------------------------------------- domaines */}
      <h2>Domaines email</h2>
      <p className="aide">C’est ce qui rattache un salarié à cette entreprise, et rien d’autre.</p>
      {(domaines.data ?? []).length === 0 ? (
        <div className="vide">Aucun domaine : personne ne peut s’inscrire.</div>
      ) : (
        <table>
          <tbody>
            {domaines.data!.map((d) => (
              <tr key={d.id}>
                <td>@{d.domaine}</td>
                <td style={{ textAlign: 'right' }}>
                  <form action={retirerDomaine}>
                    <input type="hidden" name="entreprise_id" value={id} />
                    <input type="hidden" name="domaine_id" value={d.id} />
                    <button className="discret" style={{ marginTop: 0, padding: '4px 10px', fontSize: 13 }}>Retirer</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <form action={ajouterDomaine} className="ligne-actions" style={{ marginTop: 12 }}>
        <input type="hidden" name="entreprise_id" value={id} />
        <input name="domaine" type="text" placeholder="nouveaudomaine.fr" style={{ maxWidth: 280 }} />
        <button className="discret">Ajouter</button>
      </form>

      {/* ---------------------------------------------------------------- salariés */}
      <h2>Salariés ({effectif.length})</h2>
      {effectif.length === 0 ? (
        <div className="vide">Aucun salarié inscrit. Ils peuvent s’inscrire seuls, ou vous pouvez les importer ci-dessous.</div>
      ) : (
        <table>
          <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th /></tr></thead>
          <tbody>
            {effectif.map((p) => (
              <tr key={p.id}>
                <td>{`${p.prenom ?? ''} ${p.nom ?? ''}`.trim() || <em>profil incomplet</em>}</td>
                <td>{p.email}</td>
                <td>{p.role === 'rh' ? <span className="etiquette actif">RH</span> : 'salarié'}</td>
                <td style={{ textAlign: 'right' }}>
                  <form action={changerRole} className="ligne-actions" style={{ justifyContent: 'flex-end' }}>
                    <input type="hidden" name="entreprise_id" value={id} />
                    <input type="hidden" name="salarie_id" value={p.id} />
                    <input type="hidden" name="role" value={p.role === 'rh' ? 'salarie' : 'rh'} />
                    <button className="discret" style={{ padding: '4px 10px', fontSize: 13 }}>
                      {p.role === 'rh' ? 'Retirer le rôle RH' : 'Désigner comme RH'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Importer des salariés</h3>
      <ImportSalaries entrepriseId={id} />

      {/* ---------------------------------------------------------------- attestations */}
      <h2>Attestations du forfait mobilités durables</h2>
      {(demandes.data ?? []).filter((d) => d.statut === 'en_attente').length > 0 && (
        <p className="erreur">
          Demande(s) RH en attente :{' '}
          {demandes.data!.filter((d) => d.statut === 'en_attente').map((d) => moisLisible(d.mois)).join(', ')}
        </p>
      )}

      <form action={genererAttestations} className="bloc">
        <input type="hidden" name="entreprise_id" value={id} />
        <label htmlFor="mois">Mois à générer</label>
        <div className="ligne-actions">
          <input id="mois" name="mois" type="month" defaultValue={moisPrecedent()} style={{ maxWidth: 220 }} />
          <button>Générer</button>
        </div>
        <p className="aide">
          Calcule, pour chaque salarié, les kilomètres qu’il a réellement confirmés ce mois-là —
          en conducteur comme en passager — et le montant correspondant au barème. Rejouable :
          régénérer un mois écrase les valeurs précédentes.
        </p>
      </form>

      {attestationsParMois.size > 0 && (
        <table>
          <thead><tr><th>Mois</th><th>Salariés</th><th>Kilomètres</th><th>Montant total</th><th /></tr></thead>
          <tbody>
            {[...attestationsParMois.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([mois, v]) => (
              <tr key={mois}>
                <td>{moisLisible(mois)}</td>
                <td>{v.n}</td>
                <td>{nombre(v.km)} km</td>
                <td>{euros(v.montant)}</td>
                <td><a href={`/api/export?entreprise=${id}&mois=${mois}&type=attestations`}>Exporter en CSV</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ---------------------------------------------------------------- facturation */}
      <h2>Facturation</h2>
      <form action={emettreFacture} className="bloc">
        <input type="hidden" name="entreprise_id" value={id} />
        <label htmlFor="mois-facture">Période à facturer</label>
        <div className="ligne-actions">
          <input id="mois-facture" name="mois" type="month" defaultValue={moisPrecedent()} style={{ maxWidth: 220 }} />
          <button>Émettre la facture</button>
        </div>
        <p className="aide">
          Le montant est calculé sur les <strong>salariés réellement actifs</strong> du mois (au moins
          un trajet confirmé) × {euros(entreprise.prix_mensuel)}. Aucun encaissement n’est automatisé :
          la facture est un document de suivi, le règlement se fait par virement.
        </p>
      </form>

      {(factures.data ?? []).length > 0 && (
        <table>
          <thead><tr><th>Numéro</th><th>Période</th><th>Actifs</th><th>Montant HT</th><th>Statut</th><th /></tr></thead>
          <tbody>
            {factures.data!.map((f) => (
              <tr key={f.id}>
                <td><code>{f.numero}</code></td>
                <td>{moisLisible(f.periode)}</td>
                <td>{f.salaries_actifs}</td>
                <td>{euros(Number(f.montant_ht))}</td>
                <td><span className={`etiquette ${f.statut === 'payee' ? 'actif' : 'essai'}`}>{f.statut}</span></td>
                <td style={{ textAlign: 'right' }}>
                  {f.statut === 'emise' && (
                    <form action={marquerFacturePayee}>
                      <input type="hidden" name="entreprise_id" value={id} />
                      <input type="hidden" name="facture_id" value={f.id} />
                      <button className="discret" style={{ marginTop: 0, padding: '4px 10px', fontSize: 13 }}>Marquer payée</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ---------------------------------------------------------------- corrections */}
      <h2>Corrections</h2>
      <p className="aide">
        Annuler une confirmation retire ses kilomètres. Chaque correction est tracée avec son motif —
        c’est cette trace qui tient si l’URSSAF conteste un forfait versé.
      </p>
      {(confirmations.data ?? []).length === 0 ? (
        <div className="vide">Aucun trajet confirmé pour l’instant.</div>
      ) : (
        <table>
          <thead><tr><th>Jour</th><th>Trajet</th><th>Km</th><th>Annuler</th></tr></thead>
          <tbody>
            {confirmations.data!.map((c) => (
              <tr key={c.id}>
                <td>{new Date(c.jour).toLocaleDateString('fr-FR')} ({c.sens})</td>
                <td>{nomDe(c.conducteur_id)} → {nomDe(c.passager_id)}</td>
                <td>{c.km_valides}</td>
                <td>
                  <form action={annulerConfirmation} className="ligne-actions">
                    <input type="hidden" name="entreprise_id" value={id} />
                    <input type="hidden" name="confirmation_id" value={c.id} />
                    <input name="motif" type="text" placeholder="motif obligatoire" required style={{ maxWidth: 220 }} />
                    <button className="danger" style={{ padding: '6px 12px', fontSize: 13 }}>Annuler</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Journal</h3>
      {(corrections.data ?? []).length === 0 ? (
        <div className="vide">Aucune intervention enregistrée.</div>
      ) : (
        <table>
          <thead><tr><th>Date</th><th>Auteur</th><th>Action</th><th>Motif</th></tr></thead>
          <tbody>
            {corrections.data!.map((c) => (
              <tr key={c.id}>
                <td>{new Date(c.fait_le).toLocaleString('fr-FR')}</td>
                <td>{c.auteur}</td>
                <td>{c.action}<br /><span className="aide">{c.cible}</span></td>
                <td>{c.motif}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Exports</h2>
      <p>
        <a href={`/api/export?entreprise=${id}&type=salaries`}>Salariés (CSV)</a> ·{' '}
        <a href={`/api/export?entreprise=${id}&type=confirmations`}>Trajets confirmés (CSV)</a> ·{' '}
        <a href={`/api/export?entreprise=${id}&type=mensuel`}>Synthèse mensuelle (CSV)</a>
      </p>
    </>
  );
}
