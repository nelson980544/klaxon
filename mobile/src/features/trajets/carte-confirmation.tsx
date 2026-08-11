import { useState } from 'react';
import { Text, View } from 'react-native';
import { ConfirmationDuJour } from '@/services/api';
import { Bouton, Carte } from '@/ui/composants';
import { couleur, espace, texte } from '@/ui/theme';
import { T } from '@/lib/textes';

// L'écran le plus important de l'app, et donc le plus simple : où on va,
// avec qui, un bouton. Rien d'autre.
export function CarteConfirmation({
  confirmation, onConfirmer,
}: {
  confirmation: ConfirmationDuJour;
  onConfirmer: () => Promise<void>;
}) {
  const [enCours, setEnCours] = useState(false);
  const c = confirmation;

  const etat = c.valide
    ? { texte: `${T.confirmation.valide} · ${T.confirmation.kmComptes(c.distance_km)}`, couleur: couleur.succes }
    : c.j_ai_confirme
      ? { texte: T.confirmation.attente(c.avec), couleur: couleur.encreDouce }
      : null;

  return (
    <Carte style={{ borderColor: c.valide ? couleur.succes : couleur.bordure }}>
      <Text style={[texte.petit, { textTransform: 'uppercase', letterSpacing: 1 }]}>
        {c.sens === 'aller' ? T.confirmation.aller : T.confirmation.retour} · {c.heure?.slice(0, 5)}
      </Text>

      <Text style={[texte.sousTitre, { marginTop: espace.xs }]}>
        {c.depart} → {c.arrivee}
      </Text>
      <Text style={texte.doux}>{T.confirmation.avec(c.avec)}</Text>

      {etat ? (
        <View style={{ marginTop: espace.md }}>
          <Text style={[texte.doux, { color: etat.couleur, fontWeight: '700' }]}>{etat.texte}</Text>
        </View>
      ) : (
        <>
          <Bouton
            titre={T.confirmation.confirmer}
            variante="accent"
            enCours={enCours}
            onPress={async () => {
              setEnCours(true);
              try { await onConfirmer(); } finally { setEnCours(false); }
            }}
          />
          <Text style={[texte.petit, { marginTop: espace.sm }]}>{T.confirmation.explication}</Text>
        </>
      )}
    </Carte>
  );
}
