import { useState, useEffect } from 'react';
  import PropTypes from 'prop-types';
  import axios from 'axios';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

  const NoteForm = ({ user, storage, buttons, setButtons, fetchButtons, showToast, editingNote, setEditingNote }) => {
    const [name, setName] = useState('');
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [password, setPassword] = useState('');
    const [image, setImage] = useState(null);

    useEffect(() => {
      if (editingNote) {
        setName(editingNote.name);
        setQuery(editingNote.query);
        setCategory(editingNote.category || '');
        setIsPinned(editingNote.isPinned);
        setIsPrivate(editingNote.isPrivate);
        setPassword('');
      } else {
        resetForm();
      }
    }, [editingNote]);

    const resetForm = () => {
      setName('');
      setQuery('');
      setCategory('');
      setIsPinned(false);
      setIsPrivate(false);
      setPassword('');
      setImage(null);
      setEditingNote(null);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!user) {
        showToast('Please log in to add notes');
        return;
      }
      if (!name.trim() || !query.trim()) {
        showToast('Name and content are required');
        return;
      }
      if (isPrivate && !password && !editingNote) {
        showToast('Password is required for private notes');
        return;
      }

      try {
        let imageUrl = editingNote?.imageUrl || '';
        if (image) {
          const imageRef = ref(storage, `images/${user.uid}/${image.name}`);
          await uploadBytes(imageRef, image);
          imageUrl = await getDownloadURL(imageRef);
        }

        const token = await user.getIdToken();
        const noteData = {
          name: name.trim(),
          query: query.trim(),
          category: category.trim() || '',
          isPinned,
          isPrivate,
          imageUrl,
          userId: user.uid,
          password: isPrivate ? password : '',
        };

        if (editingNote) {
          const res = await axios.put(
            `http://localhost:5000/buttons/${editingNote._id}`,
            noteData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setButtons(buttons.map((btn) => (btn._id === editingNote._id ? res.data : btn)));
          showToast('Note updated');
        } else {
          const res = await axios.post('http://localhost:5000/buttons', noteData, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setButtons([...buttons, res.data]);
          showToast('Note added');
        }

        await fetchButtons(user);
        resetForm();
      } catch (error) {
        showToast('Error saving note');
        console.error('Error saving note:', error);
      }
    };

    return (
      <div className={`note-form ${editingNote ? 'modal' : ''}`}>
        {editingNote && <div className="modal-overlay" onClick={resetForm}></div>}
        <form onSubmit={handleSubmit} className={`form-content ${editingNote ? 'modal-content' : ''}`}>
          <input
            type="text"
            placeholder="Note Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="note-input"
          />
          <textarea
            placeholder="Note Content"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="note-textarea"
          />
          <input
            type="text"
            placeholder="Category (optional)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="note-input"
          />
          <label>
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
            />
            Pin Note
          </label>
          <label>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            Private Note
          </label>
          {isPrivate && (
            <input
              type="password"
              placeholder="Password for private note"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="note-input"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="note-input"
          />
          <div className="form-actions">
            <button type="submit" className="submit-button">
              {editingNote ? 'Update Note' : 'Add Note'}
            </button>
            {editingNote && (
              <button type="button" className="cancel-button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    );
  };

  NoteForm.propTypes = {
    user: PropTypes.object,
    storage: PropTypes.object.isRequired,
    buttons: PropTypes.array.isRequired,
    setButtons: PropTypes.func.isRequired,
    fetchButtons: PropTypes.func.isRequired,
    showToast: PropTypes.func.isRequired,
    editingNote: PropTypes.object,
    setEditingNote: PropTypes.func.isRequired,
  };

  export default NoteForm;