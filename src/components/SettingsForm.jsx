import { useState } from 'react';
  import { updateProfile, updatePassword } from 'firebase/auth';
  import PropTypes from 'prop-types';
  import { validatePassword } from '../utils/validation';

  const SettingsForm = ({ user, showToast, onClose }) => {
    const [newName, setNewName] = useState(user.displayName || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleUpdateProfile = async (e) => {
      e.preventDefault();
      if (!newName.trim()) {
        showToast('Name cannot be empty');
        return;
      }

      try {
        await updateProfile(user, { displayName: newName.trim() });
        showToast('Profile updated successfully');
        onClose();
      } catch (error) {
        showToast('Error updating profile');
        console.error('Update profile error:', error);
      }
    };

    const handleUpdatePassword = async (e) => {
      e.preventDefault();
      if (!validatePassword(newPassword)) {
        showToast('Password must be at least 6 characters long');
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast('Passwords do not match');
        return;
      }

      try {
        await updatePassword(user, newPassword);
        showToast('Password updated successfully');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      } catch (error) {
        let message = 'Error updating password';
        if (error.code === 'auth/requires-recent-login') {
          message = 'Please log out and log in again to update password';
        }
        showToast(message);
        console.error('Update password error:', error);
      }
    };

    return (
      <div className="settings-container">
        <h3>User Settings</h3>
        <form onSubmit={handleUpdateProfile} className="settings-form">
          <input
            type="text"
            placeholder="Update Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="auth-input"
          />
          <button type="submit" className="auth-button">
            Update Name
          </button>
        </form>
        <form onSubmit={handleUpdatePassword} className="settings-form">
          <input
            type="password"
            placeholder="New Password (min 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="auth-input"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="auth-input"
          />
          <button type="submit" className="auth-button">
            Update Password
          </button>
        </form>
        <button className="close-settings" onClick={onClose}>
          Close
        </button>
      </div>
    );
  };

  SettingsForm.propTypes = {
    user: PropTypes.object.isRequired,
    showToast: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
  };

  export default SettingsForm;