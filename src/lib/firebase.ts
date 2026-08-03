import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'

// Firebase 설정 — 환경 변수로 관리 (.env.local)
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)

let analyticsInstance: Analytics | null = null
let analyticsReady: Promise<Analytics | null> | null = null

/** 브라우저 환경 + measurementId가 있을 때만 초기화 (SSR/빌드·미설정 시 null) */
export function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (analyticsInstance) return Promise.resolve(analyticsInstance)
  if (!analyticsReady) {
    if (typeof window === 'undefined' || !firebaseConfig.measurementId) {
      analyticsReady = Promise.resolve(null)
    } else {
      analyticsReady = isSupported()
        .then((supported) => {
          if (!supported) return null
          analyticsInstance = getAnalytics(app)
          return analyticsInstance
        })
        .catch(() => null)
    }
  }
  return analyticsReady
}
