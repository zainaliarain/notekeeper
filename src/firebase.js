import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyBswQbYgOKRaGV6iABBj8LePA8Z3oNv-QU',
  authDomain: 'note-keeprt.firebaseapp.com',
  projectId: 'note-keeprt',
  storageBucket: 'note-keeprt.firebasestorage.app',
  messagingSenderId: '976544397456',
  appId: '1:976544397456:web:5592e3cf05fe8f93bf8015',
  measurementId: 'G-FBP4RS7CYR',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { auth, storage, analytics };