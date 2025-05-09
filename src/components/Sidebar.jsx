import PropTypes from 'prop-types';
import NoteList from './NoteList';

const Sidebar = ({ user, buttons, setButtons, searchTerm, filterCategory, showToast, openPopup, onEdit }) => {
  return (
    <div className="sidebar">
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
    </div>
  );
};

export default Sidebar;