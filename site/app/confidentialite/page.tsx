import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Quelles données Klaxon collecte, pourquoi, combien de temps, et ce que votre employeur voit exactement.',
};

export default function Confidentialite() {
  return (
    <>
      <h1>Politique de confidentialité</h1>
      <p className="legal">Dernière mise à jour : 11 août 2026</p>

      <p>
        Klaxon est une application de covoiturage domicile-travail réservée aux salariés d’une
        même entreprise. Cette page explique, sans détour, quelles données nous traitons et ce que
        votre employeur peut voir.
      </p>

      <h2>En trois phrases</h2>
      <p>
        Nous collectons le strict nécessaire pour vous mettre en relation avec vos collègues et
        compter les kilomètres que vous avez confirmés. <strong>Votre employeur ne voit jamais vos
        trajets ni votre nom</strong> : il ne reçoit que des chiffres agrégés, masqués lorsqu’ils
        porteraient sur moins de cinq personnes. La seule exception est votre attestation
        nominative de forfait mobilités durables, qui vous est destinée et qui est un document
        légal.
      </p>

      <h2>Responsable du traitement</h2>
      <p>
        L’éditeur de Klaxon est responsable du traitement pour le fonctionnement du service. Votre
        employeur est responsable de traitement pour l’usage qu’il fait des statistiques agrégées
        et des attestations. Contact : <a href="mailto:contact@klaxon.app">contact@klaxon.app</a>.
      </p>

      <h2>Données traitées</h2>
      <table>
        <thead>
          <tr><th>Donnée</th><th>Pourquoi</th><th>Base légale</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Email professionnel</td>
            <td>Vous connecter et vous rattacher à votre entreprise via le domaine</td>
            <td>Exécution du contrat</td>
          </tr>
          <tr>
            <td>Prénom, nom</td>
            <td>
              Vous identifier auprès de vos collègues sous la forme « Marc D. ». Le nom complet
              n’apparaît que sur votre attestation.
            </td>
            <td>Exécution du contrat</td>
          </tr>
          <tr>
            <td>Commune de résidence et lieu de travail</td>
            <td>Rapprocher les trajets compatibles et calculer les distances</td>
            <td>Exécution du contrat</td>
          </tr>
          <tr>
            <td>Trajets, horaires, jours, places</td>
            <td>Publier votre offre ou votre recherche auprès de vos collègues</td>
            <td>Exécution du contrat</td>
          </tr>
          <tr>
            <td>Confirmations quotidiennes et kilomètres</td>
            <td>Justifier le forfait mobilités durables et alimenter les statistiques agrégées</td>
            <td>Obligation légale de l’employeur, intérêt légitime</td>
          </tr>
        </tbody>
      </table>

      <p>
        Nous ne collectons <strong>aucune donnée de géolocalisation</strong>. Klaxon n’utilise pas
        de carte, ne suit pas vos déplacements et n’accède jamais à la position de votre téléphone.
        Il n’y a ni publicité, ni traceur publicitaire, ni revente de données.
      </p>

      <h2>Ce que votre employeur voit exactement</h2>
      <ul>
        <li>
          <strong>Des chiffres agrégés par mois</strong> : kilomètres covoiturés, nombre de
          trajets confirmés, nombre de participants actifs, CO₂ évité.
        </li>
        <li>
          <strong>Rien en dessous de cinq participants.</strong> Sous ce seuil, les chiffres sont
          remplacés par « données insuffisantes », car ils permettraient de remonter à des
          personnes.
        </li>
        <li>
          <strong>Jamais un trajet, jamais un nom, jamais un horaire individuel</strong> — y
          compris pour les comptes RH, y compris dans leur propre entreprise. Cette restriction
          est appliquée par la base de données, pas par l’application.
        </li>
        <li>
          <strong>Votre attestation nominative</strong> de forfait mobilités durables : elle porte
          votre nom et vos kilomètres du mois, parce que c’est un document légal destiné à vous et,
          le cas échéant, à l’URSSAF.
        </li>
      </ul>

      <h2>Cloisonnement entre entreprises</h2>
      <p>
        Un salarié ne peut accéder à aucune donnée d’une autre entreprise, et un compte RH non plus.
        Ce cloisonnement est appliqué au niveau de la base de données elle-même, et vérifié
        automatiquement avant chaque mise en ligne par des tests qui tentent activement de le
        franchir.
      </p>

      <h2>Sous-traitants</h2>
      <ul>
        <li>
          <strong>Supabase</strong> — hébergement de la base de données et gestion des comptes.
          Données stockées dans l’Union européenne, région de Paris (France).
        </li>
        <li>
          <strong>Vercel</strong> — hébergement de ce site web. Ce site ne dépose aucun cookie et
          n’utilise aucun outil de mesure d’audience.
        </li>
        <li>
          <strong>Apple</strong> — distribution de l’application via l’App Store et envoi des
          notifications.
        </li>
      </ul>
      <p>
        Aucune donnée n’est transmise à un service d’intelligence artificielle : Klaxon n’en
        utilise aucun.
      </p>

      <h2>Durées de conservation</h2>
      <ul>
        <li><strong>Compte et profil</strong> : tant que votre compte existe.</li>
        <li>
          <strong>Trajets et confirmations</strong> : trois ans, durée pendant laquelle l’URSSAF
          peut contrôler un forfait mobilités durables versé.
        </li>
        <li>
          <strong>Statistiques agrégées</strong> : conservées sans limite, car elles n’identifient
          personne.
        </li>
      </ul>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez à tout moment consulter et corriger vos informations depuis l’application, et
        <strong> supprimer votre compte directement dans l’application</strong> (Réglages →
        Supprimer mon compte). La suppression efface votre nom, votre email, votre commune et
        désactive vos trajets. Les kilomètres déjà validés restent comptés dans les statistiques
        agrégées de votre entreprise, sans aucun lien avec vous : ils n’identifient plus personne.
      </p>
      <p>
        Vous disposez également des droits d’accès, de rectification, d’effacement, de limitation,
        d’opposition et de portabilité. Écrivez à{' '}
        <a href="mailto:contact@klaxon.app">contact@klaxon.app</a>. Vous pouvez introduire une
        réclamation auprès de la CNIL (<a href="https://www.cnil.fr">www.cnil.fr</a>).
      </p>

      <h2>Sécurité</h2>
      <p>
        Les échanges sont chiffrés (HTTPS). L’accès aux données est décidé par la base pour chaque
        requête, en fonction du compte connecté : l’application ne peut pas demander plus que ce à
        quoi vous avez droit, même si elle était modifiée.
      </p>
    </>
  );
}
