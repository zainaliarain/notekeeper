import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
  } from 'firebase/auth';
  import { validateEmail, validatePassword } from './validation';
  import { auth } from '../firebase'; // Import your Firebase auth instance
  
  export const signup = async (email, password, displayName, showToast) => {
    if (!validateEmail(email)) {
      showToast('Please enter a valid email address');
      return false;
    }
    if (!validatePassword(password)) {
      showToast('Password must be at least 6 characters long');
      return false;
    }
    if (!displayName.trim()) {
      showToast('Please enter your name');
      return false;
    }
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(userCredential.user, { displayName: displayName.trim() });
      showToast('Signed up successfully');
      return true;
    } catch (error) {
      console.error('Signup error:', error.code, error.message);
      let message = 'Signup failed';
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
        default:
          message = 'An error occurred. Please try again';
          break;
      }
      showToast(message);
      return false;
    }
  };
  
  export const login = async (email, password, showToast) => {
    if (!validateEmail(email)) {
      showToast('Please enter a valid email address');
      return false;
    }
    if (!validatePassword(password)) {
      showToast('Password must be at least 6 characters long');
      return false;
    }
  
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      showToast('Logged in successfully');
      return true;
    } catch (error) {
      console.error('Login error:', error.code, error.message);
      let message = 'Login failed';
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'User does not exist';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password';
          break;
        case 'auth/too-many-requests':
          message = 'Too many attempts. Please try again later';
          break;
        case 'auth/invalid-credential':
          message = 'Invalid credentials provided';
          break;
        default:
          message = 'An error occurred. Please try again';
          break;
      }
      showToast(message);
      return false;
    }
  };
  
  export const logout = async (showToast) => {
    try {
      await signOut(auth);
      showToast('Logged out successfully');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Error logging out');
      return false;
    }
  };
  
  export const updateUserProfile = async (user, displayName, showToast) => {
    if (!displayName.trim()) {
      showToast('Name cannot be empty');
      return false;
    }
  
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      showToast('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      showToast('Error updating profile');
      return false;
    }
  };
  
  export const updateUserPassword = async (user, currentPassword, newPassword, confirmPassword, showToast) => {
    if (!validatePassword(newPassword)) {
      showToast('Password must be at least 6 characters long');
      return false;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match');
      return false;
    }
    if (!currentPassword) {
      showToast('Please enter your current password');
      return false;
    }
  
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      showToast('Password updated successfully');
      return true;
    } catch (error) {
      console.error('Update password error:', error);
      showToast('Error updating password: ' + error.message);
      return false;
    }
  };