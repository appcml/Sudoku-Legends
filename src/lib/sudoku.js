// ─── Sudoku Engine ─────────────────────────────────────────────────────────
// Pure JS: generate, solve, validate puzzles for all 7 difficulty levels

export const LEVELS = {
  // hints = pistas gratuitas al inicio de cada partida.
  // Al agotarse, el usuario puede ver un anuncio para ganar +2 pistas más (máx 3 anuncios/sesión).
  beginner:    { id: 'beginner',    clues: [46, 50], hints: 5,  timer: null,  mult: 1.0,  label: '🌱', name: { es: 'Principiante', en: 'Beginner',    pt: 'Iniciante'   } },
  easy:        { id: 'easy',        clues: [40, 45], hints: 4,  timer: 1800,  mult: 1.5,  label: '⭐', name: { es: 'Fácil',        en: 'Easy',        pt: 'Fácil'       } },
  intermediate:{ id: 'intermediate',clues: [32, 39], hints: 3,  timer: 1200,  mult: 2.0,  label: '🔥', name: { es: 'Intermedio',   en: 'Intermediate',pt: 'Intermediário'} },
  hard:        { id: 'hard',        clues: [26, 31], hints: 3,  timer: 900,   mult: 3.0,  label: '💀', name: { es: 'Duro',         en: 'Hard',        pt: 'Difícil'     } },
  expert:      { id: 'expert',      clues: [22, 25], hints: 3,  timer: 600,   mult: 4.0,  label: '🐉', name: { es: 'Experto',      en: 'Expert',      pt: 'Especialista'} },
  nightmare:   { id: 'nightmare',   clues: [17, 21], hints: 3,  timer: 480,   mult: 6.0,  label: '😱', name: { es: 'Pesadilla',    en: 'Nightmare',   pt: 'Pesadelo'    } },
  hell:        { id: 'hell',        clues: [9,  16], hints: 3,  timer: 300,   mult: 10.0, label: '😈', name: { es: 'Infierno',     en: 'Hell',        pt: 'Inferno'     } },
};

export const LEVEL_ORDER = ['beginner','easy','intermediate','hard','expert','nightmare','hell'];

// ─── Core solver ───────────────────────────────────────────────────────────
function isValid(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      if (board[r][c] === num) return false;
  return true;
}

function solve(board, limit = 2) {
  let count = 0;
  function bt() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          const nums = shuffle([1,2,3,4,5,6,7,8,9]);
          for (const n of nums) {
            if (isValid(board, r, c, n)) {
              board[r][c] = n;
              if (bt()) { if (count >= limit) return true; }
              board[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    count++;
    return count >= limit;
  }
  bt();
  return count;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateFull() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  solve(board, 1);
  return board;
}

export function generatePuzzle(levelId) {
  const level = LEVELS[levelId];
  const [minClues, maxClues] = level.clues;
  const targetClues = Math.floor(Math.random() * (maxClues - minClues + 1)) + minClues;

  const solution = generateFull();
  const puzzle = solution.map(r => [...r]);

  // Remove cells while keeping unique solution (for hell: may have 2 solutions)
  const cells = shuffle([...Array(81).keys()]);
  let removed = 0;
  const toRemove = 81 - targetClues;

  for (const idx of cells) {
    if (removed >= toRemove) break;
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;

    const test = puzzle.map(row => [...row]);
    const solutions = countSolutions(test);

    // Hell level allows 2 solutions, others require unique
    const maxSol = levelId === 'hell' ? 2 : 1;
    if (solutions > maxSol) {
      puzzle[r][c] = backup;
    } else {
      removed++;
    }
  }

  return {
    puzzle: puzzle.map(r => [...r]),
    solution,
    levelId,
    clueCount: targetClues,
    id: Date.now() + Math.random().toString(36).slice(2),
  };
}

function countSolutions(board, limit = 2) {
  let count = 0;
  function bt() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          for (let n = 1; n <= 9; n++) {
            if (isValid(board, r, c, n)) {
              board[r][c] = n;
              bt();
              board[r][c] = 0;
              if (count >= limit) return;
            }
          }
          return;
        }
      }
    }
    count++;
  }
  bt();
  return count;
}

// ─── Scoring ────────────────────────────────────────────────────────────────
export function calculateScore({ levelId, timeSpent, timerLimit, errors, hints }) {
  const level = LEVELS[levelId];
  const base = 100 * level.mult;

  // Time bonus: faster = more points
  let timeBonus = 0;
  if (timerLimit) {
    const ratio = Math.max(0, 1 - timeSpent / timerLimit);
    timeBonus = Math.floor(base * ratio * 5);
  }

  // Penalties
  const errorPenalty = errors * 10;
  const hintPenalty = hints * 20;

  // Perfect game multiplier
  const perfect = errors === 0 && hints === 0 ? 2 : 1;

  const total = Math.max(0, Math.floor((base + timeBonus - errorPenalty - hintPenalty) * perfect));
  return { base: Math.floor(base), timeBonus, errorPenalty, hintPenalty, perfect, total };
}

// ─── Validation ─────────────────────────────────────────────────────────────
export function validateCell(board, solution, row, col) {
  if (board[row][col] === 0) return 'empty';
  if (board[row][col] === solution[row][col]) return 'correct';
  return 'wrong';
}

export function isBoardComplete(board, solution) {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c] !== solution[r][c]) return false;
  return true;
}
