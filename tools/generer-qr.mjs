// generer-qr.mjs — fabrique le QR code à scanner avec Expo Go.
// usage : node generer-qr.mjs "exp://xxxx.exp.direct"
import QRCode from 'qrcode';
import path from 'node:path';

const url = process.argv[2];
if (!url) {
  console.error('usage : node generer-qr.mjs "exp://..."');
  process.exit(1);
}

const sortie = path.resolve('..', 'qr-klaxon.png');

await QRCode.toFile(sortie, url, {
  width: 720,
  margin: 3,
  color: { dark: '#141B22', light: '#FFFFFF' },
  errorCorrectionLevel: 'M',
});

console.log(`  ✅ QR code écrit : ${sortie}`);
console.log(`     adresse encodée : ${url}`);
