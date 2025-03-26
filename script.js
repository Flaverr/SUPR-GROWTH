// Game state variables
let username = '';
let score = 0;
let growthStage = 0;
let gameActive = false;
let dropSpeed = 3000;
let doubleGrowth = false;
let basketWidth = 100;
let basketDoubles = 0;
let scores = JSON.parse(localStorage.getItem('suprGrowthScores')) || [];
let logoSize = 100;
let isMuted = false;
let pointMultiplier = 1;
let isShielded = false;
let shieldTime = 0;
let multiplierTime = 0;

// DOM elements
const splashScreen = document.getElementById('splash-screen');
const gameScreen = document.getElementById('game-screen');
const startButton = document.getElementById('start-button');
const usernameInput = document.getElementById('username');
const playerName = document.getElementById('player-name');
const currentScore = document.getElementById('current-score');
const superseedLogo = document.getElementById('superseed-logo');
const basket = document.getElementById('basket');
const shieldBar = document.getElementById('shield-bar');
const multiplierBar = document.getElementById('multiplier-bar');
const leftPanel = document.getElementById('left-panel');
const scoreList = document.getElementById('score-list');
const gameOverScreen = document.getElementById('game-over');
const finalScore = document.getElementById('final-score');
const topScoresList = document.getElementById('top-scores-list');
const resetButton = document.getElementById('reset-button');
const particlesContainer = document.getElementById('particles');
const soundToggle = document.getElementById('sound-toggle');
const themeToggle = document.getElementById('theme-toggle');
const mysteryPopup = document.getElementById('mystery-popup');
const burnDebtBtn = document.getElementById('burn-debt');
const supercollateralBtn = document.getElementById('supercollateral');
const proofRepaymentBtn = document.getElementById('proof-repayment');

// Audio elements
const soundSeed = document.getElementById('sound-seed');
const soundCorn = document.getElementById('sound-corn');
const soundCarrot = document.getElementById('sound-carrot');
const soundWater = document.getElementById('sound-water');
const soundWorm = document.getElementById('sound-worm');
const soundMystery = document.getElementById('sound-mystery');

// Item types
const itemTypes = [
    { emoji: '🌱', points: 50 },
    { emoji: '🌽', points: 20 },
    { emoji: '🥕', points: 30 },
    { emoji: '💧', points: 5 },
    { emoji: '🪱', points: 0 },
    { emoji: '🎁', points: 0 }
];

// Theme toggle
themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme', !isDark);
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Sound toggle
soundToggle.addEventListener('click', () => {
    isMuted = !isMuted;
    soundToggle.textContent = isMuted ? '🔇' : '🔊';
});

// Start game
startButton.addEventListener('click', () => {
    username = usernameInput.value.trim() || 'Player';
    splashScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    playerName.textContent = username;
    startGame();
});

// Reset game
resetButton.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    startGame();
});

// Move basket with mouse
leftPanel.addEventListener('mousemove', (e) => {
    if (!gameActive) return;
    const panelWidth = leftPanel.offsetWidth;
    let newLeft = e.clientX - leftPanel.getBoundingClientRect().left - basketWidth / 2;
    if (newLeft < 0) newLeft = 0;
    if (newLeft > panelWidth - basketWidth) newLeft = panelWidth - basketWidth;
    basket.style.left = `${newLeft}px`;
});

// Initialize game
function startGame() {
    gameActive = true;
    score = 0;
    growthStage = 0;
    dropSpeed = 3000;
    doubleGrowth = false;
    basketWidth = 100;
    basketDoubles = 0;
    pointMultiplier = 1;
    isShielded = false;
    shieldTime = 0;
    multiplierTime = 0;
    basket.style.width = `${basketWidth}px`;
    basket.classList.remove('wiggle', 'destroy', 'shielded');
    shieldBar.classList.add('hidden');
    multiplierBar.classList.add('hidden');
    superseedLogo.style.width = `${logoSize}px`;
    superseedLogo.classList.remove('wiggle');
    currentScore.textContent = score;
    gameOverScreen.classList.add('hidden');
    mysteryPopup.classList.add('hidden');
    dropItems();
    dropItems();
    updateLeaderboard();
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
        themeToggle.textContent = '☀️';
    }
}

// Drop items
function dropItems() {
    if (!gameActive) return;

    const probabilities = [0.22, 0.30, 0.25, 0.10, 0.10, 0.03];
    const random = Math.random();
    let itemType;
    if (random < probabilities[0]) itemType = itemTypes[0];
    else if (random < probabilities[0] + probabilities[1]) itemType = itemTypes[1];
    else if (random < probabilities[0] + probabilities[1] + probabilities[2]) itemType = itemTypes[2];
    else if (random < probabilities[0] + probabilities[1] + probabilities[2] + probabilities[3]) itemType = itemTypes[3];
    else if (random < probabilities[0] + probabilities[1] + probabilities[2] + probabilities[3] + probabilities[4]) itemType = itemTypes[4];
    else itemType = itemTypes[5];

    const item = document.createElement('div');
    item.classList.add('falling-item');
    item.textContent = itemType.emoji;
    item.style.left = `${Math.random() * (leftPanel.offsetWidth - 50)}px`;
    item.style.top = '0px';
    leftPanel.appendChild(item);

    const fallDuration = dropSpeed / 1000;
    item.style.transition = `top ${fallDuration}s`;
    item.style.top = `${leftPanel.offsetHeight}px`;

    const checkCollision = setInterval(() => {
        const basketRect = basket.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        if (itemRect.left < basketRect.right && 
            itemRect.right > basketRect.left &&
            itemRect.bottom > basketRect.top && 
            itemRect.top < basketRect.bottom) {
            handleCatch(itemType);
            item.remove();
            clearInterval(checkCollision);
        }
    }, 16);

    setTimeout(() => {
        if (item.parentNode) item.remove();
        clearInterval(checkCollision);
    }, fallDuration * 1000);

    setTimeout(dropItems, Math.random() * dropSpeed);
}

