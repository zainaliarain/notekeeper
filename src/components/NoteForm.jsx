import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
<<<<<<< HEAD
import PropTypes from 'prop-types';

const NoteForm = ({ user, storage, buttons, setButtons, fetchButtons, showToast }) => {
=======
import { storage } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaFileExport, FaFileImport, FaTimes } from 'react-icons/fa';

const NoteForm = ({ editingNote, setEditingNote, fetchNotes, showToast, categories, unlockedNotes, notes }) => {
>>>>>>> main
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [image, setImage] = useState(null);
  const imageInputRef = useRef(null);
<<<<<<< HEAD

  const handleAdd = async () => {
=======
  const fileInputRef = useRef(null); // For import file input
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
>>>>>>> main
    if (!user) {
      showToast('Please log in to add notes');
      return;
    }
<<<<<<< HEAD
    if (!validateNote(name, query)) {
=======
    if (!name.trim() || !query.trim()) {
>>>>>>> main
      showToast('Name and content are required');
      return;
    }
    if (isPrivate && !password.trim()) {
      showToast('Password is required for private notes');
      return;
    }
<<<<<<< HEAD
  
=======
    if (editingNote && editingNote.isPrivate && !unlockedNotes.includes(editingNote._id)) {
      showToast('Please unlock this private note to edit');
      return;
    }

>>>>>>> main
    try {
      let imageUrl = editingNote?.imageUrl || '';
      if (image) {
        const imageRef = ref(storage, `images/${user.uid}/${image.name}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
<<<<<<< HEAD
        console.log('Uploaded image URL:', imageUrl); // Debug image URL
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
        setEditingNote(null);
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
      setPassword('');
      setImage(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      await fetchButtons(user);
    } catch (error) {
      console.error('Error saving note:', error);
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
=======
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

  const exportNotes = () => {
    if (!user) {
      showToast('Please log in to export notes');
      return;
    }
    const textContent = notes
      .filter((note) => !note.isPrivate || note.userId === user.uid)
      .map((note) =>
        `=== Note ===\nName: ${note.name}\nQuery: ${note.query}\nCategory: ${note.category || ''}\nPinned: ${note.isPinned}\nPrivate: ${note.isPrivate}\nImage URL: ${note.imageUrl || ''}\nVoice URL: ${note.voiceUrl || ''}\n`
      )
      .join('');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'notes.txt';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Notes exported successfully');
  };

  const importNotes = async (e) => {
    if (!user) {
      showToast('Please log in to import notes');
      return;
    }
    const file = e.target.files[0];
    if (!file) {
      showToast('No file selected');
      return;
    }
    try {
      const text = await file.text();
      if (!text.trim()) {
        showToast('File is empty');
        return;
      }
      const token = await user.getIdToken();
      const res = await axios.post('http://localhost:5000/buttons', {
        name: 'Imported Note',
        query: text.trim(),
        category: '',
        isPinned: false,
        isPrivate: false,
        imageUrl: '',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast('Note imported successfully');
      await fetchNotes();
    } catch (error) {
      showToast('Error importing note: ' + (error.response?.data?.message || error.message));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
>>>>>>> main
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
<<<<<<< HEAD
      />
=======
        list="category-suggestions"
      />
      <datalist id="category-suggestions">
        {categories.map((cat, index) => (
          <option key={index} value={cat} />
        ))}
      </datalist>
>>>>>>> main
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
<<<<<<< HEAD
=======
      {isPrivate && (
        <input
          type="password"
          className="query-input"
          placeholder="Password for Private Note"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      )}
>>>>>>> main
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
        ref={imageInputRef}
        className="image-input"
      />
<<<<<<< HEAD
      <button className="add-button" onClick={handleAdd}>
        {editingId ? 'Update Note' : 'Add Note'}
      </button>
=======
      <div className="form-actions">
        <button
          className="add-icon"
          onClick={handleSubmit}
          title={editingNote ? 'Update Note' : 'Add Note'}
          aria-label={editingNote ? 'Update Note' : 'Add Note'}
        >
          <FaPlus />
        </button>
        <button
          className="export-icon"
          onClick={exportNotes}
          title="Export Notes"
          aria-label="Export Notes"
        >
          <FaFileExport />
        </button>
        <label className="import-icon">
          <input
            type="file"
            accept=".txt"
            onChange={importNotes}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />
          <FaFileImport />
        </label>
        {editingNote && (
          <button
            className="clear-icon"
            onClick={clearForm}
            title="Clear Form"
            aria-label="Clear Form"
          >
            <FaTimes />
          </button>
        )}
      </div>
>>>>>>> main
    </div>
  );
};

<<<<<<< HEAD
NoteForm.propTypes = {
  user: PropTypes.object,
  storage: PropTypes.object.isRequired,
  buttons: PropTypes.array.isRequired,
  setButtons: PropTypes.func.isRequired,
  fetchButtons: PropTypes.func.isRequired,
  showToast: PropTypes.func.isRequired,
};

=======
>>>>>>> main
export default NoteForm;