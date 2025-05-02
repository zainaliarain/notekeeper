import { useEffect, useState, useRef, Component } from 'react';
  import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
  import axios from 'axios';
  import { auth, storage } from './firebase';
  import { signOut, onAuthStateChanged } from 'firebase/auth';
  import AuthForm from './components/AuthForm';
  import NoteForm from './components/NoteForm';
  import NoteList from './components/NoteList';
  import NotePopup from './components/NotePopup';
  import Toast from './components/Toast';
  import TopBar from './components/TopBar';
  import SettingsForm from './components/SettingsForm';
  import ProtectedRoute from './components/ProtectedRoute';
  import Sidebar from './components/Sidebar';
  import './App.css';

  // ErrorBoundary Component
  class ErrorBoundary extends Component {
    state = { hasError: false };

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    render() {
      if (this.state.hasError) {
        return <h1>Something went wrong. Please try again.</h1>;
      }
      return this.props.children;
    }
  }

  function MainApp({ user, setUser, showToast, darkMode, setDarkMode }) {
    const [buttons, setButtons] = useState([]);
    const [categories, setCategories] = useState([]);
    const [popupContent, setPopupContent] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [recentNotes, setRecentNotes] = useState([]);
    const [editingNote, setEditingNote] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
      if (user) {
        fetchButtons(user);
      } else {
        setButtons([]);
        setCategories([]);
      }
    }, [user]);

    const fetchButtons = async (currentUser) => {
      try {
        const token = await currentUser.getIdToken();
        console.log('Fetching buttons for user:', currentUser.uid);
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

    const handleLogout = async () => {
      try {
        await signOut(auth);
        showToast('Logged out successfully');
        navigate('/');
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

    const closePopup = () => {
      setShowPopup(false);
      setPopupContent(null);
    };

    const exportNotes = () => {
      if (!user) {
        showToast('Please log in to export notes');
        return;
      }
      const textContent = buttons
        .map(
          (button) =>
            `=== Note ===\nName: ${button.name}\nQuery: ${button.query}\nCategory: ${
              button.category || ''
            }\nPinned: ${button.isPinned}\nPrivate: ${button.isPrivate}\nImage URL: ${
              button.imageUrl || ''
            }\n`
        )
        .join('');
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
        const notes = text.split('=== Note ===').slice(1).map((noteText) => {
          const lines = noteText.trim().split('\n');
          const note = {};
          lines.forEach((line) => {
            const [key, value] = line.split(': ').map((s) => s.trim());
            if (key === 'Name') note.name = value;
            if (key === 'Query') note.query = value;
            if (key === 'Category') note.category = value || '';
            if (key === 'Pinned') note.isPinned = value === 'true';
            if (key === 'Private') note.isPrivate = value === 'true';
            if (key === 'Image URL') note.imageUrl = value || '';
          });
          return note;
        });
        const token = await user.getIdToken();
        for (const note of notes) {
          if (!note.name || !note.query) {
            showToast('Skipping invalid note: missing name or content');
            continue;
          }
          await axios.post(
            'http://localhost:5000/buttons',
            { ...note, userId: user.uid },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
        await fetchButtons(user);
        showToast('Notes imported successfully');
      } catch (error) {
        showToast('Error importing notes');
        console.error('Error importing note:', error);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

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