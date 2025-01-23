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
// Back to Main Menu Button
const backToMainMenuBtn = document.querySelector("#main-menu-button");

backToMainMenuBtn.addEventListener("click", () => {
  location.reload(); // Reload the page to reset the game
});
const leftBtn = document.querySelector("#left-btn");
const rightBtn = document.querySelector("#right-btn");
const jumpBtn = document.querySelector("#jump-btn");
const flyBtn = document.querySelector("#fly-btn");
const gameOverScreen = document.querySelector("#game-over-screen");
const restartGameButton = document.querySelector("#restart-game-button");
const gameOverMainMenuButton = document.querySelector("#game-over-main-menu-button");
const backgroundMusic = document.querySelector("#background-music");
const muteBtn = document.querySelector("#mute-btn");

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
let timerInterval; // Interval for the timer
let elapsedTime = 0; // Elapsed time in seconds

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


function toggleTimer() {
  if (isPaused) {
    clearInterval(timerInterval); // Stop the timer
    console.log("Timer paused."); // Debugging log
  } else {
    timerInterval = setInterval(() => {
      elapsedTime++;
      updateTimerDisplay();
    }, 1000); // Resume the timer
    console.log("Timer resumed."); // Debugging log
  }
}





function startTimer() {
  elapsedTime = 0; // Reset the timer
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    elapsedTime++;
    updateTimerDisplay();
  }, 1000); // Start counting in seconds
}


function updateTimerDisplay() {
  const timerElement = document.querySelector("#timer");
  timerElement.textContent = `Time: ${elapsedTime}s`;
}

function stopTimer() {
  clearInterval(timerInterval);
}


// Start Game Music
function playMusic() {
  backgroundMusic.volume = 0.5; // Set volume (0.0 to 1.0)
  backgroundMusic.play();
}

// Stop Game Music
function stopMusic() {
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0; // Reset to the beginning
}

// Play music when the game starts
startBtn.addEventListener("click", () => {
  playMusic();
});

// Stop music when showing the congratulations screen
function checkGoalpostCollision() {
  const goalpostX = parseInt(goalpost.style.left);
  const goalpostY = parseInt(goalpost.style.top);

  if (checkCollision(robotX, robotY, 40, 60, goalpostX, goalpostY, 40, 100)) {
    console.log("Goalpost reached!"); // Debug log
    isPaused = true;
    stopTimer(); // Ensure timer is stopped
    stopMusic(); // Stop the music
    congratulationsScreen.style.display = "block";
  }
}


// Stop music when the game is over
function endGame() {
  isGameOver = true;

  // Stop movement and reset controls
  velocityY = 0;
  keys["ArrowRight"] = false;
  keys["ArrowLeft"] = false;
  isFlying = false; // Reset flying state
  flyBtn.style.backgroundColor = "#4caf50"; // Reset fly button color

  // Stop the music
  stopMusic();

  // Show Game Over Screen
  gameOverScreen.style.display = "flex"; // Display the Game Over screen
  isPaused = true; // Pause the game
}



function setupButtonListeners(button, direction) {
  // Mouse events
  button.addEventListener("mousedown", () => (keys[direction] = true));
  button.addEventListener("mouseup", () => (keys[direction] = false));

  // Touch events
  button.addEventListener("touchstart", (e) => {
    e.preventDefault(); // Prevent default touch behavior
    keys[direction] = true;
  });
  button.addEventListener("touchend", (e) => {
    e.preventDefault(); // Prevent default touch behavior
    keys[direction] = false;
  });
}



function toggleFlyMode() {
  isFlying = !isFlying; // Toggle flying mode
  velocityY = 0; // Reset vertical velocity when toggling flying mode
  flyBtn.style.backgroundColor = isFlying ? "#ff4444" : "#4caf50"; // Toggle button color
}


