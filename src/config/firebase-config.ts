import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDWJjMBd12mJ0kBfey16uy-AhtzQeQzA48",
  authDomain: "privee-catalog.firebaseapp.com",
  projectId: "privee-catalog",
  storageBucket: "privee-catalog.firebasestorage.app",
  messagingSenderId: "557296192181",
  appId: "1:557296192181:web:25a1a2c3670398fe978cfc"
};

export const appConfig = {
  providers: [
    // 1. Inicializa Firebase con tus credenciales reales
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    
    // 2. Inicializa Firestore apuntando directo a la nube de Google
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    
  ],
};
