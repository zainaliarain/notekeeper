import { detectBlocks, highlightSearchTerm } from '../utils/format';
import PropTypes from 'prop-types';

const NotePopup = ({ button, searchTerm, showPopup, closePopup, showToast }) => {
  if (!showPopup || !button) return null;

  const parsed = detectBlocks(button.query);
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

  if (button.imageUrl) {
    formatted.push(`
      <div class="block image">
        <strong>Image:</strong>
        <img src="${button.imageUrl}" alt="Note image" style="max-width: 100%; border-radius: 8px;" />
        <button class="popup-copy-button" onclick="navigator.clipboard.writeText('${button.imageUrl}')
          .then(() => document.querySelector('.toast').innerHTML = 'Image URL copied')
          .catch(() => document.querySelector('.toast').innerHTML = 'Copy failed')">
          📋 Copy URL
        </button>
      </div>`);
  }

  return (
    <div className="popup-overlay" onClick={closePopup}>
      <div className="popup-box" onClick={(e) => e.stopPropagation()}>
        <h3>Note Content</h3>
        <div dangerouslySetInnerHTML={{ __html: formatted.join('') }} />
        <button className="close-popup" onClick={closePopup}>
          Close
        </button>
      </div>
    </div>
  );
};

export default NotePopup;