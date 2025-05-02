import { detectBlocks, highlightSearchTerm } from '../utils/format';

const NotePopup = ({ note, searchTerm, closePopup, showToast }) => {
  const formatContent = () => {
    const parsed = detectBlocks(note.query);
    const formatted = parsed.map((block, index) => {
      const highlightedContent = highlightSearchTerm(block.content, searchTerm);
      const blockContent = block.content.replace(/'/g, "\\'");
      let blockHtml;
      if (block.type === 'sql') {
        blockHtml = `
          <div class="block sql">
            <strong>SQL Query:</strong>
            <pre>${highlightedContent}</pre>
            <button class="popup-copy-button" onclick="navigator.clipboard.writeText('${blockContent}')
              .then(() => document.querySelector('.toast').innerHTML = 'Copied to clipboard')
              .catch(() => document.querySelector('.toast').innerHTML = 'Copy failed')">
              📋 Copy
            </button>
          </div>`;
      } else if (block.type === 'command') {
        blockHtml = `
          <div class="block command">
            <strong>Command:</strong>
            <pre>${highlightedContent}</pre>
            <button class="popup-copy-button" onclick="navigator.clipboard.writeText('${blockContent}')
              .then(() => document.querySelector('.toast').innerHTML = 'Copied to clipboard')
              .catch(() => document.querySelector('.toast').innerHTML = 'Copy failed')">
              📋 Copy
            </button>
          </div>`;
      } else if (block.type === 'step') {
        blockHtml = `
          <div class="block step">
            <strong>${highlightedContent}</strong>
            <button class="popup-copy-button" onclick="navigator.clipboard.writeText('${blockContent}')
              .then(() => document.querySelector('.toast').innerHTML = 'Copied to clipboard')
              .catch(() => document.querySelector('.toast').innerHTML = 'Copy failed')">
              📋 Copy
            </button>
          </div>`;
      } else {
        blockHtml = `
          <div class="block text">
            <pre>${highlightedContent}</pre>
            <button class="popup-copy-button" onclick="navigator.clipboard.writeText('${blockContent}')
              .then(() => document.querySelector('.toast').innerHTML = 'Copied to clipboard')
              .catch(() => document.querySelector('.toast').innerHTML = 'Copy failed')">
              📋 Copy
            </button>
          </div>`;
      }
      return blockHtml;
    });
    if (note.imageUrl) {
      formatted.push(`
        <div class="block image">
          <strong>Image:</strong>
          <img src="${note.imageUrl}" alt="Note image" style="max-width: 100%; border-radius: 8px;" />
          <button class="popup-copy-button" onclick="navigator.clipboard.writeText('${note.imageUrl}')
            .then(() => document.querySelector('.toast').innerHTML = 'Image URL copied')
            .catch(() => document.querySelector('.toast').innerHTML = 'Copy failed')">
            📋 Copy URL
          </button>
        </div>`);
    }
    return formatted.join('');
  };

  return (
    <div className="popup-overlay" onClick={closePopup}>
      <div className="popup-box" onClick={(e) => e.stopPropagation()}>
        <h3>Note Content</h3>
        <div dangerouslySetInnerHTML={{ __html: formatContent() }} />
        <button className="close-popup" onClick={closePopup}>
          Close
        </button>
      </div>
    </div>
  );
};

export default NotePopup;