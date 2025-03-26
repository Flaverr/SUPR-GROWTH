// Game Data
const ITEMS = [
    { value: '🌱', points: 50, chance: 25, baseSpeed: 0.8 },
    { value: '🌽', points: 20, chance: 30, baseSpeed: 0.96 },
    { value: '🥕', points: 30, chance: 20, baseSpeed: 0.72 },
    { value: '💧', points: 5, chance: 10, baseSpeed: 0.88 },
    { value: '🪱', points: 0, chance: 10, baseSpeed: 1.6 },
    { value: '🎁', points: 0, chance: 5, baseSpeed: 0.64 }
];

// Game State
let gameActive = false;
let isPaused = false;
let score = 0;
let basketWidth = 100;
let isMuted = false;
let multiplier = 1;
let shield = false;
let logoSize = 100;
let dropInterval = 2000;
let speedMultiplier = 1;
let allTimeScores = JSON.parse(localStorage.getItem('suprGrowthScores')) || [];
let dailyScores = JSON.parse(localStorage.getItem('suprGrowthDailyScores')) || { date: null, scores: [] };

// DOM Elements
const DOM = {
    splashScreen: document.getElementById('splash-screen'),
    gameScreen: document.getElementById('game-screen'),
    startButton: document.getElementById('start-button'),
    usernameInput: document.getElementById('username'),
    playerName: document.getElementById('player-name'),
    currentScore: document.getElementById('current-score'),
    superseedLogo: document.getElementById('superseed-logo'),
    basket: document.getElementById('basket'),
    leftPanel: document.getElementById('left-panel'),
    allTimeList: document.getElementById('all-time-list'),
    dailyList: document.getElementById('daily-list'),
    gameOverScreen: document.getElementById('game-over'),
    finalScore: document.getElementById('final-score'),
    resetButton: document.getElementById('reset-button'),
    mysteryPopup: document.getElementById('mystery-popup'),
    burnDebtBtn: document.getElementById('burn-debt'),
    supercollateralBtn: document.getElementById('supercollateral'),
    proofRepaymentBtn: document.getElementById('proof-repayment'),
    soundToggle: document.getElementById('sound-toggle'),
    themeToggle: document.getElementById('theme-toggle'),
    pauseButton: document.getElementById('pause-button'),
    burnDebtBar: document.getElementById('burn-debt-bar'),
    supercollateralBar: document.getElementById('supercollateral-bar'),
    progressContainer: document.getElementById('progress-container'),
    supercollateralProgress: document.getElementById('supercollateral-progress'),
    burnDebtProgress: document.getElementById('burn-debt-progress')
};

// Audio Elements
const SOUNDS = {
    seed: document.getElementById('sound-seed'),
    corn: document.getElementById('sound-corn'),
    carrot: document.getElementById('sound-carrot'),
    water: document.getElementById('sound-water'),
    worm: document.getElementById('sound-worm'),
    mystery: document.getElementById('sound-mystery')
};

