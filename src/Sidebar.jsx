import { useNavigate } from 'react-router-dom';
import NoteList from './NoteList';
import PropTypes from 'prop-types';

const Sidebar = ({ user, buttons, setButtons, searchTerm, filterCategory, showToast, openPopup, onEdit, darkMode, handleLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="sidebar">
      <h3>Menu</h3>
      <ul className="sidebar-nav">
        <li>
          <button onClick={() => navigate('/')}>🏠 Home</button>
        </li>
        <li>
          <button onClick={() => navigate('/settings')}>⚙️ Settings</button>
        </li>
        <li>
          <button onClick={handleLogout}>🚪 Logout</button>
        </li>
        <li>
          <button onClick={() => darkMode ? setDarkMode(false) : setDarkMode(true)}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </li>
      </ul>
      {searchTerm && (
        <>
          <h3>Search Results</h3>
          <NoteList
            user={user}
            buttons={buttons}
            setButtons={setButtons}
            searchTerm={searchTerm}
            filterCategory={filterCategory}
            showToast={showToast}
            openPopup={openPopup}
            onEdit={onEdit}
          />
        </>
      )}
    </div>
  );
};

Sidebar.propTypes = {
  user: PropTypes.object,
  buttons: PropTypes.array.isRequired,
  setButtons: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  filterCategory: PropTypes.string.isRequired,
  showToast: PropTypes.func.isRequired,
  openPopup: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  darkMode: PropTypes.bool.isRequired,
  setDarkMode: PropTypes.func.isRequired,
  handleLogout: PropTypes.func.isRequired,
};

export default Sidebar;