import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { FaUser, FaSignOutAlt, FaSun, FaMoon } from 'react-icons/fa'; // Added FaSun and FaMoon
import debounce from 'lodash/debounce';

const TopBar = ({
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  categories,
  darkMode,
  setDarkMode,
  handleLogout,
  openProfile,
}) => {
  const debouncedSetSearchTerm = useCallback(
    debounce((value) => setSearchTerm(value), 300),
    [setSearchTerm]
  );

  return (
    <div className="top-bar">
      <input
        type="text"
        className="search-input"
        placeholder="Search notes..."
        value={searchTerm}
        onChange={(e) => debouncedSetSearchTerm(e.target.value)}
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
          <option value="" disabled>
            No categories available
          </option>
        )}
      </select>
      <button
        className="toggle-mode-icon"
        onClick={() => setDarkMode(!darkMode)}
        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {darkMode ? <FaSun /> : <FaMoon />}
      </button>
      <button
        className="profile-icon"
        onClick={openProfile}
        title="Profile"
        aria-label="Open profile"
      >
        <FaUser />
      </button>
      <button
        className="logout-icon"
        onClick={handleLogout}
        title="Logout"
        aria-label="Logout"
      >
        <FaSignOutAlt />
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
  openProfile: PropTypes.func.isRequired,
};

export default TopBar;