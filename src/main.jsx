import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './hooks/useAuth';
import App from './App.jsx';
import './i18n';
import { initAds } from './lib/adsService';

// Inicializar AdMob: testMode=true en desarrollo, false en producción
initAds({ testMode: !import.meta.env.PROD });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
