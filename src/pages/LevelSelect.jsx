import { useTranslation } from 'react-i18next';
import { LEVELS, LEVEL_ORDER } from '../lib/sudoku';
import { THEMES } from '../lib/themes';

export default function LevelSelect({ onSelect, profile }) {
  const { t } = useTranslation();
  return (
    <div style={{
      height: '100dvh', overflowY: 'auto',
      background: 'linear-gradient(160deg, #0d1b2a 0%, #1b263b 100%)',
      padding: '14px 12px 20px', boxSizing: 'border-box',
      fontFamily: "'Fredoka One', cursive",
    }}>
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: '#546e7a', marginBottom: 2 }}>
          {profile?.displayName || 'Player'} · {(profile?.totalPoints || 0).toLocaleString()} pts
        </div>
        <h1 style={{ color: '#ffd700', fontSize: 22, margin: 0 }}>{t('level.select')}</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxWidth: 460, margin: '0 auto' }}>
        {LEVEL_ORDER.map((id) => {
          const level = LEVELS[id];
          const theme = THEMES[id];
          return (
            <button key={id} onClick={() => onSelect(id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: theme.bg, border: `1.5px solid ${theme.accent}55`,
              borderRadius: 12, padding: '10px 12px',
              cursor: 'pointer', textAlign: 'left', width: '100%', boxSizing: 'border-box',
              transition: 'transform 0.1s',
            }}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onTouchEnd={e   => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: 26, minWidth: 34, textAlign: 'center', flexShrink: 0 }}>{level.label}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: '700', color: theme.dark ? theme.given : theme.primary, fontFamily: theme.font }}>
                    {level.name.es}
                  </span>
                  {id === 'hell' && (
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 20, background: '#ff3d0033', color: '#ff3d00', border: '1px solid #ff3d00', flexShrink: 0 }}>⚠️ EXTREMO</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {[
                    `${level.clues[0]}–${level.clues[1]} pistas`,
                    `×${level.mult}`,
                    level.timer ? `${Math.floor(level.timer/60)} min` : 'Sin límite',
                    `💡 ${level.hints} gratis`,
                  ].map(lbl => (
                    <span key={lbl} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, background: theme.accent + '22', color: theme.accent, border: `1px solid ${theme.accent}44`, whiteSpace: 'nowrap' }}>{lbl}</span>
                  ))}
                </div>
              </div>
              <span style={{ color: theme.accent, fontSize: 18, opacity: 0.7, flexShrink: 0 }}>›</span>
            </button>
          );
        })}
      </div>
      <p style={{ textAlign: 'center', color: '#546e7a', fontSize: 11, marginTop: 12 }}>
        📺 ¿Sin pistas? Ve un anuncio y gana +2 💡
      </p>
    </div>
  );
}
