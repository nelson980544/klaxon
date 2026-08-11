import type { NextConfig } from 'next';

const config: NextConfig = {
  // Le site est entièrement statique : aucune base de données, aucun cookie,
  // aucune mesure d'audience. Il n'existe que pour présenter Klaxon et servir
  // les pages légales exigées par Apple.
  reactStrictMode: true,
};

export default config;
