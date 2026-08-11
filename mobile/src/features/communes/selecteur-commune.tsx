import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { api, Commune } from '@/services/api';
import { Champ } from '@/ui/composants';
import { couleur, espace, rayon, texte } from '@/ui/theme';
import { T } from '@/lib/textes';

// Pas de carte, pas de géolocalisation : on tape le nom ou le code postal,
// on choisit dans la liste. C'est le choix produit de la v1, et c'est aussi
// ce qui garde l'app utilisable dans un ascenseur sans réseau correct.
export function SelecteurCommune({
  etiquette, valeur, nomInitial, onChoisir,
}: {
  etiquette: string;
  valeur: string | null;
  nomInitial?: string | null;
  onChoisir: (commune: Commune | null) => void;
}) {
  const [recherche, setRecherche] = useState(nomInitial ?? '');
  const [resultats, setResultats] = useState<Commune[]>([]);
  const [choisie, setChoisie] = useState(!!valeur);

  useEffect(() => {
    if (choisie || recherche.trim().length < 2) { setResultats([]); return; }
    let vivant = true;
    const minuteur = setTimeout(async () => {
      try {
        const trouvees = await api.chercherCommune(recherche.trim());
        if (vivant) setResultats(trouvees);
      } catch { if (vivant) setResultats([]); }
    }, 250);
    return () => { vivant = false; clearTimeout(minuteur); };
  }, [recherche, choisie]);

  return (
    <View>
      <Champ
        etiquette={etiquette}
        value={recherche}
        placeholder={T.publier.chercher}
        autoCorrect={false}
        onChangeText={(t) => { setRecherche(t); setChoisie(false); onChoisir(null); }}
      />
      {resultats.length > 0 && (
        <View style={{
          borderWidth: 1, borderColor: couleur.bordure, borderRadius: rayon.md,
          marginTop: -espace.sm, marginBottom: espace.md, overflow: 'hidden',
        }}>
          {resultats.map((c) => (
            <Pressable
              key={c.code}
              onPress={() => {
                setRecherche(c.nom);
                setChoisie(true);
                setResultats([]);
                onChoisir(c);
              }}
              style={({ pressed }) => ({
                padding: espace.md,
                borderBottomWidth: 1,
                borderBottomColor: couleur.bordure,
                backgroundColor: pressed ? couleur.surface : couleur.fond,
              })}
            >
              <Text style={texte.corps}>{c.nom}</Text>
              <Text style={texte.petit}>{c.code_postal}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
