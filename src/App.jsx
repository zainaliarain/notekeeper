import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { auth, storage } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
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
  const [recentNotes, setRecentNotes] = useState([]);
  const [toast, setToast] = useState({ message: '', show: false });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [editingNote, setEditingNote] = useState(null);
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
      console.log('Fetched buttons:', res.data);
      setButtons(res.data);
      const uniqueCategories = [
        ...new Set(res.data.map((btn) => btn.category).filter((cat) => cat && cat.trim())),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      showToast('Error fetching notes');
      console.error('Error fetching buttons:', error);
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
      console.error('Logout error:', error);
    }
  };

  const openPopup = (button) => {
    if (button.isPrivate && button.userId !== user?.uid) {
      showToast('This note is private');
      return;
    }
    setPopupContent(button);
    setShowPopup(true);
    setRecentNotes([button._id, ...recentNotes.filter((id) => id !== button._id).slice(0, 4)]);
    showToast('Note opened');
  };

  const handleOpenPopup = async (note) => {
    if (!user) {
      showToast('Please log in to view notes');
      return;
    }
    if (note.isPrivate) {
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
      showToast('Invalid note selected');
      setShowPasswordPopup(false);
      setPasswordInput('');
      setPasswordAction('view');
      return;
    }
    console.log('Verifying password for note ID:', passwordNoteId); // Debug
    const note = notes.find((n) => n._id === passwordNoteId);
    console.log('Note found in state:', note); // Debug
    try {
      const token = await user.getIdToken();
      const res = await axios.post(`http://localhost:5000/buttons/${passwordNoteId}/verify-password`, {
        password: passwordInput,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.verified) {
        if (passwordAction === 'view') {
          if (note) openPopup(note);
          else showToast('Note not found');
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
      console.error('Password verification error:', error.response?.data || error.message);
      let message = 'Error verifying password';
      if (error.response?.status === 404) message = 'Note not found';
      else if (error.response?.status === 400) message = 'Invalid request';
      else message = error.response?.data?.message || error.message;
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
        openSettings={() => navigate('/settings')}
      />
      <div className="main-content">
        <div className="input-section">
          <NoteForm
            user={user}
            storage={storage}
            buttons={buttons}
            setButtons={setButtons}
            fetchButtons={fetchButtons}
            showToast={showToast}
            editingNote={editingNote}
            setEditingNote={setEditingNote}
          />
          <div className="button-container">
            <button className="export-button" onClick={exportNotes}>
              Export Notes
            </button>
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
                  const btn = buttons.find((b) => b._id === id);
                  if (!btn || (btn.isPrivate && btn.userId !== user.uid)) return null;
                  return (
                    <button
                      key={id}
                      className="recent-button"
                      onClick={() => openPopup(btn)}
                    >
                      {btn.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <NoteList
            user={user}
            buttons={buttons}
            setButtons={setButtons}
            searchTerm={searchTerm}
            filterCategory={filterCategory}
            showToast={showToast}
            openPopup={openPopup}
            onEdit={(button) => setEditingNote(button)}
          />
        </div>
        {searchTerm && (
          <Sidebar
            user={user}
            buttons={buttons}
            setButtons={setButtons}
            searchTerm={searchTerm}
            filterCategory={filterCategory}
            showToast={showToast}
            openPopup={openPopup}
            onEdit={(button) => setEditingNote(button)}
          />
        )}
      </div>
      <NotePopup
        button={popupContent}
        searchTerm={searchTerm}
        showPopup={showPopup}
        closePopup={closePopup}
        showToast={showToast}
      />
    </>
  );
}

function SettingsPage({ user, showToast, darkMode, setDarkMode }) {
  const navigate = useNavigate();
  return (
    <>
      <TopBar
        searchTerm=""
        setSearchTerm={() => {}}
        filterCategory=""
        setFilterCategory={() => {}}
        categories={[]}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        handleLogout={async () => {
          await signOut(auth);
          showToast('Logged out successfully');
          navigate('/');
        }}
        openSettings={() => {}}
      />
      <SettingsForm user={user} showToast={showToast} onClose={() => navigate('/')} />
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', show: false });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const showToast = (message) => {
    console.log('Showing toast:', message);
    setToast({ message, show: true });
  };

  const handleKeyPress = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      // Trigger note add (handled in NoteForm)
    }
    if (e.key === 'Escape') {
      // Handle popup closing in components
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <ErrorBoundary>
        <div className={`container ${darkMode ? 'dark' : ''}`}>
          <h2 className="title">Note Keeper</h2>
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  <MainApp
                    user={user}
                    setUser={setUser}
                    showToast={showToast}
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                  />
                ) : (
                  <AuthForm auth={auth} onAuthSuccess={() => {}} showToast={showToast} />
                )
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute user={user}>
                  <SettingsPage
                    user={user}
                    showToast={showToast}
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                  />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toast message={toast.message} show={toast.show} setToast={setToast} />
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;