// ===== Game Variables =====
let gameState = {
    score: 0,
    level: 1,
    lives: 3,
    combo: 0,
    timeLeft: 60,
    isRunning: false,
    isPaused: false,
    soundEnabled: true
};

let gameConfig = {
    targetSize: 50,
    minTargets: 1,
    maxTargets: 5,
    spawnInterval: 1000,
    levelDuration: 60
};

let gameVariables = {
    gameTimer: null,
    spawnTimer: null,
    targets: [],
    targetIdCounter: 0
};

// ===== DOM Elements =====
const welcomeScreen = document.getElementById('welcomeScreen');
const gameScreen = document.getElementById('gameScreen');
const levelCompleteScreen = document.getElementById('levelCompleteScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const pauseScreen = document.getElementById('pauseScreen');
const gameArea = document.getElementById('gameArea');

const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const livesDisplay = document.getElementById('lives');
const comboDisplay = document.getElementById('combo');
const timerDisplay = document.getElementById('timer');

const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const quitBtn = document.getElementById('quitBtn');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const restartBtn = document.getElementById('restartBtn');
const soundBtn = document.getElementById('soundBtn');

// ===== Initialize Game =====
document.addEventListener('DOMContentLoaded', () => {
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    resumeBtn.addEventListener('click', togglePause);
    quitBtn.addEventListener('click', quitGame);
    nextLevelBtn.addEventListener('click', nextLevel);
    restartBtn.addEventListener('click', startGame);
    soundBtn.addEventListener('click', toggleSound);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && gameState.isRunning) {
            togglePause();
        }
    });
});

// ===== Start Game =====
function startGame() {
    gameState = {
        score: 0,
        level: 1,
        lives: 3,
        combo: 0,
        timeLeft: 60,
        isRunning: true,
        isPaused: false,
        soundEnabled: true
    };

    showScreen('gameScreen');
    updateDisplay();
    startLevel();
}

// ===== Start Level =====
function startLevel() {
    gameState.timeLeft = 60;
    gameState.combo = 0;
    gameArea.innerHTML = '';
    gameVariables.targets = [];

    // Update game difficulty based on level
    updateDifficulty();

    // Start spawning targets
    startSpawningTargets();

    // Start timer
    gameVariables.gameTimer = setInterval(updateTimer, 1000);
}

// ===== Update Difficulty =====
function updateDifficulty() {
    const level = gameState.level;
    gameConfig.maxTargets = Math.min(level + 2, 10);
    gameConfig.spawnInterval = Math.max(1000 - (level * 100), 300);
    gameConfig.levelDuration = Math.max(60 - (level * 2), 30);
}

// ===== Spawn Targets =====
function startSpawningTargets() {
    const spawnTarget = () => {
        if (!gameState.isRunning || gameState.isPaused) return;

        const targetCount = gameVariables.targets.length;
        if (targetCount < gameConfig.maxTargets) {
            spawnTarget_Create();
        }

        if (gameState.isRunning) {
            gameVariables.spawnTimer = setTimeout(spawnTarget, gameConfig.spawnInterval);
        }
    };

    spawnTarget();
}

// ===== Create Target =====
function spawnTarget_Create() {
    if (!gameState.isRunning) return;

    const targetId = gameVariables.targetIdCounter++;
    const x = Math.random() * (gameArea.clientWidth - gameConfig.targetSize);
    const y = Math.random() * (gameArea.clientHeight - gameConfig.targetSize);

    const target = document.createElement('div');
    target.className = 'target';
    target.id = `target-${targetId}`;
    target.textContent = '🎯';
    target.style.left = x + 'px';
    target.style.top = y + 'px';

    target.addEventListener('click', (e) => {
        e.stopPropagation();
        targetClicked(targetId);
    });

    gameArea.appendChild(target);
    gameVariables.targets.push(targetId);

    // Auto-remove target after 3 seconds
    setTimeout(() => {
        if (document.getElementById(`target-${targetId}`)) {
            targetMissed(targetId);
        }
    }, 3000);
}

// ===== Target Clicked =====
function targetClicked(targetId) {
    const targetElement = document.getElementById(`target-${targetId}`);
    if (!targetElement) return;

    // Remove from tracking
    gameVariables.targets = gameVariables.targets.filter(id => id !== targetId);

    // Add points
    const pointsEarned = 10 + (gameState.combo * 5);
    gameState.score += pointsEarned;
    gameState.combo++;

    // Visual effect
    targetElement.classList.add('clicked');

    // Show floating points
    showFloatingPoints(targetElement, pointsEarned);

    // Play sound
    playSound('click');

    updateDisplay();

    // Remove element
    setTimeout(() => {
        targetElement.remove();
    }, 400);
}

