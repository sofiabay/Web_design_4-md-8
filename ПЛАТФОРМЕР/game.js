// ============================================
// КЛАСС ДЛЯ ОБРАБОТКИ ВВОДА
// ============================================
class InputHandler {
    constructor() {
        this.keys = {
            left: false,
            right: false,
            up: false
        };
        
        this.bindEvents();
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = true;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                case 'Space':
                    if (e.code === 'Space') e.preventDefault();
                    this.keys.up = true;
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = false;
                    break;
                case 'ArrowUp':
                case 'KeyW':
                case 'Space':
                    this.keys.up = false;
                    break;
            }
        });
    }
}

// ============================================
// КЛАСС ИГРОКА
// ============================================
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 50;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        this.jumpForce = -15;
        this.gravity = 0.5;
        this.isJumping = false;
        this.isOnGround = false;
        this.facingRight = true;
        this.color = '#FF6B6B';
        this.jumpCount = 0;
        this.maxJumps = 2;
        
        this.animationTimer = 0;
        this.animationFrame = 0;
        this.isMoving = false;
        
        this.isInvincible = false;
        this.invincibilityTimer = 0;
        this.invincibilityDuration = 1000;
    }
    
    update(deltaTime, input, platforms, canvasWidth, canvasHeight) {
        this.isMoving = false;
        
        // Движение влево/вправо
        if (input.keys.left) {
            this.velocityX = -this.speed;
            this.facingRight = false;
            this.isMoving = true;
        } else if (input.keys.right) {
            this.velocityX = this.speed;
            this.facingRight = true;
            this.isMoving = true;
        } else {
            this.velocityX *= 0.8;
        }
        
        // Прыжок
        if (input.keys.up && this.jumpCount < this.maxJumps) {
            this.velocityY = this.jumpForce;
            this.isJumping = true;
            this.jumpCount++;
        }
        
        // Гравитация
        this.velocityY += this.gravity;
        
        // Обновление позиции
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Границы canvas
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;
        
        // Коллизии с платформами
        this.checkPlatformCollisions(platforms);
        
        // Анимация
        this.updateAnimation(deltaTime);
        
        // Иммунитет
        if (this.isInvincible) {
            this.invincibilityTimer -= deltaTime;
            if (this.invincibilityTimer <= 0) {
                this.isInvincible = false;
            }
        }
    }
    
    checkPlatformCollisions(platforms) {
        this.isOnGround = false;
        
        for (const platform of platforms) {
            if (this.isColliding(platform)) {
                // Сверху
                if (this.velocityY > 0 && this.y + this.height <= platform.y + 10) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.isJumping = false;
                    this.isOnGround = true;
                    this.jumpCount = 0;
                    
                    // Пружинящая платформа
                    if (platform.bounciness > 1) {
                        this.velocityY = this.jumpForce * platform.bounciness;
                        this.isJumping = true;
                        this.jumpCount = 1;
                    }
                }
                // Снизу
                else if (this.velocityY < 0) {
                    this.y = platform.y + platform.height;
                    this.velocityY = 0;
                }
                // Сбоку
                else {
                    if (this.x < platform.x) {
                        this.x = platform.x - this.width;
                    } else {
                        this.x = platform.x + platform.width;
                    }
                    this.velocityX = 0;
                }
            }
        }
    }
    
    isColliding(platform) {
        return this.x < platform.x + platform.width &&
               this.x + this.width > platform.x &&
               this.y < platform.y + platform.height &&
               this.y + this.height > platform.y;
    }
    
    updateAnimation(deltaTime) {
        if (this.isMoving) {
            this.animationTimer += deltaTime;
            if (this.animationTimer > 100) {
                this.animationFrame = (this.animationFrame + 1) % 4;
                this.animationTimer = 0;
            }
        } else {
            this.animationFrame = 0;
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        if (this.isInvincible && Math.floor(this.invincibilityTimer / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Тело
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Глаза
        ctx.fillStyle = 'white';
        const eyeX = this.facingRight ? this.x + this.width - 15 : this.x + 15;
        ctx.fillRect(eyeX, this.y + 15, 8, 8);
        
        // Зрачки
        ctx.fillStyle = 'black';
        ctx.fillRect(eyeX + 2, this.y + 17, 4, 4);
        
        // Рот
        ctx.fillStyle = 'black';
        const mouthX = this.facingRight ? this.x + this.width - 25 : this.x + 25;
        ctx.fillRect(mouthX, this.y + 35, 10, 3);
        
        // Ноги
        ctx.fillStyle = '#4A4A4A';
        const legOffset = this.isMoving ? Math.sin(this.animationFrame * Math.PI / 2) * 5 : 0;
        ctx.fillRect(this.x + 5, this.y + this.height, 8, 15 + legOffset);
        ctx.fillRect(this.x + this.width - 13, this.y + this.height, 8, 15 - legOffset);
        
        ctx.restore();
    }
    
    hit() {
        if (!this.isInvincible) {
            this.isInvincible = true;
            this.invincibilityTimer = this.invincibilityDuration;
            this.velocityY = -10;
        }
    }
    
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.isOnGround = false;
        this.jumpCount = 0;
        this.isInvincible = false;
    }
}

// ============================================
// КЛАСС ПЛАТФОРМЫ
// ============================================
class Platform {
    constructor(x, y, width, height, color = '#228B22') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.velocityX = 0;
        this.velocityY = 1;
        this.bounciness = 1.0;
    }
    
    update(deltaTime, canvasWidth) {
        this.x += this.velocityX;
        
        if (this.velocityX !== 0) {
            if (this.x < 0 || this.x + this.width > canvasWidth) {
                this.velocityX *= -1;
            }
        }
        
        this.y += this.velocityY;
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Текстура
        ctx.fillStyle = this.getDarkerColor(this.color);
        ctx.fillRect(this.x, this.y, this.width, 3);
        ctx.fillRect(this.x, this.y, 3, this.height);
        ctx.fillRect(this.x + this.width - 3, this.y, 3, this.height);
        
        // Пружинящие платформы
        if (this.bounciness > 1.0) {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Движущиеся платформы
        if (this.velocityX !== 0) {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            const direction = this.velocityX > 0 ? 1 : -1;
            ctx.moveTo(this.x + this.width/2 - 5 * direction, this.y + this.height/2 - 5);
            ctx.lineTo(this.x + this.width/2 + 5 * direction, this.y + this.height/2);
            ctx.lineTo(this.x + this.width/2 - 5 * direction, this.y + this.height/2 + 5);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    getDarkerColor(color) {
        const darkColors = {
            '#228B22': '#1A6B1A',
            '#4169E1': '#3150B0',
            '#FFD700': '#CCAC00',
            '#8B4513': '#6B3410'
        };
        return darkColors[color] || color;
    }
}

// ============================================
// КЛАСС МОНЕТЫ
// ============================================
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.floatOffset = 0;
        this.floatSpeed = 0.05;
        this.floatAmplitude = 5;
        this.rotation = 0;
    }
    
    update(deltaTime) {
        this.floatOffset = Math.sin(Date.now() * this.floatSpeed) * this.floatAmplitude;
        this.rotation += 0.05;
    }
    
    draw(ctx) {
        const drawY = this.y + this.floatOffset;
        
        ctx.save();
        ctx.translate(this.x + this.width/2, drawY + this.height/2);
        ctx.rotate(this.rotation);
        
        // Внешний круг
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Внутренний круг
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath();
        ctx.arc(0, 0, this.width/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Блик
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(-3, -3, this.width/6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// ============================================
// КЛАСС ВРАГА
// ============================================
class Enemy {
    constructor(x, y, speed = 2) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.speed = speed;
        this.direction = x < 0 ? 1 : -1;
        this.animationTimer = 0;
    }
    
    update(deltaTime, canvasWidth) {
        this.x += this.speed * this.direction;
        this.animationTimer += deltaTime;
        this.y += Math.sin(Date.now() * 0.005) * 0.5;
    }
    
    draw(ctx) {
        // Тело
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Глаза
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x + 8, this.y + 8, 6, 6);
        ctx.fillRect(this.x + this.width - 14, this.y + 8, 6, 6);
        
        // Зрачки
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + 10, this.y + 10, 2, 2);
        ctx.fillRect(this.x + this.width - 12, this.y + 10, 2, 2);
        
        // Рот
        ctx.fillStyle = '#4B0082';
        ctx.fillRect(this.x + 10, this.y + 22, this.width - 20, 4);
    }
}

// ============================================
// КЛАСС ЧАСТИЦ
// ============================================
class Particle {
    constructor(x, y, color = '#FFFFFF') {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.color = color;
        this.life = 100;
    }
    
    update(deltaTime) {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= 1;
        this.size *= 0.98;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life / 100;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ============================================
// ОСНОВНОЙ КЛАСС ИГРЫ
// ============================================
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.player = null;
        this.platforms = [];
        this.coins = [];
        this.enemies = [];
        this.particles = [];
        
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameSpeed = 1;
        
        this.isPaused = false;
        this.isGameOver = false;
        this.isRunning = false;
        
        this.lastTime = 0;
        this.platformTimer = 0;
        this.coinTimer = 0;
        this.enemyTimer = 0;
        
        this.inputHandler = new InputHandler();
        
        this.bindEvents();
        this.init();
    }
    
    init() {
        // Создаем игрока
        this.player = new Player(this.width / 2 - 15, this.height - 100);
        
        // Создаем начальные платформы
        this.createInitialPlatforms();
        
        // Запускаем игровой цикл
        this.gameLoop(0);
        
        this.showMessage('Нажмите "Старт" чтобы начать игру!');
    }
    
    createInitialPlatforms() {
        // Пол
        this.platforms.push(new Platform(0, this.height - 30, this.width, 30, '#8B4513'));
        
        // Платформы
        for (let i = 0; i < 8; i++) {
            const width = 100 + Math.random() * 100;
            const x = Math.random() * (this.width - width);
            const y = this.height - 100 - (i * 80);
            this.platforms.push(new Platform(x, y, width, 20, '#228B22'));
        }
    }
    
    generatePlatform() {
        const width = 80 + Math.random() * 120;
        const x = Math.random() * (this.width - width);
        const y = -20;
        
        const r = Math.random();
        let platform;
        
        if (r < 0.7) {
            // Обычная платформа
            platform = new Platform(x, y, width, 20, '#228B22');
        } else if (r < 0.85) {
            // Пружинящая платформа
            platform = new Platform(x, y, width, 20, '#4169E1');
            platform.bounciness = 1.5;
        } else {
            // Движущаяся платформа
            platform = new Platform(x, y, width, 20, '#FFD700');
            platform.velocityX = (Math.random() - 0.5) * 3;
        }
        
        this.platforms.push(platform);
    }
    
    generateCoin() {
        const x = Math.random() * (this.width - 20);
        const y = Math.random() * (this.height - 100);
        this.coins.push(new Coin(x, y));
    }
    
    generateEnemy() {
        const x = Math.random() > 0.5 ? -30 : this.width + 30;
        const y = Math.random() * (this.height - 100);
        const speed = 1 + this.level * 0.3;
        this.enemies.push(new Enemy(x, y, speed));
    }
    
    update(deltaTime) {
        if (this.isPaused || this.isGameOver || !this.isRunning) return;
        
        // Таймеры
        this.platformTimer += deltaTime;
        this.coinTimer += deltaTime;
        this.enemyTimer += deltaTime;
        
        // Генерация объектов
        if (this.platformTimer > 2000) {
            this.generatePlatform();
            this.platformTimer = 0;
        }
        
        if (this.coinTimer > 1000) {
            this.generateCoin();
            this.coinTimer = 0;
        }
        
        if (this.enemyTimer > 3000 / this.gameSpeed) {
            this.generateEnemy();
            this.enemyTimer = 0;
        }
        
        // Обновление игрока
        this.player.update(deltaTime, this.inputHandler, this.platforms, this.width, this.height);
        
        // Обновление платформ
        this.platforms.forEach(platform => {
            platform.update(deltaTime, this.width);
        });
        
        // Удаление платформ за пределами
        this.platforms = this.platforms.filter(p => p.y < this.height + 100);
        
        // Обновление монет
        this.coins.forEach(coin => {
            coin.update(deltaTime);
            
            // Сбор монет
            if (this.checkCollision(this.player, coin)) {
                this.collectCoin(coin);
            }
        });
        
        // Обновление врагов
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime, this.width);
            
            // Столкновение с врагом
            if (this.checkCollision(this.player, enemy)) {
                this.hitByEnemy(enemy);
            }
        });
        
        // Удаление врагов за пределами
        this.enemies = this.enemies.filter(e => e.x > -100 && e.x < this.width + 100);
        
        // Обновление частиц
        this.particles.forEach(particle => {
            particle.update(deltaTime);
        });
        this.particles = this.particles.filter(p => p.life > 0);
        
        // Проверка падения игрока
        if (this.player.y > this.height + 100) {
            this.loseLife();
        }
        
        // Обновление сложности
        this.updateDifficulty();
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    collectCoin(coin) {
        const index = this.coins.indexOf(coin);
        if (index > -1) {
            this.coins.splice(index, 1);
            this.score += 10;
            this.updateUI();
            
            // Создание частиц
            this.createParticles(coin.x + coin.width/2, coin.y + coin.height/2, 10, '#FFD700');
            
            // Повышение уровня
            if (this.score % 100 === 0) {
                this.level++;
                this.updateUI();
                this.showMessage(`Уровень ${this.level}!`);
            }
        }
    }
    
    hitByEnemy(enemy) {
        if (this.player.isInvincible) return;
        
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
            this.player.hit();
            this.loseLife();
            this.createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 15, '#FF0000');
        }
    }
    
    loseLife() {
        this.lives--;
        this.updateUI();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.player.reset(this.width / 2 - 15, this.height - 100);
            this.showMessage(`Осталось жизней: ${this.lives}`);
        }
    }
    
    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
    
    updateDifficulty() {
        this.gameSpeed = 1 + this.level * 0.1;
    }
    
    render() {
        // Очистка canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Фон
        this.drawBackground();
        
        // Отрисовка объектов
        this.platforms.forEach(p => p.draw(this.ctx));
        this.coins.forEach(c => c.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));
        this.player.draw(this.ctx);
        
        // Overlay при паузе или конце игры
        if (this.isPaused) this.drawPauseOverlay();
        if (this.isGameOver) this.drawGameOverOverlay();
    }
    
    drawBackground() {
        // Градиентный фон
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F7FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Облака
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.drawCloud(100, 50, 60);
        this.drawCloud(300, 80, 80);
        this.drawCloud(600, 60, 70);
    }
    
    drawCloud(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.6, y, size * 0.35, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ПАУЗА', this.width / 2, this.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Нажмите ПРОБЕЛ для продолжения', this.width / 2, this.height / 2 + 50);
    }
    
    drawGameOverOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#FF4757';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ИГРА ОКОНЧЕНА', this.width / 2, this.height / 2 - 50);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '36px Arial';
        this.ctx.fillText(`Счет: ${this.score}`, this.width / 2, this.height / 2 + 20);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Нажмите "Рестарт" для новой игры', this.width / 2, this.height / 2 + 80);
    }
    
    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime || 0;
        this.lastTime = timestamp;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
    }
    
    showMessage(text) {
        const messageEl = document.getElementById('gameMessage');
        messageEl.textContent = text;
        messageEl.style.display = 'block';
        messageEl.style.color = '#00cec9';
        
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 2000);
    }
    
    startGame() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.showMessage('Игра началась! Удачи!');
        }
    }
    
    pauseGame() {
        if (this.isRunning && !this.isGameOver) {
            this.isPaused = !this.isPaused;
            document.getElementById('pauseBtn').innerHTML = this.isPaused ? 
                '<i class="fas fa-play"></i> Продолжить' : 
                '<i class="fas fa-pause"></i> Пауза';
        }
    }
    
    restartGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameSpeed = 1;
        
        this.platforms = [];
        this.coins = [];
        this.enemies = [];
        this.particles = [];
        
        this.isPaused = false;
        this.isGameOver = false;
        this.isRunning = false;
        
        this.player.reset(this.width / 2 - 15, this.height - 100);
        this.createInitialPlatforms();
        
        this.updateUI();
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> Пауза';
        document.getElementById('gameMessage').style.display = 'none';
        
        this.showMessage('Готовы? Нажмите "Старт"!');
    }
    
    gameOver() {
        this.isGameOver = true;
        this.isRunning = false;
        this.showMessage(`Игра окончена! Ваш счет: ${this.score}`);
    }
    
    bindEvents() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isRunning && !this.isGameOver) {
                e.preventDefault();
                this.pauseGame();
            }
            
            if (e.code === 'KeyR' && (this.isGameOver || !this.isRunning)) {
                this.restartGame();
            }
            
            if (e.code === 'KeyS' && !this.isRunning) {
                this.startGame();
            }
        });
    }
}

// ============================================
// ЗАПУСК ИГРЫ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    // Создаем глобальный объект игры для отладки
    window.game = new Game();
    
    console.log('Pixel Jumper загружен!');
    console.log('Управление: A/D или стрелки - движение, Space/W - прыжок');
});