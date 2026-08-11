import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { useSession } from '@/features/auth/session';
import { api } from '@/services/api';
import { Bouton, Carte, Ecran, Message, Paragraphe, SousTitre, Titre } from '@/ui/composants';
import { couleur, espace, texte } from '@/ui/theme';
import { LIENS } from '@/lib/liens';
import { T } from '@/lib/textes';

function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: espace.sm }}>
      <Text style={texte.doux}>{libelle}</Text>
      <Text style={[texte.corps, { fontWeight: '600' }]}>{valeur}</Text>
    </View>
  );
}

export default function Reglages() {
  const { profil, deconnexion } = useSession();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const router = useRouter();

  const supprimer = () => {
    Alert.alert(T.reglages.supprimerTitre, T.reglages.supprimerDetail, [
      { text: T.reglages.annuler, style: 'cancel' },
      {
        text: T.reglages.supprimerConfirmer,
        style: 'destructive',
        onPress: async () => {
          setEnCours(true);
          try {
            await api.supprimerMonCompte();
            router.replace('/connexion');
          } catch (e) {
            setErreur(e instanceof Error ? e.message : T.commun.erreur);
          } finally {
            setEnCours(false);
          }
        },
      },
    ]);
  };

  return (
    <Ecran>
      <Titre>{T.reglages.titre}</Titre>

      <SousTitre>{T.reglages.monCompte}</SousTitre>
      <Carte>
        <Ligne libelle="Email" valeur={profil?.email ?? '—'} />
        <Ligne libelle={T.reglages.entreprise} valeur={profil?.entreprise ?? '—'} />
        <Ligne
          libelle={T.reglages.role}
          valeur={profil?.role === 'rh' ? T.reglages.roleRh : T.reglages.roleSalarie}
        />
      </Carte>

      {erreur ? <Message type="erreur">{erreur}</Message> : null}

      <Bouton
        titre={T.reglages.confidentialite}
        variante="discret"
        onPress={() => Linking.openURL(LIENS.confidentialite)}
      />
      <Bouton
        titre={T.reglages.conditions}
        variante="discret"
        onPress={() => Linking.openURL(LIENS.conditions)}
      />
      <Bouton titre={T.reglages.deconnexion} variante="discret" onPress={deconnexion} />

      <SousTitre>{T.reglages.supprimer}</SousTitre>
      <Paragraphe doux>{T.reglages.supprimerDetail}</Paragraphe>
      <Bouton titre={T.reglages.supprimer} onPress={supprimer} enCours={enCours} />
      <Text style={[texte.petit, { marginTop: espace.lg, color: couleur.encreDouce }]}>
        {T.app} · {T.punchline}
      </Text>
    </Ecran>
  );
}
