export default function Accueil() {
  return (
    <>
      <h1>Le covoiturage entre collègues, en deux appuis.</h1>
      <p className="chapo">
        Vos salariés font le même trajet, chacun dans sa voiture, sans le savoir. Klaxon les
        met en relation entre collègues d’une même entreprise — et transforme chaque trajet
        partagé en kilomètres justifiables pour le forfait mobilités durables.
      </p>

      <div className="bandeau">
        <h2>Le moment qui compte</h2>
        <p>
          Le matin, une notification. Deux appuis, un de chaque côté. C’est cette double
          confirmation — et elle seule — qui compte les kilomètres. Rien à saisir, rien à
          calculer, rien à payer.
        </p>
      </div>

      <h2>Pourquoi les plateformes grand public ne marchent pas ici</h2>
      <p>
        Personne ne monte avec un inconnu à 7 h du matin, tous les jours, pour aller au bureau.
        Et surtout, l’employeur n’a aucune preuve exploitable des trajets — donc aucun moyen
        sérieux de verser le forfait mobilités durables, qui peut pourtant atteindre 900 € par an
        et par salarié, exonérés de cotisations.
      </p>
      <p>
        Klaxon ferme le cercle à l’entreprise : on ne voit que ses collègues, et chaque trajet
        confirmé produit une donnée de kilométrage opposable.
      </p>

      <h2>Comment ça marche</h2>
      <ol className="etapes">
        <li>
          <strong>Le salarié s’inscrit avec son email professionnel.</strong> Le domaine le
          rattache automatiquement à son entreprise. Pas de mot de passe : un code reçu par email.
        </li>
        <li>
          <strong>Il publie son trajet récurrent</strong> — commune de départ, commune d’arrivée,
          jours, horaires, places — ou se positionne sur celui d’un collègue.
        </li>
        <li>
          <strong>Le jour même, deux appuis.</strong> Conducteur et passager confirment chacun de
          leur côté. Les kilomètres sont comptés, et seulement à ce moment-là.
        </li>
        <li>
          <strong>Les RH suivent des chiffres agrégés</strong> et lancent la génération des
          attestations mensuelles du forfait mobilités durables.
        </li>
      </ol>

      <h2>Ce que voient les RH — et ce qu’ils ne voient jamais</h2>
      <div className="grille">
        <div className="carte">
          <h3>Des agrégats, uniquement</h3>
          <p>
            Kilomètres covoiturés, trajets confirmés, participants actifs, CO₂ évité, évolution
            mensuelle. Jamais un trajet identifiable, jamais un nom.
          </p>
        </div>
        <div className="carte">
          <h3>Un seuil de masquage</h3>
          <p>
            En dessous de 5 participants sur le mois, les chiffres sont masqués : ils
            permettraient d’identifier des personnes. Le seuil est appliqué dans la base, pas
            dans l’application.
          </p>
        </div>
        <div className="carte">
          <h3>Une cloison étanche entre entreprises</h3>
          <p>
            L’isolation est appliquée par la base de données elle-même, et vérifiée à chaque mise
            en ligne par une batterie de tests qui tentent activement de la franchir.
          </p>
        </div>
        <div className="carte">
          <h3>Aucun paiement dans l’application</h3>
          <p>
            Ni entre salariés, ni vers nous. L’abonnement est facturé à l’entreprise, en dehors de
            l’application.
          </p>
        </div>
      </div>

      <h2>Pas de carte, et c’est voulu</h2>
      <p>
        Le rapprochement se fait par commune et par créneau horaire. Vos salariés connaissent leur
        trajet par cœur : une carte interactive n’ajouterait rien, sinon de la lenteur et de la
        batterie consommée. Les distances sont calculées à partir du référentiel officiel des
        35 000 communes françaises, sans qu’aucune donnée ne quitte nos serveurs.
      </p>

      <div className="bandeau">
        <h2>Vous voulez déployer Klaxon dans votre entreprise ?</h2>
        <p>
          Écrivez-nous à <a href="mailto:contact@klaxon.app">contact@klaxon.app</a>. Nous créons
          votre espace, déclarons vos domaines email et désignons vos comptes RH — vos salariés
          n’ont plus qu’à s’inscrire.
        </p>
      </div>
    </>
  );
}
