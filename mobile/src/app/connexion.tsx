import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Bouton, Champ, Ecran, Message, Paragraphe, Titre } from '@/ui/composants';
import { couleur, espace, texte } from '@/ui/theme';
import { T } from '@/lib/textes';
import { api } from '@/services/api';
import { estCompteDemo } from '@/lib/demo';
import { supabase } from '@/services/supabase';

export default function Connexion() {
  const [email, setEmail] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [entreprise, setEntreprise] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const router = useRouter();

  const envoyer = async () => {
    const adresse = email.trim().toLowerCase();
    setErreur(null);
    setEntreprise(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adresse)) {
      setErreur(T.connexion.emailInvalide);
      return;
    }

    setEnCours(true);
    try {
      // On vérifie le domaine AVANT d'envoyer quoi que ce soit : inutile
      // d'envoyer un email à quelqu'un dont l'entreprise n'est pas cliente.
      const [verdict] = await api.verifierDomaine(adresse);
      if (!verdict?.autorise) {
        setErreur(T.connexion.domaineInconnu);
        return;
      }
      setEntreprise(verdict.entreprise);

      // Les comptes de démonstration n'attendent aucun email : leur code est fixe.
      if (!estCompteDemo(adresse)) {
        const { error } = await supabase.auth.signInWithOtp({ email: adresse });
        if (error) throw new Error(error.message);
      }
      router.push({ pathname: '/code', params: { email: adresse } });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : T.commun.erreur);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Ecran>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={[texte.petit, { textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: espace.sm }]}>
          {T.app}
        </Text>
        <Titre>{T.connexion.titre}</Titre>
        <Paragraphe doux>{T.connexion.explication}</Paragraphe>

        <Champ
          etiquette={T.connexion.champEmail}
          value={email}
          onChangeText={setEmail}
          placeholder={T.connexion.exemple}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          onSubmitEditing={envoyer}
          returnKeyType="send"
        />

        {entreprise ? <Message type="succes">{T.connexion.bienvenue(entreprise)}</Message> : null}
        {erreur ? <Message type="erreur">{erreur}</Message> : null}

        <Bouton titre={T.connexion.envoyer} onPress={envoyer} enCours={enCours} />

        <Text style={[texte.petit, { marginTop: espace.lg, color: couleur.encreDouce }]}>
          {T.punchline}
        </Text>
      </View>
    </Ecran>
  );
}
