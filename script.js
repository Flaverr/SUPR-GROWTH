const items = [
    { value: '🌱', points: 50, chance: 25, speed: 1 },    // Super Sprout
    { value: '🌽', points: 20, chance: 30, speed: 1.4 },  // Corn King (1.4x)
    { value: '🥕', points: 30, chance: 20, speed: 1 },    // Carrot Cash
    { value: '💧', points: 5, chance: 10, speed: 2 },     // Liquid Loan (2x)
    { value: '🪱', points: 0, chance: 10, speed: 2 },     // Worminator (2x)
    { value: '🎁', points: 0, chance: 5, speed: 1 }       // Mystery Box
];

let gameActive = false;
let score = 0;
let basketWidth = 100;
let isMuted = false;
let multiplier = 1;
let shield = false;
let logoSize = 100;
let dropInterval = 666; // Doubled frequency (was 1333ms, now 666ms)
let scores = JSON.parse(localStorage.getItem('suprGrowthScores')) || [];

const splashScreen = document.getElementById('splash-screen');
const gameScreen = document.getElementById('game-screen');
const startButton = document.getElementById('start-button');
const usernameInput = document.getElementById('username');
const playerName = document.getElementById('player-name');
const currentScore = document.getElementById('current-score');
const superseedLogo = document.getElementById('superseed-logo');
const basket = document.getElementById('basket');
const leftPanel = document.getElementById('left-panel');
const scoreList = document.getElementById('score-list');
const gameOverScreen = document.getElementById('game-over');
const finalScore = document.getElementById('final-score');
const resetButton = document.getElementById('reset-button');
const mysteryPopup = document.getElementById('mystery-popup');
const burnDebtBtn = document.getElementById('burn-debt');
const supercollateralBtn = document.getElementById('supercollateral');
const proofRepaymentBtn = document.getElementById('proof-repayment');
const soundToggle = document.getElementById('sound-toggle');
const themeToggle = document.getElementById('theme-toggle');
const burnDebtBar = document.getElementById('burn-debt-bar');
const supercollateralBar = document.getElementById('supercollateral-bar');

const sounds = {
    seed: document.getElementById('sound-seed'),
    corn: document.getElementById('sound-corn'),
    carrot: document.getElementById('sound-carrot'),
    water: document.getElementById('sound-water'),
    worm: document.getElementById('sound-worm'),
    mystery: document.getElementById('sound-mystery')
};

// Event Listeners
startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', startGame);
soundToggle.addEventListener('click', () => {
    isMuted = !isMuted;
    soundToggle.textContent = isMuted ? '🔇' : '🔊';
});
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    themeToggle.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
});

burnDebtBtn.addEventListener('click', () => {
    score = Math.floor(score * 0.75);
    multiplier = 2;
    burnDebtBar.classList.add('active');
    setTimeout(() => {
        multiplier = 1;
        burnDebtBar.classList.remove('active');
    }, 30000);
    resumeGame();
});

supercollateralBtn.addEventListener('click', () => {
    shield = true;
    basket.classList.add('shielded');
    supercollateralBar.classList.add('active');
    setTimeout(() => {
        shield = false;
        basket.classList.remove('shielded');
        supercollateralBar.classList.remove('active');
    }, 30000);
    resumeGame();
});

proofRepaymentBtn.addEventListener('click', () => {
    score = Math.random() < 0.6 ? score * 2 : Math.floor(score / 2);
    resumeGame();
});

leftPanel.addEventListener('mousemove', (e) => {
    if (!gameActive) return;
    const panelWidth = leftPanel.offsetWidth;
    let newLeft = e.clientX - leftPanel.getBoundingClientRect().left - basketWidth / 2;
    newLeft = Math.max(0, Math.min(newLeft, panelWidth - basketWidth));
    basket.style.left = `${newLeft}px`;
});

// Ensure initial state
document.addEventListener('DOMContentLoaded', () => {
    gameOverScreen.classList.remove('active');
    mysteryPopup.classList.remove('active');
    gameScreen.classList.add('hidden');
    splashScreen.classList.remove('hidden');
});

