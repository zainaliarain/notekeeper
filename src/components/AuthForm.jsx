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
    setTimeout(() => setPopup({ message: '', show: false }), 5000); // Auto-dismiss after 5 seconds
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
    if (isSignup && !validateDisplayName(displayName)) {
      showPopup('Please enter your name');
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
      if (error.code === 'auth/email-already-in-use') message = 'Email is already in use';
      else if (error.code === 'auth/invalid-email') message = 'Invalid email address';
      else if (error.code === 'auth/weak-password') message = 'Password is too weak';
      else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') message = 'Invalid email or password';
      showPopup(message);
    }
  };

  return (
    <div className="auth-container">
      {popup.show && (
        <div className="auth-popup">
          <span className="popup-message">{popup.message}</span>
          <span className="popup-close" onClick={dismissPopup}>&times;</span>
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