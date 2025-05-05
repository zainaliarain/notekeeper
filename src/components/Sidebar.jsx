import { detectBlocks, highlightSearchTerm } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ notes, searchTerm, openPopup, togglePin, handleEdit, handleDelete, copyToClipboard }) => {
  const { user } = useAuth();

  const formatQueryForSidebar = (query, term, imageUrl) => {
    const parsed = detectBlocks(query);
    const content = parsed.map((block, index) => (
      <div key={index} className={`block ${block.type}`}>
        {block.type === 'sql' && <strong>SQL Query:</strong>}
        {block.type === 'command' && <strong>Command:</strong>}
        {block.type === 'step' && <strong>Step:</strong>}
        <pre dangerouslySetInnerHTML={{ __html: highlightSearchTerm(block.content, term) }} />
      </div>
    ));
    if (imageUrl) {
      content.push(
        <div key="image" className="block image">
          <strong>Image:</strong>
          <img
            src={imageUrl}
            alt="Note image"
            style={{ maxWidth: '100%', borderRadius: '8px' }}
          />
        </div>
      );
    }
    return content;
  };

  return (
    <div className="sidebar">
      <h3>Search Results</h3>
      <ul className="search-results">
        {notes.map((note) => {
          if (!note || !note._id || !note.name) {
            console.log('Sidebar: Skipping invalid note:', note);
            return null;
          }
          if (note.isPrivate && note.userId !== user?.uid) {
            console.log(`Sidebar: Skipping private note ID: ${note._id} for user: ${user?.uid}`);
            return null;
          }
          return (
            <li key={note._id} className="search-result-item">
              <div className="note-header">
                <button
                  className="saved-button"
                  onClick={() => {
                    console.log(`Sidebar: Opening note ID: ${note._id}, name: ${note.name}`);
                    openPopup(note);
                  }}
                  dangerouslySetInnerHTML={{ __html: highlightSearchTerm(note.name, searchTerm) }}
                />
                {note.category && <span className="category-tag">{note.category}</span>}
                {note.isPrivate && <span className="privacy-tag">🔒</span>}
              </div>
              <div className="search-query-content">
                {formatQueryForSidebar(note.query, searchTerm, note.imageUrl)}
              </div>
              <div className="button-actions">
                <button onClick={() => {
                  console.log(`Sidebar: Toggling pin for note ID: ${note._id}`);
                  togglePin(note._id);
                }}>
                  {note.isPinned ? '⭐ Unpin' : '☆ Pin'}
                </button>
                <button onClick={() => {
                  console.log(`Sidebar: Editing note ID: ${note._id}`);
                  handleEdit(note);
                }}>✏️ Edit</button>
                <button onClick={() => {
                  console.log(`Sidebar: Deleting note ID: ${note._id}`);
                  handleDelete(note._id);
                }}>🗑️ Delete</button>
                <button onClick={() => {
                  console.log(`Sidebar: Copying note ID: ${note._id}`);
                  copyToClipboard(note.query);
                }}>📋 Copy</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Sidebar;