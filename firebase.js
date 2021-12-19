// Import the functions you need from the SDKs you need
import firebase from "firebase";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

let app = null;
if (!firebase.apps.length) {
  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyC0PwTyMz5i65VVA1BJyyalr-I_T0EHiI4",
    authDomain: "campush-9ec35.firebaseapp.com",
    databaseURL: "https://campush-9ec35-default-rtdb.firebaseio.com",
    projectId: "campush-9ec35",
    storageBucket: "campush-9ec35.appspot.com",
    messagingSenderId: "961623911006",
    appId: "1:961623911006:web:63ea4f8ab91ad8a499e2cf"
  };

  // Initialize Firebase
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app()
}

const db = app.firestore();
const firebaseStorage = app.storage();

export { db, firebaseStorage }