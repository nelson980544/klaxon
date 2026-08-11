import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Une question, un problème avec Klaxon ? Voici comment nous joindre et les réponses aux questions fréquentes.',
};

export default function Support() {
  return (
    <>
      <h1>Support</h1>
      <p className="chapo">
        Une question, un compte bloqué, un kilomètre qui manque ? Écrivez-nous à{' '}
        <a href="mailto:support@klaxon.app">support@klaxon.app</a>. Nous répondons sous deux jours
        ouvrés.
      </p>

      <h2>Questions fréquentes</h2>

      <h3>Je ne reçois pas mon code de connexion</h3>
      <p>
        Vérifiez vos courriers indésirables, et que vous utilisez bien votre adresse
        professionnelle. Si votre entreprise vient d’ouvrir son accès, il peut y avoir un délai le
        temps que votre domaine soit déclaré. Le bouton « Renvoyer le code » en fait partir un
        nouveau.
      </p>

      <h3>« Votre entreprise n’utilise pas encore Klaxon »</h3>
      <p>
        Le domaine de votre adresse n’est pas déclaré. C’est votre service RH qui ouvre l’accès :
        parlez-leur de Klaxon, nous nous occupons du reste avec eux.
      </p>

      <h3>Mon trajet n’a pas été compté</h3>
      <p>
        Un trajet ne compte que si vous <strong>et</strong> votre collègue l’avez confirmé, le jour
        même. Une confirmation seule ne compte rien, et la fenêtre se ferme à minuit — il n’y a pas
        de rattrapage le lendemain. C’est cette règle stricte qui rend les attestations solides en
        cas de contrôle.
      </p>

      <h3>Mon employeur voit-il mes trajets ?</h3>
      <p>
        Non. Votre employeur ne voit que des chiffres agrégés à l’échelle de l’entreprise, et
        seulement s’ils portent sur au moins cinq participants. Ni vos trajets, ni vos horaires, ni
        votre nom n’apparaissent. Le détail est dans la{' '}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>

      <h3>Puis-je covoiturer avec quelqu’un d’une autre entreprise ?</h3>
      <p>
        Pas pour l’instant. Klaxon est volontairement cloisonné à votre entreprise : c’est ce qui
        fait que les gens acceptent de monter en voiture ensemble. Le covoiturage entre entreprises
        d’une même zone d’activité est à l’étude.
      </p>

      <h3>Comment supprimer mon compte ?</h3>
      <p>
        Dans l’application : Réglages → Supprimer mon compte. C’est immédiat et définitif. Vos
        données personnelles sont effacées ; les kilomètres déjà validés restent dans les
        statistiques de votre entreprise, sans lien avec vous.
      </p>

      <h2>Vous êtes une entreprise</h2>
      <p>
        Pour déployer Klaxon chez vous, ouvrir vos domaines email, désigner vos comptes RH ou
        obtenir vos attestations, écrivez à{' '}
        <a href="mailto:contact@klaxon.app">contact@klaxon.app</a>.
      </p>
    </>
  );
}
