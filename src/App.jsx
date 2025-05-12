import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
<<<<<<< HEAD
import { auth, storage } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
=======
import { signOut, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, storage } from './firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from './context/AuthContext';
>>>>>>> main
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
<<<<<<< HEAD
  const fileInputRef = useRef(null);
=======
  const [popupNote, setPopupNote] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [deleteNoteId, setDeleteNoteId] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordNoteId, setPasswordNoteId] = useState(null);
  const [passwordAction, setPasswordAction] = useState('view');
  const [isVerifying, setIsVerifying] = useState(false);
  const [unlockedNotes, setUnlockedNotes] = useState([]);
  const [deletingNotes, setDeletingNotes] = useState([]);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('');
  const profilePicInputRef = useRef(null);
  const coverPhotoInputRef = useRef(null);
>>>>>>> main
  const { user, loading } = useAuth();

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (user) {
      if (!showProfile) fetchNotes();
      setProfilePictureUrl(user.photoURL || '');
      fetchCoverPhoto();
    }
  }, [user, showProfile]);

  const fetchNotes = async () => {
    try {
      const token = await user.getIdToken();
      const res = await axios.get('http://localhost:5000/buttons', {
        headers: { Authorization: `Bearer ${token}` },
      });
<<<<<<< HEAD
      console.log('Fetched buttons:', res.data);
      setButtons(res.data);
      const uniqueCategories = [
        ...new Set(res.data.map((btn) => btn.category).filter((cat) => cat && cat.trim())),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      showToast('Error fetching notes');
      console.error('Error fetching buttons:', error);
=======
      const validNotes = res.data.filter(
        (note) => note && note._id && note.name && note.query
      );
      if (res.data.length !== validNotes.length) {
        console.warn(`Filtered out ${res.data.length - validNotes.length} invalid notes`);
      }
      setNotes(validNotes);
      const uniqueCategories = [
        ...new Set(validNotes.map((btn) => btn.category).filter((cat) => cat && cat.trim())),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      showToast('Error fetching notes: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchCoverPhoto = async () => {
    try {
      const token = await user.getIdToken();
      const res = await axios.get(`http://localhost:5000/users/${user.uid}/cover-photo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCoverPhotoUrl(res.data.coverPhotoUrl || '');
    } catch (error) {
      console.error('Error fetching cover photo:', error);
      setCoverPhotoUrl('');
>>>>>>> main
    }
  };

  const showToast = (message) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUnlockedNotes([]);
      setNotes([]);
      setRecentNotes([]);
      setCategories([]);
      setShowProfile(false);
      setProfilePictureUrl('');
      setCoverPhotoUrl('');
      showToast('Successfully logged out');
    } catch (error) {
<<<<<<< HEAD
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
=======
      showToast('Error logging out: ' + error.message);
    }
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
      if (newDisplayName.trim() && newDisplayName.trim() !== user.displayName) {
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
    } catch (error) {
      let message = 'Failed to update settings';
      if (error.code === 'auth/wrong-password') message = 'Incorrect current password';
      else if (error.code === 'auth/requires-recent-login') message = 'Please log in again to update settings';
      showToast(message);
    }
  };

  const handleEditProfile = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      showToast('No file selected');
      return;
    }
    try {
      const storageRef = ref(storage, `profile-pictures/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      await updateProfile(user, { photoURL });
      setProfilePictureUrl(photoURL);
      showToast('Profile picture updated successfully');
    } catch (error) {
      showToast('Error uploading profile picture: ' + error.message);
    }
    if (profilePicInputRef.current) profilePicInputRef.current.value = '';
  };

  const handleEditCoverPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      showToast('No file selected');
      return;
    }
    try {
      const storageRef = ref(storage, `cover-photos/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const coverPhotoURL = await getDownloadURL(storageRef);
      const token = await user.getIdToken();
      await axios.put(
        `http://localhost:5000/users/${user.uid}/cover-photo`,
        { coverPhotoUrl: coverPhotoURL },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCoverPhotoUrl(coverPhotoURL);
      showToast('Cover photo updated successfully');
    } catch (error) {
      showToast('Error uploading cover photo: ' + error.message);
    }
    if (coverPhotoInputRef.current) coverPhotoInputRef.current.value = '';
  };

  const togglePin = async (id) => {
    if (!user) {
      showToast('Please log in to pin notes');
      return;
    }
    try {
      const note = notes.find((n) => n._id === id);
      if (!note) {
        showToast('Note not found');
        return;
      }
      if (note.isPrivate && !unlockedNotes.includes(id)) {
        setPasswordNoteId(id);
        setPasswordAction('pin');
        setShowPasswordPopup(true);
        return;
      }
      const updated = notes.map((note) => (note._id === id ? { ...note, isPinned: !note.isPinned } : note));
      setNotes(updated);
      const token = await user.getIdToken();
      await axios.put(`http://localhost:5000/buttons/${id}`, { isPinned: !note.isPinned }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast(updated.find((note) => note._id === id).isPinned ? 'Note pinned' : 'Note unpinned');
    } catch (error) {
      showToast('Error updating pin status: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (note) => {
    if (!user) {
      showToast('Please log in to edit notes');
      return;
    }
    if (!note || !note._id || !note.name || !note.query) {
      showToast('Invalid note selected for editing');
      return;
    }
    if (note.isPrivate && note.userId !== user.uid) {
      showToast('You cannot edit this private note');
      return;
    }
    if (note.isPrivate && !unlockedNotes.includes(note._id)) {
      setPasswordNoteId(note._id);
      setPasswordAction('edit');
      setShowPasswordPopup(true);
      return;
    }
    setEditingNote(note);
    setShowProfile(false);
    showToast('Editing note');
  };

  const handleDelete = (id) => {
    if (!user) {
      showToast('Please log in to delete notes');
      return;
    }
    const note = notes.find((n) => n._id === id);
    if (!note) {
      showToast('Note not found');
      return;
    }
    if (note.userId && note.userId !== user.uid) {
      showToast('You do not have permission to delete this note');
      return;
    }
    if (note.isPrivate && !unlockedNotes.includes(id)) {
      setPasswordNoteId(id);
      setPasswordAction('delete');
      setShowPasswordPopup(true);
      return;
    }
    setDeleteNoteId(id);
    setShowDeletePopup(true);
  };

  const confirmDelete = async () => {
    if (!deleteNoteId) {
      showToast('No note selected for deletion');
      setShowDeletePopup(false);
      return;
    }
    try {
      const token = await user.getIdToken();
      setDeletingNotes([...deletingNotes, deleteNoteId]);
      const note = notes.find((n) => n._id === deleteNoteId);
      if (!note) {
        showToast('Note not found');
        setDeletingNotes(deletingNotes.filter((id) => id !== deleteNoteId));
        setShowDeletePopup(false);
        setDeleteNoteId(null);
        return;
      }
      await axios.delete(`http://localhost:5000/buttons/${deleteNoteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimeout(() => {
        setNotes(notes.filter((note) => note._id !== deleteNoteId));
        setRecentNotes(recentNotes.filter((noteId) => noteId !== deleteNoteId));
        setUnlockedNotes(unlockedNotes.filter((id) => id !== deleteNoteId));
        setDeletingNotes(deletingNotes.filter((id) => id !== deleteNoteId));
        fetchNotes();
        showToast('Note deleted successfully');
      }, 500);
    } catch (error) {
      showToast(`Error deleting note: ${error.response?.data?.message || error.message}`);
      setDeletingNotes(deletingNotes.filter((id) => id !== deleteNoteId));
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
    try {
      const token = await user.getIdToken();
      setDeletingNotes([...deletingNotes, passwordNoteId]);
      await axios.delete(`http://localhost:5000/buttons/${passwordNoteId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { password: passwordInput },
      });
      setTimeout(() => {
        setNotes(notes.filter((note) => note._id !== passwordNoteId));
        setRecentNotes(recentNotes.filter((noteId) => noteId !== passwordNoteId));
        setUnlockedNotes(unlockedNotes.filter((id) => id !== passwordNoteId));
        setDeletingNotes(deletingNotes.filter((id) => id !== passwordNoteId));
        fetchNotes();
        showToast('Note deleted successfully');
        setShowPasswordPopup(false);
        setPasswordInput('');
        setPasswordNoteId(null);
        setPasswordAction('view');
      }, 500);
    } catch (error) {
      let message = 'Error deleting note';
      if (error.response?.status === 403) message = 'Incorrect password';
      else if (error.response?.status === 404) message = 'Note not found';
      else message = error.response?.data?.message || error.message;
      showToast(`Error: ${message}`);
      setDeletingNotes(deletingNotes.filter((id) => id !== passwordNoteId));
    }
  };

  const cancelDelete = () => {
    setShowDeletePopup(false);
    setDeleteNoteId(null);
  };

  const openPopup = (note) => {
    if (!note || !note._id || !note.name || !note.query) {
      showToast('Invalid note selected');
      return;
    }
    if (note.isPrivate && !unlockedNotes.includes(note._id)) {
      setPasswordNoteId(note._id);
      setPasswordAction('view');
      setShowPasswordPopup(true);
      return;
    }
    setPopupNote(note);
    setRecentNotes([note._id, ...recentNotes.filter((id) => id !== note._id).slice(0, 4)]);
>>>>>>> main
    showToast('Note opened');
  };

  const handleOpenPopup = async (note) => {
    if (!user) {
      showToast('Please log in to view notes');
      return;
    }
    openPopup(note);
  };

  const copyToClipboard = (text, noteId = null) => {
    if (noteId) {
      const note = notes.find((n) => n._id === noteId);
      if (note && note.isPrivate && !unlockedNotes.includes(noteId)) {
        setPasswordNoteId(noteId);
        setPasswordAction('copy');
        setShowPasswordPopup(true);
        return;
      }
    }
    navigator.clipboard.writeText(text)
      .then(() => showToast('Copied to clipboard'))
      .catch(() => showToast('Copy failed'));
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
    setIsVerifying(true);
    try {
      const token = await user.getIdToken();
      const res = await axios.post(`http://localhost:5000/buttons/${passwordNoteId}/verify-password`, {
        password: passwordInput,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.verified) {
        setUnlockedNotes([...unlockedNotes, passwordNoteId]);
        const note = notes.find((n) => n._id === passwordNoteId);
        if (!note) {
          showToast('Note not found');
          setShowPasswordPopup(false);
          setPasswordInput('');
          setPasswordNoteId(null);
          setPasswordAction('view');
          return;
        }
        if (passwordAction === 'view') {
          setPopupNote(note);
          setRecentNotes([note._id, ...recentNotes.filter((id) => id !== note._id).slice(0, 4)]);
          showToast('Note unlocked and opened');
        } else if (passwordAction === 'edit') {
          setEditingNote(note);
          setShowProfile(false);
          showToast('Note unlocked for editing');
        } else if (passwordAction === 'delete') {
          await confirmDeleteWithPassword();
        } else if (passwordAction === 'copy') {
          copyToClipboard(note.query);
          showToast('Note unlocked and content copied');
        } else if (passwordAction === 'pin') {
          const updated = notes.map((n) => (n._id === passwordNoteId ? { ...n, isPinned: !n.isPinned } : n));
          setNotes(updated);
          await axios.put(`http://localhost:5000/buttons/${passwordNoteId}`, { isPinned: !note.isPinned }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showToast(updated.find((n) => n._id === passwordNoteId).isPinned ? 'Note pinned' : 'Note unpinned');
        }
        setShowPasswordPopup(false);
        setPasswordInput('');
        setPasswordNoteId(null);
        setPasswordAction('view');
      } else {
        showToast('Incorrect password');
      }
    } catch (error) {
      let message = 'Error verifying password';
      if (error.response?.status === 404) message = 'Note not found';
      else if (error.response?.status === 400) message = 'Invalid request';
      else if (error.response?.status === 401) message = 'Authentication failed';
      else message = error.response?.data?.message || error.message;
      showToast(`Error: ${message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const cancelPassword = () => {
    setShowPasswordPopup(false);
    setPasswordInput('');
    setPasswordNoteId(null);
    setPasswordAction('view');
  };

  const closePopup = () => {
    if (popupNote) {
      setUnlockedNotes(unlockedNotes.filter((id) => id !== popupNote._id));
    }
    setPopupNote(null);
  };

  const filteredNotes = notes
    .filter((note) => {
      if (!note || !note.name || !note.query) {
        console.warn('Invalid note detected in filteredNotes:', note);
        return false;
      }
      const nameMatch = note.name.toLowerCase().includes(searchTerm.toLowerCase());
      const queryMatch = note.query.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = !filterCategory || note.category === filterCategory;
      const privacyMatch = !note.isPrivate || note.userId === user?.uid;
      return (nameMatch || queryMatch) && categoryMatch && privacyMatch;
    })
    .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  const totalNotes = filteredNotes.length;
  const pinnedNotes = filteredNotes.filter((note) => note.isPinned).length;
  const joinedDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  return (
<<<<<<< HEAD
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
=======
    <div className={`container ${darkMode ? 'dark' : ''}`}>
      <h2 className="title">Note Keeper</h2>
      {!user ? (
        <AuthForm showToast={showToast} />
      ) : showProfile ? (
        <div className="profile-view">
          <button className="back-button" onClick={() => setShowProfile(false)}>
            Back to Notes
          </button>
          <div className="profile-header">
            <div
              className="cover-photo"
              style={coverPhotoUrl ? { backgroundImage: `url(${coverPhotoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            ></div>
            <div
              className="profile-picture"
              style={profilePictureUrl ? { backgroundImage: `url(${profilePictureUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            ></div>
            <div className="profile-info">
              <h3>{user.displayName || 'User'}</h3>
              <p>{user.email}</p>
              <div className="profile-actions">
                <label className="edit-profile-button">
                  Edit Profile Picture
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    ref={profilePicInputRef}
                    onChange={handleEditProfile}
                  />
                </label>
                <label className="edit-cover-button">
                  Edit Cover Photo
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    ref={coverPhotoInputRef}
                    onChange={handleEditCoverPhoto}
                  />
                </label>
              </div>
            </div>
          </div>
          <div className="profile-tabs">
            <button
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('settings');
                setCurrentPassword('');
                setNewPassword('');
                setNewDisplayName(user.displayName || '');
              }}
            >
              Settings
            </button>
            <button
              className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              Notes
            </button>
          </div>
          <div className="profile-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <h4>About</h4>
                <div className="profile-details">
                  <p><strong>Name:</strong> {user.displayName || 'Not set'}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Joined:</strong> {joinedDate}</p>
                  <p><strong>Total Notes:</strong> {totalNotes}</p>
                  <p><strong>Pinned Notes:</strong> {pinnedNotes}</p>
                </div>
                <div className="bio-section">
                  Add a bio...
                </div>
                {recentNotes.length > 0 && (
                  <div className="recent-notes">
                    <h4>Recent Notes</h4>
                    <div className="recent-list">
                      {recentNotes.map((id) => {
                        const note = notes.find((n) => n._id === id);
                        if (!note || (note.isPrivate && note.userId !== user.uid && !unlockedNotes.includes(id))) return null;
                        return (
                          <button
                            key={id}
                            className="recent-button"
                            onClick={() => handleOpenPopup(note)}
                          >
                            {note.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="settings-tab">
                <h4>Account Settings</h4>
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
                    required
                  />
                  <input
                    type="password"
                    placeholder="New Password (optional)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="note-input"
                  />
                  <div className="form-actions">
                    <button type="submit" className="settings-button">
                      Save Changes
                    </button>
                    <button type="button" className="logout-button" onClick={handleLogout}>
                      Logout
>>>>>>> main
                    </button>
                  );
                })}
              </div>
<<<<<<< HEAD
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
=======
            )}
            {activeTab === 'notes' && (
              <div className="notes-tab">
                <h4>Your Notes</h4>
                <NoteList
                  notes={filteredNotes}
                  searchTerm={searchTerm}
                  openPopup={handleOpenPopup}
                  togglePin={togglePin}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  copyToClipboard={copyToClipboard}
                  unlockedNotes={unlockedNotes}
                  deletingNotes={deletingNotes}
                />
              </div>
            )}
          </div>
        </div>
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
            openProfile={() => setShowProfile(true)}
          />
          <div className="main-content">
            <div className="input-section">
              <NoteForm
                editingNote={editingNote}
                setEditingNote={setEditingNote}
                fetchNotes={fetchNotes}
                showToast={showToast}
                categories={categories}
                unlockedNotes={unlockedNotes}
                setUnlockedNotes={setUnlockedNotes}
                notes={notes} // Pass notes for export
              />
              <NoteList
                notes={filteredNotes}
                searchTerm={searchTerm}
                openPopup={handleOpenPopup}
                togglePin={togglePin}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                copyToClipboard={copyToClipboard}
                unlockedNotes={unlockedNotes}
                deletingNotes={deletingNotes}
              />
            </div>
            {searchTerm && (
              <Sidebar
                searchTerm={searchTerm}
                notes={filteredNotes}
                openPopup={handleOpenPopup}
                copyToClipboard={copyToClipboard}
                unlockedNotes={unlockedNotes}
              />
            )}
          </div>
        </>
      )}
      {popupNote && (
        <NotePopup
          note={popupNote}
          closePopup={closePopup}
          copyToClipboard={copyToClipboard}
          handleEdit={() => handleEdit(popupNote)}
          handleDelete={() => handleDelete(popupNote._id)}
          togglePin={() => togglePin(popupNote._id)}
          isUnlocked={unlockedNotes.includes(popupNote._id)}
        />
      )}
      {showDeletePopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this note?</p>
            <div className="form-actions">
              <button className="confirm-delete" onClick={confirmDelete}>
                Delete
              </button>
              <button className="cancel-delete" onClick={cancelDelete}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showPasswordPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>Enter Password</h3>
            <input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="note-input"
              disabled={isVerifying}
            />
            <div className="form-actions">
              <button
                className="submit-password"
                onClick={verifyPassword}
                disabled={isVerifying}
              >
                {isVerifying ? 'Verifying...' : 'Submit'}
              </button>
              <button
                className="cancel-password"
                onClick={cancelPassword}
                disabled={isVerifying}
              >
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
    </div>
>>>>>>> main
  );
}

export default App;