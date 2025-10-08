const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreText = document.getElementById("score");
const deathScreen = document.getElementById("death-screen");
const restartBtn = document.getElementById("restart-btn");
const finalScore = document.getElementById("final-score");

let gridSize = 20;
let tileSize;
let snake, apples, dir, score, runSpeed;
let lastDir = null;
let loop;

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
  runSpeed = 150;

  snake = [
    new Coordinate(1, 1),
    new Coordinate(2, 1),
    new Coordinate(3, 1)
  ];

  apples = Array.from({ length: 3 }, getRandomApple);

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
  snake.push(newHead);
  lastDir = dir;
}

// --- Collision check ---
function checkCollisions() {
  const head = snake[snake.length - 1];

  // wall
  if (head.x < 0 || head.y < 0 || head.x >= gridSize || head.y >= gridSize)
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
  // apples
  ctx.fillStyle = "red";
  for (const a of apples) {
    ctx.fillRect(a.x * tileSize, a.y * tileSize, tileSize, tileSize);
  }
  // snake
  ctx.fillStyle = "lime";
  for (const s of snake) {
    ctx.fillRect(s.x * tileSize, s.y * tileSize, tileSize, tileSize);
  }
}

// --- Game loop ---
function gameLoop() {
  moveSnake();

  const collision = checkCollisions();
  if (collision === "death") {
    clearInterval(loop);
    finalScore.textContent = "Final Score: " + score;
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
  }
});

restartBtn.addEventListener("click", resetGame);
window.addEventListener("resize", setupCanvas);

// --- Start game ---
resetGame();