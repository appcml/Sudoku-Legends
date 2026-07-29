import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './hooks/useAuth';
import App from './App.jsx';
import './i18n';
import { initAds } from './lib/adsService';

// Inicializar AdMob al arrancar. testMode=true en desarrollo, false en producción.
initAds({ testMode: !import.meta.env.PROD });

const root = document.getElementById('root');
createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
