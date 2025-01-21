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
const mainMenu = document.querySelector("#main-menu");
const startBtn = document.querySelector("#start-btn");
const continueBtn = document.querySelector("#continue-btn");
const exitBtn = document.querySelector("#exit-btn");

let robotX = 50;
let robotY = 300;
let velocityY = 0;
let jumpCount = 0;
let score = 0;
let cameraOffsetX = 0;
let isGameOver = false;
let health = 100; // Initialize health at 100
let isPaused = true; // Start in the paused state
let isFlying = false; // Track whether the robot is flying

// Cooldown for enemy collisions
let lastDamageTime = 0; // Tracks when the last damage occurred
const damageCooldown = 1000; // 1-second cooldown in milliseconds

// Enemy state
const enemyData = enemies.map((enemy) => ({
  element: enemy,
  startX: parseInt(enemy.style.left),
  currentX: parseInt(enemy.style.left),
  speed: 2,
  direction: 1,
  range: 100,
}));

const keys = {};
window.addEventListener("keydown", (e) => {
  if (!isGameOver) keys[e.key] = true;

  // Toggle flying mode when pressing "F"
  if (e.key === "f" || e.key === "F") {
    isFlying = !isFlying; // Toggle flying mode
    velocityY = 0; // Reset vertical velocity
  }
});

window.addEventListener("keyup", (e) => {
  if (!isGameOver) keys[e.key] = false;
});


// Select touch controls
const leftBtn = document.querySelector("#left-btn");
const rightBtn = document.querySelector("#right-btn");
const jumpBtn = document.querySelector("#jump-btn");
const flyBtn = document.querySelector("#fly-btn");

let touchKeys = {
  left: false,
  right: false,
  jump: false,
  fly: false,
};

// Event Listeners for Touch Buttons
leftBtn.addEventListener("touchstart", () => (touchKeys.left = true));
leftBtn.addEventListener("touchend", () => (touchKeys.left = false));

rightBtn.addEventListener("touchstart", () => (touchKeys.right = true));
rightBtn.addEventListener("touchend", () => (touchKeys.right = false));

jumpBtn.addEventListener("touchstart", () => {
  if (!touchKeys.jump) {
    touchKeys.jump = true;
  }
});
jumpBtn.addEventListener("touchend", () => (touchKeys.jump = false));

flyBtn.addEventListener("touchstart", () => {
  touchKeys.fly = !touchKeys.fly; // Toggle flying
  isFlying = touchKeys.fly; // Sync with the game state
});

