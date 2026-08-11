import { Text, View } from 'react-native';
import { Trajet } from '@/services/api';
import { Bouton, Carte } from '@/ui/composants';
import { couleur, espace, texte } from '@/ui/theme';
import { T } from '@/lib/textes';

const heure = (h: string | null) => (h ? h.slice(0, 5) : '—');

export function CarteTrajet({
  trajet, onDemander, onRetirer,
}: {
  trajet: Trajet;
  onDemander: () => void;
  onRetirer: () => void;
}) {
  const complet = trajet.places_restantes <= 0;

  return (
    <Carte>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={[texte.sousTitre, { marginTop: 0, flex: 1 }]}>
          {trajet.depart} → {trajet.arrivee}
        </Text>
        <Text style={[texte.petit, { marginLeft: espace.sm }]}>{trajet.distance_km} km</Text>
      </View>

      <Text style={[texte.doux, { marginTop: espace.xs }]}>
        {trajet.est_le_mien ? T.trajets.leMien : trajet.auteur}
        {' · '}
        {trajet.role === 'conducteur' ? T.trajets.conducteur : T.trajets.passager}
      </Text>

      <View style={{ flexDirection: 'row', gap: espace.xs, marginTop: espace.sm }}>
        {T.commun.jours.map((lettre, index) => {
          const actif = trajet.jours.includes(index + 1);
          return (
            <View
              key={index}
              style={{
                width: 28, height: 28, borderRadius: 14,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: actif ? couleur.encre : couleur.surface,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: actif ? couleur.fond : couleur.encreDouce }}>
                {lettre}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={[texte.doux, { marginTop: espace.sm }]}>
        {heure(trajet.heure_aller)}
        {trajet.heure_retour ? ` · retour ${heure(trajet.heure_retour)}` : ''}
        {trajet.role === 'conducteur' ? ` · ${T.trajets.places(trajet.places_restantes)}` : ''}
      </Text>

      {trajet.est_le_mien ? (
        <Bouton titre={T.trajets.retirer} variante="discret" onPress={onRetirer} />
      ) : trajet.deja_demande ? (
        <Bouton titre={T.trajets.demandeEnvoyee} variante="discret" onPress={() => {}} desactive />
      ) : (
        <Bouton titre={T.trajets.demander} onPress={onDemander} desactive={complet && trajet.role === 'conducteur'} />
      )}
    </Carte>
  );
}
