import { useState } from 'react';
import { signup, login } from '../utils/auth';
import PropTypes from 'prop-types';

const AuthForm = ({ onAuthSuccess, showToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isSubmitting) {
      showToast('Please wait before trying again');
      return;
    }
    setIsSubmitting(true);
    const success = isSignup
      ? await signup(email, password, displayName, showToast)
      : await login(email, password, showToast);
    if (success) {
      setEmail('');
      setPassword('');
      setDisplayName('');
      onAuthSuccess();
    }
    setIsSubmitting(false);
  };

  // Rest of AuthForm.jsx (form JSX) remains unchanged
};

AuthForm.propTypes = {
  onAuthSuccess: PropTypes.func.isRequired,
  showToast: PropTypes.func.isRequired,
};

export default AuthForm;