// Update Game Logic to Incorporate Touch Controls
function gameLoop() {
  if (isPaused || isGameOver) return; // Pause the game if isPaused is true

  if (isFlying) {
    // Flying controls
    if (keys["ArrowUp"] || touchKeys.jump) robotY -= 5; // Move up
    if (keys["ArrowDown"]) robotY += 5; // Move down
  } else {
    // Gravity and jumping
    velocityY += 0.8; // Gravity
    robotY += velocityY;

    if ((keys["ArrowUp"] || touchKeys.jump) && jumpCount < 2) {
      velocityY = -12;
      jumpCount++;
      touchKeys.jump = false; // Reset jump after touch
    }

    // Platform Collision for Normal Movement
    let onPlatform = false;
    platforms.forEach((platform) => {
      const platX = parseInt(platform.style.left);
      const platY = parseInt(platform.style.top);
      const platW = parseInt(platform.style.width);
      const platH = 10;

      if (
        checkCollision(robotX, robotY, 40, 60, platX, platY, platW, platH) &&
        velocityY >= 0
      ) {
        robotY = platY - 60;
        velocityY = 0;
        onPlatform = true;
      }
    });

    if (onPlatform || robotY >= 390) {
      jumpCount = 0; // Reset jump count
    }
  }

  // Horizontal Movement
  if (keys["ArrowRight"] || touchKeys.right) robotX += 5;
  if (keys["ArrowLeft"] || touchKeys.left) robotX -= 5;

  // Continue the rest of the collision and rendering logic...
}


  // Check collisions for coins, power-ups, and enemies
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

  powerUps.forEach((powerUp, index) => {
    const parentElement = powerUp.parentElement;

    if (!parentElement || !parentElement.style.left || !parentElement.style.top) {
      return; // Skip if missing positioning data
    }

    const powerUpX = parseInt(parentElement.style.left, 10);
    const powerUpY = parseInt(parentElement.style.top, 10);

    if (checkCollision(robotX, robotY, 40, 60, powerUpX, powerUpY, 30, 30)) {
      // Restore health by 25%, but cap it at 100%
      health = Math.min(health + 25, 100);
      updateHealthBar();

      // Remove the power-up from the game
      parentElement.remove();
      powerUps.splice(index, 1);
    }
  });

  // Goalpost Collision
  const goalpost = document.querySelector("#goalpost");
  const goalpostX = parseInt(goalpost.style.left);
  const goalpostY = parseInt(goalpost.style.top);

  if (checkCollision(robotX, robotY, 40, 60, goalpostX, goalpostY, 40, 100)) {
    isPaused = true; // Pause the game
    document.querySelector("#congratulations-screen").style.display = "flex";
  }

  enemies.forEach((enemy) => {
    const enemyX = parseInt(enemy.style.left);
    const enemyY = parseInt(enemy.style.top);

    if (
      checkCollision(robotX, robotY, 40, 60, enemyX, enemyY, 40, 40) &&
      Date.now() - lastDamageTime > damageCooldown // Check cooldown
    ) {
      health -= 20;
      lastDamageTime = Date.now();
      updateHealthBar();

      if (health <= 0) {
        endGame();
      }
    }
  });

  if (robotY > 400) {
    endGame();
  }

  // Camera and Player Position Updates
  cameraOffsetX = Math.max(0, Math.min(robotX - 400, 8000 - 800));
  level.style.transform = `translateX(${-cameraOffsetX}px)`;

  robot.style.left = `${robotX}px`;
  robot.style.top = `${robotY}px`;

  moveEnemies();

  requestAnimationFrame(gameLoop);



// Helper: Check Collision
function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
  return (
    x1 < x2 + w2 &&
    x1 + w1 > x2 &&
    y1 < y2 + h2 &&
    y1 + h1 > y2
  );
}

// Update Health Bar
function updateHealthBar() {
  healthBar.style.width = `${health}%`;
  healthBar.style.backgroundColor =
    health > 50 ? "#4caf50" : health > 25 ? "#ffa500" : "#f44336"; // Green, orange, red
}

// Update Scoreboard
function updateScore() {
  scoreboard.textContent = `Score: ${score}`;
}

// Restart Game
function restartGame() {
  robotX = 50;
  robotY = 300;
  velocityY = 0;
  jumpCount = 0;
  score = 0;
  health = 100; // Reset health
  isGameOver = false;
  isPaused = false; // Ensure the game starts unpaused
  isFlying = false; // Reset flying ability
  updateScore();
  updateHealthBar();

  // Restore all coins
  coins.forEach((coin) => {
    if (!level.contains(coin)) {
      level.appendChild(coin); // Re-add the coin if it was collected
    }
  });

  // Restore all power-ups
  powerUps.forEach((powerUp) => {
    const parentElement = powerUp.parentElement;
    if (!level.contains(parentElement)) {
      level.appendChild(parentElement); // Re-add the power-up if it was collected
    }
  });

  // Reset enemies
  enemies.forEach((enemy) => level.appendChild(enemy));
}