// ===== Target Missed =====
function targetMissed(targetId) {
    const targetElement = document.getElementById(`target-${targetId}`);
    if (!targetElement) return;

    gameVariables.targets = gameVariables.targets.filter(id => id !== targetId);
    gameState.combo = 0;
    gameState.lives--;

    playSound('miss');
    updateDisplay();

    if (gameState.lives <= 0) {
        endGame();
    }

    targetElement.style.backgroundColor = '#ff6b6b';
    setTimeout(() => {
        targetElement.remove();
    }, 300);
}

// ===== Show Floating Points =====
function showFloatingPoints(targetElement, points) {
    const plusElement = document.createElement('div');
    plusElement.className = 'target-plus';
    plusElement.textContent = `+${points}`;

    const rect = targetElement.getBoundingClientRect();
    const gameRect = gameArea.getBoundingClientRect();

    plusElement.style.left = (rect.left - gameRect.left + gameConfig.targetSize / 2) + 'px';
    plusElement.style.top = (rect.top - gameRect.top + gameConfig.targetSize / 2) + 'px';

    gameArea.appendChild(plusElement);

    setTimeout(() => {
        plusElement.remove();
    }, 800);
}

// ===== Update Timer =====
function updateTimer() {
    if (gameState.isPaused) return;

    gameState.timeLeft--;
    updateDisplay();

    if (gameState.timeLeft <= 0) {
        levelComplete();
    }
}

// ===== Update Display =====
function updateDisplay() {
    scoreDisplay.textContent = gameState.score;
    levelDisplay.textContent = gameState.level;
    livesDisplay.textContent = gameState.lives;
    comboDisplay.textContent = gameState.combo;
    timerDisplay.textContent = gameState.timeLeft;
}

// ===== Level Complete =====
function levelComplete() {
    gameState.isRunning = false;
    clearInterval(gameVariables.gameTimer);
    clearTimeout(gameVariables.spawnTimer);

    // Show level complete screen
    document.getElementById('resultLevel').textContent = gameState.level;
    document.getElementById('resultScore').textContent = gameState.score;
    document.getElementById('resultCombo').textContent = gameState.combo;

    showScreen('levelCompleteScreen');
    playSound('levelComplete');
}

// ===== Next Level =====
function nextLevel() {
    gameState.level++;
    gameState.combo = 0;
    gameState.isRunning = true;
    showScreen('gameScreen');
    startLevel();
}

// ===== End Game =====
function endGame() {
    gameState.isRunning = false;
    clearInterval(gameVariables.gameTimer);
    clearTimeout(gameVariables.spawnTimer);

    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('levelsReached').textContent = gameState.level;

    showScreen('gameOverScreen');
    playSound('gameOver');
}

// ===== Toggle Pause =====
function togglePause() {
    gameState.isPaused = !gameState.isPaused;

    if (gameState.isPaused) {
        showScreen('pauseScreen');
        playSound('pause');
    } else {
        showScreen('gameScreen');
        playSound('resume');
    }
}

// ===== Quit Game =====
function quitGame() {
    gameState.isRunning = false;
    gameState.isPaused = false;
    clearInterval(gameVariables.gameTimer);
    clearTimeout(gameVariables.spawnTimer);
    showScreen('welcomeScreen');
}

// ===== Toggle Sound =====
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    soundBtn.textContent = gameState.soundEnabled ? '🔊 Sound On' : '🔇 Sound Off';
}

// ===== Sound Effects =====
function playSound(type) {
    if (!gameState.soundEnabled) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    switch (type) {
        case 'click':
            playSoundEffect(audioContext, 800, 0.1, 'sine');
            break;
        case 'miss':
            playSoundEffect(audioContext, 300, 0.1, 'sine');
            break;
        case 'levelComplete':
            playMelody(audioContext, [523, 659, 784], [0.1, 0.1, 0.2]);
            break;
        case 'gameOver':
            playMelody(audioContext, [400, 300, 200], [0.1, 0.1, 0.2]);
            break;
        case 'pause':
            playSoundEffect(audioContext, 600, 0.05, 'sine');
            break;
        case 'resume':
            playSoundEffect(audioContext, 700, 0.05, 'sine');
            break;
    }
}

// ===== Play Sound Effect =====
function playSoundEffect(audioContext, frequency, duration, type = 'sine') {
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.log('Audio context error:', e);
    }
}

// ===== Play Melody =====
function playMelody(audioContext, frequencies, durations) {
    let time = audioContext.currentTime;
    frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = freq;
        gainNode.gain.setValueAtTime(0.1, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + durations[index]);

        oscillator.start(time);
        oscillator.stop(time + durations[index]);

        time += durations[index];
    });
}

// ===== Show Screen =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}
