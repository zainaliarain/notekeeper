<<<<<<< HEAD
import PropTypes from 'prop-types';
  import { marked } from 'marked';
  import axios from 'axios';

  const NoteList = ({ user, buttons, setButtons, searchTerm, filterCategory, showToast, openPopup, onEdit }) => {
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
        setButtons(buttons.filter((btn) => btn._id !== id));
        showToast('Note deleted');
      } catch (error) {
        showToast('Error deleting note');
        console.error('Delete error:', error);
      }
    };

    const filteredButtons = buttons.filter((button) => {
      if (button.isPrivate && button.userId !== user?.uid) return false;
      const matchesSearch = button.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           button.query.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory ? button.category === filterCategory : true;
      return matchesSearch && matchesCategory;
    });

    return (
      <div className="note-list">
        {filteredButtons.map((button) => (
          <div key={button._id} className={`note-item ${button.isPinned ? 'pinned' : ''}`}>
            <div onClick={() => openPopup(button)} className="note-content">
              <h3>{button.name}</h3>
              <p dangerouslySetInnerHTML={{ __html: marked(button.query.substring(0, 100)) }} />
              {button.imageUrl && <img src={button.imageUrl} alt="Note" className="note-image" />}
            </div>
            <div className="note-actions">
              <button className="edit-button" onClick={() => onEdit(button)}>
                ✏️
              </button>
              <button className="delete-button" onClick={() => handleDelete(button._id)}>
                🗑️
              </button>
=======
import { highlightSearchTerm } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const NoteList = ({ notes, searchTerm, openPopup, togglePin, handleEdit, handleDelete, copyToClipboard, unlockedNotes, deletingNotes }) => {
  const { user } = useAuth();

  return (
    <ul className="note-list">
      {notes.map((note) => {
        if (!note || !note._id || !note.name || !note.query) {
          console.warn('NoteList: Skipping invalid note:', note);
          return null;
        }
        if (note.isPrivate && note.userId !== user?.uid) {
          console.log(`NoteList: Skipping private note ID: ${note._id} for user: ${user?.uid}`);
          return null;
        }
        const isUnlocked = !note.isPrivate || unlockedNotes.includes(note._id);
        return (
          <li
            key={note._id}
            className={`query-display ${deletingNotes.includes(note._id) ? 'deleting' : ''}`}
          >
            <div className="note-header">
              <button
                className="saved-button"
                onClick={() => {
                  console.log(`NoteList: Opening note ID: ${note._id}, name: ${note.name}`);
                  openPopup(note);
                }}
                dangerouslySetInnerHTML={{ __html: highlightSearchTerm(note.name, searchTerm) }}
              />
              {note.category && <span className="category-tag">{note.category}</span>}
              {note.isPrivate && <span className="privacy-tag">🔒</span>}
            </div>
            <div className="button-actions">
              <button
                onClick={() => {
                  console.log(`NoteList: Toggling pin for note ID: ${note._id}`);
                  togglePin(note._id);
                }}
              >
                {note.isPinned ? '⭐ Unpin' : '☆ Pin'}
              </button>
              <button
                onClick={() => {
                  console.log(`NoteList: Editing note ID: ${note._id}`);
                  handleEdit(note);
                }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => {
                  console.log(`NoteList: Deleting note ID: ${note._id}`);
                  handleDelete(note._id);
                }}
              >
                🗑️ Delete
              </button>
              <button
                onClick={() => {
                  console.log(`NoteList: Copying note ID: ${note._id}`);
                  if (note.isPrivate && !isUnlocked) {
                    copyToClipboard(note.query, note._id);
                  } else {
                    copyToClipboard(note.query);
                  }
                }}
              >
                📋 Copy
              </button>
>>>>>>> main
            </div>
          </div>
        ))}
      </div>
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
    onEdit: PropTypes.func.isRequired,
  };

export default NoteList;