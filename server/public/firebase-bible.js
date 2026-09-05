// ============================================================
// Konfigurasi Firebase project Leitora — dipakai HANYA untuk
// membaca data Alkitab (alkitab_versi/kitab/pasal) dari Firestore.
// Tidak dipakai untuk login/auth apapun di Leitora Live.
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyAKlE5VivkDREbRBcuoCw_nm0UvU5WxB74",
  authDomain: "leitora-18263.firebaseapp.com",
  projectId: "leitora-18263",
  storageBucket: "leitora-18263.firebasestorage.app",
  messagingSenderId: "1051623634139",
  appId: "1:1051623634139:web:7dd4d751b18eae16f4c8fe"
};

firebase.initializeApp(firebaseConfig);
const bibleDb = firebase.firestore();
