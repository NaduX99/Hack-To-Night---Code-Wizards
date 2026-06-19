import { getApps, initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

export function isFirebaseClientConfigured() {
  return Object.values(firebaseConfig).every(Boolean)
}

export function getFirebaseAuth() {
  if (!isFirebaseClientConfigured()) {
    throw new Error('Firebase client environment variables are missing.')
  }

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  return getAuth(app)
}

export function getGoogleProvider() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return provider
}
