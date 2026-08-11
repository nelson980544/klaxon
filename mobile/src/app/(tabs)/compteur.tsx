import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { api, Stats } from '@/services/api';
import { Attente, Carte, Ecran, Message, Titre } from '@/ui/composants';
import { espace, texte } from '@/ui/theme';
import { T } from '@/lib/textes';

function Chiffre({ valeur, unite, libelle }: { valeur: number; unite: string; libelle: string }) {
  return (
    <Carte>
      <Text style={texte.petit}>{libelle}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: espace.xs }}>
        <Text style={texte.chiffre}>{valeur}</Text>
        <Text style={[texte.doux, { marginLeft: espace.sm }]}>{unite}</Text>
      </View>
    </Carte>
  );
}

export default function EcranCompteur() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    api.mesStats().then(setStats).catch((e) => setErreur(e.message));
  }, []);

  return (
    <Ecran>
      <Titre>{T.compteur.titre}</Titre>
      {erreur ? <Message type="erreur">{erreur}</Message> : null}
      {!stats ? (
        <Attente texte={T.commun.chargement} />
      ) : (
        <>
          <Chiffre valeur={stats.km_mois} unite="km" libelle={T.compteur.kmMois} />
          <Chiffre valeur={stats.trajets_mois} unite="trajets" libelle={T.compteur.trajets} />
          <Chiffre valeur={stats.km_annee} unite="km" libelle={T.compteur.kmAnnee} />
          <Chiffre valeur={stats.co2_kg} unite="kg" libelle={T.compteur.co2} />
          <Chiffre valeur={stats.montant_estime} unite="€" libelle={T.compteur.forfait} />
          <Text style={texte.petit}>{T.compteur.forfaitNote}</Text>
        </>
      )}
    </Ecran>
  );
}
