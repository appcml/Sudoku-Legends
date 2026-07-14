import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { THEMES } from '../lib/themes';
import { LEVELS } from '../lib/sudoku';

export default function GameComplete({ result, onNewGame, onHome, onWatchAd }) {
  const { t } = useTranslation();
  const { levelId, score, timeSpent, errors } = result;
  const theme = THEMES[levelId];
  const level = LEVELS[levelId];
  const [adWatched, setAdWatched] = useState(false);
  const [showAdAnim, setShowAdAnim] = useState(false);

  const handleWatchAd = async () => {
    // In production: call AdMob rewarded ad here
    // For now: simulate with timeout
    setShowAdAnim(true);
    await new Promise(r => setTimeout(r, 2000));
    setShowAdAnim(false);
    setAdWatched(true);
    onWatchAd?.(150);
  };

  const stars = errors === 0 ? 3 : errors <= 3 ? 2 : 1;
  const mins = Math.floor(timeSpent / 60);
  const secs = timeSpent % 60;

  return (
    <div style={{
      minHeight: '100dvh',
      background: theme.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
      fontFamily: theme.font,
    }}>
      {/* Stars */}
      <div style={{ fontSize: 48, marginBottom: 8, animation: 'pop 0.5s ease' }}>
        {stars === 3 ? '⭐⭐⭐' : stars === 2 ? '⭐⭐☆' : '⭐☆☆'}
      </div>

      <h1 style={{ color: theme.given, fontSize: 32, margin: '0 0 4px' }}>
        {t('game.complete')}
      </h1>
      <p style={{ color: theme.text, opacity: 0.7, fontSize: 14, margin: '0 0 28px' }}>
        {level.label} {level.name.es}
      </p>

      {/* Score card */}
      <div style={{
        background: theme.cell,
        border: `1px solid ${theme.border}`,
        borderRadius: 16,
        padding: '20px 28px',
        width: '100%', maxWidth: 320,
        marginBottom: 20,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: theme.text, opacity: 0.6, marginBottom: 4 }}>{t('game.score')}</div>
          <div style={{ fontSize: 48, fontWeight: '700', color: theme.primary, lineHeight: 1 }}>
            {(score.total + (adWatched ? 150 : 0)).toLocaleString()}
          </div>
          {score.perfect > 1 && (
            <div style={{ fontSize: 13, color: '#ffd700', marginTop: 4 }}>{t('game.perfect')}</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ScoreRow label="Base" value={`+${score.base}`} color={theme.text} />
          {score.timeBonus > 0 && <ScoreRow label="⚡ Bonus velocidad" value={`+${score.timeBonus}`} color="#4caf50" />}
          {score.errorPenalty > 0 && <ScoreRow label="❌ Errores" value={`-${score.errorPenalty}`} color="#ef5350" />}
          {score.hintPenalty > 0 && <ScoreRow label="💡 Pistas usadas" value={`-${score.hintPenalty}`} color="#ff9800" />}
          {adWatched && <ScoreRow label="📺 Ver anuncio" value="+150" color="#ffd700" />}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 13, color: theme.text, opacity: 0.7 }}>
          <span>⏱ {mins}:{secs.toString().padStart(2,'0')}</span>
          <span>❌ {errors} {errors === 1 ? 'error' : 'errores'}</span>
          <span>×{level.mult} nivel</span>
        </div>
      </div>

      {/* Ad reward button */}
      {!adWatched && (
        <button
          onClick={handleWatchAd}
          disabled={showAdAnim}
          style={{
            width: '100%', maxWidth: 320,
            padding: '16px',
            background: 'linear-gradient(135deg, #ffd700, #ff8f00)',
            border: 'none', borderRadius: 14,
            color: '#0d1b2a', fontSize: 16, fontWeight: '700',
            fontFamily: theme.font,
            cursor: 'pointer',
            marginBottom: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {showAdAnim ? (
            <span>📺 Cargando anuncio...</span>
          ) : (
            <span>📺 {t('game.watchAd')}</span>
          )}
        </button>
      )}

      {adWatched && (
        <div style={{
          width: '100%', maxWidth: 320,
          padding: '12px',
          background: '#4caf5033',
          border: '1px solid #4caf50',
          borderRadius: 12,
          textAlign: 'center',
          color: '#4caf50',
          fontSize: 14,
          marginBottom: 10,
        }}>
          ✅ {t('game.adBonus')}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 320 }}>
        <button onClick={onHome} style={{
          flex: 1, padding: '12px',
          background: theme.cell, border: `1px solid ${theme.border}`,
          borderRadius: 12, color: theme.text, fontFamily: theme.font,
          fontSize: 14, cursor: 'pointer',
        }}>
          🏠 Menú
        </button>
        <button onClick={onNewGame} style={{
          flex: 2, padding: '12px',
          background: theme.primary, border: 'none',
          borderRadius: 12, color: theme.dark ? '#000' : '#fff',
          fontFamily: theme.font, fontSize: 15, fontWeight: '700',
          cursor: 'pointer',
        }}>
          🔄 {t('game.newGame')}
        </button>
      </div>

      <style>{`
        @keyframes pop { 0%{transform:scale(0)} 80%{transform:scale(1.1)} 100%{transform:scale(1)} }
      `}</style>
    </div>
  );
}

function ScoreRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span style={{ color, fontWeight: '600' }}>{value}</span>
    </div>
  );
}
