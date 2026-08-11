import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const cle = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !cle) {
  throw new Error(
    "La configuration Supabase est absente. Vérifie le fichier .env du dossier mobile.",
  );
}

// La clé publique ne donne aucun privilège : tout ce qu'un compte a le droit de
// lire ou d'écrire est décidé par la base (RLS), jamais par l'app.
export const supabase = createClient(url, cle, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** Appelle une fonction de la base et remonte une erreur lisible. */
export async function rpc<T>(nom: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(nom, args);
  if (error) throw new Error(error.message);
  return data as T;
}
