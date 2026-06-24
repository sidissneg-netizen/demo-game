// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas responsive sizing
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game State
let gameState = {
    coins: 0,
    health: 100,
    score: 0,
    upgrades: {
        damage: 1,
        speed: 1,
        armor: 1
    },
    upgradeCosts: {
        damage: 50,
        speed: 50,
        armor: 50
    }
};

// Player Object
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 40,
    height: 50,
    speed: 5,
    vx: 0,
    vy: 0,
    draw() {
        // Body
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Head
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 30, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 32, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 5, this.y - 32, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Gun
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(this.x + 15, this.y - 10);
        ctx.lineTo(this.x + 40, this.y - 15);
        ctx.stroke();
    },
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Boundaries
        if (this.x - this.width/2 < 0) this.x = this.width/2;
        if (this.x + this.width/2 > canvas.width) this.x = canvas.width - this.width/2;
        if (this.y - this.height/2 < 0) this.y = this.height/2;
        if (this.y + this.height/2 > canvas.height) this.y = canvas.height - this.height/2;
    }
};

// Enemies Array
let enemies = [];
let bullets = [];
let explosions = [];

// Enemy Class
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = Math.random() * 2 + 1;
        this.health = 3;
        this.maxHealth = 3;
    }
    
    draw() {
        // Enemy body
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Enemy head
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 20, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2 - 8, (this.health / this.maxHealth) * this.width, 4);
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Bounce off walls
        if (this.x - this.width/2 < 0 || this.x + this.width/2 > canvas.width) {
            this.vx *= -1;
        }
    }
}

// Bullet Class
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = -12;
        this.width = 8;
        this.height = 15;
    }
    
    draw() {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
}

// Explosion Class
class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.maxRadius = 30;
        this.opacity = 1;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    update() {
        this.radius += 1;
        this.opacity -= 0.05;
    }
    
    isDead() {
        return this.opacity <= 0;
    }
}

// Spawn enemies
function spawnEnemy() {
    const x = Math.random() * (canvas.width - 60) + 30;
    enemies.push(new Enemy(x, -30));
}

// Shoot function
function shootEnemy() {
    bullets.push(new Bullet(player.x + 20, player.y - 15));
    playSound('shoot');
}

// Collision detection
function checkCollisions() {
    // Bullet-Enemy collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            const bullet = bullets[i];
            const enemy = enemies[j];
            
            if (bullet.x > enemy.x - enemy.width/2 && 
                bullet.x < enemy.x + enemy.width/2 &&
                bullet.y > enemy.y - enemy.height/2 && 
                bullet.y < enemy.y + enemy.height/2) {
                
                enemy.health -= gameState.upgrades.damage;
                explosions.push(new Explosion(bullet.x, bullet.y));
                bullets.splice(i, 1);
                
                if (enemy.health <= 0) {
                    enemies.splice(j, 1);
                    gameState.coins += 10 * gameState.upgrades.damage;
                    gameState.score += 100;
                    updateCoins();
                    createExplosion(enemy.x, enemy.y);
                }
                break;
            }
        }
    }
    
    // Enemy-Player collisions
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (Math.abs(player.x - enemy.x) < (player.width + enemy.width) / 2 &&
            Math.abs(player.y - enemy.y) < (player.height + enemy.height) / 2) {
            
            gameState.health -= (5 - gameState.upgrades.armor);
            enemies.splice(i, 1);
            createExplosion(enemy.x, enemy.y);
        }
    }
}

// Create multiple particles for explosion
function createExplosion(x, y) {
    for (let i = 0; i < 8; i++) {
        explosions.push(new Explosion(x, y));
    }
    playSound('explosion');
}

// Sound and vibration
function playSound(type) {
    if (!document.getElementById('soundToggle').checked) return;
    
    // Audio context for sound effects
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'shoot') {
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'explosion') {
        oscillator.frequency.value = 150;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }
}

function vibrate() {
    if (document.getElementById('vibrationToggle').checked && navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ruins in background
    drawRuins();
    
    // Draw entities
    player.draw();
    
    enemies.forEach(enemy => enemy.draw());
    bullets.forEach(bullet => bullet.draw());
    explosions.forEach(explosion => explosion.draw());
    
    // Draw health bar
    drawHealthBar();
}

function drawRuins() {
    ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    
    // Building ruins
    ctx.fillRect(50, 100, 80, 150);
    ctx.fillRect(canvas.width - 130, 120, 80, 130);
    ctx.fillRect(canvas.width / 2 - 40, 80, 80, 160);
    
    // Windows
    ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(60 + i * 20, 110 + i * 30, 12, 12);
    }
}

function drawHealthBar() {
    const barWidth = 200;
    const barHeight = 20;
    const x = 20;
    const y = 20;
    
    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Health
    ctx.fillStyle = gameState.health > 50 ? '#00FF00' : gameState.health > 25 ? '#FFD700' : '#FF0000';
    ctx.fillRect(x, y, (gameState.health / 100) * barWidth, barHeight);
    
    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    // Text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('HP: ' + gameState.health, x + 10, y + 14);
}

