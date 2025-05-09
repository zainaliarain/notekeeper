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