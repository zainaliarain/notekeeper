import { detectBlocks, highlightSearchTerm } from '../utils/format';

const Sidebar = ({ notes, searchTerm, openPopup, togglePin, handleEdit, handleDelete, copyToClipboard, unlockedNotes, showToast, deletingNotes }) => {
  const formatQueryForSidebar = (query, term, imageUrl, voiceUrl, isUnlocked) => {
    if (!isUnlocked) return <p>Locked private note. Enter password to view content.</p>;
    const parsed = detectBlocks(query);
    const content = parsed.map((block, index) => (
      <div key={index} className={`block ${block.type}`}>
        {block.type === 'sql' && <strong>SQL Query:</strong>}
        {block.type === 'command' && <strong>Command:</strong>}
        {block.type === 'step' && <strong>Step:</strong>}
        <pre dangerouslySetInnerHTML={{ __html: highlightSearchTerm(block.content, term) }} />
      </div>
    ));
    if (imageUrl && isUnlocked) {
      content.push(
        <div key="image" className="block image">
          <strong>Image:</strong>
          <img
            src={imageUrl}
            alt="Note image"
            style={{ maxWidth: '100%', borderRadius: '8px' }}
            onError={(e) => console.log('Image failed to load:', imageUrl, e)}
          />
        </div>
      );
    }
    if (voiceUrl && isUnlocked) {
      content.push(
        <div key="voice" className="block voice">
          <strong>Voice Note:</strong>
          <audio controls src={voiceUrl} onError={(e) => console.log('Voice failed to load:', voiceUrl, e)}>
            Your browser does not support the audio element.
          </audio>
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
          if (!note || !note._id || !note.name || !note.query) {
            console.warn('Sidebar: Skipping invalid note:', note);
            return null;
          }
          const isUnlocked = !note.isPrivate || unlockedNotes.includes(note._id);
          return (
            <li
              key={note._id}
              className={`search-result-item ${deletingNotes.includes(note._id) ? 'deleting' : ''}`}
            >
              <div className="note-header">
                <button
                  className="saved-button"
                  onClick={() => {
                    if (note.isPrivate && !isUnlocked) {
                      showToast('Please unlock this private note to view');
                      return;
                    }
                    console.log(`Sidebar: Opening note ID: ${note._id}`);
                    openPopup(note);
                  }}
                  dangerouslySetInnerHTML={{ __html: highlightSearchTerm(note.name, searchTerm) }}
                />
                {note.category && <span className="category-tag">{note.category}</span>}
                {note.isPrivate && <span className="privacy-tag">🔒</span>}
              </div>
              <div className="search-query-content">
                {formatQueryForSidebar(note.query, searchTerm, note.imageUrl, note.voiceUrl, isUnlocked)}
              </div>
              <div className="button-actions">
                <button
                  onClick={() => {
                    console.log(`Sidebar: Toggling pin for note ID: ${note._id}`);
                    togglePin(note._id);
                  }}
                >
                  {note.isPinned ? '⭐ Unpin' : '☆ Pin'}
                </button>
                <button
                  onClick={() => {
                    console.log(`Sidebar: Editing note ID: ${note._id}`);
                    handleEdit(note);
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => {
                    console.log(`Sidebar: Deleting note ID: ${note._id}`);
                    handleDelete(note._id);
                  }}
                >
                  🗑️ Delete
                </button>
                <button
                  onClick={() => {
                    console.log(`Sidebar: Copying note ID: ${note._id}`);
                    if (note.isPrivate && !isUnlocked) {
                      copyToClipboard(note.query, note._id);
                    } else {
                      copyToClipboard(note.query);
                    }
                  }}
                >
                  📋 Copy
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Sidebar;