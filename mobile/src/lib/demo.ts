// Les comptes de démonstration pour la review Apple.
//
// Un relecteur Apple ne peut pas relever un email professionnel : il ne recevrait
// jamais le code envoyé par email. Ces deux comptes-là — et EUX SEULS — se
// connectent donc avec un code fixe, communiqué dans les notes de review.
//
// La restriction tient au domaine : aucun compte réel ne peut passer par ce
// chemin, puisqu'aucune entreprise cliente n'utilisera « lafabrique.demo ».
export const DOMAINE_DEMO = 'lafabrique.demo';

export const estCompteDemo = (email: string) =>
  email.trim().toLowerCase().endsWith(`@${DOMAINE_DEMO}`);
