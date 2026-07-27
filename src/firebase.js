import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyAmcngn8ge2nBrMb9OxWbbpjYvGiJ0yRoY",
  authDomain: "fit5032-lab7-4087e.firebaseapp.com",
  projectId: "fit5032-lab7-4087e",
  storageBucket: "fit5032-lab7-4087e.firebasestorage.app",
  messagingSenderId: "828387352208",
  appId: "1:828387352208:web:938f6a08482595a9e3c215"
}

const firebaseApp = initializeApp(firebaseConfig)

export const auth = getAuth(firebaseApp)
export default firebaseApp