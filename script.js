// DOM Elements
const game = document.querySelector("#game");
const level = document.querySelector("#level");
const robot = document.querySelector("#robot");
const healthBar = document.querySelector("#health");
const scoreboard = document.createElement("div");
scoreboard.id = "scoreboard";
game.appendChild(scoreboard);

const coins = Array.from(document.querySelectorAll(".coin"));
const enemies = Array.from(document.querySelectorAll(".enemy"));
const platforms = Array.from(document.querySelectorAll(".platform"));
const powerUps = Array.from(document.querySelectorAll(".power-up"));
const goalpost = document.querySelector("#goalpost");
const congratulationsScreen = document.querySelector("#congratulations-screen");
const mainMenu = document.querySelector("#main-menu");
const startBtn = document.querySelector("#start-btn");
const backToMainMenuBtn = congratulationsScreen.querySelector("#back-to-main-menu"); // Added Back to Main Menu Button
const leftBtn = document.querySelector("#left-btn");
const rightBtn = document.querySelector("#right-btn");
const jumpBtn = document.querySelector("#jump-btn");
const flyBtn = document.querySelector("#fly-btn");

// Game State Variables
let robotX = 50;
let robotY = 300;
let velocityY = 0;
let jumpCount = 0;
let isJumping = false; // Prevent continuous jumping
let score = 0;
let cameraOffsetX = 0;
let isGameOver = false;
let health = 100; // Initialize health at 100
let isPaused = true; // Start in the paused state
let isFlying = false; // Flying mode toggle
let lastDamageTime = 0; // Cooldown for damage
const damageCooldown = 1000; // 1 second cooldown

// Enemy Movement Data
const enemyData = enemies.map((enemy) => ({
  element: enemy,
  startX: parseInt(enemy.style.left),
  currentX: parseInt(enemy.style.left),
  speed: 2,
  direction: 1,
  range: 100,
}));

// Keyboard Input
const keys = {};
window.addEventListener("keydown", (e) => {
  if (!isGameOver) keys[e.key] = true;

  // Toggle flying mode
  if (e.key === "f" || e.key === "F") {
    isFlying = !isFlying; // Toggle flying mode
    velocityY = 0; // Reset vertical velocity
  }
});
window.addEventListener("keyup", (e) => {
  if (!isGameOver) keys[e.key] = false;
});

// Button Input Handling
function setupButtonListeners(button, direction) {
  button.addEventListener("mousedown", () => (keys[direction] = true));
  button.addEventListener("mouseup", () => (keys[direction] = false));
}
setupButtonListeners(leftBtn, "ArrowLeft");
setupButtonListeners(rightBtn, "ArrowRight");

// Jump Button
jumpBtn.addEventListener("mousedown", () => {
  if (!isFlying && jumpCount < 2 && !isJumping) {
    velocityY = -12;
    jumpCount++;
    isJumping = true; // Set jumping flag to prevent continuous jumping
  }
});
jumpBtn.addEventListener("mouseup", () => {
  isJumping = false; // Reset jumping flag
});

// Fly Button
flyBtn.addEventListener("mousedown", () => {
  isFlying = !isFlying;
  velocityY = 0; // Reset vertical velocity
  flyBtn.style.backgroundColor = isFlying ? "#ff4444" : "#4caf50"; // Toggle color
});

// Game Loop
function gameLoop() {
  if (isPaused || isGameOver) return;

  // Flying mode
  if (isFlying) {
    if (keys["ArrowUp"]) robotY -= 5; // Move up
    if (keys["ArrowDown"]) robotY += 5; // Move down
  } else {
    // Gravity and jumping
    velocityY += 0.8; // Gravity
    robotY += velocityY;

    if (keys["ArrowUp"] && jumpCount < 2 && !isJumping) {
      velocityY = -12;
      jumpCount++;
      isJumping = true; // Set jumping flag
    }
    if (!keys["ArrowUp"]) {
      isJumping = false; // Reset jumping flag when key is released
    }

    // Platform Collision
    let onPlatform = false;
    platforms.forEach((platform) => {
      const platX = parseInt(platform.style.left);
      const platY = parseInt(platform.style.top);
      const platW = parseInt(platform.style.width);

      if (
        checkCollision(robotX, robotY, 40, 60, platX, platY, platW, 10) &&
        velocityY >= 0
      ) {
        robotY = platY - 60;
        velocityY = 0;
        onPlatform = true;
      }
    });
    if (onPlatform || robotY >= 390) jumpCount = 0;
  }

  // Horizontal Movement
  if (keys["ArrowRight"]) robotX += 5;
  if (keys["ArrowLeft"]) robotX -= 5;

  // Check Collisions
  checkEnemyCollision();
  checkPowerUpCollision();
  checkCoinCollision();
  checkGoalpostCollision();

  // Check if Robot Falls Off the Level
  if (robotY > 400) {
    endGame();
  }

  // Update Camera and Robot Position
  cameraOffsetX = Math.max(0, Math.min(robotX - 400, 8000 - 800));
  level.style.transform = `translateX(${-cameraOffsetX}px)`;
  robot.style.left = `${robotX}px`;
  robot.style.top = `${robotY}px`;

  // Enemy Movement
  moveEnemies();

  requestAnimationFrame(gameLoop);
}

