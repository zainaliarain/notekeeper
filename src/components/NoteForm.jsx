import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { validateNote } from '../utils/validation';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

const NoteForm = ({ editingNote, setEditingNote, fetchNotes, showToast }) => {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [image, setImage] = useState(null);
  const imageInputRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (editingNote) {
      setName(editingNote.name || '');
      setQuery(editingNote.query || '');
      setCategory(editingNote.category || '');
      setIsPrivate(editingNote.isPrivate || false);
      setPassword(''); // Password not pre-filled for security
      setImage(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
    } else {
      setName('');
      setQuery('');
      setCategory('');
      setIsPrivate(false);
      setPassword('');
      setImage(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  }, [editingNote]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Please log in to add notes');
      return;
    }
    if (!validateNote(name, query)) {
      showToast('Name and content are required');
      return;
    }
    if (isPrivate && !password.trim()) {
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
      const payload = { name, query, category, isPrivate, password: isPrivate ? password : '', imageUrl };

      if (editingNote) {
        await axios.put(`http://localhost:5000/buttons/${editingNote._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast('Note updated');
      } else {
        await axios.post('http://localhost:5000/buttons', { ...payload, isPinned: false }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast('Note added');
      }

      setName('');
      setQuery('');
      setCategory('');
      setIsPrivate(false);
      setPassword('');
      setImage(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      setEditingNote(null);
      await fetchNotes();
    } catch (error) {
      showToast('Error saving note');
    }
  };

  const handleCancel = () => {
    setName('');
    setQuery('');
    setCategory('');
    setIsPrivate(false);
    setPassword('');
    setImage(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    setEditingNote(null);
    showToast('Editing cancelled');
  };

  return (
    <div className="input-container">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="query-input"
          placeholder="Note Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          className="query-input"
          placeholder="Category (optional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <textarea
          className="query-input"
          placeholder="Note Content"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={6}
        />
        <label className="privacy-toggle">
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
            className="query-input"
            placeholder="Note Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          ref={imageInputRef}
          className="image-input"
        />
        <div className="form-actions">
          <button type="submit" className="add-button">
            {editingNote ? 'Update Note' : 'Add Note'}
          </button>
          {editingNote && (
            <button type="button" className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

NoteForm.propTypes = {
  editingNote: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    query: PropTypes.string,
    category: PropTypes.string,
    isPrivate: PropTypes.bool,
    password: PropTypes.string,
    imageUrl: PropTypes.string,
    userId: PropTypes.string,
  }),
  setEditingNote: PropTypes.func.isRequired,
  fetchNotes: PropTypes.func.isRequired,
  showToast: PropTypes.func.isRequired,
};

export default NoteForm;