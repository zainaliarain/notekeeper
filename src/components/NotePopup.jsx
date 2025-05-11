import React from 'react';
import '../App.css';

const NotePopup = ({ note, searchTerm, closePopup, showToast, isUnlocked }) => {
  const detectBlocks = (query) => {
    const blocks = [];
    const lines = query.split('\n');
    let currentBlock = { type: 'text', content: '' };
    const sqlKeywords = /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/i;
    const commandKeywords = /^(ls|cd|pwd|cat|grep|chmod|rm|mv|cp|touch|mkdir|rmdir|echo|ps|kill|top|htop)/i;
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        if (currentBlock.content) {
          blocks.push({ type: currentBlock.type, content: currentBlock.content.trim() });
          currentBlock = { type: 'text', content: '' };
        }
        return;
      }
      if (sqlKeywords.test(trimmedLine)) {
        if (currentBlock.content) {
          blocks.push({ type: currentBlock.type, content: currentBlock.content.trim() });
        }
        currentBlock = { type: 'sql', content: trimmedLine };
      } else if (commandKeywords.test(trimmedLine)) {
        if (currentBlock.content) {
          blocks.push({ type: currentBlock.type, content: currentBlock.content.trim() });
        }
        currentBlock = { type: 'command', content: trimmedLine };
      } else if (trimmedLine.match(/^\d+\./)) {
        if (currentBlock.content) {
          blocks.push({ type: currentBlock.type, content: currentBlock.content.trim() });
        }
        currentBlock = { type: 'step', content: trimmedLine };
      } else {
        currentBlock.content += (currentBlock.content ? '\n' : '') + trimmedLine;
      }
      if (index === lines.length - 1 && currentBlock.content) {
        blocks.push({ type: currentBlock.type, content: currentBlock.content.trim() });
      }
    });
    return blocks.length > 0 ? blocks : [{ type: 'text', content: query }];
  };

  const highlightText = (text, type) => {
    let label = '';
    switch (type) {
      case 'command':
        label = '<strong class="block-label">Command:</strong>';
        break;
      case 'sql':
        label = '<strong class="block-label">SQL Query:</strong>';
        break;
      case 'step':
        label = '<strong class="block-label">Step:</strong>';
        break;
      default:
        break;
    }
    return `${label}<br/><span class="block-content">${text.replace(/\n/g, '<br/>')}</span>`;
  };

  const getBlockClass = (type) => {
    switch (type) {
      case 'command':
        return 'block command';
      case 'sql':
        return 'block sql';
      case 'mixed':
        return 'block mixed';
      default:
        return 'block text';
    }
  };

  if (!note || !note.name || !note.query) {
    console.warn('NotePopup: Invalid note:', note);
    return null;
  }

  return (
    <div className="popup-overlay" onClick={closePopup}>
      <div className="popup-box note-popup" onClick={(e) => e.stopPropagation()}>
        <h3>{note.name}</h3>
        {note.isPrivate && !isUnlocked ? (
          <p>Locked private note. Please enter the password to view content.</p>
        ) : (
          <>
            {note.query ? (
              detectBlocks(note.query).map((query, index) => (
                <div key={index} className={getBlockClass(query.type)}>
                  <pre dangerouslySetInnerHTML={{ __html: highlightText(query.content, query.type) }} />
                  <button
                    className="popup-copy-button"
                    onClick={() => {
                      navigator.clipboard.writeText(query.content);
                      showToast('Copied to clipboard');
                    }}
                  >
                    Copy
                  </button>
                </div>
              ))
            ) : (
              <p>No content to display.</p>
            )}
            {note.imageUrl && (
              <div className="block image">
                <strong>Image:</strong>
                <img
                  src={note.imageUrl}
                  alt="Note image"
                  style={{ maxWidth: '100%', borderRadius: '8px' }}
                  onError={() => showToast('Failed to load image')}
                />
              </div>
            )}
            {note.voiceUrl && (
              <div className="block voice">
                <strong>Voice Note:</strong>
                <audio
                  controls
                  src={note.voiceUrl}
                  onError={() => showToast('Failed to load voice note')}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </>
        )}
        {note.isPrivate && <p>Private Note</p>}
        <button className="close-popup" onClick={closePopup}>
          Close
        </button>
      </div>
    </div>
  );
};

export default NotePopup;