// Event Listeners
function setupEventListeners() {
    DOM.startButton.addEventListener('click', startGame);
    DOM.resetButton.addEventListener('click', startGame);
    DOM.soundToggle.addEventListener('click', () => {
        isMuted = !isMuted;
        DOM.soundToggle.textContent = isMuted ? '🔇' : '🔊';
    });
    DOM.themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        DOM.themeToggle.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
    });
    DOM.burnDebtBtn.addEventListener('click', () => {
        score = Math.floor(score * 0.75);
        multiplier = 2;
        DOM.burnDebtBar.classList.add('active');
        DOM.burnDebtProgress.classList.remove('hidden');
        DOM.progressContainer.classList.remove('hidden');
        setTimeout(() => {
            multiplier = 1;
            DOM.burnDebtBar.classList.remove('active');
            DOM.burnDebtProgress.classList.add('hidden');
            if (!shield) DOM.progressContainer.classList.add('hidden');
        }, 30000);
        resumeGame();
    });
    DOM.supercollateralBtn.addEventListener('click', () => {
        shield = true;
        DOM.basket.classList.add('shielded');
        DOM.supercollateralBar.classList.add('active');
        DOM.supercollateralProgress.classList.remove('hidden');
        DOM.progressContainer.classList.remove('hidden');
        setTimeout(() => {
            shield = false;
            DOM.basket.classList.remove('shielded');
            DOM.supercollateralBar.classList.remove('active');
            DOM.supercollateralProgress.classList.add('hidden');
            if (multiplier === 1) DOM.progressContainer.classList.add('hidden');
        }, 30000);
        resumeGame();
    });
    DOM.proofRepaymentBtn.addEventListener('click', () => {
        score = Math.random() < 0.6 ? score * 2 : Math.floor(score / 2);
        resumeGame();
    });
    DOM.leftPanel.addEventListener('mousemove', (e) => {
        if (!gameActive || isPaused) return;
        const panelWidth = DOM.leftPanel.offsetWidth;
        let newLeft = e.clientX - DOM.leftPanel.getBoundingClientRect().left - basketWidth / 2;
        newLeft = Math.max(0, Math.min(newLeft, panelWidth - basketWidth));
        DOM.basket.style.left = `${newLeft}px`;
        DOM.progressContainer.style.left = `${newLeft + basketWidth / 2}px`;
    });
    DOM.pauseButton.addEventListener('click', togglePause);
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    DOM.gameOverScreen.classList.remove('active');
    DOM.mysteryPopup.classList.remove('active');
    DOM.gameScreen.classList.add('hidden');
    DOM.splashScreen.classList.remove('hidden');
    checkDailyReset();
    updateLeaderboard();
    setupEventListeners();
});

// Game Logic
function startGame() {
    const username = DOM.usernameInput.value.trim() || 'Player';
    gameActive = true;
    isPaused = false;
    score = 0;
    basketWidth = 100;
    multiplier = 1;
    shield = false;
    logoSize = 100;
    dropInterval = 2000;
    speedMultiplier = 1;
    DOM.splashScreen.classList.add('hidden');
    DOM.gameScreen.classList.remove('hidden');
    DOM.gameOverScreen.classList.remove('active');
    DOM.mysteryPopup.classList.remove('active');
    DOM.progressContainer.classList.add('hidden');
    DOM.playerName.textContent = username;
    DOM.currentScore.textContent = score;
    DOM.basket.style.width = `${basketWidth}px`;
    DOM.superseedLogo.style.width = `${logoSize}px`;
    DOM.pauseButton.textContent = '⏸️';
    updateLeaderboard();
    dropLoop();
}

function dropLoop() {
    if (!gameActive || isPaused) return;
    const numItems = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numItems; i++) dropItem();
    setTimeout(dropLoop, Math.random() * dropInterval + 500);
}

function dropItem() {
    const totalChance = ITEMS.reduce((sum, item) => sum + item.chance, 0);
    const random = Math.random() * totalChance;
    let cumulative = 0;
    const item = ITEMS.find(i => { cumulative += i.chance; return random < cumulative; });
    const randomFactor = 0.8 + Math.random() * 0.4;
    const speed = item.baseSpeed * randomFactor * speedMultiplier;
    const elem = document.createElement('div');
    elem.classList.add('falling-item');
    elem.textContent = item.value;
    const left = Math.random() * (DOM.leftPanel.offsetWidth - 50);
    elem.style.left = `${left}px`;
    elem.style.top = '0px';
    DOM.leftPanel.appendChild(elem);
    const duration = dropInterval / speed / 1000;
    elem.style.transition = `top ${duration}s linear`;
    elem.style.top = `${DOM.leftPanel.offsetHeight}px`;
    const collisionCheck = setInterval(() => {
        if (!gameActive || isPaused) return;
        const basketRect = DOM.basket.getBoundingClientRect();
        const itemRect = elem.getBoundingClientRect();
        if (itemRect.left < basketRect.right && itemRect.right > basketRect.left &&
            itemRect.bottom > basketRect.top && itemRect.top < basketRect.bottom) {
            handleCatch(item, elem);
            elem.remove();
            clearInterval(collisionCheck);
        }
    }, 16);
    setTimeout(() => { if (elem.parentNode) elem.remove(); clearInterval(collisionCheck); }, duration * 1000);
}

