import { Tabs } from 'expo-router';
import { useSession } from '@/features/auth/session';
import { couleur } from '@/ui/theme';
import { T } from '@/lib/textes';

export default function Onglets() {
  const { profil } = useSession();
  const estRh = profil?.role === 'rh';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: couleur.encre,
        tabBarInactiveTintColor: couleur.encreDouce,
        tabBarStyle: { borderTopColor: couleur.bordure, backgroundColor: couleur.fond },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
        tabBarIconStyle: { display: 'none' },
        tabBarItemStyle: { paddingTop: 10 },
      }}
    >
      <Tabs.Screen name="trajets" options={{ title: T.trajets.titre }} />
      <Tabs.Screen name="compteur" options={{ title: T.compteur.titre }} />
      {/* L'onglet RH n'est pas seulement masqué ici : la base refuse les chiffres
          à quiconque n'a pas le rôle. Cacher l'onglet est du confort, pas de la sécurité. */}
      <Tabs.Screen name="rh" options={{ title: T.rh.titre, href: estRh ? '/rh' : null }} />
    </Tabs>
  );
}
