import { useState, useEffect, useCallback, useRef } from 'react';
import { generatePuzzle, isBoardComplete, calculateScore, LEVELS } from '../lib/sudoku';
import { THEMES } from '../lib/themes';
import { useTranslation } from 'react-i18next';

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function SudokuBoard({ levelId = 'beginner', onComplete, onGiveUp }) {
  const { t } = useTranslation();
  const theme = THEMES[levelId];
  const level = LEVELS[levelId];

  const [gameData, setGameData]       = useState(null);
  const [board, setBoard]             = useState(null);
  const [selected, setSelected]       = useState(null);
  const [noteMode, setNoteMode]       = useState(false);
  const [notes, setNotes]             = useState({});
  const [errors, setErrors]           = useState(0);
  const [hints, setHints]             = useState(level.hints === 99 ? 99 : level.hints);
  const [timeSpent, setTimeSpent]     = useState(0);
  const [paused, setPaused]           = useState(false);
  const [completed, setCompleted]     = useState(false);
  const [wrongCells, setWrongCells]   = useState(new Set());
  const [flashCells, setFlashCells]   = useState(new Set());
  const timerRef = useRef(null);

  // Init game
  useEffect(() => {
    const data = generatePuzzle(levelId);
    setGameData(data);
    setBoard(data.puzzle.map(r => [...r]));
    setSelected(null);
    setErrors(0);
    setHints(level.hints === 99 ? 99 : level.hints);
    setTimeSpent(0);
    setNotes({});
    setWrongCells(new Set());
    setCompleted(false);
  }, [levelId]);

  // Timer
  useEffect(() => {
    if (!gameData || paused || completed) return;
    timerRef.current = setInterval(() => {
      setTimeSpent(t => {
        if (level.timer && t + 1 >= level.timer) {
          clearInterval(timerRef.current);
          onGiveUp?.({ reason: 'timeout', timeSpent: t + 1 });
          return t + 1;
        }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameData, paused, completed]);

  const timeLeft = level.timer ? Math.max(0, level.timer - timeSpent) : null;
  const timerWarning = timeLeft !== null && timeLeft < 60;

  const handleCellClick = (r, c) => {
    if (completed) return;
    setSelected([r, c]);
  };

  const handleNumber = useCallback((num) => {
    if (!selected || !gameData || completed) return;
    const [r, c] = selected;
    if (gameData.puzzle[r][c] !== 0) return; // given cell

    if (noteMode) {
      const key = `${r}-${c}`;
      setNotes(prev => {
        const cell = new Set(prev[key] || []);
        cell.has(num) ? cell.delete(num) : cell.add(num);
        return { ...prev, [key]: cell };
      });
      return;
    }

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);

    // Validate
    if (num !== gameData.solution[r][c]) {
      setErrors(e => e + 1);
      const key = `${r}-${c}`;
      setWrongCells(prev => new Set([...prev, key]));
      setTimeout(() => {
        setWrongCells(prev => { const s = new Set(prev); s.delete(key); return s; });
      }, 1000);
    } else {
      // Flash matching numbers
      const matches = new Set();
      for (let i = 0; i < 9; i++)
        for (let j = 0; j < 9; j++)
          if (newBoard[i][j] === num) matches.add(`${i}-${j}`);
      setFlashCells(matches);
      setTimeout(() => setFlashCells(new Set()), 600);

      if (isBoardComplete(newBoard, gameData.solution)) {
        setCompleted(true);
        clearInterval(timerRef.current);
        const score = calculateScore({
          levelId, timeSpent, timerLimit: level.timer, errors, hints: level.hints - hints,
        });
        onComplete?.({ score, timeSpent, errors, levelId });
      }
    }
  }, [selected, gameData, board, noteMode, errors, hints, completed]);

  const handleHint = () => {
    if (!selected || hints <= 0 || !gameData) return;
    const [r, c] = selected;
    if (gameData.puzzle[r][c] !== 0 || board[r][c] === gameData.solution[r][c]) return;
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = gameData.solution[r][c];
    setBoard(newBoard);
    setHints(h => h - 1);
  };

  const handleErase = () => {
    if (!selected || !gameData) return;
    const [r, c] = selected;
    if (gameData.puzzle[r][c] !== 0) return;
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = 0;
    setBoard(newBoard);
    setNotes(prev => { const n = { ...prev }; delete n[`${r}-${c}`]; return n; });
  };

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '1' && e.key <= '9') handleNumber(parseInt(e.key));
      if (e.key === 'Backspace' || e.key === 'Delete') handleErase();
      if (!selected) return;
      const [r, c] = selected;
      if (e.key === 'ArrowUp')    setSelected([Math.max(0, r-1), c]);
      if (e.key === 'ArrowDown')  setSelected([Math.min(8, r+1), c]);
      if (e.key === 'ArrowLeft')  setSelected([r, Math.max(0, c-1)]);
      if (e.key === 'ArrowRight') setSelected([r, Math.min(8, c+1)]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNumber, selected]);

  if (!board || !gameData) return (
    <div style={{ textAlign: 'center', padding: '2rem', fontFamily: theme.font, color: theme.text }}>
      Generando puzzle...
    </div>
  );

  const getCellStyle = (r, c) => {
    const isGiven    = gameData.puzzle[r][c] !== 0;
    const isSelected = selected?.[0] === r && selected?.[1] === c;
    const isWrong    = wrongCells.has(`${r}-${c}`);
    const isFlash    = flashCells.has(`${r}-${c}`);
    const selR = selected?.[0], selC = selected?.[1];
    const isHighlight = selR !== undefined && (
      r === selR || c === selC ||
      (Math.floor(r/3) === Math.floor(selR/3) && Math.floor(c/3) === Math.floor(selC/3))
    );
    const isSameNum = selected && board[selR]?.[selC] !== 0 && board[r][c] === board[selR]?.[selC];

    let bg = isGiven ? theme.cellGiven : theme.cell;
    if (isHighlight && !isSelected) bg = theme.highlight;
    if (isSameNum && !isSelected) bg = theme.accent + '44';
    if (isSelected) bg = theme.selected;
    if (isWrong) bg = '#ff000033';
    if (isFlash) bg = theme.accent + '88';

    return {
      background: bg,
      color: isWrong ? theme.error : (isGiven ? theme.given : theme.text),
      fontWeight: isGiven ? '700' : '500',
      fontFamily: theme.font,
      fontSize: 'clamp(16px, 3.5vw, 22px)',
      cursor: isGiven ? 'default' : 'pointer',
      transition: 'background 0.15s',
      borderRight: (c+1) % 3 === 0 && c < 8 ? `2px solid ${theme.primary}` : `1px solid ${theme.border}`,
      borderBottom: (r+1) % 3 === 0 && r < 8 ? `2px solid ${theme.primary}` : `1px solid ${theme.border}`,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none',
      WebkitTapHighlightColor: 'transparent',
      animation: (theme.shake && isSelected) ? 'shake 0.5s infinite' : 'none',
    };
  };

  const progress = board.flat().filter(v => v !== 0).length / 81;

  return (
    <div style={{
      minHeight: '100dvh',
      background: theme.bg,
      fontFamily: theme.font,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '12px',
      color: theme.text,
    }}>
      {/* Glitch overlay for nightmare/hell */}
      {theme.glitch && (
        <style>{`
          @keyframes glitch {
            0%,100%{clip-path:inset(0 0 98% 0)} 20%{clip-path:inset(40% 0 50% 0)}
            40%{clip-path:inset(60% 0 10% 0)} 60%{clip-path:inset(80% 0 5% 0)}
            80%{clip-path:inset(10% 0 70% 0)}
          }
          @keyframes shake { 0%,100%{transform:translate(0)} 25%{transform:translate(-1px,1px)} 75%{transform:translate(1px,-1px)} }
          .glitch-overlay { position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:999; }
          .glitch-overlay::before {
            content:'';position:absolute;inset:0;background:${theme.accent}11;
            animation:glitch 3s infinite;
          }
        `}</style>
      )}
      {theme.glitch && <div className="glitch-overlay" />}

      {/* Header */}
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 12, fontSize: 13, opacity: 0.85 }}>
          <span>{t('game.errors', { count: errors })}</span>
          {hints < 99 && <span>{t('game.hintsLeft', { count: hints })}</span>}
        </div>
        <div style={{
          fontSize: timerWarning ? 18 : 16,
          fontWeight: '700',
          color: timerWarning ? '#ff3d00' : theme.primary,
          animation: timerWarning ? 'pulse 1s infinite' : 'none',
        }}>
          {timeLeft !== null ? formatTime(timeLeft) : formatTime(timeSpent)}
        </div>
        <button
          onClick={() => setPaused(p => !p)}
          style={{ background: 'none', border: `1px solid ${theme.border}`, borderRadius: 6, padding: '4px 10px', color: theme.text, cursor: 'pointer', fontSize: 12 }}
        >
          {paused ? t('game.resume') : t('game.pause')}
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 420, height: 3, background: theme.border + '44', borderRadius: 2, marginBottom: 10 }}>
        <div style={{ width: `${progress * 100}%`, height: '100%', background: theme.accent, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>

      {/* Board */}
      {paused ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, opacity: 0.6 }}>
          ⏸ {t('game.pause')}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          gridTemplateRows: 'repeat(9, 1fr)',
          width: '100%',
          maxWidth: 420,
          aspectRatio: '1',
          border: `2px solid ${theme.primary}`,
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          {board.map((row, r) =>
            row.map((val, c) => {
              const noteKey = `${r}-${c}`;
              const cellNotes = notes[noteKey];
              return (
                <div key={noteKey} style={getCellStyle(r, c)} onClick={() => handleCellClick(r, c)}>
                  {val !== 0 ? (
                    <span style={{ filter: theme.glitch && Math.random() > 0.98 ? 'blur(1px)' : 'none' }}>
                      {val}
                    </span>
                  ) : cellNotes?.size > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', width: '100%', height: '100%', padding: 1 }}>
                      {[1,2,3,4,5,6,7,8,9].map(n => (
                        <span key={n} style={{ fontSize: 7, textAlign: 'center', opacity: cellNotes.has(n) ? 0.8 : 0, color: theme.accent, lineHeight: 1.2 }}>
                          {cellNotes.has(n) ? n : ''}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Number pad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9,1fr)', gap: 4, width: '100%', maxWidth: 420, marginTop: 14 }}>
        {[1,2,3,4,5,6,7,8,9].map(n => {
          const usedCount = board.flat().filter(v => v === n).length;
          return (
            <button key={n} onClick={() => handleNumber(n)} disabled={usedCount >= 9}
              style={{
                aspectRatio: '1',
                background: usedCount >= 9 ? theme.border + '22' : theme.cell,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                color: usedCount >= 9 ? theme.border : theme.primary,
                fontSize: 'clamp(16px, 4vw, 22px)',
                fontWeight: '700',
                fontFamily: theme.font,
                cursor: usedCount >= 9 ? 'default' : 'pointer',
                opacity: usedCount >= 9 ? 0.3 : 1,
              }}>
              {n}
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginTop: 12, width: '100%', maxWidth: 420 }}>
        <button onClick={handleErase} style={btnStyle(theme)}>✕ {t('common.cancel')}</button>
        <button
          onClick={() => setNoteMode(m => !m)}
          style={{ ...btnStyle(theme), background: noteMode ? theme.accent + '33' : 'transparent', flex: 1.5 }}
        >
          ✎ {t('game.notes')}{noteMode ? ' ON' : ''}
        </button>
        {hints > 0 && (
          <button onClick={handleHint} style={btnStyle(theme)}>
            💡 {t('game.hint')} ({hints})
          </button>
        )}
        <button onClick={() => onGiveUp?.()} style={{ ...btnStyle(theme), color: theme.error }}>
          🏳 {t('game.giveUp')}
        </button>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}

function btnStyle(theme) {
  return {
    flex: 1,
    padding: '8px 4px',
    background: 'transparent',
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    color: theme.text,
    fontFamily: theme.font,
    fontSize: 12,
    cursor: 'pointer',
  };
}
