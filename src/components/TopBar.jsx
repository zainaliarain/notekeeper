import React from 'react';
import PropTypes from 'prop-types';

const TopBar = ({
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  categories,
  darkMode,
  setDarkMode,
  handleLogout,
  openSettings,
}) => {
  return (
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
        {categories.length > 0 ? (
          categories.map((category, index) => (
            <option key={index} value={category}>
              {category}
            </option>
          ))
        ) : (
          <option value="" disabled>No categories available</option>
        )}
      </select>
      <button className="toggle-dark" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
      <button className="settings-button" onClick={openSettings}>
        Settings
      </button>
      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

TopBar.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  filterCategory: PropTypes.string.isRequired,
  setFilterCategory: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  darkMode: PropTypes.bool.isRequired,
  setDarkMode: PropTypes.func.isRequired,
  handleLogout: PropTypes.func.isRequired,
  openSettings: PropTypes.func.isRequired,
};

export default TopBar;