import { useEffect } from 'react';
import PropTypes from 'prop-types';

const Toast = ({ message, show, setToast }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setToast({ message: '', show: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [show, setToast]);

  if (!show) return null;

  return <div className="toast">{message}</div>;
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  show: PropTypes.bool.isRequired,
  setToast: PropTypes.func.isRequired,
};

export default Toast;