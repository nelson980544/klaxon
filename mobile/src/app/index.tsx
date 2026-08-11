import { Redirect } from 'expo-router';

// Point d'entrée : le portier du _layout décide de la suite.
export default function Accueil() {
  return <Redirect href="/connexion" />;
}
