// Tous les textes de l'app au même endroit : aucune chaîne en dur dans les écrans.
// L'app est en français uniquement pour la v1 ; ce fichier est le point d'entrée
// unique le jour où on ajoutera l'anglais.

export const T = {
  app: 'Klaxon',
  punchline: 'Le covoiturage entre collègues, en deux appuis.',

  connexion: {
    titre: 'Votre email professionnel',
    explication:
      "C'est votre adresse professionnelle qui vous rattache à votre entreprise. Vous ne verrez que les trajets de vos collègues, et eux ne verront que les vôtres.",
    champEmail: 'Email professionnel',
    exemple: 'prenom.nom@entreprise.fr',
    envoyer: 'Recevoir mon code',
    domaineInconnu:
      "Votre entreprise n'utilise pas encore Klaxon. Parlez-en à vos ressources humaines : c'est elles qui ouvrent l'accès.",
    emailInvalide: 'Cette adresse ne ressemble pas à un email.',
    bienvenue: (entreprise: string) => `Bienvenue chez ${entreprise}.`,
  },

  code: {
    titre: 'Votre code arrive',
    explication: (email: string) =>
      `Nous venons d'envoyer un code à 6 chiffres à ${email}. Il est valable une heure.`,
    champ: 'Code à 6 chiffres',
    valider: 'Me connecter',
    renvoyer: 'Renvoyer le code',
    renvoye: 'Un nouveau code vient de partir.',
    invalide: "Ce code n'est pas le bon, ou il a expiré. Demandez-en un nouveau.",
    autreAdresse: 'Utiliser une autre adresse',
  },

  profil: {
    titre: 'Faisons connaissance',
    explication:
      'Vos collègues vous verront sous la forme « Marc D. ». Votre nom complet ne sort jamais de l’app, sauf sur votre attestation.',
    prenom: 'Prénom',
    nom: 'Nom',
    commune: 'Ma commune de résidence',
    site: 'Mon lieu de travail',
    enregistrer: 'Continuer',
    incomplet: 'Il manque encore votre prénom, votre nom ou votre commune.',
  },

  trajets: {
    titre: 'Trajets',
    aConfirmer: 'À confirmer aujourd’hui',
    mesDemandes: 'Demandes reçues',
    lesTrajets: 'Les trajets de vos collègues',
    publier: 'Publier un trajet',
    vide: 'Aucun trajet pour l’instant',
    videDetail:
      'Personne n’a encore publié de trajet dans votre entreprise. Soyez le premier : vos collègues verront le vôtre.',
    conducteur: 'Propose des places',
    passager: 'Cherche une place',
    places: (n: number) => (n <= 0 ? 'Complet' : n === 1 ? '1 place libre' : `${n} places libres`),
    demander: 'Demander une place',
    demandeEnvoyee: 'Demande envoyée',
    leMien: 'Mon trajet',
    retirer: 'Retirer ce trajet',
    accepter: 'Accepter',
    refuser: 'Refuser',
    demandeDe: (qui: string) => `${qui} demande une place`,
  },

  publier: {
    titre: 'Publier un trajet',
    role: 'Je suis',
    conducteur: 'Conducteur',
    passager: 'Passager',
    depart: 'Je pars de',
    arrivee: 'Je vais à',
    jours: 'Les jours',
    heureAller: 'Départ le matin',
    heureRetour: 'Retour le soir',
    places: 'Places disponibles',
    publier: 'Publier',
    manque: 'Il manque une commune, un jour ou un horaire.',
    heureInvalide: 'L’horaire doit s’écrire comme 08:15.',
    chercher: 'Tapez les premières lettres…',
  },

  confirmation: {
    titre: 'Le trajet du jour',
    aller: 'Aller',
    retour: 'Retour',
    avec: (qui: string) => `avec ${qui}`,
    confirmer: 'Confirmer ce trajet',
    confirme: 'Vous avez confirmé',
    attente: (qui: string) => `En attente de ${qui}`,
    valide: 'Confirmé des deux côtés',
    kmComptes: (km: number) => `${km} km comptés`,
    explication:
      'Les kilomètres ne sont comptés que si vous confirmez tous les deux, le jour même.',
    rien: 'Rien à confirmer aujourd’hui',
    rienDetail:
      'Vous n’avez pas de trajet prévu aujourd’hui, ou aucune place n’a encore été acceptée.',
  },

  compteur: {
    titre: 'Mon compteur',
    kmMois: 'Kilomètres ce mois-ci',
    kmAnnee: 'Depuis le 1er janvier',
    trajets: 'Trajets ce mois-ci',
    co2: 'CO₂ évité cette année',
    forfait: 'Forfait mobilités durables estimé',
    forfaitNote:
      'Montant indicatif, calculé sur le barème de votre entreprise. Seule votre attestation fait foi.',
  },

  rh: {
    titre: 'Ressources humaines',
    explication:
      'Ces chiffres portent sur votre entreprise uniquement, et sont toujours agrégés : aucun trajet ni aucun nom n’apparaît ici.',
    mois: 'Mois',
    km: 'Kilomètres covoiturés',
    trajets: 'Trajets confirmés',
    participants: 'Participants actifs',
    co2: 'CO₂ évité',
    masque: 'Données insuffisantes',
    masqueDetail:
      'En dessous de 5 participants sur le mois, les chiffres sont masqués : ils permettraient d’identifier des personnes.',
    vide: 'Aucun trajet confirmé pour l’instant',
    videDetail:
      'Les chiffres apparaîtront dès que vos salariés auront confirmé leurs premiers trajets.',
    attestations: 'Générer les attestations du mois',
    attestationsLancees:
      'La génération est lancée. Les attestations vous seront transmises par l’éditeur.',
  },

  reglages: {
    titre: 'Réglages',
    monCompte: 'Mon compte',
    entreprise: 'Entreprise',
    role: 'Rôle',
    roleSalarie: 'Salarié',
    roleRh: 'Ressources humaines',
    confidentialite: 'Confidentialité',
    conditions: 'Conditions d’utilisation',
    deconnexion: 'Se déconnecter',
    supprimer: 'Supprimer mon compte',
    supprimerTitre: 'Supprimer votre compte ?',
    supprimerDetail:
      'Votre nom, votre email et vos trajets seront effacés. Les kilomètres déjà validés restent comptés dans les statistiques de votre entreprise, sans lien avec vous. Cette action est définitive.',
    supprimerConfirmer: 'Supprimer définitivement',
    annuler: 'Annuler',
  },

  commun: {
    chargement: 'Un instant…',
    erreur: 'Quelque chose n’a pas fonctionné',
    reessayer: 'Réessayer',
    fermer: 'Fermer',
    jours: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
    joursLongs: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
  },
} as const;