function startGame() {
    const username = usernameInput.value.trim() || 'Player';
    gameActive = true;
    score = 0;
    basketWidth = 100;
    multiplier = 1;
    shield = false;
    logoSize = 100;
    dropInterval = 666;

    splashScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    gameOverScreen.classList.remove('active');
    mysteryPopup.classList.remove('active');
    playerName.textContent = username;
    currentScore.textContent = score;
    basket.style.width = `${basketWidth}px`;
    superseedLogo.style.width = `${logoSize}px`;
    updateLeaderboard();
    dropLoop();
}

function dropLoop() {
    if (!gameActive) return;
    dropItem();
    setTimeout(dropLoop, Math.random() * dropInterval + 166); // Adjusted for doubled frequency
}

function dropItem() {
    const totalChance = items.reduce((sum, item) => sum + item.chance, 0);
    const random = Math.random() * totalChance;
    let cumulative = 0;
    const item = items.find(i => {
        cumulative += i.chance;
        return random < cumulative;
    });

    const elem = document.createElement('div');
    elem.classList.add('falling-item');
    elem.textContent = item.value;
    const left = Math.random() * (leftPanel.offsetWidth - 50);
    elem.style.left = `${left}px`;
    elem.style.top = '0px';
    leftPanel.appendChild(elem);

    const duration = dropInterval / item.speed / 1000;
    elem.style.transition = `top ${duration}s linear`;
    elem.style.top = `${leftPanel.offsetHeight}px`;

    const collisionCheck = setInterval(() => {
        const basketRect = basket.getBoundingClientRect();
        const itemRect = elem.getBoundingClientRect();
        if (itemRect.left < basketRect.right && itemRect.right > basketRect.left &&
            itemRect.bottom > basketRect.top && itemRect.top < basketRect.bottom) {
            handleCatch(item);
            elem.remove();
            clearInterval(collisionCheck);
        }
    }, 16);

    setTimeout(() => {
        if (elem.parentNode) elem.remove();
        clearInterval(collisionCheck);
    }, duration * 1000);
}

function handleCatch(item) {
    if (item.points > 0 && item.value !== '💧' && item.value !== '🎁') {
        score += item.points * multiplier;
        if (!isMuted) {
            if (item.value === '🌱') sounds.seed.play();
            else if (item.value === '🌽') sounds.corn.play();
            else if (item.value === '🥕') sounds.carrot.play();
        }
    } else if (item.value === '💧') {
        score += item.points * multiplier;
        basketWidth = 100 + Math.random() * 500; // Increased to 500% (600px max)
        basket.style.width = `${basketWidth}px`;
        if (!isMuted) sounds.water.play();
    } else if (item.value === '🪱') {
        if (shield) return;
        if (!isMuted) sounds.worm.play();
        endGame();
    } else if (item.value === '🎁') {
        gameActive = false;
        mysteryPopup.classList.add('active');
        if (!isMuted) sounds.mystery.play();
    }
    currentScore.textContent = score;
    updateGrowth();
}

function updateGrowth() {
    const newSize = Math.min(300, 100 + score / 20);
    if (newSize !== logoSize) {
        logoSize = newSize;
        superseedLogo.style.width = `${logoSize}px`;
        superseedLogo.classList.add('wiggle');
        setTimeout(() => superseedLogo.classList.remove('wiggle'), 500);
    }
    dropInterval = Math.max(333, 666 - score / 20); // Adjusted min for doubled frequency
}

function endGame() {
    gameActive = false;
    scores.push({ username: playerName.textContent, score });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 5);
    localStorage.setItem('suprGrowthScores', JSON.stringify(scores));
    finalScore.textContent = score;
    updateLeaderboard();
    gameOverScreen.classList.add('active');
}

function resumeGame() {
    mysteryPopup.classList.remove('active');
    gameActive = true;
    dropLoop();
}

function updateLeaderboard() {
    scoreList.innerHTML = scores.map(s => `<li>${s.username}: ${s.score}</li>`).join('');
}
