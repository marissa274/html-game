const game = document.getElementById("game");
const playerEl = document.getElementById("player");
const starEl = document.getElementById("star");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const restartBtn = document.getElementById("restart");

// Base sizes (match CSS)
const SIZE = 360;
const PLAYER_SIZE = 26;
const STAR_BASE = 22;

// Level settings
let level = 1;
let target = 5;        // stars to collect to pass level
let speed = 4;         // movement speed
let starSize = STAR_BASE;
let timeLeft = 30;

let px = 20, py = 20;
let sx = 200, sy = 200;
let score = 0;         // total score
let levelScore = 0;    // score inside current level
let running = true;

const keys = new Set();

function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh){
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function applyLevelSettings(){
  // Make each level a bit harder
  target = 5 + (level - 1) * 3;      // 5, 8, 11, 14...
  speed = 4 + (level - 1) * 0.6;     // faster
  starSize = Math.max(10, STAR_BASE - (level - 1) * 2); // smaller, min 10
  timeLeft = Math.max(10, 30 - (level - 1) * 3);        // less time, min 10

  // Update HUD: show level + goal
  scoreEl.textContent = `${score}  (Lvl ${level}: ${levelScore}/${target})`;
  timeEl.textContent = timeLeft;

  // Update star size visually
  starEl.style.width = starSize + "px";
  starEl.style.height = starSize + "px";
}

function placeStar(){
  sx = Math.floor(Math.random() * (SIZE - starSize));
  sy = Math.floor(Math.random() * (SIZE - starSize));
  starEl.style.left = sx + "px";
  starEl.style.top  = sy + "px";
}

function renderPlayer(){
  playerEl.style.left = px + "px";
  playerEl.style.top  = py + "px";
}

function nextLevel(){
  level++;
  levelScore = 0;
  px = 20; py = 20;
  renderPlayer();
  applyLevelSettings();
  placeStar();

  // Small message
  setTimeout(() => {
    alert(`✅ Level ${level - 1} complete! Welcome to Level ${level} 🎉`);
  }, 50);
}

function resetGame(){
  level = 1;
  score = 0;
  levelScore = 0;
  px = 20; py = 20;
  running = true;
  renderPlayer();

  applyLevelSettings();
  placeStar();
}

function tick(){
  if (!running) return;

  // Movement
  let dx = 0, dy = 0;
  if (keys.has("ArrowLeft") || keys.has("a")) dx -= speed;
  if (keys.has("ArrowRight") || keys.has("d")) dx += speed;
  if (keys.has("ArrowUp") || keys.has("w")) dy -= speed;
  if (keys.has("ArrowDown") || keys.has("s")) dy += speed;

  px = clamp(px + dx, 0, SIZE - PLAYER_SIZE);
  py = clamp(py + dy, 0, SIZE - PLAYER_SIZE);
  renderPlayer();

  // Collision with star
  if (rectsOverlap(px, py, PLAYER_SIZE, PLAYER_SIZE, sx, sy, starSize, starSize)){
    score++;
    levelScore++;
    scoreEl.textContent = `${score}  (Lvl ${level}: ${levelScore}/${target})`;
    placeStar();

    // Pass level
    if (levelScore >= target){
      nextLevel();
    }
  }

  requestAnimationFrame(tick);
}

document.addEventListener("keydown", (e) => keys.add(e.key));
document.addEventListener("keyup", (e) => keys.delete(e.key));

let timer = setInterval(() => {
  if (!running) return;

  timeLeft--;
  timeEl.textContent = timeLeft;

  if (timeLeft <= 0){
    running = false;
    alert(`⏰ Time's up! Final score: ${score} (Reached Level ${level})`);
  }
}, 1000);

restartBtn.addEventListener("click", resetGame);

resetGame();
requestAnimationFrame(tick);
