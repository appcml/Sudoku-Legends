import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const { t }           = useTranslation();
  const { signInAnon, signInGoogle, signInApple, signInEmail, registerEmail } = useAuth();
  const [mode, setMode] = useState('home'); // home | email-login | email-register
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (fn) => {
    setError('');
    setLoading(true);
    try { await fn(); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 50%, #0d1b2a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Fredoka One', cursive",
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>🔢</div>
        <h1 style={{ color: '#ffd700', fontSize: 36, margin: 0, letterSpacing: 2 }}>
          {t('auth.title')}
        </h1>
        <p style={{ color: '#90a4ae', margin: '8px 0 0', fontSize: 15 }}>
          {t('auth.subtitle')}
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 360 }}>
        {mode === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Social logins */}
            <SocialBtn icon="🔵" label={t('auth.google')}  onClick={() => handle(signInGoogle)} loading={loading} />
            <SocialBtn icon="🍎" label={t('auth.apple')}   onClick={() => handle(signInApple)}  loading={loading} />

            {/* Email */}
            <SocialBtn icon="✉️" label={t('auth.email')}   onClick={() => setMode('email-login')} loading={false} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#37474f' }} />
              <span style={{ color: '#546e7a', fontSize: 13 }}>o</span>
              <div style={{ flex: 1, height: 1, background: '#37474f' }} />
            </div>

            {/* Guest */}
            <button
              onClick={() => handle(signInAnon)}
              disabled={loading}
              style={{ ...ghostBtn, color: '#90a4ae', borderColor: '#37474f', fontSize: 14 }}
            >
              {t('auth.anon')} →
            </button>

            <p style={{ color: '#546e7a', fontSize: 11, textAlign: 'center', lineHeight: 1.5, marginTop: 8 }}>
              {t('auth.anonWarning')}
            </p>
          </div>
        )}

        {mode === 'email-login' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ color: '#eceff1', margin: '0 0 4px', fontSize: 22 }}>{t('auth.login')}</h2>
            <input placeholder={t('auth.email')} type="email" value={email}
              onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <input placeholder={t('auth.password')} type="password" value={password}
              onChange={e => setPassword(e.target.value)} style={inputStyle} />
            {error && <p style={{ color: '#ef5350', fontSize: 12, margin: 0 }}>{error}</p>}
            <button onClick={() => handle(() => signInEmail(email, password))}
              disabled={loading} style={primaryBtn}>
              {loading ? '...' : t('auth.login')}
            </button>
            <p style={{ color: '#90a4ae', fontSize: 13, textAlign: 'center' }}>
              {t('auth.noAccount')}{' '}
              <span onClick={() => setMode('email-register')}
                style={{ color: '#ffd700', cursor: 'pointer' }}>{t('auth.register')}</span>
            </p>
            <button onClick={() => setMode('home')} style={{ ...ghostBtn, fontSize: 13 }}>
              ← {t('common.back')}
            </button>
          </div>
        )}

        {mode === 'email-register' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ color: '#eceff1', margin: '0 0 4px', fontSize: 22 }}>{t('auth.register')}</h2>
            <input placeholder={t('profile.nickname')} value={name}
              onChange={e => setName(e.target.value)} style={inputStyle} />
            <input placeholder={t('auth.email')} type="email" value={email}
              onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <input placeholder={t('auth.password')} type="password" value={password}
              onChange={e => setPassword(e.target.value)} style={inputStyle} />
            {error && <p style={{ color: '#ef5350', fontSize: 12, margin: 0 }}>{error}</p>}
            <button onClick={() => handle(async () => {
              const cred = await registerEmail(email, password);
              if (name) await cred.user.updateProfile?.({ displayName: name });
            })} disabled={loading} style={primaryBtn}>
              {loading ? '...' : t('auth.register')}
            </button>
            <p style={{ color: '#90a4ae', fontSize: 13, textAlign: 'center' }}>
              {t('auth.haveAccount')}{' '}
              <span onClick={() => setMode('email-login')}
                style={{ color: '#ffd700', cursor: 'pointer' }}>{t('auth.login')}</span>
            </p>
            <button onClick={() => setMode('home')} style={{ ...ghostBtn, fontSize: 13 }}>
              ← {t('common.back')}
            </button>
          </div>
        )}
      </div>

      {/* Lang selector */}
      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        {['es','en','pt'].map(lang => (
          <button key={lang} onClick={() => { /* i18n.changeLanguage(lang) */ }}
            style={{ background: 'none', border: 'none', color: '#546e7a', cursor: 'pointer', fontSize: 13 }}>
            {lang.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

function SocialBtn({ icon, label, onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: '#1b263b', border: '1px solid #37474f',
      borderRadius: 12, padding: '14px 20px', color: '#eceff1',
      fontSize: 15, cursor: 'pointer', width: '100%',
      fontFamily: "'Fredoka One', cursive",
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      {loading ? '...' : label}
    </button>
  );
}

const inputStyle = {
  padding: '12px 16px',
  background: '#1b263b',
  border: '1px solid #37474f',
  borderRadius: 10,
  color: '#eceff1',
  fontSize: 15,
  fontFamily: "'Fredoka One', cursive",
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const primaryBtn = {
  padding: '14px',
  background: '#ffd700',
  border: 'none',
  borderRadius: 12,
  color: '#0d1b2a',
  fontSize: 16,
  fontWeight: '700',
  fontFamily: "'Fredoka One', cursive",
  cursor: 'pointer',
  width: '100%',
};

const ghostBtn = {
  padding: '12px',
  background: 'transparent',
  border: '1px solid #546e7a',
  borderRadius: 12,
  color: '#90a4ae',
  fontSize: 15,
  fontFamily: "'Fredoka One', cursive",
  cursor: 'pointer',
  width: '100%',
};
