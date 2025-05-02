import { useState } from 'react';
import axios from 'axios';
import { detectBlocks, highlightSearchTerm } from '../utils/format';
import PropTypes from 'prop-types';

const NoteList = ({ user, buttons, setButtons, searchTerm, filterCategory, showToast, openPopup }) => {
  const togglePin = async (id) => {
    if (!user) {
      showToast('Please log in to pin notes');
      return;
    }
    try {
      const updated = buttons.map((btn) =>
        btn._id === id ? { ...btn, isPinned: !btn.isPinned } : btn
      );
      setButtons(updated);
      const token = await user.getIdToken();
      await axios.put(
        `http://localhost:5000/buttons/${id}`,
        { isPinned: !buttons.find((btn) => btn._id === id)?.isPinned },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(updated.find((btn) => btn._id === id).isPinned ? 'Note pinned' : 'Note unpinned');
    } catch (error) {
      showToast('Error updating pin status');
      console.error('Error updating pin status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!user) {
      showToast('Please log in to delete notes');
      return;
    }
    try {
      const token = await user.getIdToken();
      await axios.delete(`http://localhost:5000/buttons/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setButtons(buttons.filter((button) => button._id !== id));
      showToast('Note deleted');
    } catch (error) {
      showToast('Error deleting note');
      console.error('Error deleting button:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast('Copied to clipboard'))
      .catch((err) => {
        showToast('Copy failed');
        console.error('Copy failed:', err);
      });
  };

  const filteredButtons = buttons
    .filter((btn) => {
      const nameMatch = btn.name.toLowerCase().includes(searchTerm.toLowerCase());
      const queryMatch = btn.query.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = !filterCategory || btn.category === filterCategory;
      const privacyMatch = !btn.isPrivate || btn.userId === user?.uid;
      return (nameMatch || queryMatch) && categoryMatch && privacyMatch;
    })
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  return (
    <ul className="note-list">
      {filteredButtons.map((button) => (
        <li key={button._id} className="query-display">
          <div className="note-header">
            <button
              className="saved-button"
              onClick={() => openPopup(button)}
              dangerouslySetInnerHTML={{ __html: highlightSearchTerm(button.name, searchTerm) }}
            />
            {button.category && <span className="category-tag">{button.category}</span>}
            {button.isPrivate && <span className="privacy-tag">🔒</span>}
          </div>
          <div className="button-actions">
            <button onClick={() => togglePin(button._id)}>
              {button.isPinned ? '⭐ Unpin' : '☆ Pin'}
            </button>
            <button
              onClick={() =>
                user && (!button.isPrivate || button.userId === user.uid)
                  ? openPopup(button, true)
                  : showToast('You cannot edit this note')
              }
            >
              ✏️ Edit
            </button>
            <button onClick={() => handleDelete(button._id)}>🗑️ Delete</button>
            <button onClick={() => copyToClipboard(button.query)}>📋 Copy</button>
          </div>
        </li>
      ))}
    </ul>
  );
};

NoteList.propTypes = {
  user: PropTypes.object,
  buttons: PropTypes.array.isRequired,
  setButtons: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  filterCategory: PropTypes.string.isRequired,
  showToast: PropTypes.func.isRequired,
  openPopup: PropTypes.func.isRequired,
};

export default NoteList;