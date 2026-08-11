import { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api, Profil } from '@/services/api';
import { supabase } from '@/services/supabase';

type Contexte = {
  session: Session | null;
  profil: Profil | null;
  pret: boolean;
  rafraichirProfil: () => Promise<void>;
  deconnexion: () => Promise<void>;
};

const SessionContexte = createContext<Contexte>({
  session: null, profil: null, pret: false,
  rafraichirProfil: async () => {}, deconnexion: async () => {},
});

export function FournisseurSession({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [pret, setPret] = useState(false);

  const chargerProfil = async (s: Session | null) => {
    if (!s) { setProfil(null); return; }
    try { setProfil(await api.monProfil()); }
    catch { setProfil(null); }
  };

  useEffect(() => {
    let vivant = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!vivant) return;
      setSession(data.session);
      await chargerProfil(data.session);
      setPret(true);
    });

    const { data: abonnement } = supabase.auth.onAuthStateChange(async (_evenement, s) => {
      setSession(s);
      await chargerProfil(s);
      setPret(true);
    });

    return () => { vivant = false; abonnement.subscription.unsubscribe(); };
  }, []);

  return (
    <SessionContexte.Provider
      value={{
        session,
        profil,
        pret,
        rafraichirProfil: async () => chargerProfil(session),
        deconnexion: async () => { await supabase.auth.signOut(); },
      }}
    >
      {children}
    </SessionContexte.Provider>
  );
}

export const useSession = () => useContext(SessionContexte);
