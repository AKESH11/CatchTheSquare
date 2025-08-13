// --- Audio Setup ---
const bgMusic = new Audio('audio/music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;

const catchSound = new Audio('audio/catch.wav');
catchSound.volume = 0.5;

const gameOverSound = new Audio('audio/gameover.wav');
gameOverSound.volume = 0.6;

const clickSound = new Audio('audio/click.wav');
clickSound.volume = 0.5;

// --- Background Canvas Setup ---
const bgCanvas = document.getElementById('backgroundCanvas');
const bgCtx = bgCanvas.getContext('2d');

function resizeBG() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeBG);
resizeBG();

// ... (The entire background animation code remains the same) ...
const starCount = 120;
const stars = [];

for (let i = 0; i < starCount; i++) {
  stars.push({
    x: Math.random() * bgCanvas.width,
    y: Math.random() * bgCanvas.height,
    size: Math.random() * 1.8 + 0.5,
    alpha: Math.random() * 0.5 + 0.3,
    flickerSpeed: Math.random() * 0.02 + 0.01,
    flickerDir: 1,
  });
}

const gridSpacing = 60;
let gridOffset = 0;
const gridSpeed = 0.9;
let bgHue = 290;
let backgroundRunning = true;

function drawBackground() {
  if (!backgroundRunning) return;

  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

  bgHue += 0.8;
  if (bgHue > 360) bgHue = 290;

  stars.forEach(star => {
    star.alpha += star.flickerSpeed * star.flickerDir;
    if (star.alpha >= 1) star.flickerDir = -1;
    else if (star.alpha <= 0.3) star.flickerDir = 1;

    bgCtx.fillStyle = `hsla(${bgHue}, 100%, 75%, ${star.alpha.toFixed(2)})`;
    bgCtx.beginPath();
    bgCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    bgCtx.fill();
  });

  bgCtx.lineWidth = 1.7;
  bgCtx.shadowColor = `hsl(${bgHue}, 100%, 80%)`;
  bgCtx.shadowBlur = 10;
  bgCtx.strokeStyle = `hsl(${bgHue}, 90%, 70%)`;

  for (let x = gridOffset; x < bgCanvas.width; x += gridSpacing) {
    bgCtx.beginPath();
    bgCtx.moveTo(x, 0);
    bgCtx.lineTo(x, bgCanvas.height);
    bgCtx.stroke();
  }
  for (let y = gridOffset; y < bgCanvas.height; y += gridSpacing) {
    bgCtx.beginPath();
    bgCtx.moveTo(0, y);
    bgCtx.lineTo(bgCanvas.width, y);
    bgCtx.stroke();
  }

  bgCtx.shadowBlur = 0;

  gridOffset -= gridSpeed;
  if (gridOffset <= 0) gridOffset = gridSpacing;
}


// --- Game Canvas Setup ---
const gameCanvas = document.getElementById('game');
const ctx = gameCanvas.getContext('2d');
// NEW: Selectors for mobile buttons
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

// Paddle Object
const paddle = {
  width: 90, // Will be set dynamically
  height: 28, // Will be set dynamically
  x: 0,
  y: 0,
  speed: 0,
  maxSpeed: 9, // Will be set dynamically
  acceleration: 0.8,
  deceleration: 0.92,
  movingLeft: false,
  movingRight: false,
  bounceScale: 1,
  bounceVelocity: 0,
};

// Square Class
class Square {
    constructor(x, speed) {
      this.x = x;
      this.y = -50; // Start off-screen
      this.size = gameCanvas.width * 0.08; // CHANGED: Slightly larger for better visibility
      this.rotation = 0;
      this.rotationSpeed = (Math.random() * 0.12) - 0.06;
      this.glowPulse = 0;
      this.glowDirection = 1;
      this.speed = speed;
    }
  
    update() {
      this.y += this.speed;
      this.rotation += this.rotationSpeed;
      this.glowPulse += 0.06 * this.glowDirection;
      if (this.glowPulse > 1) this.glowDirection = -1;
      else if (this.glowPulse < 0) this.glowDirection = 1;
    }
  
    draw() {
      ctx.save();
      ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
      ctx.rotate(this.rotation);
      const glowAlpha = 0.65 + 0.35 * this.glowPulse;
      ctx.shadowColor = `rgba(255, 100, 255, ${glowAlpha.toFixed(2)})`;
      ctx.shadowBlur = 22;
      ctx.fillStyle = '#ff44cc';
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      ctx.restore();
    }
  }

