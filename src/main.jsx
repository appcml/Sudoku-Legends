import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './hooks/useAuth';
import App from './App.jsx';
import './i18n';

const root = document.getElementById('root');
createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
