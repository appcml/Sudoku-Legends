import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import LevelSelect from './pages/LevelSelect';
import SudokuBoard from './components/SudokuBoard';
import GameComplete from './pages/GameComplete';
import './i18n';
import { GOOGLE_FONTS_URL } from './lib/themes';

// Screens: 'auth' | 'home' | 'level-select' | 'game' | 'complete'

export default function App() {
  const { user, profile, isLoading } = useAuth();
  const [screen, setScreen]   = useState('home');
  const [levelId, setLevelId] = useState('beginner');
  const [gameResult, setResult] = useState(null);

  if (isLoading) return (
    <div style={{
      minHeight: '100dvh',
      background: '#0d1b2a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#ffd700', fontFamily: 'sans-serif', fontSize: 18,
    }}>
      🔢 Cargando...
    </div>
  );

  if (!user) return <AuthPage />;

  const handleLevelSelect = (id) => {
    setLevelId(id);
    setScreen('game');
  };

  const handleGameComplete = (result) => {
    setResult({ ...result, levelId });
    setScreen('complete');
    // TODO: saveGameResult(user.uid, { ...result, levelId });
  };

  const handleGiveUp = () => {
    setScreen('level-select');
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={GOOGLE_FONTS_URL} rel="stylesheet" />

      {screen === 'home' && (
        <Home
          profile={profile}
          onPlay={() => setScreen('level-select')}
          onLeaderboard={() => alert('Leaderboard — próximamente')}
          onGroup={() => alert('Grupos — próximamente')}
          onProfile={() => alert('Perfil — próximamente')}
        />
      )}
      {screen === 'level-select' && (
        <LevelSelect
          profile={profile}
          onSelect={handleLevelSelect}
        />
      )}
      {screen === 'game' && (
        <SudokuBoard
          levelId={levelId}
          onComplete={handleGameComplete}
          onGiveUp={handleGiveUp}
        />
      )}
      {screen === 'complete' && gameResult && (
        <GameComplete
          result={gameResult}
          onNewGame={() => setScreen('game')}
          onHome={() => setScreen('home')}
          onWatchAd={(pts) => console.log('Ad watched, +', pts, 'pts')}
        />
      )}
    </>
  );
}

// ─── Home screen ─────────────────────────────────────────────────────────────
function Home({ profile, onPlay, onLeaderboard, onGroup, onProfile }) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #0d1b2a 0%, #1b263b 60%, #0d1b2a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'space-between', padding: '40px 24px 32px',
      fontFamily: "'Fredoka One', cursive",
    }}>
      {/* Top: profile strip */}
      <div onClick={onProfile} style={{
        width: '100%', maxWidth: 400,
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#1b263b',
        border: '1px solid #37474f',
        borderRadius: 14, padding: '12px 16px',
        cursor: 'pointer',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'linear-gradient(135deg, #ffd700, #ff8f00)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: '700', color: '#0d1b2a', flexShrink: 0,
        }}>
          {(profile?.displayName || 'P')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#eceff1', fontSize: 16 }}>{profile?.displayName || 'Player'}</div>
          <div style={{ color: '#90a4ae', fontSize: 12 }}>
            ⭐ {(profile?.totalPoints || 0).toLocaleString()} pts · 🔥 {profile?.currentStreak || 0} días
          </div>
        </div>
        <span style={{ color: '#546e7a' }}>›</span>
      </div>

      {/* Center: logo + play */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 8, filter: 'drop-shadow(0 0 20px #ffd70066)' }}>🔢</div>
        <h1 style={{ color: '#ffd700', fontSize: 40, margin: '0 0 4px', letterSpacing: 2 }}>
          SUDOKU
        </h1>
        <p style={{ color: '#546e7a', margin: '0 0 40px', fontSize: 14 }}>LEGENDS</p>

        <button
          onClick={onPlay}
          style={{
            padding: '18px 60px',
            background: 'linear-gradient(135deg, #ffd700, #ff8f00)',
            border: 'none', borderRadius: 18,
            color: '#0d1b2a', fontSize: 22, fontWeight: '700',
            fontFamily: "'Fredoka One', cursive",
            cursor: 'pointer',
            boxShadow: '0 4px 24px #ffd70044',
            letterSpacing: 1,
          }}
        >
          ▶ JUGAR
        </button>
      </div>

      {/* Bottom nav */}
      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 400 }}>
        {[
          { icon: '🏆', label: 'Ranking', action: onLeaderboard },
          { icon: '👥', label: 'Grupos',  action: onGroup },
          { icon: '🏅', label: 'Torneos', action: () => alert('Torneos — próximamente') },
          { icon: '⚙️', label: 'Ajustes', action: () => alert('Ajustes — próximamente') },
        ].map(({ icon, label, action }) => (
          <button key={label} onClick={action} style={{
            flex: 1, padding: '12px 4px',
            background: '#1b263b',
            border: '1px solid #37474f',
            borderRadius: 12,
            color: '#90a4ae', fontSize: 11,
            fontFamily: "'Fredoka One', cursive",
            cursor: 'pointer',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
