/**
 * Snake Game - Modern Edition
 */

class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }
    
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    
    play(type) {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        const now = this.ctx.currentTime;
        
        switch(type) {
            case 'eat':
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'special':
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'gameOver':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
                break;
            case 'move':
                osc.frequency.setValueAtTime(150, now);
                gain.gain.setValueAtTime(0.02, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                osc.start(now);
                osc.stop(now + 0.03);
                break;
        }
    }
}

class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.gridSize = 20;
        this.snake = [];
        this.food = null;
        this.specialFood = null;
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snake_high') || '0');
        this.gameLoop = null;
        this.isPaused = false;
        this.isGameOver = false;
        this.speed = 120;
        this.startTime = 0;
        this.foodEaten = 0;
        
        // Touch handling
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        this.sound = new SoundManager();
        
        this.initElements();
        this.bindEvents();
        this.resizeCanvas();
        this.updateHighScoreDisplay();
    }
    
    initElements() {
        this.screens = {
            intro: document.getElementById('intro'),
            game: document.getElementById('game'),
            gameover: document.getElementById('gameover')
        };
        
        this.scoreEl = document.getElementById('score');
        this.highScoreEl = document.getElementById('highScore');
        this.bestScoreDisplay = document.getElementById('bestScoreDisplay');
        this.pauseOverlay = document.getElementById('pauseOverlay');
    }
    
    bindEvents() {
        document.getElementById('startGame').addEventListener('click', () => {
            this.sound.init();
            this.startGame();
        });
        document.getElementById('playAgain').addEventListener('click', () => this.startGame());
        document.getElementById('backToMenu').addEventListener('click', () => this.showScreen('intro'));
        
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Mobile controls
        const mobileButtons = document.querySelectorAll('.control-btn');
        mobileButtons.forEach(btn => {
            btn.addEventListener('click', () => this.setDirection(btn.dataset.dir));
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.setDirection(btn.dataset.dir);
            });
        });
        
        // Swipe controls
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens[screenName].classList.add('active');
    }
    
    resizeCanvas() {
        const wrapper = this.canvas.parentElement;
        const maxWidth = Math.min(window.innerWidth - 40, 500);
        const maxHeight = window.innerHeight - 200;
        const size = Math.min(maxWidth, maxHeight);
        
        // Make sure grid fits evenly
        const gridCount = Math.floor(size / this.gridSize);
        this.canvas.width = gridCount * this.gridSize;
        this.canvas.height = gridCount * this.gridSize;
        this.cols = gridCount;
        this.rows = gridCount;
    }
    
    startGame() {
        this.resizeCanvas();
        this.resetGame();
        this.showScreen('game');
        this.gameLoop = setInterval(() => this.update(), this.speed);
    }
    
    resetGame() {
        const midX = Math.floor(this.cols / 2);
        const midY = Math.floor(this.rows / 2);
        
        this.snake = [
            { x: midX, y: midY },
            { x: midX - 1, y: midY },
            { x: midX - 2, y: midY }
        ];
        
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.foodEaten = 0;
        this.speed = 120;
        this.isPaused = false;
        this.isGameOver = false;
        this.startTime = Date.now();
        this.specialFood = null;
        
        this.scoreEl.textContent = '0';
        this.pauseOverlay.classList.remove('active');
        
        this.spawnFood();
    }
    
    spawnFood() {
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows)
            };
        } while (this.isSnakePosition(pos.x, pos.y));
        
        this.food = pos;
        
        // Chance for special food
        if (Math.random() < 0.15 && !this.specialFood) {
            let specialPos;
            do {
                specialPos = {
                    x: Math.floor(Math.random() * this.cols),
                    y: Math.floor(Math.random() * this.rows)
                };
            } while (this.isSnakePosition(specialPos.x, specialPos.y) || 
                     (specialPos.x === pos.x && specialPos.y === pos.y));
            
            this.specialFood = { ...specialPos, timer: 100 };
        }
    }
    
    isSnakePosition(x, y) {
        return this.snake.some(seg => seg.x === x && seg.y === y);
    }
    
    handleKeydown(e) {
        if (this.screens.game.classList.contains('active')) {
            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePause();
                return;
            }
            
            if (this.isPaused) return;
            
            const dirMap = {
                'ArrowUp': 'up', 'KeyW': 'up',
                'ArrowDown': 'down', 'KeyS': 'down',
                'ArrowLeft': 'left', 'KeyA': 'left',
                'ArrowRight': 'right', 'KeyD': 'right'
            };
            
            if (dirMap[e.code]) {
                e.preventDefault();
                this.setDirection(dirMap[e.code]);
            }
        }
    }
    
    setDirection(dir) {
        const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
        if (opposites[dir] !== this.direction) {
            this.nextDirection = dir;
        }
    }
    
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }
    
    handleTouchEnd(e) {
        if (this.isPaused) return;
        
        const deltaX = e.changedTouches[0].clientX - this.touchStartX;
        const deltaY = e.changedTouches[0].clientY - this.touchStartY;
        const minSwipe = 30;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > minSwipe) {
                this.setDirection(deltaX > 0 ? 'right' : 'left');
            }
        } else {
            if (Math.abs(deltaY) > minSwipe) {
                this.setDirection(deltaY > 0 ? 'down' : 'up');
            }
        }
    }
    
    togglePause() {
        if (this.isGameOver) return;
        
        this.isPaused = !this.isPaused;
        this.pauseOverlay.classList.toggle('active', this.isPaused);
    }
    
    update() {
        if (this.isPaused || this.isGameOver) return;
        
        this.direction = this.nextDirection;
        
        // Move snake
        const head = { ...this.snake[0] };
        
        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }
        
        // Check wall collision
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
            this.endGame();
            return;
        }
        
        // Check self collision
        if (this.isSnakePosition(head.x, head.y)) {
            this.endGame();
            return;
        }
        
        this.snake.unshift(head);
        
        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.foodEaten++;
            this.scoreEl.textContent = this.score;
            this.sound.play('eat');
            this.spawnFood();
            
            // Speed up slightly
            if (this.speed > 60) {
                this.speed -= 2;
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => this.update(), this.speed);
            }
        } else {
            this.snake.pop();
        }
        
        // Check special food
        if (this.specialFood) {
            if (head.x === this.specialFood.x && head.y === this.specialFood.y) {
                this.score += 50;
                this.foodEaten++;
                this.scoreEl.textContent = this.score;
                this.sound.play('special');
                this.specialFood = null;
                // Grow snake by 2 extra
                this.snake.push({ ...this.snake[this.snake.length - 1] });
                this.snake.push({ ...this.snake[this.snake.length - 1] });
            } else {
                this.specialFood.timer--;
                if (this.specialFood.timer <= 0) {
                    this.specialFood = null;
                }
            }
        }
        
        this.draw();
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid (subtle)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.cols; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        for (let i = 0; i <= this.rows; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }
        
        // Draw snake
        this.snake.forEach((seg, i) => {
            const x = seg.x * this.gridSize;
            const y = seg.y * this.gridSize;
            const size = this.gridSize - 2;
            
            // Gradient from head to tail
            const ratio = i / this.snake.length;
            const r = Math.floor(0 + ratio * 0);
            const g = Math.floor(255 - ratio * 100);
            const b = Math.floor(136 - ratio * 50);
            
            this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            
            // Head is slightly larger
            if (i === 0) {
                this.ctx.shadowColor = '#00ff88';
                this.ctx.shadowBlur = 15;
                this.ctx.fillStyle = '#00ff88';
            } else {
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.beginPath();
            this.ctx.roundRect(x + 1, y + 1, size, size, 4);
            this.ctx.fill();
            
            // Eyes on head
            if (i === 0) {
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = '#0a0a0f';
                const eyeSize = 3;
                let eyeOffset = { x: 5, y: 5 };
                
                if (this.direction === 'up') eyeOffset = { x: 5, y: 4 };
                else if (this.direction === 'down') eyeOffset = { x: 5, y: 10 };
                else if (this.direction === 'left') eyeOffset = { x: 4, y: 5 };
                else eyeOffset = { x: 10, y: 5 };
                
                this.ctx.beginPath();
                this.ctx.arc(x + eyeOffset.x, y + 6, eyeSize, 0, Math.PI * 2);
                this.ctx.arc(x + this.gridSize - eyeOffset.x, y + 6, eyeSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // Draw food
        this.ctx.shadowColor = '#ff3366';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#ff3366';
        this.ctx.beginPath();
        const fx = this.food.x * this.gridSize + this.gridSize / 2;
        const fy = this.food.y * this.gridSize + this.gridSize / 2;
        this.ctx.arc(fx, fy, this.gridSize / 2 - 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // Draw special food
        if (this.specialFood) {
            const opacity = this.specialFood.timer < 30 ? (this.specialFood.timer / 30) : 1;
            this.ctx.shadowColor = '#f7a600';
            this.ctx.shadowBlur = 15;
            this.ctx.fillStyle = `rgba(247, 166, 0, ${opacity})`;
            this.ctx.beginPath();
            const sfx = this.specialFood.x * this.gridSize + this.gridSize / 2;
            const sfy = this.specialFood.y * this.gridSize + this.gridSize / 2;
            // Star shape
            this.drawStar(sfx, sfy, 5, this.gridSize / 2 - 2, this.gridSize / 4);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }
    
    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;
        
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            let x = cx + Math.cos(rot) * outerRadius;
            let y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
    }
    
    endGame() {
        this.isGameOver = true;
        clearInterval(this.gameLoop);
        
        this.sound.play('gameOver');
        
        const isNewRecord = this.score > this.highScore;
        if (isNewRecord) {
            this.highScore = this.score;
            localStorage.setItem('snake_high', this.highScore);
            this.updateHighScoreDisplay();
        }
        
        // Calculate play time
        const playTime = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(playTime / 60);
        const seconds = playTime % 60;
        
        // Update game over screen
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLength').textContent = this.snake.length;
        document.getElementById('foodEaten').textContent = this.foodEaten;
        document.getElementById('playTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const newRecord = document.getElementById('newRecord');
        const gameoverIcon = document.getElementById('gameoverIcon');
        const gameoverTitle = document.getElementById('gameoverTitle');
        
        if (isNewRecord) {
            newRecord.style.display = 'block';
            gameoverIcon.textContent = '🏆';
            gameoverTitle.textContent = 'New High Score!';
            gameoverTitle.style.color = '#f7a600';
        } else {
            newRecord.style.display = 'none';
            gameoverIcon.textContent = '💀';
            gameoverTitle.textContent = 'Game Over!';
            gameoverTitle.style.color = '#ff3366';
        }
        
        setTimeout(() => this.showScreen('gameover'), 300);
    }
    
    updateHighScoreDisplay() {
        this.highScoreEl.textContent = this.highScore;
        this.bestScoreDisplay.textContent = this.highScore;
    }
}

document.addEventListener('DOMContentLoaded', () => new SnakeGame());