// Game variables
let squares = [];
let score = 0;
let missed = 0;
const maxMissed = 1;
let currentMilestone = 0;
let squareSpeed = 4; // Will be set dynamically

// Timer variables
let startTime = null;
let elapsedTime = 0;

// --- Input Handling ---
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') paddle.movingLeft = true;
  else if (e.key === 'ArrowRight') paddle.movingRight = true;
  else if (e.key === 'Enter' && gameOverContainer.style.display === 'block') {
    restartGame();
  }
});

document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') paddle.movingLeft = false;
  else if (e.key === 'ArrowRight') paddle.movingRight = false;
});

// NEW: Mobile Input Handling
function handleControlStart(e, direction) {
  e.preventDefault(); // Prevents screen scrolling on touch
  if (direction === 'left') {
    paddle.movingLeft = true;
  } else if (direction === 'right') {
    paddle.movingRight = true;
  }
}

function handleControlEnd(e, direction) {
  e.preventDefault();
  paddle.movingLeft = false;
  paddle.movingRight = false;
}

// Listen for both touch and mouse events for robustness
leftBtn.addEventListener('touchstart', (e) => handleControlStart(e, 'left'), { passive: false });
leftBtn.addEventListener('touchend', (e) => handleControlEnd(e, 'left'));
leftBtn.addEventListener('mousedown', (e) => handleControlStart(e, 'left'));
leftBtn.addEventListener('mouseup', (e) => handleControlEnd(e, 'left'));
leftBtn.addEventListener('mouseleave', (e) => handleControlEnd(e, 'left')); // Handle mouse leaving button

rightBtn.addEventListener('touchstart', (e) => handleControlStart(e, 'right'), { passive: false });
rightBtn.addEventListener('touchend', (e) => handleControlEnd(e, 'right'));
rightBtn.addEventListener('mousedown', (e) => handleControlStart(e, 'right'));
rightBtn.addEventListener('mouseup', (e) => handleControlEnd(e, 'right'));
rightBtn.addEventListener('mouseleave', (e) => handleControlEnd(e, 'right'));


// --- Paddle Movement ---
function movePaddle() {
  if (paddle.movingLeft && !paddle.movingRight) {
    paddle.speed -= paddle.acceleration;
  } else if (paddle.movingRight && !paddle.movingLeft) {
    paddle.speed += paddle.acceleration;
  } else {
    paddle.speed *= paddle.deceleration;
    if (Math.abs(paddle.speed) < 0.2) paddle.speed = 0;
  }

  paddle.speed = Math.max(-paddle.maxSpeed, Math.min(paddle.speed, paddle.maxSpeed));
  paddle.x += paddle.speed;

  // Prevent paddle from going off-screen
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > gameCanvas.width) {
    paddle.x = gameCanvas.width - paddle.width;
  }
}

// --- Paddle Drawing ---
function drawPaddle() {
  ctx.save();
  ctx.translate(paddle.x + paddle.width / 2, paddle.y + paddle.height / 2);
  ctx.scale(paddle.bounceScale, 1);
  ctx.fillStyle = '#ff44cc';
  ctx.shadowColor = 'rgba(255, 68, 204, 0.8)';
  ctx.shadowBlur = 18;
  ctx.fillRect(-paddle.width / 2, -paddle.height / 2, paddle.width, paddle.height);
  ctx.restore();
}

// --- Squares Management ---
function createSquare() {
  const x = Math.random() * (gameCanvas.width - gameCanvas.width * 0.08); // Use new responsive size
  squares.push(new Square(x, squareSpeed));
}

function updateSquares() {
  for (let i = squares.length - 1; i >= 0; i--) {
    const square = squares[i];
    square.update();

    const hit =
      square.y + square.size > paddle.y &&
      square.x + square.size > paddle.x &&
      square.x < paddle.x + paddle.width &&
      square.y < paddle.y + paddle.height;

    if (hit) {
      catchSound.currentTime = 0;
      catchSound.play();
      squares.splice(i, 1);
      score += 5;

      if (score > 0 && score % 50 === 0) {
        squareSpeed *= 1.2;
        currentMilestone++;
      }
      paddle.bounceVelocity = 0.18;
    } else if (square.y > gameCanvas.height) {
      missed++;
      squares.splice(i, 1);
      if (missed >= maxMissed) endGame();
    }
  }
}