// End the Game
function endGame() {
  isGameOver = true;
  velocityY = 0;
  isFlying = false; // Reset flying ability on death
  keys["ArrowRight"] = false;
  keys["ArrowLeft"] = false;
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

// Game Loop
function gameLoop() {
  if (isPaused || isGameOver) return; // Pause the game if isPaused is true

  if (isFlying) {
    // Flying controls
    if (keys["ArrowUp"]) robotY -= 5; // Move up
    if (keys["ArrowDown"]) robotY += 5; // Move down
  } else {
    // Gravity and jumping
    velocityY += 0.8; // Gravity
    robotY += velocityY;

    if (keys["ArrowUp"] && jumpCount < 2) {
      velocityY = -12;
      jumpCount++;
      keys["ArrowUp"] = false;
    }

    // Platform Collision for Normal Movement
    let onPlatform = false;
    platforms.forEach((platform) => {
      const platX = parseInt(platform.style.left);
      const platY = parseInt(platform.style.top);
      const platW = parseInt(platform.style.width);
      const platH = 10;

      if (
        checkCollision(robotX, robotY, 40, 60, platX, platY, platW, platH) &&
        velocityY >= 0
      ) {
        robotY = platY - 60;
        velocityY = 0;
        onPlatform = true;
      }
    });

    if (onPlatform || robotY >= 390) {
      jumpCount = 0; // Reset jump count
    }
  }

  // Horizontal Movement
  if (keys["ArrowRight"]) robotX += 5;
  if (keys["ArrowLeft"]) robotX -= 5;

  // Check collisions for coins, power-ups, and enemies
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

  powerUps.forEach((powerUp, index) => {
    const parentElement = powerUp.parentElement;

    if (!parentElement || !parentElement.style.left || !parentElement.style.top) {
      return; // Skip if missing positioning data
    }

    const powerUpX = parseInt(parentElement.style.left, 10);
    const powerUpY = parseInt(parentElement.style.top, 10);

    if (checkCollision(robotX, robotY, 40, 60, powerUpX, powerUpY, 30, 30)) {
      // Restore health by 25%, but cap it at 100%
      health = Math.min(health + 25, 100);
      updateHealthBar();

      // Remove the power-up from the game
      parentElement.remove();
      powerUps.splice(index, 1);
    }
  });




  
  // Goalpost Collision
  const goalpost = document.querySelector("#goalpost");
  const goalpostX = parseInt(goalpost.style.left);
  const goalpostY = parseInt(goalpost.style.top);

  if (checkCollision(robotX, robotY, 40, 60, goalpostX, goalpostY, 40, 100)) {
    isPaused = true; // Pause the game
    document.querySelector("#congratulations-screen").style.display = "flex";
  }

  enemies.forEach((enemy) => {
    const enemyX = parseInt(enemy.style.left);
    const enemyY = parseInt(enemy.style.top);

    if (
      checkCollision(robotX, robotY, 40, 60, enemyX, enemyY, 40, 40) &&
      Date.now() - lastDamageTime > damageCooldown // Check cooldown
    ) {
      health -= 20;
      lastDamageTime = Date.now();
      updateHealthBar();

      if (health <= 0) {
        endGame();
      }
    }
  });

  if (robotY > 400) {
    endGame();
  }

  // Camera and Player Position Updates
  cameraOffsetX = Math.max(0, Math.min(robotX - 400, 8000 - 800));
  level.style.transform = `translateX(${-cameraOffsetX}px)`;

  robot.style.left = `${robotX}px`;
  robot.style.top = `${robotY}px`;

  moveEnemies();

  requestAnimationFrame(gameLoop);
}

// Event Listeners for Buttons
startBtn.addEventListener("click", () => {
  restartGame(); // Reset the game, including coins and power-ups
  mainMenu.style.display = "none"; // Hide the menu
  isPaused = false; // Unpause the game
  requestAnimationFrame(gameLoop); // Start the game loop
});


continueBtn.addEventListener("click", () => {
  if (!isGameOver) {
    mainMenu.style.display = "none"; // Hide the menu
    isPaused = false; // Resume the game
    requestAnimationFrame(gameLoop); // Resume the game loop
  }
});

document.querySelector("#main-menu-button").addEventListener("click", () => {
  document.querySelector("#congratulations-screen").style.display = "none"; // Hide the message
  mainMenu.style.display = "flex"; // Show the main menu
  restartGame(); // Reset the game
});

// Initial Setup
updateScore();
updateHealthBar();
gameLoop();