function handleCatch(item, elem) {
    if (item.value === '🌱' || item.value === '🌽' || item.value === '🥕') {
        score += item.points * multiplier;
        if (!isMuted) SOUNDS[item.value === '🌱' ? 'seed' : item.value === '🌽' ? 'corn' : 'carrot'].play();
    } else if (item.value === '💧') {
        score += item.points * multiplier;
        basketWidth = 100 + Math.random() * 500;
        DOM.basket.style.width = `${basketWidth}px`;
        DOM.progressContainer.style.width = `${basketWidth}px`;
        if (!isMuted) SOUNDS.water.play();
    } else if (item.value === '🪱') {
        if (shield) return;
        if (!isMuted) SOUNDS.worm.play();
        DOM.basket.classList.add('destroyed');
        setTimeout(() => {
            DOM.basket.classList.remove('destroyed');
            endGame();
        }, 500);
    } else if (item.value === '🎁') {
        gameActive = false;
        DOM.basket.classList.add('wiggle');
        DOM.mysteryPopup.classList.add('active');
        if (!isMuted) SOUNDS.mystery.play();
        setTimeout(() => DOM.basket.classList.remove('wiggle'), 500);
    }
    DOM.currentScore.textContent = score;
    updateGrowth();
}

function updateGrowth() {
    let newSize = logoSize;
    if (score <= 6000) {
        newSize = 100 * (1 + 0.3 * Math.floor(score / 500));
    }
    if (score > 6000 && score % 500 < 50) {
        DOM.superseedLogo.classList.add('wiggle');
        setTimeout(() => DOM.superseedLogo.classList.remove('wiggle'), 500);
    }
    if (newSize !== logoSize) {
        logoSize = newSize;
        DOM.superseedLogo.style.width = `${logoSize}px`;
        DOM.superseedLogo.classList.add('wiggle');
        setTimeout(() => DOM.superseedLogo.classList.remove('wiggle'), 500);
    }
    speedMultiplier = 1 + Math.floor(score / 500) * 0.15;
}

function endGame() {
    gameActive = false;
    const username = DOM.playerName.textContent;
    allTimeScores.push({ username, score });
    dailyScores.scores.push({ username, score });
    allTimeScores.sort((a, b) => b.score - a.score);
    dailyScores.scores.sort((a, b) => b.score - a.score);
    allTimeScores = allTimeScores.slice(0, 10);
    dailyScores.scores = dailyScores.scores.slice(0, 10);
    localStorage.setItem('suprGrowthScores', JSON.stringify(allTimeScores));
    localStorage.setItem('suprGrowthDailyScores', JSON.stringify(dailyScores));
    DOM.finalScore.textContent = score;
    updateLeaderboard();
    DOM.gameOverScreen.classList.remove('hidden');
    DOM.gameOverScreen.classList.add('active');
}

function resumeGame() {
    DOM.mysteryPopup.classList.remove('active');
    gameActive = true;
    if (!isPaused) dropLoop();
}

function togglePause() {
    if (!gameActive) return;
    isPaused = !isPaused;
    DOM.pauseButton.textContent = isPaused ? '▶️' : '⏸️';
    if (!isPaused) dropLoop();
}

function updateLeaderboard() {
    DOM.allTimeList.innerHTML = allTimeScores.map(s => `<li>${s.username}: ${s.score}</li>`).join('');
    DOM.dailyList.innerHTML = dailyScores.scores.map(s => `<li>${s.username}: ${s.score}</li>`).join('');
}

function checkDailyReset() {
    const today = new Date('2025-03-26').toDateString();
    if (!dailyScores.date || dailyScores.date !== today) {
        dailyScores = { date: today, scores: [] };
        localStorage.setItem('suprGrowthDailyScores', JSON.stringify(dailyScores));
    }
}
