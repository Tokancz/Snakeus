const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreText = document.getElementById("score");
const deathScreen = document.getElementById("death-screen");
const restartBtn = document.getElementById("restart-btn");
const finalScore = document.getElementById("final-score");
const bestScoreText = document.getElementById("best-score");
const speedRange = document.getElementById("speed-range");
const speedValue = document.getElementById("speed-value");
const appleRange = document.getElementById("apple-range");
const appleValue = document.getElementById("apple-value");
const warpCheckbox = document.getElementById("checkbox-warp");
const gradientCheckbox = document.getElementById("checkbox-gradient");

let gridSize = 20;
let tileSize;
let snake, apples, dir, score;
let runSpeed = parseInt(speedRange.value);
let lastDir = null;
let loop;
let bestScore = 0;

// --- Direction enum ---
const direction = {
  Up: "Up",
  Down: "Down",
  Left: "Left",
  Right: "Right"
};

// --- Coordinate class ---
class Coordinate {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  equals(other) {
    return this.x === other.x && this.y === other.y;
  }
}

// Load best score from localStorage
if (localStorage.getItem("bestScore")) {
  bestScore = parseInt(localStorage.getItem("bestScore"));
  bestScoreText.textContent = "Best: " + bestScore;
} else {
  bestScoreText.textContent = "Best: 0";
}

// --- Resize and initialize ---
function setupCanvas() {
  const size = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.7);
  canvas.width = size;
  canvas.height = size;
  tileSize = size / gridSize;
}

// --- Initialize / restart game ---
function resetGame() {
  setupCanvas();
  score = 0;
  dir = direction.Right;
  lastDir = dir;

  snake = [
    new Coordinate(1, 1),
    new Coordinate(2, 1),
    new Coordinate(3, 1)
  ];

  apples = Array.from({ length: parseInt(appleRange.value) }, getRandomApple);

  deathScreen.classList.add("hidden");
  scoreText.textContent = "Score: 0";

  if (loop) clearInterval(loop);
  loop = setInterval(gameLoop, runSpeed);
}

function getRandomApple() {
  let newApple;
  do {
    newApple = new Coordinate(
      Math.floor(Math.random() * gridSize),
      Math.floor(Math.random() * gridSize)
    );
  } while (snake.some(segment => segment.equals(newApple)));
  return newApple;
}

function blendColors(c1, c2, t) {
  const parseHex = c => {
    const hex = c.replace("#", "");
    if (hex.length === 8) { // RGBA
      return [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16),
        parseInt(hex.substring(6, 8), 16) / 255
      ];
    } else if (hex.length === 6) { // RGB
      return [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16),
        1
      ];
    }
    return [0, 255, 0, 1];
  };

  const [r1, g1, b1, a1] = parseHex(c1);
  const [r2, g2, b2, a2] = parseHex(c2);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  const a = a1 + (a2 - a1) * t;

  return `rgba(${r},${g},${b},${a})`;
}

// --- Movement ---
function moveSnake() {
  const head = snake[snake.length - 1];
  let newHead;

  switch (dir) {
    case direction.Up: newHead = new Coordinate(head.x, head.y - 1); break;
    case direction.Down: newHead = new Coordinate(head.x, head.y + 1); break;
    case direction.Left: newHead = new Coordinate(head.x - 1, head.y); break;
    case direction.Right: newHead = new Coordinate(head.x + 1, head.y); break;
  }

  // --- Warp Walls behavior ---
  if (warpCheckbox.checked) {
    if (newHead.x < 0) newHead.x = gridSize - 1;
    else if (newHead.x >= gridSize) newHead.x = 0;
    if (newHead.y < 0) newHead.y = gridSize - 1;
    else if (newHead.y >= gridSize) newHead.y = 0;
  }

  snake.push(newHead);
  lastDir = dir;
}

// --- Collision check ---
function checkCollisions() {
  const head = snake[snake.length - 1];
  
  // wall
  if (!warpCheckbox.checked && (head.x < 0 || head.y < 0 || head.x >= gridSize || head.y >= gridSize))
    return "death";

  // self collision
  for (let i = 0; i < snake.length - 1; i++) {
    if (snake[i].equals(head)) return "death";
  }

  // apple
  for (let i = 0; i < apples.length; i++) {
    if (apples[i].equals(head)) {
      apples.splice(i, 1);
      apples.push(getRandomApple());
      score++;
      scoreText.textContent = "Score: " + score;
      return "apple";
    }
  }

  return "none";
}

// --- Draw everything ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // --- Draw apples ---
  ctx.fillStyle = "red";
  for (const a of apples) {
    ctx.fillRect(a.x * tileSize, a.y * tileSize, tileSize, tileSize);
  }

  // --- Draw snake with gradient ---
  for (let i = 0; i < snake.length; i++) {
    const s = snake[i];
    
    if (gradientCheckbox.checked) {
      // --- Gradient enabled ---
      const t = i / (snake.length - 1);
      const headColor = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#00ff00";
      const tailColor = "#3fff3f00";
      ctx.fillStyle = blendColors(tailColor, headColor, t);
    } else {
      // --- Gradient disabled: solid color ---
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#00ff00";
    }

    ctx.fillRect(s.x * tileSize, s.y * tileSize, tileSize, tileSize);
  }
}


// --- Game loop ---
function gameLoop() {
  moveSnake();
  console.log("Speed:", runSpeed);

  const collision = checkCollisions();
  if (collision === "death") {
    clearInterval(loop);

    // Update best score if needed
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem("bestScore", bestScore);
    }

    finalScore.textContent = "Final Score: " + score;
    bestScoreText.textContent = "Best: " + bestScore;
    deathScreen.classList.remove("hidden");
    return;
  } else if (collision === "apple") {
    // don't remove tail -> grow
  } else {
    snake.shift();
  }
  draw();
}

// --- Controls ---
document.addEventListener("keydown", e => {
  if (e.key === "w" || e.key === "ArrowUp") {
    if (lastDir !== direction.Down) dir = direction.Up;
  } else if (e.key === "s" || e.key === "ArrowDown") {
    if (lastDir !== direction.Up) dir = direction.Down;
  } else if (e.key === "a" || e.key === "ArrowLeft") {
    if (lastDir !== direction.Right) dir = direction.Left;
  } else if (e.key === "d" || e.key === "ArrowRight") {
    if (lastDir !== direction.Left) dir = direction.Right;
  } else if (e.key === " " || e.key === "Enter") {
    resetGame();
  }
});

speedRange.addEventListener("input", () => {
  runSpeed = parseInt(speedRange.value);
  speedValue.textContent = "Speed: " + runSpeed + " ms";
});
appleRange.addEventListener("input", () => {
  appleValue.textContent = "Apples: " + appleRange.value;
});


restartBtn.addEventListener("click", resetGame);
window.addEventListener("resize", setupCanvas);

// --- Start game ---
resetGame();