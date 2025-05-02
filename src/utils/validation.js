export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateNote = (name, query) => {
  return name.trim().length > 0 && query.trim().length > 0;
};

export const validateDisplayName = (displayName) => {
  return displayName.trim().length > 0;
};