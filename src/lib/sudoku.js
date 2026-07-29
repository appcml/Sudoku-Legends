// ─── Sudoku Engine ─────────────────────────────────────────────────────────
// Pure JS: generate, solve, validate puzzles for all 7 difficulty levels

export const LEVELS = {
  // hints = pistas gratuitas al inicio. Al agotarse el usuario puede ver
  // un anuncio para ganar +2 pistas más (máx 3 anuncios/sesión).
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
    const r = 3 * Math.floor(row / 3) + Math.floor(i / 3);
    const c = 3 * Math.floor(col / 3) + (i % 3);
    if (board[r][c] === num) return false;
  }
  return true;
}

function solve(board, maxSolutions = 1) {
  let solutions = 0;
  function bt() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          for (let n = 1; n <= 9; n++) {
            if (isValid(board, r, c, n)) {
              board[r][c] = n;
              bt();
              if (solutions >= maxSolutions) return;
              board[r][c] = 0;
            }
          }
          return;
        }
      }
    }
    solutions++;
  }
  bt();
  return solutions;
}

function generateFull() {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  const nums = [1,2,3,4,5,6,7,8,9];
  function fill(pos) {
    if (pos === 81) return true;
    const r = Math.floor(pos / 9), c = pos % 9;
    const shuffled = [...nums].sort(() => Math.random() - 0.5);
    for (const n of shuffled) {
      if (isValid(board, r, c, n)) {
        board[r][c] = n;
        if (fill(pos + 1)) return true;
        board[r][c] = 0;
      }
    }
    return false;
  }
  fill(0);
  return board;
}

export function generatePuzzle(levelId) {
  const level = LEVELS[levelId];
  const solution = generateFull();
  const puzzle = solution.map(r => [...r]);
  const cells = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5);
  const [minClues, maxClues] = level.clues;
  const targetClues = minClues + Math.floor(Math.random() * (maxClues - minClues + 1));
  let filled = 81;
  for (const idx of cells) {
    if (filled <= targetClues) break;
    const r = Math.floor(idx / 9), c = idx % 9;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    const copy = puzzle.map(row => [...row]);
    const maxSol = levelId === 'hell' ? 2 : 1;
    if (solve(copy, maxSol + 1) > maxSol) {
      puzzle[r][c] = backup;
    } else {
      filled--;
    }
  }
  return { puzzle, solution };
}

export function isBoardComplete(board, solution) {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c] !== solution[r][c]) return false;
  return true;
}

export function calculateScore({ levelId, timeSpent, timerLimit, errors, hints }) {
  const level = LEVELS[levelId];
  const base = 100 * level.mult;
  let timeBonus = 0;
  if (timerLimit) {
    const ratio = Math.max(0, 1 - timeSpent / timerLimit);
    timeBonus = Math.round(ratio * 200 * level.mult);
  }
  const errorPenalty = errors * 10;
  const hintPenalty  = hints  * 20;
  const perfect      = errors === 0 && hints === 0 ? 2 : 1;
  const total        = Math.max(0, Math.round((base + timeBonus - errorPenalty - hintPenalty) * perfect));
  return { base, timeBonus, errorPenalty, hintPenalty, perfect, total };
}