// Handle catching items
function handleCatch(itemType) {
    if (itemType.points > 0 && itemType.emoji !== '💧' && itemType.emoji !== '🎁') {
        score += itemType.points * pointMultiplier;
        growthStage += doubleGrowth ? 2 : 1;
        if (!isMuted) {
            if (itemType.emoji === '🌱') soundSeed.play();
            else if (itemType.emoji === '🌽') soundCorn.play();
            else if (itemType.emoji === '🥕') soundCarrot.play();
        }
        updateGrowth();
    } else if (itemType.emoji === '💧') {
        score += itemType.points * pointMultiplier;
        basketWidth = 100 + Math.random() * 200;
        basket.style.width = `${basketWidth}px`;
        if (!isMuted) soundWater.play();
        updateGrowth();
    } else if (itemType.emoji === '🪱') {
        if (isShielded) return;
        if (!isMuted) soundWorm.play();
        basket.classList.add('destroy');
        triggerSplash();
        setTimeout(() => {
            endGame();
            basket.classList.remove('destroy');
        }, 500);
    } else if (itemType.emoji === '🎁') {
        gameActive = false;
        mysteryPopup.classList.remove('hidden');
        if (!isMuted) soundMystery.play();
        basket.classList.add('wiggle');
        setTimeout(() => basket.classList.remove('wiggle'), 500);
    }
    currentScore.textContent = score;
}

// Mystery Box choices
burnDebtBtn.addEventListener('click', () => {
    score = Math.floor(score * 0.75);
    pointMultiplier = 2;
    multiplierTime = 300; // 30 seconds (300 ticks at 100ms)
    multiplierBar.classList.remove('hidden');
    multiplierBar.style.width = '100%';
    resumeGame();
});

supercollateralBtn.addEventListener('click', () => {
    isShielded = true;
    shieldTime = 300; // 30 seconds (300 ticks at 100ms)
    basket.classList.add('shielded');
    shieldBar.classList.remove('hidden');
    shieldBar.style.width = '100%';
    resumeGame();
});

proofRepaymentBtn.addEventListener('click', () => {
    if (Math.random() < 0.6) {
        score *= 2;
        console.log('Proof-of-Repayment: Doubled!');
    } else {
        score = Math.floor(score / 2);
        console.log('Proof-of-Repayment: Halved!');
    }
    updateGrowth();
    resumeGame();
});

function resumeGame() {
    mysteryPopup.classList.add('hidden');
    gameActive = true;
    dropItems();
    dropItems();
}

// Shield countdown
function updateShield() {
    if (!isShielded || shieldTime <= 0) {
        isShielded = false;
        basket.classList.remove('shielded');
        shieldBar.classList.add('hidden');
        return;
    }
    shieldTime--;
    shieldBar.style.width = `${(shieldTime / 300) * 100}%`; // 300 ticks = 30s
}

// Multiplier countdown
function updateMultiplier() {
    if (multiplierTime <= 0) {
        pointMultiplier = 1;
        multiplierBar.classList.add('hidden');
        return;
    }
    multiplierTime--;
    multiplierBar.style.width = `${(multiplierTime / 300) * 100}%`; // 300 ticks = 30s
}

// Update growth
function updateGrowth() {
    const growthSteps = Math.floor(score / 100);
    const growthFactor = 1 + (growthSteps * 0.2);
    const newSize = 100 * growthFactor;

    if (newSize !== logoSize) {
        logoSize = newSize;
        superseedLogo.style.width = `${logoSize}px`;
        superseedLogo.classList.add('wiggle');
        setTimeout(() => superseedLogo.classList.remove('wiggle'), 500);
    }

    if (score > 0 && score % 100 === 0) {
        dropSpeed = Math.max(200, dropSpeed * (score >= 5000 ? 0.85 : 0.9));
    }
}

// End game
function endGame() {
    gameActive = false;
    scores.push({ username, score });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 5);
    localStorage.setItem('suprGrowthScores', JSON.stringify(scores));
    finalScore.textContent = score;
    updateLeaderboard();
    updateGameOverScores();
    gameOverScreen.classList.remove('hidden');
}

// Splash effect for worm
function triggerSplash() {
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = `${basket.offsetLeft + basketWidth / 2}px`;
        particle.style.top = `${basket.offsetTop}px`;
        const angle = Math.random() * 360;
        const distance = Math.random() * 50;
        particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
        particlesContainer.appendChild(particle);
        setTimeout(() => particle.remove(), 500);
    }
}

// Update leaderboard
function updateLeaderboard() {
    scoreList.innerHTML = '';
    scores.forEach(s => {
        const li = document.createElement('li');
        li.textContent = `${s.username}: ${s.score} $SUPR`;
        scoreList.appendChild(li);
    });
}

// Update game over top scores
function updateGameOverScores() {
    topScoresList.innerHTML = '';
    scores.forEach(s => {
        const li = document.createElement('li');
        li.textContent = `${s.username}: ${s.score} $SUPR`;
        topScoresList.appendChild(li);
    });
}

// Game loop for shield and multiplier updates
setInterval(() => {
    if (gameActive) {
        if (isShielded) updateShield();
        if (multiplierTime > 0) updateMultiplier();
    }
}, 100); // 100ms per tick
