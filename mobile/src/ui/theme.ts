// Klaxon — une app qu'on ouvre à 7 h du matin, à moitié réveillé, dans une entrée
// d'immeuble. Deux couleurs, beaucoup de blanc, du contraste, rien qui clignote.

export const couleur = {
  fond: '#FFFFFF',
  surface: '#F4F6F8',
  encre: '#141B22',
  encreDouce: '#5A6672',
  bordure: '#E3E8ED',

  // La couleur d'action : un ambre qui se voit dans le noir d'un parking à 7 h.
  accent: '#F0A202',
  accentEncre: '#2A1D00',

  succes: '#1B7F5A',
  alerte: '#B3261E',
} as const;

export const espace = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const rayon = { sm: 8, md: 14, lg: 20 } as const;

export const texte = {
  titre: { fontSize: 30, fontWeight: '700', color: couleur.encre, letterSpacing: -0.5 },
  sousTitre: { fontSize: 20, fontWeight: '700', color: couleur.encre },
  corps: { fontSize: 17, color: couleur.encre },
  doux: { fontSize: 15, color: couleur.encreDouce },
  petit: { fontSize: 13, color: couleur.encreDouce },
  chiffre: { fontSize: 44, fontWeight: '800', color: couleur.encre, letterSpacing: -1 },
} as const;
