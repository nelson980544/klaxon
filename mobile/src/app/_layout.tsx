import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FournisseurSession, useSession } from '@/features/auth/session';
import { Attente } from '@/ui/composants';
import { T } from '@/lib/textes';

// Le portier de l'app : pas de session → connexion ; session mais profil
// incomplet → présentation ; sinon → les onglets.
function Portier() {
  const { session, profil, pret } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!pret) return;
    const zone = segments[0];
    const dansLesOnglets = zone === '(tabs)';

    if (!session) {
      if (zone !== 'connexion' && zone !== 'code') router.replace('/connexion');
      return;
    }
    if (profil && !profil.profil_complet) {
      if (zone !== 'profil') router.replace('/profil');
      return;
    }
    if (profil?.profil_complet && !dansLesOnglets && zone !== 'publier' && zone !== 'reglages') {
      router.replace('/(tabs)/trajets');
    }
  }, [pret, session, profil, segments, router]);

  if (!pret) return <Attente texte={T.commun.chargement} />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="connexion" />
      <Stack.Screen name="code" />
      <Stack.Screen name="profil" />
      <Stack.Screen name="publier" options={{ presentation: 'modal' }} />
      <Stack.Screen name="reglages" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function Racine() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <FournisseurSession>
        <Portier />
      </FournisseurSession>
    </SafeAreaProvider>
  );
}
