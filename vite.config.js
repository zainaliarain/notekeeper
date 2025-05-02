import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external access (e.g., for ngrok)
    port: 5173,
    strictPort: true // Prevent port fallback
  }
});