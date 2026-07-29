import { useTranslation } from 'react-i18next';
import { LEVELS, LEVEL_ORDER } from '../lib/sudoku';
import { THEMES } from '../lib/themes';

export default function LevelSelect({ onSelect, profile }) {
  const { t } = useTranslation();

  return (
    <div style={{
      minHeight: '100dvh',
      maxHeight: '100dvh',
      overflowY: 'auto',
      background: 'linear-gradient(160deg, #0d1b2a 0%, #1b263b 100%)',
      // padding lateral fijo, padding vertical justo
      padding: '16px 12px 24px',
      fontFamily: "'Fredoka One', cursive",
      boxSizing: 'border-box',
    }}>
      {/* Header compacto */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#546e7a', marginBottom: 2 }}>
          {profile?.displayName || 'Player'} · {profile?.totalPoints?.toLocaleString() || 0} pts
        </div>
        <h1 style={{ color: '#ffd700', fontSize: 24, margin: 0 }}>{t('level.select')}</h1>
      </div>

      {/* Level cards */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        maxWidth: 460, margin: '0 auto',
        width: '100%',
      }}>
        {LEVEL_ORDER.map((id) => {
          const level = LEVELS[id];
          const theme = THEMES[id];
          const locked = false;

          return (
            <button
              key={id}
              onClick={() => !locked && onSelect(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: theme.bg,
                border: `1.5px solid ${theme.accent}55`,
                borderRadius: 12,
                padding: '10px 14px',
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.4 : 1,
                textAlign: 'left',
                width: '100%',
                boxSizing: 'border-box',
                transition: 'transform 0.1s',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* Icon */}
              <span style={{ fontSize: 28, minWidth: 36, textAlign: 'center', flexShrink: 0 }}>
                {level.label}
              </span>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 15, fontWeight: '700',
                    color: theme.dark ? theme.given : theme.primary,
                    fontFamily: theme.font,
                  }}>
                    {level.name.es}
                  </span>
                  {id === 'hell' && (
                    <span style={{
                      fontSize: 9, padding: '1px 6px', borderRadius: 20,
                      background: '#ff3d0033', color: '#ff3d00', border: '1px solid #ff3d00',
                      flexShrink: 0,
                    }}>⚠️ EXTREMO</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  <Tag label={`${level.clues[0]}–${level.clues[1]} pistas`} color={theme.accent} />
                  <Tag label={`×${level.mult}`} color={theme.accent} />
                  {level.timer
                    ? <Tag label={`${Math.floor(level.timer / 60)} min`} color={theme.accent} />
                    : <Tag label="Sin límite" color={theme.accent} />
                  }
                  <Tag label={`💡 ${level.hints} gratis`} color={theme.accent} />
                </div>
              </div>

              {/* Arrow */}
              <span style={{ color: theme.accent, fontSize: 18, opacity: 0.7, flexShrink: 0 }}>›</span>
            </button>
          );
        })}
      </div>

      {/* Nota sobre anuncios */}
      <p style={{
        textAlign: 'center',
        color: '#546e7a',
        fontSize: 11,
        marginTop: 14,
        marginBottom: 0,
      }}>
        📺 ¿Sin pistas? Ve un anuncio y gana +2 💡 extra
      </p>
    </div>
  );
}

function Tag({ label, color }) {
  return (
    <span style={{
      fontSize: 10,
      padding: '2px 7px',
      borderRadius: 20,
      background: color + '22',
      color: color,
      border: `1px solid ${color}44`,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}
