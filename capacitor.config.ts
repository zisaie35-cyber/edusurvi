import type { CapacitorConfig } from '@capacitor/cli'

// IMPORTANT : remplacez server.url par le domaine réel de votre déploiement
// Vercel avant de compiler l'app Android. L'application EduSuivi (pages +
// routes API) reste hébergée sur Vercel — l'app Android n'est qu'une
// coquille WebView native qui charge cette URL, elle n'embarque pas le
// backend (clé Supabase, JWT, etc. restent côté serveur).
const config: CapacitorConfig = {
  appId: 'com.edusuivi.app',
  appName: 'EduSuivi',
  webDir: 'www',
  server: {
    url: 'https://REMPLACER-PAR-VOTRE-DOMAINE.vercel.app',
    cleartext: false,
  },
}

export default config
