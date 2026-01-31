// ============================================
// CONFIGURACIÓN DE FIREBASE
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyDgGIhbTiosbFm3vXFyF3KZfRuegmMnfRo",
    authDomain: "semaforo-calidad-planta.firebaseapp.com",
    projectId: "semaforo-calidad-planta",
    storageBucket: "semaforo-calidad-planta.firebasestorage.app",
    messagingSenderId: "57193317591",
    appId: "1:57193317591:web:3881c0a67b78650d785c92",
    measurementId: "G-WSEQ2BE1G0"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencia a Firestore
const db = firebase.firestore();
