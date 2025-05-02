import { detectBlocks, highlightSearchTerm } from '../utils/format';

const Sidebar = ({ notes, searchTerm, openPopup, togglePin, handleEdit, handleDelete, copyToClipboard }) => {
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
        {notes.map((note) => (
          <li key={note._id} className="search-result-item">
            <div className="note-header">
              <button
                className="saved-button"
                onClick={() => openPopup(note)}
                dangerouslySetInnerHTML={{ __html: highlightSearchTerm(note.name, searchTerm) }}
              />
              {note.category && <span className="category-tag">{note.category}</span>}
              {note.isPrivate && <span className="privacy-tag">🔒</span>}
            </div>
            <div className="search-query-content">
              {formatQueryForSidebar(note.query, searchTerm, note.imageUrl)}
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
    </div>
  );
};

export default Sidebar;