import { useState, useRef } from 'react';
import axios from 'axios';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import PropTypes from 'prop-types';

const NoteForm = ({ user, storage, buttons, setButtons, fetchButtons, showToast }) => {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const imageInputRef = useRef(null);

  const handleAdd = async () => {
    if (!user) {
      showToast('Please log in to add notes');
      return;
    }
    if (!name.trim() || !query.trim()) {
      showToast('Name and content are required');
      return;
    }

    try {
      let imageUrl = '';
      if (image) {
        const imageRef = ref(storage, `images/${user.uid}/${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      const token = await user.getIdToken();
      if (editingId) {
        const res = await axios.put(
          `http://localhost:5000/buttons/${editingId}`,
          { name, query, category, isPrivate, imageUrl },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setButtons(buttons.map((btn) => (btn._id === editingId ? res.data : btn)));
        setEditingId(null);
        showToast('Note updated');
      } else {
        const res = await axios.post(
          'http://localhost:5000/buttons',
          { name, query, category, isPinned: false, isPrivate, imageUrl },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setButtons([...buttons, res.data]);
        showToast('Note added');
      }
      setName('');
      setQuery('');
      setCategory('');
      setIsPrivate(false);
      setImage(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      await fetchButtons(user);
    } catch (error) {
      showToast('Error saving note');
      console.error('Error saving button:', error);
    }
  };

  const handleEdit = (button) => {
    if (!user || (button.isPrivate && button.userId !== user.uid)) {
      showToast('You cannot edit this note');
      return;
    }
    setEditingId(button._id);
    setName(button.name);
    setQuery(button.query);
    setCategory(button.category || '');
    setIsPrivate(button.isPrivate || false);
    showToast('Editing note');
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
      <button className="add-button" onClick={handleAdd}>
        {editingId ? 'Update Note' : 'Add Note'}
      </button>
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
};

export default NoteForm;