// Collision Check Functions
function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
  return (
    x1 < x2 + w2 &&
    x1 + w1 > x2 &&
    y1 < y2 + h2 &&
    y1 + h1 > y2
  );
}

function checkEnemyCollision() {
  enemies.forEach((enemy) => {
    const enemyX = parseInt(enemy.style.left);
    const enemyY = parseInt(enemy.style.top);

    if (
      checkCollision(robotX, robotY, 40, 60, enemyX, enemyY, 40, 40) &&
      Date.now() - lastDamageTime > damageCooldown
    ) {
      health -= 20;
      lastDamageTime = Date.now();
      updateHealthBar();
      if (health <= 0) {
        endGame();
      }
    }
  });
}

function checkPowerUpCollision() {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i];

    // Get the bounding rectangles
    const powerUpRect = powerUp.getBoundingClientRect();
    const levelRect = level.getBoundingClientRect();

    // Align positions with the game world's coordinates
    const powerUpX = powerUpRect.left - levelRect.left;
    const powerUpY = powerUpRect.top - levelRect.top;

    if (checkCollision(robotX, robotY, 40, 60, powerUpX, powerUpY, 30, 30)) {
      health = Math.min(health + 25, 100); // Restore health
      updateHealthBar();

      // Remove the entire health container (orb + label)
      const healthContainer = powerUp.closest(".health-container");
      if (healthContainer) {
        healthContainer.remove();
      }

      // Remove the power-up from the array
      powerUps.splice(i, 1);
    }
  }
}



function checkCoinCollision() {
  coins.forEach((coin, index) => {
    const coinX = parseInt(coin.style.left);
    const coinY = parseInt(coin.style.top);

    if (checkCollision(robotX, robotY, 40, 60, coinX, coinY, 20, 20)) {
      coin.remove();
      coins.splice(index, 1);
      score += 10;
      updateScore();
    }
  });
}

function checkGoalpostCollision() {
  const goalpostX = parseInt(goalpost.style.left);
  const goalpostY = parseInt(goalpost.style.top);

  if (checkCollision(robotX, robotY, 40, 60, goalpostX, goalpostY, 40, 100)) {
    isPaused = true;
    congratulationsScreen.style.display = "block";
  }
}

// Update Functions
function updateScore() {
  scoreboard.textContent = `Score: ${score}`;
}

function updateHealthBar() {
  healthBar.style.width = `${health}%`;
  healthBar.style.backgroundColor =
    health > 50 ? "#4caf50" : health > 25 ? "#ffa500" : "#f44336"; // Green, orange, red
}

// Restart and End Game
function restartGame() {
  robotX = 50;
  robotY = 300;
  velocityY = 0;
  jumpCount = 0;
  score = 0;
  health = 100;
  isGameOver = false;
  isPaused = false;
  updateScore();
  updateHealthBar();
  congratulationsScreen.style.display = "none";
}

function endGame() {
  isGameOver = true;
  alert("Game Over!");
  restartGame();
}

// Move Enemies
function moveEnemies() {
  enemyData.forEach((enemy) => {
    enemy.currentX += enemy.speed * enemy.direction;
    if (
      enemy.currentX > enemy.startX + enemy.range ||
      enemy.currentX < enemy.startX
    ) {
      enemy.direction *= -1;
    }
    enemy.element.style.left = `${enemy.currentX}px`;
  });
}

// Start Game
startBtn.addEventListener("click", () => {
  restartGame();
  mainMenu.style.display = "none";
  isPaused = false;
  gameLoop();
});

// Back to Main Menu Button
backToMainMenuBtn.addEventListener("click", () => {
  location.reload(); // Reload the page to reset the game
});

// Initialize
updateScore();
updateHealthBar();
