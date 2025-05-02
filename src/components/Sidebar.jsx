import PropTypes from 'prop-types';
  import NoteList from './NoteList';

  const Sidebar = ({ user, buttons, setButtons, searchTerm, filterCategory, showToast, openPopup }) => {
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
          onEdit={(button) => {}}
        />
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
  };

  export default Sidebar;