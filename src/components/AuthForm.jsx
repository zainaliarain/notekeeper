import { useState } from 'react';
import { auth } from '../firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { validateEmail, validatePassword, validateDisplayName } from '../utils/validation';

const AuthForm = ({ showToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [popup, setPopup] = useState({ message: '', show: false });

  const showPopup = (message) => {
    setPopup({ message, show: true });
    setTimeout(() => setPopup({ message: '', show: false }), 5000);
    showToast(message);
  };

  const dismissPopup = () => {
    setPopup({ message: '', show: false });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      showPopup('Please enter a valid email address');
      return;
    }
    if (!validatePassword(password)) {
      showPopup('Password must be at least 6 characters long');
      return;
    }
    if (isSignup && !displayName.trim()) {
      showToast('Please enter your name');
      return;
    }

    try {
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: displayName.trim() });
        showToast('Signed up successfully');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Logged in successfully');
      }
      setEmail('');
      setPassword('');
      setDisplayName('');
    } catch (error) {
      let message = 'Authentication failed';
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'Email is already in use';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address';
          break;
        case 'auth/weak-password':
          message = 'Password is too weak';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          message = 'Invalid email or password';
          break;
        default:
          break;
      }
      showToast(message);
      console.error('Auth error:', error);
    }
  };

  return (
    <div className="auth-container">
      {popup.show && (
        <div className="auth-popup" onClick={dismissPopup}>
          {popup.message}
        </div>
      )}
      <h3>{isSignup ? 'Sign Up' : 'Log In'}</h3>
      <form onSubmit={handleAuth} className="auth-form">
        {isSignup && (
          <input
            type="text"
            placeholder="Your Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="auth-input"
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
          required
        />
        <button type="submit" className="auth-button">
          {isSignup ? 'Sign Up' : 'Log In'}
        </button>
        <button type="button" className="toggle-auth" onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? 'Switch to Log In' : 'Switch to Sign Up'}
        </button>
      </form>
    </div>
  );
};

export default AuthForm;