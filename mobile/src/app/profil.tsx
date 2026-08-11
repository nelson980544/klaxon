import { useState } from 'react';
import { useSession } from '@/features/auth/session';
import { SelecteurCommune } from '@/features/communes/selecteur-commune';
import { api } from '@/services/api';
import { Bouton, Champ, Ecran, Message, Paragraphe, Titre } from '@/ui/composants';
import { T } from '@/lib/textes';

export default function ProfilInitial() {
  const { profil, rafraichirProfil } = useSession();
  const [prenom, setPrenom] = useState(profil?.prenom ?? '');
  const [nom, setNom] = useState(profil?.nom ?? '');
  const [commune, setCommune] = useState<string | null>(profil?.commune_code ?? null);
  const [site, setSite] = useState<string | null>(profil?.site_travail ?? null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const enregistrer = async () => {
    setErreur(null);
    if (!prenom.trim() || !nom.trim() || !commune) {
      setErreur(T.profil.incomplet);
      return;
    }
    setEnCours(true);
    try {
      await api.majProfil({
        prenom: prenom.trim(),
        nom: nom.trim(),
        commune_code: commune,
        site_travail: site,
      });
      await rafraichirProfil();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : T.commun.erreur);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Ecran>
      <Titre>{T.profil.titre}</Titre>
      <Paragraphe doux>{T.profil.explication}</Paragraphe>

      <Champ etiquette={T.profil.prenom} value={prenom} onChangeText={setPrenom} autoCapitalize="words" />
      <Champ etiquette={T.profil.nom} value={nom} onChangeText={setNom} autoCapitalize="words" />

      <SelecteurCommune
        etiquette={T.profil.commune}
        valeur={commune}
        onChoisir={(c) => setCommune(c?.code ?? null)}
      />
      <SelecteurCommune
        etiquette={T.profil.site}
        valeur={site}
        onChoisir={(c) => setSite(c?.code ?? null)}
      />

      {erreur ? <Message type="erreur">{erreur}</Message> : null}
      <Bouton titre={T.profil.enregistrer} onPress={enregistrer} enCours={enCours} />
    </Ecran>
  );
}
