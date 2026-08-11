// generer-icone.mjs — fabrique les images de l'app à partir de brand/icon.svg.
// Rien à dessiner à la main : une source vectorielle, trois fichiers en sortie.
// usage : cd tools && node generer-icone.mjs
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const racine = path.resolve('..');
const source = path.join(racine, 'brand', 'icon.svg');
const sortie = path.join(racine, 'mobile', 'assets');
mkdirSync(sortie, { recursive: true });

const svg = readFileSync(source);

// Le signe seul, sans son fond : c'est ce qui va sur l'écran de démarrage blanc.
const signeSeul = Buffer.from(
  readFileSync(source, 'utf8').replace(/<rect[^>]*\/>/, ''),
);

const fichiers = [
  // Apple refuse une icône avec de la transparence ou des coins arrondis :
  // on livre un carré plein, iOS arrondit lui-même.
  { nom: 'icon.png', taille: 1024, source: svg, aplatir: '#F0A202' },
  { nom: 'splash-icon.png', taille: 512, source: signeSeul, aplatir: null },
  { nom: 'favicon.png', taille: 48, source: svg, aplatir: '#F0A202' },
];

for (const f of fichiers) {
  let image = sharp(f.source, { density: 600 }).resize(f.taille, f.taille);
  if (f.aplatir) image = image.flatten({ background: f.aplatir });
  await image.png().toFile(path.join(sortie, f.nom));

  const meta = await sharp(path.join(sortie, f.nom)).metadata();
  console.log(
    `  ${f.nom.padEnd(18)} ${meta.width}×${meta.height}` +
    `  ${meta.hasAlpha ? 'avec transparence' : 'opaque'}`,
  );
}

console.log('\n  ✅ Images générées dans mobile/assets.');
