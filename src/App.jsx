import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { signOut } from 'firebase/auth';
import { auth } from './firebase.js';
import { useAuth } from './context/AuthContext';
import AuthForm from './components/AuthForm';
import NoteForm from './components/NoteForm';
import NoteList from './components/NoteList';
import NotePopup from './components/NotePopup';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [recentNotes, setRecentNotes] = useState([]);
  const [toast, setToast] = useState({ message: '', show: false });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [editingNote, setEditingNote] = useState(null);
  const [popupNote, setPopupNote] = useState(null);
  const fileInputRef = useRef(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

  const fetchNotes = async () => {
    try {
      const token = await user.getIdToken();
      const res = await axios.get('http://localhost:5000/buttons', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(res.data);
      const uniqueCategories = [...new Set(res.data.map((btn) => btn.category).filter((cat) => cat && cat.trim()))];
      setCategories(uniqueCategories);
    } catch (error) {
      showToast('Error fetching notes');
    }
  };

  const showToast = (message) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast('Logged out successfully');
    } catch (error) {
      showToast('Error logging out');
    }
  };

  const togglePin = async (id) => {
    if (!user) {
      showToast('Please log in to pin notes');
      return;
    }
    try {
      const updated = notes.map((note) => (note._id === id ? { ...note, isPinned: !note.isPinned } : note));
      setNotes(updated);
      const token = await user.getIdToken();
      await axios.put(`http://localhost:5000/buttons/${id}`, { isPinned: !notes.find((note) => note._id === id)?.isPinned }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast(updated.find((note) => note._id === id).isPinned ? 'Note pinned' : 'Note unpinned');
    } catch (error) {
      showToast('Error updating pin status');
    }
  };

  const handleEdit = (note) => {
    if (!user || (note.isPrivate && note.userId !== user.uid)) {
      showToast('You cannot edit this note');
      return;
    }
    setEditingNote(note);
    showToast('Editing note');
  };

  const handleDelete = async (id) => {
    if (!user) {
      showToast('Please log in to delete notes');
      return;
    }
    try {
      const token = await user.getIdToken();
      await axios.delete(`http://localhost:5000/buttons/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(notes.filter((note) => note._id !== id));
      setRecentNotes(recentNotes.filter((noteId) => noteId !== id));
      await fetchNotes();
      showToast('Note deleted');
    } catch (error) {
      showToast('Error deleting note');
    }
  };

  const openPopup = (note) => {
    if (note.isPrivate && note.userId !== user?.uid) {
      showToast('This note is private');
      return;
    }
    setPopupNote(note);
    setRecentNotes([note._id, ...recentNotes.filter((id) => id !== note._id).slice(0, 4)]);
    showToast('Note opened');
  };

  const closePopup = () => {
    setPopupNote(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Copied to clipboard'))
      .catch(() => showToast('Copy failed'));
  };

  const exportNotes = () => {
    if (!user) {
      showToast('Please log in to export notes');
      return;
    }
    const textContent = notes.map((note) =>
      `=== Note ===\nName: ${note.name}\nQuery: ${note.query}\nCategory: ${note.category || ''}\nPinned: ${note.isPinned}\nPrivate: ${note.isPrivate}\nImage URL: ${note.imageUrl || ''}\n`
    ).join('');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'notes.txt';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Notes exported');
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
      setNotes([...notes, res.data]);
      await fetchNotes();
      showToast('Note imported successfully');
    } catch (error) {
      showToast('Error importing note');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredNotes = notes
    .filter((note) => {
      const nameMatch = note.name.toLowerCase().includes(searchTerm.toLowerCase());
      const queryMatch = note.query.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = !filterCategory || note.category === filterCategory;
      const privacyMatch = !note.isPrivate || note.userId === user?.uid;
      return (nameMatch || queryMatch) && categoryMatch && privacyMatch;
    })
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className={`container ${darkMode ? 'dark' : ''}`}>
      <h2 className="title">Note Keeper</h2>
      {!user ? (
        <AuthForm showToast={showToast} />
      ) : (
        <>
          <div className="welcome-message">Welcome, {user.displayName || 'User'}!</div>
          <div className="top-bar">
            <input
              type="text"
              className="search-input"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button className="toggle-dark" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button className="logout-button" onClick={handleLogout}>🚪 Logout</button>
          </div>
          <div className="main-content">
            <div className="input-section">
              <NoteForm
                editingNote={editingNote}
                setEditingNote={setEditingNote}
                fetchNotes={fetchNotes}
                showToast={showToast}
              />
              <div className="button-container">
                <button className="export-button" onClick={exportNotes}>Export Notes</button>
                <label className="import-button">
                  Import Notes
                  <input
                    type="file"
                    accept=".txt"
                    onChange={importNotes}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              {recentNotes.length > 0 && (
                <div className="recent-notes">
                  <h3>Recent Notes</h3>
                  <div className="recent-list">
                    {recentNotes.map((id) => {
                      const note = notes.find((n) => n._id === id);
                      if (!note || (note.isPrivate && note.userId !== user.uid)) return null;
                      return (
                        <button
                          key={id}
                          className="recent-button"
                          onClick={() => openPopup(note)}
                        >
                          {note.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <NoteList
                notes={filteredNotes}
                searchTerm={searchTerm}
                openPopup={openPopup}
                togglePin={togglePin}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                copyToClipboard={copyToClipboard}
              />
            </div>
            {searchTerm && (
              <Sidebar
                notes={filteredNotes}
                searchTerm={searchTerm}
                openPopup={openPopup}
                togglePin={togglePin}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                copyToClipboard={copyToClipboard}
              />
            )}
          </div>
          {popupNote && (
            <NotePopup
              note={popupNote}
              searchTerm={searchTerm}
              closePopup={closePopup}
              showToast={showToast}
            />
          )}
          {toast.show && <div className="toast">{toast.message}</div>}
        </>
      )}
    </div>
  );
}

export default App;