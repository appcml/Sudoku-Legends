import { useTranslation } from 'react-i18next';
import { LEVELS, LEVEL_ORDER } from '../lib/sudoku';
import { THEMES } from '../lib/themes';

export default function LevelSelect({ onSelect, profile }) {
  const { t } = useTranslation();

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #0d1b2a 0%, #1b263b 100%)',
      padding: '20px 16px 40px',
      fontFamily: "'Fredoka One', cursive",
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: '#546e7a', marginBottom: 4 }}>
          {profile?.displayName || 'Player'} · {profile?.totalPoints?.toLocaleString() || 0} pts
        </div>
        <h1 style={{ color: '#ffd700', fontSize: 28, margin: 0 }}>{t('level.select')}</h1>
      </div>

      {/* Level cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 480, margin: '0 auto' }}>
        {LEVEL_ORDER.map((id, idx) => {
          const level = LEVELS[id];
          const theme = THEMES[id];
          const locked = false; // add unlock logic later

          return (
            <button
              key={id}
              onClick={() => !locked && onSelect(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: theme.bg,
                border: `1.5px solid ${theme.accent}55`,
                borderRadius: 14,
                padding: '14px 18px',
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.4 : 1,
                textAlign: 'left',
                transition: 'transform 0.1s, box-shadow 0.1s',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* Icon */}
              <span style={{ fontSize: 32, minWidth: 40, textAlign: 'center' }}>{level.label}</span>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{
                    fontSize: 17, fontWeight: '700',
                    color: theme.dark ? theme.given : theme.primary,
                    fontFamily: theme.font,
                  }}>
                    {level.name.es}
                  </span>
                  {id === 'hell' && (
                    <span style={{
                      fontSize: 9, padding: '2px 7px', borderRadius: 20,
                      background: '#ff3d0033', color: '#ff3d00', border: '1px solid #ff3d00'
                    }}>⚠️ EXTREMO</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Tag label={t('level.clues', { count: `${level.clues[0]}–${level.clues[1]}` })} color={theme.accent} />
                  <Tag label={`×${level.mult}`} color={theme.accent} />
                  {level.timer
                    ? <Tag label={t('level.timer', { min: Math.floor(level.timer/60) })} color={theme.accent} />
                    : <Tag label={t('level.noTimer')} color={theme.accent} />
                  }
                  {level.hints === 0
                    ? <Tag label="Sin pistas" color="#ef5350" />
                    : level.hints < 99
                      ? <Tag label={`💡 ${level.hints}`} color={theme.accent} />
                      : <Tag label="💡 ∞" color={theme.accent} />
                  }
                </div>
              </div>

              {/* Arrow */}
              <span style={{ color: theme.accent, fontSize: 20, opacity: 0.7 }}>›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Tag({ label, color }) {
  return (
    <span style={{
      fontSize: 11,
      padding: '2px 8px',
      borderRadius: 20,
      background: color + '22',
      color: color,
      border: `1px solid ${color}44`,
    }}>{label}</span>
  );
}
