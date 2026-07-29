import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import LevelSelect from './pages/LevelSelect';
import SudokuBoard from './components/SudokuBoard';
import GameComplete from './pages/GameComplete';
import { getLeaderboard, updateUserProfile, auth } from './lib/firebase';
import './i18n';
import { GOOGLE_FONTS_URL } from './lib/themes';

// ─── PANTALLAS ───────────────────────────────────────────────────────────────
// home | level-select | game | complete | ranking | tournament | settings

const NAV = [
  { id: 'ranking',    icon: '🏆', label: 'Ranking'  },
  { id: 'tournament', icon: '⚔️', label: 'Torneo'   },
  { id: 'settings',   icon: '⚙️', label: 'Ajustes'  },
];

export default function App() {
  const { user, profile, isLoading } = useAuth();
  const [screen, setScreen]   = useState('home');
  const [levelId, setLevelId] = useState('beginner');
  const [gameResult, setResult] = useState(null);

  if (isLoading) return (
    <div style={{ minHeight:'100dvh', background:'#0d1b2a', display:'flex', alignItems:'center', justifyContent:'center', color:'#ffd700', fontFamily:'sans-serif', fontSize:18 }}>
      🔢 Cargando...
    </div>
  );

  if (!user) return <AuthPage />;

  const handleLevelSelect  = (id) => { setLevelId(id); setScreen('game'); };
  const handleGameComplete = (result) => { setResult({ ...result, levelId }); setScreen('complete'); };
  const handleGiveUp       = () => setScreen('level-select');
  const handleAdWatched    = (pts) => console.log('[AdMob] +', pts, 'pts');
  const goHome             = () => setScreen('home');

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={GOOGLE_FONTS_URL} rel="stylesheet" />

      {screen === 'home'         && <HomeScreen profile={profile} onPlay={() => setScreen('level-select')} onNav={setScreen} />}
      {screen === 'level-select' && <LevelSelect profile={profile} onSelect={handleLevelSelect} />}
      {screen === 'game'         && <SudokuBoard levelId={levelId} onComplete={handleGameComplete} onGiveUp={handleGiveUp} onHome={goHome} />}
      {screen === 'complete' && gameResult && (
        <GameComplete result={gameResult} onNewGame={() => setScreen('game')} onHome={goHome} onWatchAd={handleAdWatched} />
      )}
      {screen === 'ranking'    && <RankingScreen    user={user} profile={profile} onBack={goHome} />}
      {screen === 'tournament' && <TournamentScreen user={user} profile={profile} onBack={goHome} onPlay={handleLevelSelect} />}
      {screen === 'settings'   && <SettingsScreen   user={user} profile={profile} onBack={goHome} />}
    </>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomeScreen({ profile, onPlay, onNav }) {
  return (
    <div style={{
      height:'100dvh', background:'linear-gradient(160deg,#0d1b2a 0%,#1b263b 60%,#0d1b2a 100%)',
      display:'flex', flexDirection:'column', fontFamily:"'Fredoka One', cursive", overflow:'hidden',
    }}>
      {/* Perfil */}
      <div style={{ padding:'12px 16px 0' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, background:'#1b263b', border:'1px solid #37474f', borderRadius:14, padding:'10px 14px' }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#ffd700,#ff8f00)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:'700', color:'#0d1b2a', flexShrink:0 }}>
            {(profile?.displayName||'P')[0].toUpperCase()}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ color:'#eceff1', fontSize:15 }}>{profile?.displayName||'Player'}</div>
            <div style={{ color:'#90a4ae', fontSize:11 }}>⭐ {(profile?.totalPoints||0).toLocaleString()} pts · 🔥 {profile?.currentStreak||0} días</div>
          </div>
          <span style={{ color:'#546e7a' }}>›</span>
        </div>
      </div>

      {/* Logo + Jugar */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <div style={{ fontSize:72, filter:'drop-shadow(0 0 24px #ffd70066)' }}>🔢</div>
        <div style={{ textAlign:'center' }}>
          <h1 style={{ color:'#ffd700', fontSize:42, margin:0, letterSpacing:3 }}>SUDOKU</h1>
          <p style={{ color:'#546e7a', margin:'2px 0 0', fontSize:13, letterSpacing:4 }}>LEGENDS</p>
        </div>
        <button onClick={onPlay} style={{
          marginTop:8, padding:'16px 56px',
          background:'linear-gradient(135deg,#ffd700,#ff8f00)',
          border:'none', borderRadius:18, color:'#0d1b2a', fontSize:22, fontWeight:'700',
          fontFamily:"'Fredoka One', cursive", cursor:'pointer',
          boxShadow:'0 4px 24px #ffd70055', letterSpacing:1,
        }}>▶ JUGAR</button>
      </div>

      {/* Nav */}
      <div style={{ padding:'12px 16px 24px' }}>
        <div style={{ display:'flex', gap:10 }}>
          {NAV.map(({ id, icon, label }) => (
            <button key={id} onClick={() => onNav(id)} style={{
              flex:1, padding:'12px 4px', background:'#1b263b', border:'1px solid #37474f',
              borderRadius:12, color:'#90a4ae', fontSize:11,
              fontFamily:"'Fredoka One', cursive", cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:4,
            }}>
              <span style={{ fontSize:22 }}>{icon}</span>{label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RANKING ──────────────────────────────────────────────────────────────────
function RankingScreen({ user, profile, onBack }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard('global', 50)
      .then(data => { setPlayers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const medals = ['🥇','🥈','🥉'];
  const myIdx  = players.findIndex(p => p.uid === user?.uid);

  return (
    <div style={{ height:'100dvh', background:'#0d1b2a', display:'flex', flexDirection:'column', fontFamily:"'Fredoka One', cursive" }}>
      <div style={{ padding:'14px 16px 0', display:'flex', alignItems:'center', gap:12 }}>
        <BackBtn onBack={onBack} />
        <h2 style={{ color:'#ffd700', fontSize:22, margin:0 }}>🏆 Ranking Global</h2>
      </div>

      {myIdx >= 0 && (
        <div style={{ margin:'12px 16px 0', padding:'10px 14px', background:'#ffd70022', border:'1px solid #ffd70055', borderRadius:12, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20 }}>#{myIdx+1}</span>
          <div style={{ flex:1 }}>
            <div style={{ color:'#ffd700', fontSize:14 }}>{profile?.displayName||'Tú'}</div>
            <div style={{ color:'#90a4ae', fontSize:11 }}>⭐ {(players[myIdx]?.totalPoints||0).toLocaleString()} pts</div>
          </div>
          <span style={{ color:'#ffd700', fontSize:12 }}>Tu posición</span>
        </div>
      )}

      <div style={{ flex:1, overflowY:'auto', padding:'10px 16px 20px' }}>
        {loading ? (
          <div style={{ textAlign:'center', color:'#546e7a', paddingTop:40 }}>Cargando...</div>
        ) : players.length === 0 ? (
          <div style={{ textAlign:'center', color:'#546e7a', paddingTop:40 }}>
            <div style={{ fontSize:40 }}>🏆</div>
            <p>¡Sé el primero en el ranking!</p>
            <p style={{ fontSize:12 }}>Juega partidas para aparecer aquí.</p>
          </div>
        ) : players.map((p, i) => (
          <div key={p.id} style={{
            display:'flex', alignItems:'center', gap:10, padding:'10px 12px', marginBottom:6,
            background: p.uid===user?.uid ? '#ffd70015' : '#1b263b',
            border:`1px solid ${p.uid===user?.uid ? '#ffd70044' : '#37474f'}`, borderRadius:10,
          }}>
            <span style={{ fontSize:i<3?22:14, minWidth:28, textAlign:'center', color:i<3?'inherit':'#546e7a' }}>{i<3?medals[i]:`${i+1}`}</span>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#ffd700,#ff8f00)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:'700', color:'#0d1b2a', flexShrink:0 }}>
              {(p.displayName||'P')[0].toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ color:'#eceff1', fontSize:13 }}>{p.displayName||'Player'}{p.uid===user?.uid?' (Tú)':''}</div>
              <div style={{ color:'#546e7a', fontSize:11 }}>🎮 {p.gamesWon||0} victorias</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ color:'#ffd700', fontSize:14, fontWeight:'700' }}>{(p.totalPoints||0).toLocaleString()}</div>
              <div style={{ color:'#546e7a', fontSize:10 }}>pts</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TORNEO SEMANAL ───────────────────────────────────────────────────────────
const CHALLENGES = [
  { id: 'c1', level: 'beginner',    name: '🌱 Calentamiento',  pts: 100,  desc: 'Completa un puzzle fácil para abrir el torneo',        unlocked: true  },
  { id: 'c2', level: 'easy',        name: '⭐ Primer Desafío', pts: 250,  desc: 'Termina sin usar más de 2 pistas',                    unlocked: false },
  { id: 'c3', level: 'intermediate',name: '🔥 A Medias',       pts: 500,  desc: 'Completa sin errores — ¡cada celda cuenta!',          unlocked: false },
  { id: 'c4', level: 'hard',        name: '💀 Bajo Presión',   pts: 1000, desc: 'Contrarreloj: termina antes de que se acabe el tiempo',unlocked: false },
  { id: 'c5', level: 'expert',      name: '🐉 Final de Torneo',pts: 2000, desc: 'El reto definitivo — solo los mejores llegan aquí',    unlocked: false },
];

function TournamentScreen({ user, profile, onBack, onPlay }) {
  const now        = new Date();
  const endOfWeek  = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - now.getDay() || 7));
  endOfWeek.setHours(23, 59, 59, 0);
  const msLeft     = Math.max(0, endOfWeek - now);
  const daysLeft   = Math.floor(msLeft / 86400000);
  const hoursLeft  = Math.floor((msLeft % 86400000) / 3600000);

  // Persistir progreso en localStorage
  const storageKey = `tournament_${getWeekKey()}`;
  const [completed, setCompleted] = useState(() =>
    JSON.parse(localStorage.getItem(storageKey) || '[]')
  );

  const markDone = (id) => {
    const next = [...new Set([...completed, id])];
    setCompleted(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const earnedPts = CHALLENGES.filter(c => completed.includes(c.id)).reduce((s, c) => s + c.pts, 0);
  const totalPts  = CHALLENGES.reduce((s, c) => s + c.pts, 0);
  const allDone   = completed.length === CHALLENGES.length;

  return (
    <div style={{ height:'100dvh', background:'#0d1b2a', display:'flex', flexDirection:'column', fontFamily:"'Fredoka One', cursive" }}>
      <div style={{ padding:'14px 16px 0', display:'flex', alignItems:'center', gap:12 }}>
        <BackBtn onBack={onBack} />
        <h2 style={{ color:'#ffd700', fontSize:22, margin:0 }}>⚔️ Torneo Semanal</h2>
      </div>

      {/* Timer + puntos */}
      <div style={{ margin:'12px 16px 0', padding:'14px', background:'linear-gradient(135deg,#1b263b,#263545)', border:'1px solid #37474f', borderRadius:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div>
            <div style={{ color:'#90a4ae', fontSize:12 }}>Tiempo restante</div>
            <div style={{ color:'#eceff1', fontSize:22, fontWeight:'700' }}>{daysLeft}d {hoursLeft}h</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ color:'#90a4ae', fontSize:12 }}>Tus puntos del torneo</div>
            <div style={{ color:'#4caf50', fontSize:22, fontWeight:'700' }}>{earnedPts.toLocaleString()} / {totalPts.toLocaleString()}</div>
          </div>
        </div>
        <div style={{ height:6, background:'#37474f', borderRadius:3 }}>
          <div style={{ height:'100%', width:`${(earnedPts/totalPts)*100}%`, background:'linear-gradient(90deg,#ffd700,#4caf50)', borderRadius:3, transition:'width 0.5s' }} />
        </div>
        <div style={{ color:'#546e7a', fontSize:11, marginTop:4, textAlign:'center' }}>
          {allDone ? '🏆 ¡Torneo completado! Eres una leyenda esta semana.' : 'Completa todos los desafíos para ganar el trofeo'}
        </div>
      </div>

      {/* Desafíos */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px 20px' }}>
        {CHALLENGES.map((ch, i) => {
          const done      = completed.includes(ch.id);
          const prevDone  = i === 0 || completed.includes(CHALLENGES[i-1].id);
          const isOpen    = prevDone && !done;

          return (
            <div key={ch.id}>
              {i > 0 && (
                <div style={{ width:2, height:14, background: prevDone?'#ffd70066':'#37474f', margin:'0 auto' }} />
              )}
              <div style={{
                display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
                background: done?'#4caf5015' : isOpen?'#1b263b':'#0d1b2a',
                border:`1.5px solid ${done?'#4caf50':isOpen?'#ffd70055':'#1b263b'}`,
                borderRadius:12, opacity: prevDone?1:0.45,
              }}>
                <span style={{ fontSize:28, flexShrink:0 }}>{done?'✅':!prevDone?'🔒':ch.name.slice(0,2)}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:done?'#4caf50':isOpen?'#ffd700':'#90a4ae', fontSize:14, fontWeight:'700' }}>{ch.name.slice(2).trim()}</div>
                  <div style={{ color:'#546e7a', fontSize:11, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ch.desc}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ color:'#ffd700', fontSize:13 }}>+{ch.pts} pts</div>
                  {done
                    ? <div style={{ color:'#4caf50', fontSize:11 }}>¡Completo!</div>
                    : isOpen
                      ? <button onClick={() => { onPlay(ch.level); markDone(ch.id); }} style={{
                          marginTop:4, padding:'5px 12px',
                          background:'linear-gradient(135deg,#ffd700,#ff8f00)',
                          border:'none', borderRadius:8,
                          color:'#0d1b2a', fontSize:11, fontWeight:'700',
                          cursor:'pointer', fontFamily:"'Fredoka One', cursive",
                        }}>JUGAR</button>
                      : null
                  }
                </div>
              </div>
            </div>
          );
        })}

        {/* Premio */}
        <div style={{ width:2, height:14, background: allDone?'#ffd700':'#37474f', margin:'0 auto' }} />
        <div style={{
          padding:'16px', textAlign:'center',
          background: allDone?'linear-gradient(135deg,#ffd70022,#ff8f0022)':'#1b263b',
          border:`1.5px solid ${allDone?'#ffd700':'#37474f'}`, borderRadius:14,
        }}>
          <div style={{ fontSize:36 }}>{allDone?'🏆':'🎁'}</div>
          <div style={{ color:'#ffd700', fontSize:15, marginTop:6 }}>Premio de la semana</div>
          <div style={{ color:'#90a4ae', fontSize:12, marginTop:4 }}>
            {allDone
              ? '¡Has ganado el título 👑 Leyenda de la Semana!'
              : 'Completa los 5 desafíos y gana el título especial'
            }
          </div>
        </div>
      </div>
    </div>
  );
}

function getWeekKey() {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}_w${week}`;
}

// ─── AJUSTES ──────────────────────────────────────────────────────────────────
function SettingsScreen({ user, profile, onBack }) {
  const [name,  setName]  = useState(profile?.displayName || '');
  const [lang,  setLang]  = useState(profile?.lang || 'es');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      if (user?.uid) await updateUserProfile(user.uid, { displayName: name, lang });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => auth.signOut();

  return (
    <div style={{ height:'100dvh', background:'#0d1b2a', display:'flex', flexDirection:'column', fontFamily:"'Fredoka One', cursive" }}>
      <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <BackBtn onBack={onBack} />
        <h2 style={{ color:'#ffd700', fontSize:22, margin:0 }}>⚙️ Ajustes</h2>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'0 16px 24px' }}>
        <Sec title="👤 Perfil">
          <label style={{ color:'#90a4ae', fontSize:12, display:'block', marginBottom:6 }}>Nombre de jugador</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" style={{
            width:'100%', padding:'10px 12px', boxSizing:'border-box',
            background:'#1b263b', border:'1px solid #37474f', borderRadius:10,
            color:'#eceff1', fontSize:14, fontFamily:"'Fredoka One', cursive", outline:'none',
          }} />
          <button onClick={handleSave} style={{
            marginTop:10, width:'100%', padding:'11px',
            background: saved?'#4caf50':'linear-gradient(135deg,#ffd700,#ff8f00)',
            border:'none', borderRadius:10, color:'#0d1b2a', fontSize:14, fontWeight:'700',
            fontFamily:"'Fredoka One', cursive", cursor:'pointer',
          }}>{saved?'✅ Guardado':'Guardar cambios'}</button>
        </Sec>

        <Sec title="🌐 Idioma">
          {[{id:'es',label:'🇪🇸 Español'},{id:'en',label:'🇺🇸 English'},{id:'pt',label:'🇧🇷 Português'}].map(l => (
            <button key={l.id} onClick={() => setLang(l.id)} style={{
              width:'100%', padding:'10px 14px', marginBottom:6,
              background: lang===l.id?'#ffd70022':'#1b263b',
              border:`1.5px solid ${lang===l.id?'#ffd700':'#37474f'}`,
              borderRadius:10, color: lang===l.id?'#ffd700':'#90a4ae',
              fontSize:14, fontFamily:"'Fredoka One', cursive", cursor:'pointer', textAlign:'left',
            }}>{l.label}</button>
          ))}
        </Sec>

        <Sec title="📊 Mis estadísticas">
          <div style={{ background:'#1b263b', borderRadius:10, padding:'12px 14px' }}>
            {[
              ['⭐ Puntos totales',  (profile?.totalPoints||0).toLocaleString()],
              ['🎮 Partidas jugadas', profile?.gamesPlayed||0],
              ['🏆 Victorias',        profile?.gamesWon||0],
              ['🔥 Racha actual',    `${profile?.currentStreak||0} días`],
            ].map(([label, val]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #263545' }}>
                <span style={{ color:'#90a4ae', fontSize:13 }}>{label}</span>
                <span style={{ color:'#eceff1', fontSize:13, fontWeight:'700' }}>{val}</span>
              </div>
            ))}
          </div>
        </Sec>

        <Sec title="🔐 Cuenta">
          <div style={{ padding:'10px 14px', background:'#1b263b', borderRadius:10, marginBottom:8 }}>
            <div style={{ color:'#90a4ae', fontSize:12 }}>Sesión activa</div>
            <div style={{ color:'#eceff1', fontSize:13 }}>{user?.email || (user?.isAnonymous?'Anónimo':'—')}</div>
          </div>
          <button onClick={handleLogout} style={{ width:'100%', padding:'11px', background:'#ef535022', border:'1px solid #ef5350', borderRadius:10, color:'#ef5350', fontSize:14, fontFamily:"'Fredoka One', cursive", cursor:'pointer' }}>
            🚪 Cerrar sesión
          </button>
        </Sec>

        <Sec title="ℹ️ Acerca de">
          {[['Versión','1.0.0'],['App ID','com.appcml.sudokulegends'],['Desarrollador','AppCML']].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #1b263b' }}>
              <span style={{ color:'#546e7a', fontSize:13 }}>{k}</span>
              <span style={{ color:'#90a4ae', fontSize:13 }}>{v}</span>
            </div>
          ))}
        </Sec>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function BackBtn({ onBack }) {
  return (
    <button onClick={onBack} style={{ background:'none', border:'1px solid #37474f', borderRadius:8, color:'#eceff1', fontSize:22, padding:'2px 12px', cursor:'pointer', lineHeight:1.4, fontFamily:"'Fredoka One', cursive" }}>‹</button>
  );
}
function Sec({ title, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ color:'#546e7a', fontSize:11, letterSpacing:1, marginBottom:8, textTransform:'uppercase' }}>{title}</div>
      {children}
    </div>
  );
}
