'use client'

import { useEffect } from 'react'

// Enregistre le service worker (public/sw.js) pour permettre l'installation
// de l'application (PWA) et un fonctionnement minimal hors-ligne.
export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}
