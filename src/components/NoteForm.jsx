import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useAuth } from '../context/AuthContext';

const NoteForm = ({ editingNote, setEditingNote, fetchNotes, showToast, categories, unlockedNotes }) => {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [image, setImage] = useState(null);
  const imageInputRef = useRef(null);
  const { user } = useAuth();

  // Update form fields when editingNote changes
  useEffect(() => {
    if (editingNote) {
      setName(editingNote.name || '');
      setQuery(editingNote.query || '');
      setCategory(editingNote.category || '');
      setIsPrivate(editingNote.isPrivate || false);
      setPassword(''); // Password is not pre-filled for security
      setImage(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
    } else {
      clearForm();
    }
  }, [editingNote]);

  const clearForm = () => {
    setName('');
    setQuery('');
    setCategory('');
    setIsPrivate(false);
    setPassword('');
    setImage(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    setEditingNote(null);
  };

  const handleSubmit = async () => {
    if (!user) {
      showToast('Please log in to add notes');
      return;
    }
    if (!name.trim() || !query.trim()) {
      showToast('Name and content are required');
      return;
    }
    if (isPrivate && !password.trim()) {
      showToast('Password is required for private notes');
      return;
    }
    if (editingNote && editingNote.isPrivate && !unlockedNotes.includes(editingNote._id)) {
      showToast('Please unlock this private note to edit');
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
      const payload = {
        name: name.trim(),
        query: query.trim(),
        category,
        isPrivate,
        password: isPrivate ? password : '',
        imageUrl,
      };
      if (editingNote) {
        await axios.put(`http://localhost:5000/buttons/${editingNote._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast('Note updated');
        clearForm();
      } else {
        await axios.post('http://localhost:5000/buttons', { ...payload, isPinned: false }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast('Note added');
        clearForm();
      }
      await fetchNotes();
    } catch (error) {
      showToast(`Error saving note: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="input-container">
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
        list="category-suggestions"
      />
      <datalist id="category-suggestions">
        {categories.map((cat, index) => (
          <option key={index} value={cat} />
        ))}
      </datalist>
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
          placeholder="Password for Private Note"
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
        <button className="add-button" onClick={handleSubmit}>
          {editingNote ? 'Update Note' : 'Add Note'}
        </button>
        {editingNote && (
          <button className="clear-button" onClick={clearForm}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default NoteForm;