// Button Input Handling
function setupButtonListeners(button, direction) {
  // Mouse events
  button.addEventListener("mousedown", () => (keys[direction] = true));
  button.addEventListener("mouseup", () => (keys[direction] = false));

  // Touch events
  button.addEventListener("touchstart", (e) => {
    e.preventDefault(); // Prevent default touch behavior (e.g., scrolling)
    keys[direction] = true;
  });
  button.addEventListener("touchend", (e) => {
    e.preventDefault(); // Prevent default touch behavior
    keys[direction] = false;
  });
}

// Setup left and right button listeners
setupButtonListeners(leftBtn, "ArrowLeft");
setupButtonListeners(rightBtn, "ArrowRight");

// Fly Button with Touch Support
flyBtn.addEventListener("mousedown", toggleFlyMode);
flyBtn.addEventListener("touchstart", (e) => {
  e.preventDefault(); // Prevent default touch behavior
  toggleFlyMode();
});

function toggleFlyMode() {
  isFlying = !isFlying; // Toggle flying mode
  velocityY = 0; // Reset vertical velocity when toggling flying mode
  flyBtn.style.backgroundColor = isFlying ? "#ff4444" : "#4caf50"; // Toggle button color
}

// Jump Button with Touch Support
jumpBtn.addEventListener("mousedown", () => handleJump());
jumpBtn.addEventListener("mouseup", () => handleJumpEnd());
jumpBtn.addEventListener("touchstart", (e) => {
  e.preventDefault(); // Prevent default touch behavior
  handleJump();
});
jumpBtn.addEventListener("touchend", (e) => {
  e.preventDefault(); // Prevent default touch behavior
  handleJumpEnd();
});

function handleJump() {
  if (isFlying) {
    keys["ArrowUp"] = true; // Simulate "ArrowUp" for flying
  } else if (jumpCount < 2 && !isJumping) {
    velocityY = -12; // Perform jump
    jumpCount++;
    isJumping = true; // Prevent continuous jumping
  }
}

function handleJumpEnd() {
  if (isFlying) {
    keys["ArrowUp"] = false; // Stop upward movement in flying mode
  } else {
    isJumping = false; // Reset jumping flag in normal mode
  }
}

// Pause Button
const pauseBtn = document.querySelector("#pause-btn");

// Toggle Pause State
pauseBtn.addEventListener("click", () => {
  pauseGame();
  if (isPaused) {
    pauseBtn.textContent = "Resume"; // Change button text to "Resume"
  } else {
    pauseBtn.textContent = "Pause"; // Change button text to "Pause"
  }
});

function pauseGame() {
  isPaused = !isPaused; // Toggle the pause state

  if (isPaused) {
    stopTimer(); // Stop the timer when paused
    console.log("Game Paused");
  } else {
    startTimer(); // Resume the timer when unpaused
    console.log("Game Resumed");
    gameLoop(); // Restart the game loop
  }
}

