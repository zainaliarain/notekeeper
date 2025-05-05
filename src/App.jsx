import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { signOut, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.js';
import { useAuth } from './context/AuthContext';
import AuthForm from './components/AuthForm';
import NoteForm from './components/NoteForm';
import NoteList from './components/NoteList';
import NotePopup from './components/NotePopup';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import './App.css';

function App() {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [recentNotes, setRecentNotes] = useState(() => {
    // Load recentNotes from localStorage and validate
    try {
      const stored = localStorage.getItem('recentNotes');
      const parsed = stored ? JSON.parse(stored) : [];
      console.log('Initial recentNotes from localStorage:', parsed);
      return Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string' && id.trim()) : [];
    } catch (error) {
      console.error('Error loading recentNotes from localStorage:', error.message);
      return [];
    }
  });
  const [toast, setToast] = useState({ message: '', show: false });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [editingNote, setEditingNote] = useState(null);
  const [popupNote, setPopupNote] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [deleteNoteId, setDeleteNoteId] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordNoteId, setPasswordNoteId] = useState(null);
  const [passwordAction, setPasswordAction] = useState('view'); // 'view' or 'delete'
  const fileInputRef = useRef(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    // Persist recentNotes to localStorage
    try {
      localStorage.setItem('recentNotes', JSON.stringify(recentNotes));
      console.log('Saved recentNotes to localStorage:', recentNotes);
    } catch (error) {
      console.error('Error saving recentNotes to localStorage:', error.message);
    }
  }, [recentNotes]);

  useEffect(() => {
    // Validate recentNotes against notes after fetch
    if (notes.length > 0) {
      const validRecentNotes = recentNotes.filter(id => notes.some(note => note._id === id));
      if (validRecentNotes.length !== recentNotes.length) {
        console.log('useEffect: Filtered recentNotes from', recentNotes, 'to', validRecentNotes);
        setRecentNotes(validRecentNotes);
      }
    }
  }, [notes]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? { uid: firebaseUser.uid, email: firebaseUser.email } : 'No user');
      if (firebaseUser) {
        console.log('User authenticated, fetching notes:', firebaseUser.uid);
        fetchNotes(firebaseUser);
      } else {
        console.log('No authenticated user, clearing notes');
        setNotes([]);
        setCategories([]);
        setRecentNotes([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchNotes = async (firebaseUser) => {
    if (!firebaseUser) {
      console.log('fetchNotes: No user, skipping');
      return;
    }
    try {
      console.log('fetchNotes: Attempting to get ID token for user:', firebaseUser.uid);
      let token;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          token = await firebaseUser.getIdToken(true);
          if (token) break;
          console.log(`fetchNotes: Attempt ${attempt} failed, no token`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error(`fetchNotes: Attempt ${attempt} error:`, err.message);
        }
      }
      if (!token) {
        console.error('fetchNotes: No token retrieved after retries');
        showToast('Authentication error: Unable to get token');
        await signOut(auth);
        return;
      }
      console.log('fetchNotes: Token retrieved:', token.substring(0, 10) + '...');
      const requestConfig = {
        method: 'GET',
        url: 'http://localhost:5000/buttons',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      };
      console.log('fetchNotes request:', {
        url: requestConfig.url,
        method: requestConfig.method,
        headers: { Authorization: 'Bearer <token>', 'Content-Type': 'application/json' },
      });
      const res = await axios(requestConfig);
      console.log('fetchNotes: Received response with', res.data.length, 'notes:', res.data.map(n => ({ id: n._id, name: n.name })));
      setNotes(res.data);
      const uniqueCategories = [...new Set(res.data.map((btn) => btn.category).filter((cat) => cat && cat.trim()))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('fetchNotes error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      showToast(`Error fetching notes: ${error.response?.data?.error || error.message}`);
      if (error.response?.status === 401) {
        await signOut(auth);
        showToast('Session expired. Please log in again.');
      }
      setNotes([]);
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

  const openSettings = () => {
    setShowSettings(true);
    setCurrentPassword('');
    setNewPassword('');
    setNewDisplayName('');
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    if (!newDisplayName.trim() && !newPassword) {
      showToast('Please provide a new display name or password');
      return;
    }
    if (!currentPassword) {
      showToast('Please enter your current password');
      return;
    }
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      if (newDisplayName.trim()) {
        await updateProfile(user, { displayName: newDisplayName.trim() });
        showToast('Display name updated successfully');
      }
      if (newPassword) {
        if (newPassword.length < 6) {
          showToast('Password must be at least 6 characters long');
          return;
        }
        await updatePassword(user, newPassword);
        showToast('Password updated successfully');
      }
      setCurrentPassword('');
      setNewPassword('');
      setNewDisplayName('');
      setShowSettings(false);
    } catch (error) {
      let message = 'Failed to update settings';
      if (error.code === 'auth/wrong-password') message = 'Incorrect current password';
      else if (error.code === 'auth/requires-recent-login') message = 'Please log in again to update settings';
      showToast(message);
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
      const token = await user.getIdToken(true);
      await axios.put(`http://localhost:5000/buttons/${id}`, { isPinned: !notes.find((note) => note._id === id)?.isPinned }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast(updated.find((note) => note._id === id).isPinned ? 'Note pinned' : 'Note unpinned');
      await fetchNotes(user);
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

  const handleDelete = (id) => {
    if (!user) {
      showToast('Please log in to delete notes');
      return;
    }
    const note = notes.find((n) => n._id === id);
    if (!note) {
      console.log(`HandleDelete: Note not found for ID: ${id}`);
      showToast('Note not found');
      setRecentNotes(recentNotes.filter((noteId) => noteId !== id));
      fetchNotes(user);
      return;
    }
    console.log(`HandleDelete: Initiating delete for note ID: ${id}, isPrivate: ${note.isPrivate}`);
    if (note.isPrivate) {
      setPasswordNoteId(id);
      setPasswordAction('delete');
      setShowPasswordPopup(true);
    } else {
      setDeleteNoteId(id);
      setShowDeletePopup(true);
    }
  };

  const confirmDelete = async () => {
    if (!deleteNoteId) {
      showToast('No note selected for deletion');
      setShowDeletePopup(false);
      return;
    }
    try {
      const token = await user.getIdToken(true);
      await axios.delete(`http://localhost:5000/buttons/${deleteNoteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(notes.filter((note) => note._id !== deleteNoteId));
      setRecentNotes(recentNotes.filter((noteId) => noteId !== deleteNoteId));
      await fetchNotes(user);
      showToast('Note deleted');
    } catch (error) {
      console.error('Delete error:', error.response?.data || error.message);
      showToast(`Error deleting note: ${error.response?.data?.error || error.message}`);
    } finally {
      setShowDeletePopup(false);
      setDeleteNoteId(null);
    }
  };

  const confirmDeleteWithPassword = async () => {
    if (!passwordInput.trim()) {
      showToast('Please enter a password');
      return;
    }
    const note = notes.find((n) => n._id === passwordNoteId);
    if (!note) {
      console.log(`ConfirmDeleteWithPassword: Note not found for ID: ${passwordNoteId}`);
      showToast('Note not found');
      setRecentNotes(recentNotes.filter((id) => id !== passwordNoteId));
      await fetchNotes(user);
      setShowPasswordPopup(false);
      setPasswordInput('');
      setPasswordNoteId(null);
      setPasswordAction('view');
      return;
    }
    try {
      const token = await user.getIdToken(true);
      await axios.delete(`http://localhost:5000/buttons/${passwordNoteId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { password: passwordInput },
      });
      setNotes(notes.filter((note) => note._id !== passwordNoteId));
      setRecentNotes(recentNotes.filter((noteId) => noteId !== passwordNoteId));
      await fetchNotes(user);
      showToast('Note deleted');
      setShowPasswordPopup(false);
      setPasswordInput('');
      setPasswordNoteId(null);
      setPasswordAction('view');
    } catch (error) {
      console.error('Delete with password error:', error.response?.data || error.message);
      let message = 'Error deleting note';
      if (error.response?.status === 403) message = 'Incorrect password';
      else if (error.response?.status === 404) {
        message = 'Note not found on server';
        setRecentNotes(recentNotes.filter((id) => id !== passwordNoteId));
        await fetchNotes(user);
      } else {
        message = error.response?.data?.error || error.message;
      }
      showToast(`Error: ${message}`);
    }
  };

  const cancelDelete = () => {
    setShowDeletePopup(false);
    setDeleteNoteId(null);
  };

  const openPopup = (note) => {
    setPopupNote(note);
    setRecentNotes([note._id, ...recentNotes.filter((id) => id !== note._id).slice(0, 4)]);
    showToast('Note opened');
  };

  const handleOpenPopup = async (note) => {
    if (!user) {
      showToast('Please log in to view notes');
      return;
    }
    if (!note || !note._id || !note.name) {
      console.log('HandleOpenPopup: Invalid or undefined note:', note);
      showToast('Note not found');
      await fetchNotes(user);
      return;
    }
    const currentNote = notes.find((n) => n._id === note._id);
    if (!currentNote) {
      console.log(`HandleOpenPopup: Note ID ${note._id} not found in current notes state`);
      showToast('Note no longer exists');
      setRecentNotes(recentNotes.filter((id) => id !== note._id));
      await fetchNotes(user);
      return;
    }
    console.log(`HandleOpenPopup: Opening note`, {
      id: note._id,
      name: note.name,
      isPrivate: note.isPrivate,
      userId: note.userId,
      currentUser: user.uid,
      source: 'handleOpenPopup',
    });
    if (note.isPrivate && note.userId !== user.uid) {
      console.log(`HandleOpenPopup: Unauthorized access to private note ID: ${note._id}`);
      showToast('You are not authorized to view this note');
      return;
    }
    if (note.isPrivate) {
      console.log(`Setting passwordNoteId to ${note._id} for private note`);
      setPasswordNoteId(note._id);
      setPasswordAction('view');
      setShowPasswordPopup(true);
    } else {
      openPopup(note);
    }
  };

  const verifyPassword = async () => {
    if (!passwordInput.trim()) {
      showToast('Please enter a password');
      return;
    }
    if (!passwordNoteId) {
      console.log('VerifyPassword: Invalid note ID');
      showToast('Invalid note selected');
      setShowPasswordPopup(false);
      setPasswordInput('');
      setPasswordAction('view');
      return;
    }
    const note = notes.find((n) => n._id === passwordNoteId);
    if (!note) {
      console.log(`VerifyPassword: Note not found for ID: ${passwordNoteId}`);
      showToast('Note no longer exists');
      setShowPasswordPopup(false);
      setPasswordInput('');
      setPasswordNoteId(null);
      setPasswordAction('view');
      setRecentNotes(recentNotes.filter((id) => id !== passwordNoteId));
      await fetchNotes(user);
      return;
    }
    console.log(`VerifyPassword: Verifying password for note ID: ${passwordNoteId}, action: ${passwordAction}, noteName: ${note.name}`);
    try {
      if (!user) {
        throw new Error('No authenticated user found');
      }
      let token;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          token = await user.getIdToken(true);
          if (token) break;
          console.log(`VerifyPassword: Attempt ${attempt} failed, no token`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error(`VerifyPassword: Token attempt ${attempt} error:`, err.message);
        }
      }
      if (!token) {
        throw new Error('Failed to retrieve authentication token');
      }
      console.log('VerifyPassword: Token retrieved:', token.substring(0, 10) + '...');
      const requestUrl = `http://localhost:5000/buttons/${passwordNoteId}/verify-password`;
      const requestConfig = {
        method: 'POST',
        url: requestUrl,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { password: passwordInput },
      };
      console.log('VerifyPassword: Sending request:', {
        url: requestConfig.url,
        method: requestConfig.method,
        headers: { Authorization: 'Bearer <token>', 'Content-Type': 'application/json' },
        data: requestConfig.data,
      });
      const res = await axios(requestConfig);
      if (res.data.verified) {
        if (passwordAction === 'view') {
          openPopup(note);
        } else if (passwordAction === 'delete') {
          await confirmDeleteWithPassword();
        }
        setShowPasswordPopup(false);
        setPasswordInput('');
        setPasswordNoteId(null);
        setPasswordAction('view');
      } else {
        showToast('Incorrect password');
      }
    } catch (error) {
      console.error('Password verification error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: `http://localhost:5000/buttons/${passwordNoteId}/verify-password`,
      });
      let message = 'Error verifying password';
      if (error.response?.status === 404) {
        message = 'Note no longer exists on server';
        setRecentNotes(recentNotes.filter((id) => id !== passwordNoteId));
        await fetchNotes(user);
      } else if (error.response?.status === 401) {
        message = error.response?.data?.error || 'Authentication error';
        await signOut(auth);
        showToast('Session expired. Please log in again.');
      } else if (error.response?.status === 400) {
        message = 'Invalid request';
      } else {
        message = typeof error.response?.data === 'string' ? 'Unexpected server response' : error.response?.data?.error || error.message;
      }
      showToast(`Error: ${message}`);
    }
  };

  const cancelPassword = () => {
    setShowPasswordPopup(false);
    setPasswordInput('');
    setPasswordNoteId(null);
    setPasswordAction('view');
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
      const token = await user.getIdToken(true);
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
      await fetchNotes(user);
      showToast('Note imported successfully');
    } catch (error) {
      showToast('Error importing note');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredNotes = notes
    .filter((note) => {
      if (!note || !note._id || !note.name) {
        console.log('FilteredNotes: Skipping invalid note:', note);
        return false;
      }
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
          <TopBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            categories={categories}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            handleLogout={handleLogout}
            openSettings={openSettings}
          />
          <div className="main-content">
            <div className="input-section">
              <NoteForm
                editingNote={editingNote}
                setEditingNote={setEditingNote}
                fetchNotes={() => fetchNotes(user)}
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
                      if (!note || !note.name) {
                        console.log(`RecentNotes: Skipping invalid note ID: ${id}`);
                        return null;
                      }
                      if (note.isPrivate && note.userId !== user.uid) {
                        console.log(`RecentNotes: Skipping private note ID: ${id} for user: ${user.uid}`);
                        return null;
                      }
                      return (
                        <button
                          key={id}
                          className="recent-button"
                          onClick={() => {
                            console.log(`Recent note clicked: ID ${id}, name: ${note.name}`);
                            handleOpenPopup(note);
                          }}
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
                openPopup={(note) => {
                  if (!note || !note._id || !note.name) {
                    console.log('NoteList: Invalid note passed to openPopup:', note);
                    return;
                  }
                  console.log(`NoteList openPopup called for note ID: ${note._id}, name: ${note.name}`);
                  handleOpenPopup(note);
                }}
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
                openPopup={(note) => {
                  if (!note || !note._id || !note.name) {
                    console.log('Sidebar: Invalid note passed to openPopup:', note);
                    return;
                  }
                  console.log(`Sidebar openPopup called for note ID: ${note._id}, name: ${note.name}`);
                  handleOpenPopup(note);
                }}
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
          {showSettings && (
            <div className="popup-overlay" onClick={() => setShowSettings(false)}>
              <div className="popup-box settings-container" onClick={(e) => e.stopPropagation()}>
                <h3>Account Settings</h3>
                <form className="settings-form" onSubmit={handleSettingsSave}>
                  <input
                    type="text"
                    placeholder="New Display Name"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="note-input"
                  />
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="note-input"
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="note-input"
                  />
                  <div className="form-actions">
                    <button type="submit" className="settings-button">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="close-settings"
                      onClick={() => setShowSettings(false)}
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {showDeletePopup && (
            <div className="popup-overlay" onClick={cancelDelete}>
              <div className="popup-box" onClick={(e) => e.stopPropagation()}>
                <h3>Confirm Deletion</h3>
                <p>Are you sure you want to delete this note?</p>
                <div className="form-actions">
                  <button className="confirm-delete" onClick={confirmDelete}>
                    Confirm
                  </button>
                  <button className="cancel-delete" onClick={cancelDelete}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {showPasswordPopup && (
            <div className="popup-overlay" onClick={cancelPassword}>
              <div className="popup-box" onClick={(e) => e.stopPropagation()}>
                <h3>{passwordAction === 'view' ? 'Enter Password' : 'Enter Password to Delete'}</h3>
                <p>Please enter the password for this private note.</p>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="note-input"
                  placeholder="Password"
                />
                <div className="form-actions">
                  <button className="submit-password" onClick={verifyPassword}>
                    Submit
                  </button>
                  <button className="cancel-password" onClick={cancelPassword}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {toast.show && (
            <div className="auth-popup">
              <span className="popup-message">{toast.message}</span>
              <span className="popup-close" onClick={() => setToast({ message: '', show: false })}>
                ×
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;