import axios from 'axios';
import { highlightSearchTerm } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const NoteList = ({ notes, searchTerm, openPopup, togglePin, handleEdit, handleDelete, copyToClipboard }) => {
  const { user } = useAuth();

  return (
    <ul className="note-list">
      {notes.map((note) => (
        <li key={note._id} className="query-display">
          <div className="note-header">
            <button
              className="saved-button"
              onClick={() => openPopup(note)}
              dangerouslySetInnerHTML={{ __html: highlightSearchTerm(note.name, searchTerm) }}
            />
            {note.category && <span className="category-tag">{note.category}</span>}
            {note.isPrivate && <span className="privacy-tag">🔒</span>}
          </div>
          <div className="button-actions">
            <button onClick={() => togglePin(note._id)}>
              {note.isPinned ? '⭐ Unpin' : '☆ Pin'}
            </button>
            <button onClick={() => handleEdit(note)}>✏️ Edit</button>
            <button onClick={() => handleDelete(note._id)}>🗑️ Delete</button>
            <button onClick={() => copyToClipboard(note.query)}>📋 Copy</button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default NoteList;