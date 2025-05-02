import { useState, useRef } from 'react';
import axios from 'axios';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { validateNote } from '../utils/validation';
import { useAuth } from '../context/AuthContext';

const NoteForm = ({ editingNote, setEditingNote, fetchNotes, showToast }) => {
  const [name, setName] = useState(editingNote?.name || '');
  const [query, setQuery] = useState(editingNote?.query || '');
  const [category, setCategory] = useState(editingNote?.category || '');
  const [isPrivate, setIsPrivate] = useState(editingNote?.isPrivate || false);
  const [image, setImage] = useState(null);
  const imageInputRef = useRef(null);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) {
      showToast('Please log in to add notes');
      return;
    }
    if (!validateNote(name, query)) {
      showToast('Name and content are required');
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
      const payload = { name, query, category, isPrivate, imageUrl };
      if (editingNote) {
        const res = await axios.put(`http://localhost:5000/buttons/${editingNote._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast('Note updated');
        setEditingNote(null);
      } else {
        const res = await axios.post('http://localhost:5000/buttons', { ...payload, isPinned: false }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast('Note added');
      }
      setName('');
      setQuery('');
      setCategory('');
      setIsPrivate(false);
      setImage(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      await fetchNotes();
    } catch (error) {
      showToast('Error saving note');
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
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
        ref={imageInputRef}
        className="image-input"
      />
      <button className="add-button" onClick={handleSubmit}>
        {editingNote ? 'Update Note' : 'Add Note'}
      </button>
    </div>
  );
};

export default NoteForm;