function drawSquares() {
  squares.forEach(square => square.draw());
}

// --- Format time helper ---
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// --- Game Loop ---
const gameOverContainer = document.getElementById('gameOverContainer');
const finalScoreText = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');

let animationId;
let spawnTimeout;

function animate(timestamp) {
  if (!startTime) startTime = timestamp;
  elapsedTime = (timestamp - startTime) / 1000;

  drawBackground();
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

  movePaddle();

  if (paddle.bounceVelocity > 0) {
    paddle.bounceScale = 1 + paddle.bounceVelocity;
    paddle.bounceVelocity -= 0.012;
  } else {
    paddle.bounceScale = 1;
  }

  drawPaddle();
  updateSquares();
  drawSquares();

  // Draw UI Text
  const fontSize = gameCanvas.width / 25;
  ctx.fillStyle = '#ff44cc';
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.shadowColor = '#cc33cc';
  ctx.shadowBlur = 6;
  ctx.textAlign = 'right';
  ctx.fillText(`Score: ${score}`, gameCanvas.width - 12, fontSize + 5);

  ctx.textAlign = 'left';
  ctx.fillText(`Time: ${formatTime(elapsedTime)}`, 12, fontSize + 5);

  const level = Math.floor(score / 50) + 1;
  const levelFontSize = gameCanvas.width / 18;
  ctx.fillStyle = '#3399ff';
  ctx.font = `bold ${levelFontSize}px Consolas, monospace`;
  ctx.textAlign = 'center';
  ctx.shadowColor = '#3366cc';
  ctx.shadowBlur = 8;
  ctx.fillText(`Level: ${level}`, gameCanvas.width / 2, levelFontSize + 10);

  animationId = requestAnimationFrame(animate);
}

function spawnSquares() {
  createSquare();
  // Speed up spawn rate as level increases
  const baseInterval = 1500;
  const spawnInterval = Math.max(400, baseInterval - (currentMilestone * 150));
  spawnTimeout = setTimeout(spawnSquares, spawnInterval);
}

// --- Game Control Functions ---
function stopGame() {
  clearTimeout(spawnTimeout);
  cancelAnimationFrame(animationId);
  backgroundRunning = false;
  bgMusic.pause();
  bgMusic.currentTime = 0;
}

function endGame() {
  stopGame();
  gameOverSound.play();
  finalScoreText.textContent = score;
  gameOverContainer.style.display = 'block';
}

// CHANGED: restartGame now handles all resizing and setup
function restartGame() {
  clickSound.currentTime = 0;
  clickSound.play();
  bgMusic.play().catch(() => {});

  // --- Responsive Setup ---
  // Match canvas internal resolution to its display size
  const rect = gameCanvas.getBoundingClientRect();
  gameCanvas.width = rect.width;
  gameCanvas.height = rect.height;

  // --- Reset Game State ---
  score = 0;
  missed = 0;
  currentMilestone = 0;
  squares = [];
  
  // Make game values responsive
  paddle.width = gameCanvas.width * 0.22;
  paddle.height = 20;
  paddle.maxSpeed = gameCanvas.width / 50;
  squareSpeed = gameCanvas.height / 200;

  paddle.x = gameCanvas.width / 2 - paddle.width / 2;
  paddle.y = gameCanvas.height - paddle.height * 2.5; // Position near bottom
  paddle.speed = 0;
  paddle.movingLeft = false;
  paddle.movingRight = false;
  paddle.bounceVelocity = 0;
  paddle.bounceScale = 1;

  window.blur(); // Unfocus to prevent sticky keys

  startTime = null;
  elapsedTime = 0;

  gameOverContainer.style.display = 'none';
  backgroundRunning = true;
  cancelAnimationFrame(animationId);
  clearTimeout(spawnTimeout);

  spawnSquares();
  animate();
}

// --- Event Listeners ---
restartBtn.addEventListener('click', restartGame);
// NEW: Add resize listener to restart game (most stable way to handle resize)
window.addEventListener('resize', restartGame);

// --- Start Game ---
// Initial game start is now handled by restartGame to ensure proper sizing
restartGame();
