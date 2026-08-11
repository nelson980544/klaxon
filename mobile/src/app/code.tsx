import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bouton, Champ, Ecran, Message, Paragraphe, Titre } from '@/ui/composants';
import { espace, texte } from '@/ui/theme';
import { T } from '@/lib/textes';
import { supabase } from '@/services/supabase';
import { estCompteDemo } from '@/lib/demo';

export default function CodeConnexion() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const router = useRouter();

  const valider = async () => {
    setErreur(null);
    setEnCours(true);
    try {
      const adresse = String(email);
      // Compte de démonstration : code fixe, aucun email en jeu (voir lib/demo.ts).
      const { error } = estCompteDemo(adresse)
        ? await supabase.auth.signInWithPassword({ email: adresse, password: code.trim() })
        : await supabase.auth.verifyOtp({ email: adresse, token: code.trim(), type: 'email' });
      if (error) throw new Error(T.code.invalide);
      // Le portier du _layout prend le relais dès que la session existe.
    } catch (e) {
      setErreur(e instanceof Error ? e.message : T.code.invalide);
    } finally {
      setEnCours(false);
    }
  };

  const renvoyer = async () => {
    setErreur(null);
    setInfo(null);
    const { error } = await supabase.auth.signInWithOtp({ email: String(email) });
    if (error) setErreur(error.message);
    else setInfo(T.code.renvoye);
  };

  return (
    <Ecran>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Titre>{T.code.titre}</Titre>
        <Paragraphe doux>{T.code.explication(String(email))}</Paragraphe>

        <Champ
          etiquette={T.code.champ}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          maxLength={6}
          autoFocus
          onSubmitEditing={valider}
        />

        {info ? <Message type="info">{info}</Message> : null}
        {erreur ? <Message type="erreur">{erreur}</Message> : null}

        <Bouton titre={T.code.valider} onPress={valider} enCours={enCours} desactive={code.length < 6} />
        <Bouton titre={T.code.renvoyer} onPress={renvoyer} variante="discret" />

        <Pressable onPress={() => router.replace('/connexion')} style={{ marginTop: espace.lg }}>
          <Text style={[texte.petit, { textAlign: 'center', textDecorationLine: 'underline' }]}>
            {T.code.autreAdresse}
          </Text>
        </Pressable>
      </View>
    </Ecran>
  );
}
