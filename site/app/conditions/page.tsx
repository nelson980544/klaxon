import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions d’utilisation',
  description:
    'Les règles d’usage de Klaxon : qui peut s’inscrire, ce que fait l’application, et ce dont elle ne répond pas.',
};

export default function Conditions() {
  return (
    <>
      <h1>Conditions d’utilisation</h1>
      <p className="legal">Dernière mise à jour : 11 août 2026</p>

      <h2>1. Objet</h2>
      <p>
        Klaxon est une application mobile qui permet aux salariés d’une même entreprise
        d’organiser entre eux le covoiturage de leurs trajets domicile-travail, et de faire
        constater les kilomètres effectivement partagés. L’utilisation de l’application vaut
        acceptation des présentes conditions.
      </p>

      <h2>2. Qui peut utiliser Klaxon</h2>
      <p>
        L’accès est réservé aux salariés des entreprises clientes, identifiés par leur adresse
        email professionnelle. Si le domaine de votre adresse n’est pas déclaré, l’inscription est
        refusée. Vous ne pouvez créer qu’un seul compte, à votre nom, avec votre adresse
        professionnelle.
      </p>

      <h2>3. Gratuité pour le salarié</h2>
      <p>
        L’application est <strong>entièrement gratuite</strong> pour les salariés. Elle ne contient
        aucun achat, aucun abonnement et aucun moyen de paiement. Le service est facturé à
        l’entreprise, en dehors de l’application.
      </p>
      <p>
        Klaxon <strong>n’organise aucun partage de frais</strong> entre salariés. Aucune somme ne
        transite par l’application, à aucun moment.
      </p>

      <h2>4. Ce que Klaxon fait, et ce qu’il ne fait pas</h2>
      <p>
        Klaxon met des collègues en relation et enregistre les trajets qu’ils confirment tous les
        deux. Klaxon n’est ni un transporteur, ni une agence de voyage, ni un assureur.
      </p>
      <ul>
        <li>
          <strong>Le trajet relève des personnes concernées.</strong> Le conducteur reste seul
          responsable de son véhicule, de son assurance, de son permis et de sa conduite.
        </li>
        <li>
          <strong>Nous ne garantissons ni la ponctualité, ni la réalisation d’un trajet.</strong>{' '}
          Un collègue peut annuler, être absent ou refuser une demande de place.
        </li>
        <li>
          <strong>Les distances sont calculées</strong> à partir du référentiel officiel des
          communes françaises. Elles sont une estimation raisonnable, pas un relevé kilométrique.
        </li>
      </ul>

      <h2>5. Confirmation des trajets et attestations</h2>
      <p>
        Un trajet n’est comptabilisé que si le conducteur <em>et</em> le passager le confirment
        chacun, le jour même. Une confirmation unilatérale ne compte aucun kilomètre. Cette double
        confirmation est ce qui donne leur valeur aux attestations de forfait mobilités durables.
      </p>
      <p>
        <strong>Toute déclaration volontairement inexacte</strong> — confirmer un trajet qui n’a
        pas eu lieu — engage votre responsabilité vis-à-vis de votre employeur et de
        l’administration. Nous nous réservons le droit de suspendre un compte en cas de fraude
        manifeste, et de corriger les kilomètres concernés. Toute correction est tracée.
      </p>

      <h2>6. Comportement attendu</h2>
      <p>
        Klaxon ne comporte volontairement aucune messagerie libre : les échanges se limitent à des
        actions cadrées (demander, accepter, refuser, confirmer, annuler). Il est interdit
        d’utiliser le service pour proposer un transport rémunéré, démarcher des collègues ou
        contourner le rattachement par domaine email.
      </p>

      <h2>7. Suppression du compte</h2>
      <p>
        Vous pouvez supprimer votre compte à tout moment depuis l’application (Réglages →
        Supprimer mon compte). Votre entreprise peut également désactiver votre accès lorsque vous
        la quittez. Les conséquences exactes sur vos données sont décrites dans la{' '}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>

      <h2>8. Disponibilité</h2>
      <p>
        Nous faisons notre possible pour que le service soit disponible en permanence, sans le
        garantir. Une interruption peut survenir pour maintenance ou en raison d’un incident chez
        un hébergeur. Nous ne sommes pas responsables des conséquences d’une indisponibilité sur
        l’organisation d’un trajet.
      </p>

      <h2>9. Modification des conditions</h2>
      <p>
        Ces conditions peuvent évoluer. En cas de changement significatif, vous en serez informé
        dans l’application. La poursuite de l’utilisation vaut acceptation.
      </p>

      <h2>10. Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français. En cas de litige, une solution
        amiable sera recherchée avant toute action contentieuse : écrivez à{' '}
        <a href="mailto:contact@klaxon.app">contact@klaxon.app</a>.
      </p>
    </>
  );
}