function startTimer() {
  clearInterval(timerInterval); // Clear any existing intervals
  timerInterval = setInterval(() => {
    if (!isPaused) { // Only increment the timer when the game is not paused
      elapsedTime++;
      updateTimerDisplay();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval); // Clear the interval to stop the timer
}







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

  // Adjust camera for mobile devices
  const isMobile = window.innerWidth <= 768; // Detect mobile devices
  if (isMobile) {
    cameraOffsetX = Math.max(0, robotX - window.innerWidth / 2); // Center robot in the middle
  } else {
    cameraOffsetX = Math.max(0, Math.min(robotX - 400, 8000 - 800)); // Original logic for laptops
  }

  // Update camera and robot position
  level.style.transform = `translateX(${-cameraOffsetX}px)`; // Apply camera offset
  robot.style.left = `${robotX}px`;
  robot.style.top = `${robotY}px`;

  // Check Collisions
  checkEnemyCollision();
  checkPowerUpCollision();
  checkCoinCollision();
  checkGoalpostCollision();

  // Check if Robot Falls Off the Level
  if (robotY > 400) {
    endGame();
  }

  // Enemy Movement
  moveEnemies();

  requestAnimationFrame(gameLoop);
}



function checkEnemyCollision() {
  enemies.forEach((enemy) => {
    const enemyX = parseInt(enemy.style.left);
    const enemyY = parseInt(enemy.style.top);

    if (
      checkCollision(robotX, robotY, 40, 60, enemyX, enemyY, 40, 40) &&
      Date.now() - lastDamageTime > damageCooldown
    ) {
      // If the enemy has the class "red-enemy", apply specific behavior
      if (enemy.classList.contains("red-enemy")) {
        console.log("Collided with a red enemy!");

        // Example: End the game on collision with red-enemy
        endGame();
      } else {
        // Default behavior for normal enemies
        health -= 20;
        lastDamageTime = Date.now();
        updateHealthBar();
        if (health <= 0) {
          endGame();
        }
      }
    }
  });
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




// Function to generate spikes
function generateSpikes() {
  const spikeCount = 50; // Number of spikes to generate
  const floorY = 40; // Position spikes at the floor level

  for (let i = 0; i < spikeCount; i++) {
    const spike = document.createElement("div");

    // Randomize size and color
    const width = Math.random() * 10 + 10; // Width between 10px and 20px
    const height = Math.random() * 20 + 20; // Height between 20px and 40px
    const left = Math.random() * 8000; // Random position along the floor
    const colorClass = Math.random() > 0.5 ? "dark-red" : ""; // Alternate colors

    spike.classList.add("spike", colorClass);
    spike.style.borderLeftWidth = `${width / 2}px`;
    spike.style.borderRightWidth = `${width / 2}px`;
    spike.style.borderBottomWidth = `${height}px`;
    spike.style.left = `${left}px`;
    spike.style.bottom = `${floorY}px`;

    // Append spike to the game level
    level.appendChild(spike);
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
    stopTimer(); // Stop the timer
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
  stopTimer(); // Stop the previous timer
  startTimer(); // Restart the timer
  congratulationsScreen.style.display = "none";
}


// Event Listener for Restart Button
restartGameButton.addEventListener("click", () => {
  restartGame(); // Reset the level without showing the main menu
  gameOverScreen.style.display = "none"; // Hide Game Over screen
  isPaused = false; // Resume the game
  gameLoop(); // Restart the game loop
});

// Event Listener for Back to Main Menu Button
gameOverMainMenuButton.addEventListener("click", () => {
  location.reload(); // Reload the page to go back to the main menu
});

// Updated End Game Function
function endGame() {
  isGameOver = true;

  // Stop movement and reset controls
  velocityY = 0;
  keys["ArrowRight"] = false;
  keys["ArrowLeft"] = false;
  isFlying = false; // Reset flying state
  flyBtn.style.backgroundColor = "#4caf50"; // Reset fly button color

  // Clear all keys to prevent unintended movement
  for (let key in keys) {
    keys[key] = false;
  }

  // Show Game Over Screen
  gameOverScreen.style.display = "flex"; // Display the Game Over screen
  isPaused = true; // Pause the game
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


muteBtn.addEventListener("click", () => {
  if (backgroundMusic.muted) {
    backgroundMusic.muted = false;
    muteBtn.textContent = "Mute";
  } else {
    backgroundMusic.muted = true;
    muteBtn.textContent = "Unmute";
  }
});

// Start Game
startBtn.addEventListener("click", () => {
  restartGame();
  mainMenu.style.display = "none";
  isPaused = false;
  startTimer(); // Start the timer
  gameLoop();
});


// Back to Main Menu Button
backToMainMenuBtn.addEventListener("click", () => {
  location.reload(); // Reload the page to reset the game
});

// Initialize
updateScore();
updateHealthBar();
// Call generateSpikes to create spikes at the start
generateSpikes();