// Update game
function update() {
    player.update();
    
    enemies.forEach(enemy => enemy.update());
    bullets.forEach(bullet => bullet.update());
    explosions.forEach(explosion => explosion.update());
    
    // Remove off-screen bullets
    bullets = bullets.filter(b => b.y > -50);
    
    // Remove dead explosions
    explosions = explosions.filter(e => !e.isDead());
    
    // Remove off-screen enemies
    enemies = enemies.filter(e => e.y < canvas.height + 50);
    
    checkCollisions();
    
    // Spawn new enemies
    if (Math.random() < 0.02) {
        spawnEnemy();
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Keyboard controls
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === ' ') {
        shootEnemy();
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Update player movement
setInterval(() => {
    player.vx = 0;
    player.vy = 0;
    
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.vx = -player.speed;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) player.vx = player.speed;
    if (keys['ArrowUp'] || keys['w'] || keys['W']) player.vy = -player.speed;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) player.vy = player.speed;
}, 30);

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    const diffX = touchX - touchStartX;
    const diffY = touchY - touchStartY;
    
    player.vx = (diffX / 50) * player.speed;
    player.vy = (diffY / 50) * player.speed;
});

canvas.addEventListener('touchend', () => {
    player.vx = 0;
    player.vy = 0;
});

canvas.addEventListener('click', (e) => {
    shootEnemy();
    vibrate();
});

// UI Functions
function updateCoins() {
    document.getElementById('coins').textContent = gameState.coins;
    updateUpgradeCosts();
}

function updateUpgradeCosts() {
    document.getElementById('dmgLevel').textContent = gameState.upgrades.damage;
    document.getElementById('spyLevel').textContent = gameState.upgrades.speed;
    document.getElementById('armLevel').textContent = gameState.upgrades.armor;
    
    document.getElementById('dmgCost').textContent = gameState.upgradeCosts.damage;
    document.getElementById('spyCost').textContent = gameState.upgradeCosts.speed;
    document.getElementById('armCost').textContent = gameState.upgradeCosts.armor;
    
    // Enable/disable buttons
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        if (btn.textContent.includes('Урон')) {
            btn.disabled = gameState.coins < gameState.upgradeCosts.damage;
        } else if (btn.textContent.includes('Скорость')) {
            btn.disabled = gameState.coins < gameState.upgradeCosts.speed;
        } else if (btn.textContent.includes('Броня')) {
            btn.disabled = gameState.coins < gameState.upgradeCosts.armor;
        }
    });
}

function upgradeDamage() {
    if (gameState.coins >= gameState.upgradeCosts.damage) {
        gameState.coins -= gameState.upgradeCosts.damage;
        gameState.upgrades.damage++;
        gameState.upgradeCosts.damage = Math.floor(gameState.upgradeCosts.damage * 1.5);
        updateCoins();
        playSound('shoot');
    }
}

function upgradeSpeed() {
    if (gameState.coins >= gameState.upgradeCosts.speed) {
        gameState.coins -= gameState.upgradeCosts.speed;
        gameState.upgrades.speed++;
        player.speed += 1;
        gameState.upgradeCosts.speed = Math.floor(gameState.upgradeCosts.speed * 1.5);
        updateCoins();
        playSound('shoot');
    }
}

function upgradeArmor() {
    if (gameState.coins >= gameState.upgradeCosts.armor) {
        gameState.coins -= gameState.upgradeCosts.armor;
        gameState.upgrades.armor++;
        gameState.upgradeCosts.armor = Math.floor(gameState.upgradeCosts.armor * 1.5);
        updateCoins();
        playSound('shoot');
    }
}

function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

function openUpgrades() {
    document.getElementById('upgradeMenu').classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

function openDaily() {
    document.getElementById('dailyModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

function closeDailyModal() {
    document.getElementById('dailyModal').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

function openLeaderboard() {
    document.getElementById('leaderboardModal').classList.add('active');
    document.getElementById('overlay').classList.add('active');
}

function closeLeaderboard() {
    document.getElementById('leaderboardModal').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

function closeMenu() {
    document.getElementById('settingsModal').classList.remove('active');
    document.getElementById('upgradeMenu').classList.remove('active');
    document.getElementById('dailyModal').classList.remove('active');
    document.getElementById('leaderboardModal').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
}

// Timer
function updateTimer() {
    let seconds = 21660; // 6:07:40
    setInterval(() => {
        seconds--;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        document.getElementById('timer').textContent = 
            `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
}

// Start game
updateCoins();
updateTimer();
gameLoop();

// Initial spawn
for (let i = 0; i < 3; i++) {
    spawnEnemy();
}
