import { initializeApp } from 'firebase/app'
import { initializeAnalytics, isSupported, type Analytics } from 'firebase/analytics'

// Firebase web client config — 공개 값 (번들에 포함됨). 보안은 Firestore Rules로 제어.
// GitHub Actions Variables가 비어 있어도 프로덕션 GA가 동작하도록 코드에 고정.
const firebaseConfig = {
  apiKey:            'AIzaSyCd2WhcJaWBb27GnMU1uYLb9wLcaedpvdE',
  authDomain:        'festreci.firebaseapp.com',
  projectId:         'festreci',
  storageBucket:     'festreci.firebasestorage.app',
  messagingSenderId: '986187827789',
  appId:             '1:986187827789:web:adeed468fac0cadd28aa04',
  measurementId:     'G-VPQXYYDQMN',
}

const app = initializeApp(firebaseConfig)

let analyticsInstance: Analytics | null = null
let analyticsReady: Promise<Analytics | null> | null = null

/** 브라우저에서만 Analytics 초기화 */
export function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (analyticsInstance) return Promise.resolve(analyticsInstance)
  if (!analyticsReady) {
    if (typeof window === 'undefined') {
      analyticsReady = Promise.resolve(null)
    } else {
      analyticsReady = isSupported()
        .then((supported) => {
          if (!supported) return null
          // SPA: 자동 page_view 비활성화 → usePageTracking에서만 전송 (중복·집계 왜곡 방지)
          analyticsInstance = initializeAnalytics(app, {
            config: { send_page_view: false },
          })
          return analyticsInstance
        })
        .catch(() => null)
    }
  }
  return analyticsReady
}
