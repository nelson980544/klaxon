import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CarteConfirmation } from '@/features/trajets/carte-confirmation';
import { CarteTrajet } from '@/features/trajets/carte-trajet';
import { api, ConfirmationDuJour, Demande, Trajet } from '@/services/api';
import { Attente, Bouton, Message, SousTitre, Vide } from '@/ui/composants';
import { couleur, espace, texte } from '@/ui/theme';
import { T } from '@/lib/textes';

export default function EcranTrajets() {
  const [confirmations, setConfirmations] = useState<ConfirmationDuJour[]>([]);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichit, setRafraichit] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const router = useRouter();

  const charger = useCallback(async () => {
    setErreur(null);
    try {
      // Les confirmations du jour se créent à l'ouverture de l'app : c'est
      // idempotent, on peut le rejouer autant de fois qu'on veut.
      await api.genererConfirmations();
      const [c, d, t] = await Promise.all([
        api.confirmationsDuJour(),
        api.mesDemandes(),
        api.trajetsCollegues(),
      ]);
      setConfirmations(c);
      setDemandes(d);
      setTrajets(t);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : T.commun.erreur);
    } finally {
      setChargement(false);
      setRafraichit(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const confirmer = async (id: string) => {
    await api.confirmer(id);
    setConfirmations(await api.confirmationsDuJour());
  };

  const repondre = async (id: string, accepte: boolean) => {
    await api.repondreDemande(id, accepte);
    await charger();
  };

  const demanderPlace = async (trajet: Trajet) => {
    await api.demanderPlace(trajet.id);
    setTrajets(await api.trajetsCollegues());
  };

  const retirer = async (trajet: Trajet) => {
    await api.desactiverTrajet(trajet.id);
    await charger();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleur.fond }} edges={['top']}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: espace.lg, paddingBottom: espace.sm,
      }}>
        <Text style={texte.titre}>{T.trajets.titre}</Text>
        <Pressable onPress={() => router.push('/reglages')} hitSlop={12}>
          <Text style={[texte.doux, { textDecorationLine: 'underline' }]}>
            {T.reglages.titre}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: espace.lg, paddingTop: 0, paddingBottom: espace.xxl }}
        refreshControl={
          <RefreshControl refreshing={rafraichit} onRefresh={() => { setRafraichit(true); charger(); }} />
        }
      >
        {chargement ? (
          <Attente texte={T.commun.chargement} />
        ) : (
          <>
            {erreur ? <Message type="erreur">{erreur}</Message> : null}

            {confirmations.length > 0 && (
              <>
                <SousTitre>{T.trajets.aConfirmer}</SousTitre>
                {confirmations.map((c) => (
                  <CarteConfirmation key={c.id} confirmation={c} onConfirmer={() => confirmer(c.id)} />
                ))}
              </>
            )}

            {demandes.length > 0 && (
              <>
                <SousTitre>{T.trajets.mesDemandes}</SousTitre>
                {demandes.map((d) => (
                  <View key={d.id} style={{
                    borderWidth: 1, borderColor: couleur.bordure, borderRadius: 14,
                    padding: espace.md, marginBottom: espace.md,
                  }}>
                    <Text style={texte.corps}>{T.trajets.demandeDe(d.passager)}</Text>
                    <Text style={[texte.petit, { marginTop: espace.xs }]}>
                      {d.depart} → {d.arrivee} · {d.heure_aller.slice(0, 5)}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: espace.sm }}>
                      <View style={{ flex: 1 }}>
                        <Bouton titre={T.trajets.accepter} onPress={() => repondre(d.id, true)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Bouton titre={T.trajets.refuser} variante="discret" onPress={() => repondre(d.id, false)} />
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            <SousTitre>{T.trajets.lesTrajets}</SousTitre>
            {trajets.length === 0 ? (
              <Vide titre={T.trajets.vide} detail={T.trajets.videDetail} />
            ) : (
              trajets.map((t) => (
                <CarteTrajet
                  key={t.id}
                  trajet={t}
                  onDemander={() => demanderPlace(t)}
                  onRetirer={() => retirer(t)}
                />
              ))
            )}

            <Bouton titre={T.trajets.publier} onPress={() => router.push('/publier')} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
