import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";

function generateMaze(cols, rows) {
  const cells = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      r, c,
      walls: { top: true, right: true, bottom: true, left: true },
      visited: false,
    }))
  );
  function carve(r, c) {
    cells[r][c].visited = true;
    const dirs = shuffle([
      { dr: -1, dc: 0, from: "bottom", to: "top" },
      { dr: 1, dc: 0, from: "top", to: "bottom" },
      { dr: 0, dc: -1, from: "right", to: "left" },
      { dr: 0, dc: 1, from: "left", to: "right" },
    ]);
    for (const { dr, dc, from, to } of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !cells[nr][nc].visited) {
        cells[r][c].walls[to] = false;
        cells[nr][nc].walls[from] = false;
        carve(nr, nc);
      }
    }
  }
  carve(0, 0);
  return cells;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const COLS = 15;
const ROWS = 15;
const CELL = 32;

export default function App() {
  const [maze, setMaze] = useState(() => generateMaze(COLS, ROWS));
  const [pos, setPos] = useState({ r: 0, c: 0 });
  const [trail, setTrail] = useState([{ r: 0, c: 0 }]);
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (running && !won) {
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [running, won]);

  const reset = useCallback(() => {
    setMaze(generateMaze(COLS, ROWS));
    setPos({ r: 0, c: 0 });
    setTrail([{ r: 0, c: 0 }]);
    setWon(false);
    setMoves(0);
    setTime(0);
    setRunning(true);
  }, []);

  const move = useCallback((dir) => {
    if (won) return;
    setPos(prev => {
      const cell = maze[prev.r][prev.c];
      let nr = prev.r, nc = prev.c;
      if (dir === "top" && !cell.walls.top) nr--;
      else if (dir === "bottom" && !cell.walls.bottom) nr++;
      else if (dir === "left" && !cell.walls.left) nc--;
      else if (dir === "right" && !cell.walls.right) nc++;
      else return prev;
      const next = { r: nr, c: nc };
      setMoves(m => m + 1);
      setTrail(t => [...t, next]);
      if (nr === ROWS - 1 && nc === COLS - 1) setWon(true);
      return next;
    });
  }, [maze, won]);

  useEffect(() => {
    const handler = (e) => {
      const map = { ArrowUp:"top", ArrowDown:"bottom", ArrowLeft:"left", ArrowRight:"right", w:"top", s:"bottom", a:"left", d:"right" };
      if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [move]);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  return (
    <div className="app">
      <header>
        <span className="logo">dutchki.dev</span>
        <nav>
          <span className="stat">moves <b>{moves}</b></span>
          <span className="stat">time <b>{fmt(time)}</b></span>
          <button className="btn-reset" onClick={reset}>new maze</button>
        </nav>
      </header>
      <main>
        <div className="maze-wrap">
          {won && (
            <div className="win-overlay">
              <div className="win-box">
                <div className="win-icon">◈</div>
                <h2>Solved</h2>
                <p>{moves} moves · {fmt(time)}</p>
                <button onClick={reset}>play again</button>
              </div>
            </div>
          )}
          <svg width={COLS*CELL+2} height={ROWS*CELL+2} style={{display:"block"}}>
            {trail.map((t, i) => (
              <rect key={i} x={t.c*CELL+2} y={t.r*CELL+2} width={CELL-2} height={CELL-2}
                fill={t.r===pos.r && t.c===pos.c ? "transparent" : "#ececec"} rx={3}/>
            ))}
            <rect x={(COLS-1)*CELL+6} y={(ROWS-1)*CELL+6} width={CELL-10} height={CELL-10} fill="#111" rx={3}/>
            {maze.map((row) =>
              row.map((cell) => {
                const x = cell.c*CELL+1, y = cell.r*CELL+1;
                return (
                  <g key={`${cell.r}-${cell.c}`}>
                    {cell.walls.top    && <line x1={x} y1={y} x2={x+CELL} y2={y} stroke="#222" strokeWidth={1.5}/>}
                    {cell.walls.right  && <line x1={x+CELL} y1={y} x2={x+CELL} y2={y+CELL} stroke="#222" strokeWidth={1.5}/>}
                    {cell.walls.bottom && <line x1={x} y1={y+CELL} x2={x+CELL} y2={y+CELL} stroke="#222" strokeWidth={1.5}/>}
                    {cell.walls.left   && <line x1={x} y1={y} x2={x} y2={y+CELL} stroke="#222" strokeWidth={1.5}/>}
                  </g>
                );
              })
            )}
            <circle cx={pos.c*CELL+CELL/2+1} cy={pos.r*CELL+CELL/2+1} r={9} fill="#111"/>
          </svg>
        </div>
        <div className="controls">
          <div className="ctrl-row"><button className="ctrl-btn" onClick={()=>move("top")}>↑</button></div>
          <div className="ctrl-row">
            <button className="ctrl-btn" onClick={()=>move("left")}>←</button>
            <button className="ctrl-btn" onClick={()=>move("bottom")}>↓</button>
            <button className="ctrl-btn" onClick={()=>move("right")}>→</button>
          </div>
        </div>
        <p className="hint">Arrow keys or WASD · reach the ◼ to win</p>
      </main>
    </div>
  );
}
