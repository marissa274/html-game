const game = document.getElementById("game");
const playerEl = document.getElementById("player");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const restartBtn = document.getElementById("restart");

const SIZE = 360;
const PLAYER_SIZE = 26;

let level, score, levelScore, target, speed, starSize, timeLeft, running, lives;
let px, py;

const keys = new Set();
let stars = [];
let enemies = [];
let timerId = null;

function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
function randInt(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh){
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function removeAllDynamic(){
  document.querySelectorAll(".star, .enemy").forEach(el => el.remove());
  stars = [];
  enemies = [];
}

function makeStar(){
  const el = document.createElement("div");
  el.className = "star";
  el.style.width = starSize + "px";
  el.style.height = starSize + "px";
  game.appendChild(el);

  const s = {
    el,
    x: randInt(0, SIZE - starSize),
    y: randInt(0, SIZE - starSize),
    w: starSize,
    h: starSize
  };
  el.style.left = s.x + "px";
  el.style.top  = s.y + "px";
  stars.push(s);
}

function makeEnemy(){
  const el = document.createElement("div");
  el.className = "enemy";
  game.appendChild(el);

  const size = 22;
  const e = {
    el,
    x: randInt(0, SIZE - size),
    y: randInt(0, SIZE - size),
    w: size,
    h: size,
    vx: (Math.random() < 0.5 ? -1 : 1) * (1.2 + level * 0.25),
    vy: (Math.random() < 0.5 ? -1 : 1) * (1.0 + level * 0.22),
  };
  el.style.left = e.x + "px";
  el.style.top  = e.y + "px";
  enemies.push(e);
}

function applyLevelSettings(){
  // HARD scaling
  target   = 5 + (level - 1) * 4;              // need more stars
  speed    = 4 + (level - 1) * 0.35;           // slightly faster
  starSize = Math.max(10, 22 - (level - 1) * 2); // smaller stars
  timeLeft = Math.max(8, 28 - (level - 1) * 3);  // less time (fast)

  const starCount   = Math.min(1 + Math.floor(level / 2), 5); // up to 5 stars
  const enemyCount  = Math.min(Math.floor(level / 2), 6);     // up to 6 enemies

  // Update HUD
  scoreEl.textContent = `Score: ${score} | Level: ${level} (${levelScore}/${target}) | ❤️ ${lives}`;
  timeEl.textContent = timeLeft;

  // Create level objects
  removeAllDynamic();
  for (let i = 0; i < starCount; i++) makeStar();
  for (let i = 0; i < enemyCount; i++) makeEnemy();
}

function renderPlayer(){
  playerEl.style.left = px + "px";
  playerEl.style.top  = py + "px";
}

function loseLife(){
  lives--;
  scoreEl.textContent = `Score: ${score} | Level: ${level} (${levelScore}/${target}) | ❤️ ${lives}`;

  // knockback reset
  px = 20; py = 20;
  renderPlayer();

  if (lives <= 0){
    running = false;
    clearInterval(timerId);
    alert(`💀 Game Over! Score: ${score} | Reached Level ${level}`);
  }
}

function nextLevel(){
  level++;
  levelScore = 0;
  px = 20; py = 20;
  renderPlayer();
  applyLevelSettings();
  setTimeout(() => alert(`✅ Level up! Welcome to Level ${level} 😈`), 50);
}

function resetGame(){
  level = 1;
  score = 0;
  levelScore = 0;
  lives = 3;
  px = 20; py = 20;
  running = true;
  renderPlayer();

  applyLevelSettings();

  if (timerId) clearInterval(timerId);
  timerId = setInterval(() => {
    if (!running) return;
    timeLeft--;
    timeEl.textContent = timeLeft;

    if (timeLeft <= 0){
      // level fail = lose life + restart level timer
      loseLife();
      if (running){
        timeLeft = Math.max(8, 28 - (level - 1) * 3);
        timeEl.textContent = timeLeft;
      }
    }
  }, 1000);
}

function tick(){
  if (!running) return;

  // movement
  let dx = 0, dy = 0;
  if (keys.has("ArrowLeft") || keys.has("a")) dx -= speed;
  if (keys.has("ArrowRight") || keys.has("d")) dx += speed;
  if (keys.has("ArrowUp") || keys.has("w")) dy -= speed;
  if (keys.has("ArrowDown") || keys.has("s")) dy += speed;

  px = clamp(px + dx, 0, SIZE - PLAYER_SIZE);
  py = clamp(py + dy, 0, SIZE - PLAYER_SIZE);
  renderPlayer();

  // move enemies
  for (const e of enemies){
    e.x += e.vx;
    e.y += e.vy;

    if (e.x <= 0 || e.x >= SIZE - e.w) e.vx *= -1;
    if (e.y <= 0 || e.y >= SIZE - e.h) e.vy *= -1;

    e.x = clamp(e.x, 0, SIZE - e.w);
    e.y = clamp(e.y, 0, SIZE - e.h);

    e.el.style.left = e.x + "px";
    e.el.style.top  = e.y + "px";

    // collision with player
    if (rectsOverlap(px, py, PLAYER_SIZE, PLAYER_SIZE, e.x, e.y, e.w, e.h)){
      loseLife();
      break;
    }
  }

  // collect stars
  for (let i = stars.length - 1; i >= 0; i--){
    const s = stars[i];
    if (rectsOverlap(px, py, PLAYER_SIZE, PLAYER_SIZE, s.x, s.y, s.w, s.h)){
      score++;
      levelScore++;
      scoreEl.textContent = `Score: ${score} | Level: ${level} (${levelScore}/${target}) | ❤️ ${lives}`;

      // respawn that star elsewhere
      s.x = randInt(0, SIZE - s.w);
      s.y = randInt(0, SIZE - s.h);
      s.el.style.left = s.x + "px";
      s.el.style.top  = s.y + "px";

      if (levelScore >= target){
        nextLevel();
      }
    }
  }

  requestAnimationFrame(tick);
}

document.addEventListener("keydown", (e) => keys.add(e.key));
document.addEventListener("keyup", (e) => keys.delete(e.key));
restartBtn.addEventListener("click", resetGame);

// Add enemy style in JS if you didn't in CSS (safe fallback)
(function ensureEnemyCSS(){
  const style = document.createElement("style");
  style.textContent = `
    .enemy{
      width:22px;height:22px;
      position:absolute;
      border-radius:6px;
      background:#ff4d4d;
      box-shadow: 0 0 14px rgba(255,77,77,.55);
    }
  `;
  document.head.appendChild(style);
})();

resetGame();
requestAnimationFrame(tick);
