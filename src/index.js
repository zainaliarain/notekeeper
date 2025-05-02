import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

// In App.jsx
<Router>
  <ErrorBoundary>
    <div className={`container ${darkMode ? 'dark' : ''}`}>
      ...
    </div>
  </ErrorBoundary>
</Router>