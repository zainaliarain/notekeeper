import { useState } from 'react';
  import PropTypes from 'prop-types';
  import { marked } from 'marked';
  import axios from 'axios';
  import bcrypt from 'bcryptjs';

  const NotePopup = ({ button, searchTerm, showPopup, closePopup, showToast }) => {
    const [password, setPassword] = useState('');
    const [isUnlocked, setIsUnlocked] = useState(false);

    const handleUnlock = async () => {
      if (!button.isPrivate) {
        setIsUnlocked(true);
        return;
      }
      try {
        const response = await axios.get(`http://localhost:5000/buttons/${button._id}`);
        const storedPassword = response.data.password;
        if (storedPassword && await bcrypt.compare(password, storedPassword)) {
          setIsUnlocked(true);
          showToast('Note unlocked');
        } else {
          showToast('Incorrect password');
        }
      } catch (error) {
        showToast('Error verifying password');
        console.error('Password verification error:', error);
      }
    };

    if (!button) return null;

    return (
      <div className={`popup ${showPopup ? 'show' : ''}`}>
        <div className="popup-content">
          <button className="close-button" onClick={closePopup}>×</button>
          {!isUnlocked ? (
            <>
              <h3>{button.name}</h3>
              {button.isPrivate ? (
                <>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="note-input"
                  />
                  <button onClick={handleUnlock} className="submit-button">
                    Unlock Note
                  </button>
                </>
              ) : (
                <button onClick={handleUnlock} className="submit-button">
                  View Note
                </button>
              )}
            </>
          ) : (
            <>
              <h3>{button.name}</h3>
              <p dangerouslySetInnerHTML={{ __html: marked(button.query) }} />
              {button.imageUrl && <img src={button.imageUrl} alt="Note" className="note-image" />}
              <p>Category: {button.category || 'None'}</p>
              <p>Pinned: {button.isPinned ? 'Yes' : 'No'}</p>
              <p>Private: {button.isPrivate ? 'Yes' : 'No'}</p>
            </>
          )}
        </div>
      </div>
    );
  };

  NotePopup.propTypes = {
    button: PropTypes.object,
    searchTerm: PropTypes.string.isRequired,
    showPopup: PropTypes.bool.isRequired,
    closePopup: PropTypes.func.isRequired,
    showToast: PropTypes.func.isRequired,
  };

  export default NotePopup;