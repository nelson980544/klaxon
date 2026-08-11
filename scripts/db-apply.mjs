// db-apply.mjs — applique un fichier SQL sur la base Supabase du projet.
// usage : node scripts/db-apply.mjs db/0001_init.sql
import { readFileSync } from 'node:fs';

const env = readFileSync('.recette/secrets.env', 'utf8');
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1]?.trim();
const token = get('SUPABASE_ACCESS_TOKEN');
const ref = get('SUPABASE_PROJECT_REF');
const file = process.argv[2];
if (!file) { console.error('usage: node scripts/db-apply.mjs <fichier.sql>'); process.exit(1); }

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: readFileSync(file, 'utf8') }),
});
const body = await res.text();
console.log(res.status === 200 || res.status === 201 ? `OK — ${file} appliqué` : `ECHEC ${res.status}`);
if (res.status >= 300) { console.log(body); process.exit(1); }
// Affiche les lignes renvoyées (utile pour les requêtes d'inspection).
try { const rows = JSON.parse(body); if (Array.isArray(rows) && rows.length) console.table(rows); } catch {}
