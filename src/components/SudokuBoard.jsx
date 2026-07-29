import { useState, useEffect, useCallback, useRef } from 'react';
import { generatePuzzle, isBoardComplete, calculateScore, LEVELS } from '../lib/sudoku';
import { THEMES } from '../lib/themes';
import { useTranslation } from 'react-i18next';
import { showRewardedAd, canWatchAd } from '../lib/adsService';

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function SudokuBoard({ levelId = 'beginner', onComplete, onGiveUp, onHome, onBack }) {
  const { t } = useTranslation();
  const theme = THEMES[levelId];
  const level = LEVELS[levelId];

  const [gameData, setGameData]       = useState(null);
  const [board, setBoard]             = useState(null);
  const [selected, setSelected]       = useState(null);
  const [noteMode, setNoteMode]       = useState(false);
  const [notes, setNotes]             = useState({});
  const [errors, setErrors]           = useState(0);
  const [hints, setHints]             = useState(level.hints);
  const [timeSpent, setTimeSpent]     = useState(0);
  const [paused, setPaused]           = useState(false);
  const [completed, setCompleted]     = useState(false);
  const [wrongCells, setWrongCells]   = useState(new Set());
  const [flashCells, setFlashCells]   = useState(new Set());
  const [adHintState, setAdHintState] = useState('idle');
  const [cellSize, setCellSize]       = useState(38);
  const timerRef = useRef(null);

  // Tamaño de celda dinámico — usa casi todo el ancho disponible
  useEffect(() => {
    const update = () => {
      // Padding lateral 8px cada lado = 16px total
      const available = Math.min(window.innerWidth - 16, 500);
      setCellSize(Math.floor(available / 9));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const data = generatePuzzle(levelId);
    setGameData(data);
    setBoard(data.puzzle.map(r => [...r]));
    setSelected(null); setErrors(0); setHints(level.hints);
    setTimeSpent(0); setNotes({}); setWrongCells(new Set());
    setCompleted(false); setAdHintState('idle'); setPaused(false);
  }, [levelId]);

  useEffect(() => {
    if (!gameData || paused || completed) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeSpent(prev => {
        if (level.timer && prev + 1 >= level.timer) {
          clearInterval(timerRef.current);
          onGiveUp?.({ reason: 'timeout', timeSpent: prev + 1 });
          return prev + 1;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameData, paused, completed]);

  const timeLeft    = level.timer ? Math.max(0, level.timer - timeSpent) : null;
  const timerWarning = timeLeft !== null && timeLeft < 60;

  const handleNumber = useCallback((num) => {
    if (!selected || !gameData || completed || paused) return;
    const [r, c] = selected;
    if (gameData.puzzle[r][c] !== 0) return;
    if (noteMode) {
      const key = `${r}-${c}`;
      setNotes(prev => {
        const cell = new Set(prev[key] || []);
        cell.has(num) ? cell.delete(num) : cell.add(num);
        return { ...prev, [key]: cell };
      });
      return;
    }
    const nb = board.map(row => [...row]);
    nb[r][c] = num;
    setBoard(nb);
    if (num !== gameData.solution[r][c]) {
      setErrors(e => e + 1);
      const key = `${r}-${c}`;
      setWrongCells(prev => new Set([...prev, key]));
      setTimeout(() => setWrongCells(prev => { const s = new Set(prev); s.delete(key); return s; }), 1000);
    } else {
      const matches = new Set();
      for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) if (nb[i][j] === num) matches.add(`${i}-${j}`);
      setFlashCells(matches);
      setTimeout(() => setFlashCells(new Set()), 600);
      if (isBoardComplete(nb, gameData.solution)) {
        setCompleted(true);
        clearInterval(timerRef.current);
        const score = calculateScore({ levelId, timeSpent, timerLimit: level.timer, errors, hints: level.hints - hints });
        setTimeout(() => onComplete?.({ score, timeSpent, errors, levelId }), 600);
      }
    }
  }, [selected, gameData, board, noteMode, errors, hints, completed, paused]);

  const handleHint = () => {
    if (!selected || hints <= 0 || !gameData || paused) return;
    const [r, c] = selected;
    if (gameData.puzzle[r][c] !== 0 || board[r][c] === gameData.solution[r][c]) return;
    const nb = board.map(row => [...row]);
    nb[r][c] = gameData.solution[r][c];
    setBoard(nb);
    setHints(h => h - 1);
  };

  const handleAdHint = async () => {
    setAdHintState('loading');
    const rewarded = await showRewardedAd({ testMode: !import.meta.env.PROD });
    if (rewarded) { setHints(h => h + 2); setAdHintState('idle'); }
    else { setAdHintState('incomplete'); setTimeout(() => setAdHintState('idle'), 3000); }
  };

  const handleErase = () => {
    if (!selected || !gameData || paused) return;
    const [r, c] = selected;
    if (gameData.puzzle[r][c] !== 0) return;
    const nb = board.map(row => [...row]);
    nb[r][c] = 0;
    setBoard(nb);
    setNotes(prev => { const n = { ...prev }; delete n[`${r}-${c}`]; return n; });
  };

  useEffect(() => {
    const h = (e) => {
      if (e.key >= '1' && e.key <= '9') handleNumber(parseInt(e.key));
      if (e.key === 'Backspace' || e.key === 'Delete') handleErase();
      if (!selected) return;
      const [r, c] = selected;
      if (e.key === 'ArrowUp')    setSelected([Math.max(0,r-1),c]);
      if (e.key === 'ArrowDown')  setSelected([Math.min(8,r+1),c]);
      if (e.key === 'ArrowLeft')  setSelected([r,Math.max(0,c-1)]);
      if (e.key === 'ArrowRight') setSelected([r,Math.min(8,c+1)]);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleNumber, selected]);

  if (!board || !gameData) return (
    <div style={{ minHeight:'100dvh', background:theme.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:theme.font, color:theme.text, fontSize:18 }}>
      🔢 Generando puzzle...
    </div>
  );

  const getCellBg = (r, c) => {
    const isGiven   = gameData.puzzle[r][c] !== 0;
    const isSel     = selected?.[0]===r && selected?.[1]===c;
    const isWrong   = wrongCells.has(`${r}-${c}`);
    const isFlash   = flashCells.has(`${r}-${c}`);
    const [sR, sC]  = selected || [];
    const isHL      = sR!==undefined && (r===sR || c===sC || (Math.floor(r/3)===Math.floor(sR/3) && Math.floor(c/3)===Math.floor(sC/3)));
    const isSameNum = selected && board[sR]?.[sC]!==0 && board[r][c]===board[sR]?.[sC];
    if (isWrong)  return '#ff000033';
    if (isFlash)  return theme.accent + '99';
    if (isSel)    return theme.selected;
    if (isSameNum)return theme.accent + '44';
    if (isHL)     return theme.highlight;
    return isGiven ? theme.cellGiven : theme.cell;
  };

  const progress       = board.flat().filter(v => v !== 0).length / 81;
  const showAdHintBtn  = hints === 0 && canWatchAd();
  const boardPx        = cellSize * 9;
  const numBtnH        = Math.max(38, cellSize * 0.88);
  const fontSize       = Math.max(15, cellSize * 0.46);

  return (
    <div style={{
      minHeight: '100dvh',
      background: theme.bg,
      fontFamily: theme.font,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '6px 8px 10px',
      color: theme.text,
      boxSizing: 'border-box',
    }}>
      {theme.glitch && (
        <style>{`
          @keyframes glitch{0%,100%{clip-path:inset(0 0 98% 0)}20%{clip-path:inset(40% 0 50% 0)}40%{clip-path:inset(60% 0 10% 0)}60%{clip-path:inset(80% 0 5% 0)}80%{clip-path:inset(10% 0 70% 0)}}
          @keyframes shake{0%,100%{transform:translate(0)}25%{transform:translate(-1px,1px)}75%{transform:translate(1px,-1px)}}
          .go{position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:999;}
          .go::before{content:'';position:absolute;inset:0;background:${theme.accent}11;animation:glitch 3s infinite;}
        `}</style>
      )}
      {theme.glitch && <div className="go" />}

      {/* ── Top bar ── */}
      <div style={{ width:'100%', maxWidth: boardPx, display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>

        {/* ‹ Atrás — vuelve a selección de nivel */}
        <button
          onClick={() => onBack?.() || onGiveUp?.()}
          style={{
            background: 'none',
            border: `1.5px solid ${theme.border}`,
            borderRadius: 8,
            color: theme.text,
            fontSize: 20,
            padding: '3px 10px',
            cursor: 'pointer',
            lineHeight: 1.3,
            flexShrink: 0,
          }}
        >‹</button>

        {/* 🏠 Home */}
        <button
          onClick={onHome}
          style={{
            background: 'none',
            border: `1.5px solid ${theme.border}`,
            borderRadius: 8,
            color: theme.text,
            fontSize: 16,
            padding: '3px 8px',
            cursor: 'pointer',
            lineHeight: 1.4,
            flexShrink: 0,
          }}
        >🏠</button>

        {/* Stats */}
        <div style={{ flex:1, display:'flex', gap:10, fontSize:13 }}>
          <span>❌ {errors}</span>
          <span>💡 {hints}</span>
        </div>

        {/* Timer */}
        <div style={{
          fontSize: timerWarning ? 17 : 15,
          fontWeight: '700',
          color: timerWarning ? '#ff3d00' : theme.primary,
          animation: timerWarning ? 'pulse 1s infinite' : 'none',
          flexShrink: 0,
        }}>
          {timeLeft !== null ? formatTime(timeLeft) : formatTime(timeSpent)}
        </div>

        {/* Pausa */}
        <button
          onClick={() => setPaused(p => !p)}
          style={{
            background: paused ? theme.accent + '33' : 'none',
            border: `1.5px solid ${theme.border}`,
            borderRadius: 8,
            padding: '3px 8px',
            color: theme.text,
            cursor: 'pointer',
            fontSize: 14,
            flexShrink: 0,
          }}
        >{paused ? '▶' : '⏸'}</button>
      </div>

      {/* Progress bar */}
      <div style={{ width:'100%', maxWidth: boardPx, height: 3, background: theme.border+'44', borderRadius: 2, marginBottom: 6 }}>
        <div style={{ width:`${progress*100}%`, height:'100%', background: theme.accent, borderRadius: 2, transition:'width 0.3s' }} />
      </div>

      {/* ── Tablero ── */}
      {paused ? (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
          <div style={{ fontSize:52 }}>⏸</div>
          <div style={{ color:theme.text, fontSize:18, opacity:0.7 }}>Juego pausado</div>
          <button onClick={() => setPaused(false)} style={{ padding:'12px 32px', background:theme.primary, border:'none', borderRadius:12, color:theme.dark?'#000':'#fff', fontSize:16, fontWeight:'700', fontFamily:theme.font, cursor:'pointer' }}>
            ▶ Continuar
          </button>
        </div>
      ) : (
        <div style={{
          width: boardPx,
          height: boardPx,
          display: 'grid',
          gridTemplateColumns: `repeat(9, ${cellSize}px)`,
          gridTemplateRows: `repeat(9, ${cellSize}px)`,
          border: `2.5px solid ${theme.primary}`,
          borderRadius: 8,
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {board.map((row, r) => row.map((val, c) => {
            const key = `${r}-${c}`;
            const isGiven = gameData.puzzle[r][c] !== 0;
            const isWrong = wrongCells.has(key);
            const cellNotes = notes[key];
            return (
              <div
                key={key}
                onClick={() => !completed && setSelected([r, c])}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: getCellBg(r, c),
                  color: isWrong ? theme.error : (isGiven ? theme.given : theme.text),
                  fontWeight: isGiven ? '700' : '500',
                  fontFamily: theme.font,
                  fontSize,
                  cursor: isGiven ? 'default' : 'pointer',
                  transition: 'background 0.12s',
                  borderRight:  (c+1)%3===0 && c<8 ? `2px solid ${theme.primary}` : `1px solid ${theme.border}`,
                  borderBottom: (r+1)%3===0 && r<8 ? `2px solid ${theme.primary}` : `1px solid ${theme.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  userSelect: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  boxSizing: 'border-box',
                }}
              >
                {val !== 0 ? val
                  : cellNotes?.size > 0 ? (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', width:'100%', height:'100%', padding:1 }}>
                      {[1,2,3,4,5,6,7,8,9].map(n => (
                        <span key={n} style={{ fontSize: Math.max(6, cellSize*0.22), textAlign:'center', color:theme.accent, lineHeight:1.1, opacity: cellNotes.has(n)?0.85:0 }}>{n}</span>
                      ))}
                    </div>
                  ) : null}
              </div>
            );
          }))}
        </div>
      )}

      {/* Aviso anuncio incompleto */}
      {adHintState === 'incomplete' && (
        <div style={{ width:'100%', maxWidth:boardPx, marginTop:5, padding:'6px 10px', background:'#ff3d0022', border:'1px solid #ff3d00', borderRadius:8, textAlign:'center', color:'#ff3d00', fontSize:11 }}>
          ⚠️ Debes ver el anuncio completo para ganar las pistas
        </div>
      )}

      {/* ── Teclado numérico ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(9,1fr)', gap:3, width:'100%', maxWidth:boardPx, marginTop:8 }}>
        {[1,2,3,4,5,6,7,8,9].map(n => {
          const used = board.flat().filter(v => v === n).length;
          return (
            <button key={n} onClick={() => handleNumber(n)} disabled={used >= 9} style={{
              height: numBtnH,
              background: used>=9 ? theme.border+'22' : theme.cell,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              color: used>=9 ? theme.border : theme.primary,
              fontSize: Math.max(17, cellSize * 0.42),
              fontWeight: '700',
              fontFamily: theme.font,
              cursor: used>=9 ? 'default' : 'pointer',
              opacity: used>=9 ? 0.25 : 1,
            }}>{n}</button>
          );
        })}
      </div>

      {/* ── Controles ── */}
      <div style={{ display:'flex', gap:6, marginTop:7, width:'100%', maxWidth:boardPx }}>
        <CtrlBtn theme={theme} onClick={handleErase}>✕ Borrar</CtrlBtn>
        <CtrlBtn theme={theme} onClick={() => setNoteMode(m => !m)} active={noteMode}>
          ✎ Notas{noteMode ? ' ON' : ''}
        </CtrlBtn>
        {hints > 0 && (
          <CtrlBtn theme={theme} onClick={handleHint}>💡 Pista ({hints})</CtrlBtn>
        )}
        {showAdHintBtn && (
          <button onClick={handleAdHint} disabled={adHintState==='loading'} style={{
            flex: 1, padding: '8px 2px',
            background: adHintState==='loading' ? theme.border+'44' : 'linear-gradient(135deg,#ffd700,#ff8f00)',
            border: 'none', borderRadius: 8,
            color: adHintState==='loading' ? theme.text : '#0d1b2a',
            fontFamily: theme.font, fontSize: 11, fontWeight: '700',
            cursor: adHintState==='loading' ? 'not-allowed' : 'pointer',
          }}>{adHintState==='loading' ? '⏳' : '📺 +2 💡'}</button>
        )}
        <CtrlBtn theme={theme} onClick={() => onGiveUp?.()} danger>🏳 Salir</CtrlBtn>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}

function CtrlBtn({ theme, onClick, children, active, danger }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '8px 2px',
      background: active ? theme.accent+'33' : 'transparent',
      border: `1px solid ${theme.border}`,
      borderRadius: 8,
      color: danger ? theme.error : theme.text,
      fontFamily: theme.font,
      fontSize: 11,
      cursor: 'pointer',
    }}>{children}</button>
  );
}
