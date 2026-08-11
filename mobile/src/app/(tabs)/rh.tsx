import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { api, StatRh } from '@/services/api';
import { Attente, Bouton, Carte, Ecran, Message, Paragraphe, Titre, Vide } from '@/ui/composants';
import { couleur, espace, texte } from '@/ui/theme';
import { T } from '@/lib/textes';

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
              'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const libelleMois = (iso: string) => {
  const [annee, mois] = iso.split('-');
  return `${MOIS[Number(mois) - 1]} ${annee}`;
};

function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: espace.xs }}>
      <Text style={texte.doux}>{libelle}</Text>
      <Text style={[texte.corps, { fontWeight: '700' }]}>{valeur}</Text>
    </View>
  );
}

export default function EcranRh() {
  const [stats, setStats] = useState<StatRh[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [demandes, setDemandes] = useState<{ mois: string; statut: string }[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [lance, setLance] = useState<string | null>(null);

  useEffect(() => {
    api.statsRh().then((s) => setStats([...s].reverse())).catch((e) => setErreur(e.message));
    api.demandesAttestations().then(setDemandes).catch(() => setDemandes([]));
  }, []);

  const demanderAttestations = async () => {
    setErreur(null);
    setEnCours(true);
    try {
      const mois = await api.demanderAttestations();
      setLance(mois);
      setDemandes(await api.demandesAttestations());
    } catch (e) {
      setErreur(e instanceof Error ? e.message : T.commun.erreur);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Ecran>
      <Titre>{T.rh.titre}</Titre>
      <Paragraphe doux>{T.rh.explication}</Paragraphe>

      {erreur ? <Message type="erreur">{erreur}</Message> : null}

      {!stats ? (
        <Attente texte={T.commun.chargement} />
      ) : stats.length === 0 ? (
        <Vide titre={T.rh.vide} detail={T.rh.videDetail} />
      ) : (
        stats.map((m) => (
          <Carte key={m.mois}>
            <Text style={[texte.sousTitre, { marginTop: 0, textTransform: 'capitalize' }]}>
              {libelleMois(m.mois)}
            </Text>
            {m.masque ? (
              <>
                <Text style={[texte.corps, { color: couleur.encreDouce, marginTop: espace.sm }]}>
                  {T.rh.masque}
                </Text>
                <Text style={[texte.petit, { marginTop: espace.xs }]}>{T.rh.masqueDetail}</Text>
              </>
            ) : (
              <>
                <Ligne libelle={T.rh.km} valeur={`${m.km} km`} />
                <Ligne libelle={T.rh.trajets} valeur={String(m.trajets)} />
                <Ligne libelle={T.rh.participants} valeur={String(m.participants_actifs)} />
                <Ligne libelle={T.rh.co2} valeur={`${m.co2_evite_kg} kg`} />
              </>
            )}
          </Carte>
        ))
      )}

      {lance || demandes.some((d) => d.statut === 'en_attente') ? (
        <Message type="succes">{T.rh.attestationsLancees}</Message>
      ) : (
        <Bouton titre={T.rh.attestations} onPress={demanderAttestations} enCours={enCours} />
      )}
    </Ecran>
  );
}
