import axios from 'axios';
import { highlightSearchTerm } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const NoteList = ({ notes, searchTerm, openPopup, togglePin, handleEdit, handleDelete, copyToClipboard }) => {
  const { user } = useAuth();

  return (
    <ul className="note-list">
      {notes.map((note) => {
        if (!note || !note._id || !note.name) {
          console.log('NoteList: Skipping invalid note:', note);
          return null;
        }
        if (note.isPrivate && note.userId !== user?.uid) {
          console.log(`NoteList: Skipping private note ID: ${note._id} for user: ${user?.uid}`);
          return null;
        }
        return (
          <li key={note._id} className="query-display">
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
              <button onClick={() => {
                console.log(`NoteList: Toggling pin for note ID: ${note._id}`);
                togglePin(note._id);
              }}>
                {note.isPinned ? '⭐ Unpin' : '☆ Pin'}
              </button>
              <button onClick={() => {
                console.log(`NoteList: Editing note ID: ${note._id}`);
                handleEdit(note);
              }}>✏️ Edit</button>
              <button onClick={() => {
                console.log(`NoteList: Deleting note ID: ${note._id}`);
                handleDelete(note._id);
              }}>🗑️ Delete</button>
              <button onClick={() => {
                console.log(`NoteList: Copying note ID: ${note._id}`);
                copyToClipboard(note.query);
              }}>📋 Copy</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default NoteList;