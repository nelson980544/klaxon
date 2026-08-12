import { NextResponse, type NextRequest } from 'next/server';

// Le middleware ne fait qu'un filtrage grossier : présence d'un cookie.
// La vraie vérification (signature du cookie, session valide) est faite dans
// chaque page et chaque action serveur — jamais uniquement ici.
export function middleware(requete: NextRequest) {
  const connecte = requete.cookies.has('klaxon_admin');
  const surLaPageConnexion = requete.nextUrl.pathname === '/connexion';

  if (!connecte && !surLaPageConnexion) {
    return NextResponse.redirect(new URL('/connexion', requete.url));
  }
  if (connecte && surLaPageConnexion) {
    return NextResponse.redirect(new URL('/', requete.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
