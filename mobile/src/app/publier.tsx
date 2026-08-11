import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SelecteurCommune } from '@/features/communes/selecteur-commune';
import { api, RoleTrajet } from '@/services/api';
import { Bouton, Champ, Ecran, Message, Paragraphe, Titre } from '@/ui/composants';
import { couleur, espace, rayon, texte } from '@/ui/theme';
import { T } from '@/lib/textes';

const HORAIRE = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function Publier() {
  const [role, setRole] = useState<RoleTrajet>('conducteur');
  const [depart, setDepart] = useState<string | null>(null);
  const [arrivee, setArrivee] = useState<string | null>(null);
  const [jours, setJours] = useState<number[]>([1, 2, 3, 4, 5]);
  const [aller, setAller] = useState('08:00');
  const [retour, setRetour] = useState('18:00');
  const [places, setPlaces] = useState('3');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const router = useRouter();

  const basculerJour = (jour: number) =>
    setJours((actuels) =>
      actuels.includes(jour) ? actuels.filter((j) => j !== jour) : [...actuels, jour].sort());

  const publier = async () => {
    setErreur(null);
    if (!depart || !arrivee || jours.length === 0) { setErreur(T.publier.manque); return; }
    if (!HORAIRE.test(aller) || (retour.trim() !== '' && !HORAIRE.test(retour))) {
      setErreur(T.publier.heureInvalide);
      return;
    }
    setEnCours(true);
    try {
      await api.publierTrajet({
        role,
        commune_depart: depart,
        commune_arrivee: arrivee,
        jours,
        heure_aller: aller,
        heure_retour: retour.trim() === '' ? null : retour,
        places: role === 'conducteur' ? Math.max(1, Number(places) || 1) : 1,
      });
      router.back();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : T.commun.erreur);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Ecran>
      <Titre>{T.publier.titre}</Titre>

      <Text style={[texte.petit, { textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: espace.xs }]}>
        {T.publier.role}
      </Text>
      <View style={{ flexDirection: 'row', gap: espace.sm, marginBottom: espace.md }}>
        {(['conducteur', 'passager'] as const).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRole(r)}
            style={{
              flex: 1, minHeight: 52, borderRadius: rayon.md, borderWidth: 1,
              alignItems: 'center', justifyContent: 'center',
              borderColor: role === r ? couleur.encre : couleur.bordure,
              backgroundColor: role === r ? couleur.encre : couleur.fond,
            }}
          >
            <Text style={{ fontWeight: '700', color: role === r ? couleur.fond : couleur.encre }}>
              {r === 'conducteur' ? T.publier.conducteur : T.publier.passager}
            </Text>
          </Pressable>
        ))}
      </View>

      <SelecteurCommune etiquette={T.publier.depart} valeur={depart} onChoisir={(c) => setDepart(c?.code ?? null)} />
      <SelecteurCommune etiquette={T.publier.arrivee} valeur={arrivee} onChoisir={(c) => setArrivee(c?.code ?? null)} />

      <Text style={[texte.petit, { textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: espace.xs }]}>
        {T.publier.jours}
      </Text>
      <View style={{ flexDirection: 'row', gap: espace.sm, marginBottom: espace.lg }}>
        {T.commun.jours.map((lettre, index) => {
          const jour = index + 1;
          const actif = jours.includes(jour);
          return (
            <Pressable
              key={index}
              onPress={() => basculerJour(jour)}
              accessibilityLabel={T.commun.joursLongs[index]}
              style={{
                width: 42, height: 42, borderRadius: 21, borderWidth: 1,
                alignItems: 'center', justifyContent: 'center',
                borderColor: actif ? couleur.encre : couleur.bordure,
                backgroundColor: actif ? couleur.encre : couleur.fond,
              }}
            >
              <Text style={{ fontWeight: '700', color: actif ? couleur.fond : couleur.encreDouce }}>
                {lettre}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Champ etiquette={T.publier.heureAller} value={aller} onChangeText={setAller} keyboardType="numbers-and-punctuation" placeholder="08:00" />
      <Champ etiquette={T.publier.heureRetour} value={retour} onChangeText={setRetour} keyboardType="numbers-and-punctuation" placeholder="18:00" />

      {role === 'conducteur' && (
        <Champ etiquette={T.publier.places} value={places} onChangeText={setPlaces} keyboardType="number-pad" maxLength={1} />
      )}

      {erreur ? <Message type="erreur">{erreur}</Message> : null}

      <Bouton titre={T.publier.publier} onPress={publier} enCours={enCours} />
      <Paragraphe doux> </Paragraphe>
    </Ecran>
  );
}
