/**
 * Aim Trainer Game
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
            case 'hit':
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'miss':
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'spawn':
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
            case 'gameOver':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
                break;
        }
    }
}

class AimTrainer {
    constructor() {
        this.mode = 'precision';
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.totalClicks = 0;
        this.targetsSpawned = 0;
        this.maxTargets = 30;
        this.timeLimit = 30;
        this.timer = 0;
        this.timerInterval = null;
        this.reactionTimes = [];
        this.targetSpawnTime = 0;
        this.isPlaying = false;
        
        this.targetSize = 60;
        this.minTargetSize = 30;
        this.maxTargetSize = 80;
        
        this.sound = new SoundManager();
        
        this.initElements();
        this.bindEvents();
        this.loadBestScore();
    }
    
    initElements() {
        this.screens = {
            intro: document.getElementById('intro'),
            game: document.getElementById('game'),
            results: document.getElementById('results')
        };
        
        this.arena = document.getElementById('gameArena');
        this.scoreEl = document.getElementById('score');
        this.progressEl = document.getElementById('progress');
        this.progressLabel = document.getElementById('progressLabel');
        this.accuracyEl = document.getElementById('accuracy');
        this.timerEl = document.getElementById('timer');
        this.bestScoreDisplay = document.getElementById('bestScoreDisplay');
        
        this.modeButtons = document.querySelectorAll('.mode-btn');
    }
    
    bindEvents() {
        document.getElementById('startGame').addEventListener('click', () => {
            this.sound.init();
            this.startGame();
        });
        document.getElementById('playAgain').addEventListener('click', () => this.startGame());
        document.getElementById('backToMenu').addEventListener('click', () => this.showScreen('intro'));
        
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.mode = btn.dataset.mode;
                this.updateBestScoreDisplay();
            });
        });
        
        this.arena.addEventListener('click', (e) => this.handleArenaClick(e));
        
        // Custom crosshair
        this.arena.addEventListener('mousemove', (e) => {
            const crosshair = document.getElementById('crosshair');
            crosshair.style.left = e.clientX + 'px';
            crosshair.style.top = e.clientY + 'px';
        });
    }
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens[screenName].classList.add('active');
    }
    
    startGame() {
        this.resetGame();
        this.showScreen('game');
        this.isPlaying = true;
        
        if (this.mode === 'speed') {
            this.progressLabel.textContent = 'Hits';
            this.startTimer();
            this.spawnTarget();
        } else {
            this.progressLabel.textContent = 'Targets';
            this.spawnTarget();
            this.startTimer();
        }
    }
    
    resetGame() {
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.totalClicks = 0;
        this.targetsSpawned = 0;
        this.timer = 0;
        this.reactionTimes = [];
        this.isPlaying = false;
        
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        // Clear arena
        this.arena.querySelectorAll('.target, .hit-indicator, .miss-indicator').forEach(el => el.remove());
        
        this.updateHUD();
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
            
            if (this.mode === 'speed' && this.timer >= this.timeLimit) {
                this.endGame();
            }
            
            // Move targets in tracking mode
            if (this.mode === 'tracking') {
                this.moveTargets();
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        this.timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    spawnTarget() {
        if (!this.isPlaying) return;
        
        const padding = 100;
        const arenaRect = this.arena.getBoundingClientRect();
        
        // Variable size for difficulty
        let size = this.targetSize;
        if (this.mode === 'precision') {
            // Smaller targets as game progresses
            size = this.maxTargetSize - (this.targetsSpawned / this.maxTargets) * (this.maxTargetSize - this.minTargetSize);
        } else if (this.mode === 'tracking') {
            size = 50;
        }
        
        const maxX = arenaRect.width - padding * 2 - size;
        const maxY = arenaRect.height - padding * 2 - size;
        
        const x = padding + Math.random() * Math.max(0, maxX);
        const y = padding + Math.random() * Math.max(0, maxY);
        
        const target = document.createElement('div');
        target.className = 'target' + (this.mode === 'tracking' ? ' moving' : '');
        target.style.width = size + 'px';
        target.style.height = size + 'px';
        target.style.left = x + 'px';
        target.style.top = y + 'px';
        
        target.innerHTML = `
            <div class="target-inner">
                <div class="target-ring"></div>
                <div class="target-ring"></div>
                <div class="target-ring"></div>
            </div>
        `;
        
        this.arena.appendChild(target);
        this.targetsSpawned++;
        this.targetSpawnTime = Date.now();
        this.sound.play('spawn');
        
        // For speed mode, spawn multiple targets
        if (this.mode === 'speed') {
            const activeTargets = this.arena.querySelectorAll('.target:not(.hit)').length;
            if (activeTargets < 3) {
                setTimeout(() => this.spawnTarget(), 200);
            }
        }
    }
    
    moveTargets() {
        const targets = this.arena.querySelectorAll('.target:not(.hit)');
        const arenaRect = this.arena.getBoundingClientRect();
        const padding = 100;
        
        targets.forEach(target => {
            const size = parseInt(target.style.width);
            const maxX = arenaRect.width - padding * 2 - size;
            const maxY = arenaRect.height - padding * 2 - size;
            const newX = padding + Math.random() * Math.max(0, maxX);
            const newY = padding + Math.random() * Math.max(0, maxY);
            target.style.left = newX + 'px';
            target.style.top = newY + 'px';
        });
    }
    
    handleArenaClick(e) {
        if (!this.isPlaying) return;
        
        // Find if we clicked on a target
        const target = e.target.closest('.target');
        
        if (target && !target.classList.contains('hit')) {
            // Hit a target!
            const reactionTime = Date.now() - this.targetSpawnTime;
            this.reactionTimes.push(reactionTime);
            
            // Score based on reaction time and accuracy
            const baseScore = 100;
            const timeBonus = Math.max(0, 50 - Math.floor(reactionTime / 20));
            const points = baseScore + timeBonus;
            
            this.score += points;
            this.hits++;
            this.totalClicks++;
            
            this.sound.play('hit');
            
            // Show hit indicator
            const arenaRect = this.arena.getBoundingClientRect();
            const indicator = document.createElement('div');
            indicator.className = 'hit-indicator';
            indicator.textContent = `+${points}`;
            indicator.style.left = e.clientX - arenaRect.left + 'px';
            indicator.style.top = e.clientY - arenaRect.top - 20 + 'px';
            this.arena.appendChild(indicator);
            setTimeout(() => indicator.remove(), 500);
            
            target.classList.add('hit');
            setTimeout(() => target.remove(), 200);
            
            this.updateHUD();
            
            // Check if game should end
            if (this.mode !== 'speed' && this.hits >= this.maxTargets) {
                this.endGame();
            } else {
                setTimeout(() => this.spawnTarget(), 100);
            }
        } else if (!target) {
            // Missed - clicked on arena background
            this.misses++;
            this.totalClicks++;
            
            this.sound.play('miss');
            
            // Show miss indicator
            const arenaRect = this.arena.getBoundingClientRect();
            const indicator = document.createElement('div');
            indicator.className = 'miss-indicator';
            indicator.style.left = e.clientX - arenaRect.left - 10 + 'px';
            indicator.style.top = e.clientY - arenaRect.top - 10 + 'px';
            this.arena.appendChild(indicator);
            setTimeout(() => indicator.remove(), 300);
            
            this.updateHUD();
        }
    }
    
    updateHUD() {
        this.scoreEl.textContent = this.score;
        
        if (this.mode === 'speed') {
            this.progressEl.textContent = this.hits;
        } else {
            this.progressEl.textContent = `${this.hits}/${this.maxTargets}`;
        }
        
        const accuracy = this.totalClicks > 0 ? Math.round((this.hits / this.totalClicks) * 100) : 100;
        this.accuracyEl.textContent = accuracy + '%';
    }
    
    endGame() {
        this.isPlaying = false;
        clearInterval(this.timerInterval);
        
        this.sound.play('gameOver');
        
        // Clear remaining targets
        this.arena.querySelectorAll('.target').forEach(t => t.remove());
        
        const accuracy = this.totalClicks > 0 ? Math.round((this.hits / this.totalClicks) * 100) : 0;
        const avgReaction = this.reactionTimes.length > 0 
            ? Math.round(this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length)
            : 0;
        
        // Update results
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('targetsHit').textContent = this.hits;
        document.getElementById('targetsMissed').textContent = this.misses;
        document.getElementById('avgReaction').textContent = avgReaction + 'ms';
        document.getElementById('finalAccuracy').textContent = accuracy;
        
        // Animate accuracy ring
        const ring = document.getElementById('accuracyRing');
        const circumference = 326.7;
        ring.style.strokeDashoffset = circumference - (accuracy / 100) * circumference;
        
        // Update ring color based on accuracy
        if (accuracy >= 80) {
            ring.style.stroke = '#2ed573';
            document.getElementById('resultsTitle').textContent = 'Excellent!';
            document.getElementById('resultsTitle').style.color = '#2ed573';
            document.getElementById('resultsIcon').textContent = '🎯';
        } else if (accuracy >= 60) {
            ring.style.stroke = '#f7a600';
            document.getElementById('resultsTitle').textContent = 'Good Job!';
            document.getElementById('resultsTitle').style.color = '#f7a600';
            document.getElementById('resultsIcon').textContent = '👍';
        } else {
            ring.style.stroke = '#ff4757';
            document.getElementById('resultsTitle').textContent = 'Keep Practicing!';
            document.getElementById('resultsTitle').style.color = '#ff4757';
            document.getElementById('resultsIcon').textContent = '💪';
        }
        
        // Check for best score
        const bestKey = `aim_best_${this.mode}`;
        const best = parseInt(localStorage.getItem(bestKey) || '0');
        const newRecord = document.getElementById('newRecord');
        
        if (accuracy > best) {
            localStorage.setItem(bestKey, accuracy);
            this.updateBestScoreDisplay();
            newRecord.style.display = 'block';
        } else {
            newRecord.style.display = 'none';
        }
        
        this.showScreen('results');
    }
    
    loadBestScore() {
        this.updateBestScoreDisplay();
    }
    
    updateBestScoreDisplay() {
        const bestKey = `aim_best_${this.mode}`;
        const best = localStorage.getItem(bestKey);
        this.bestScoreDisplay.textContent = best ? best + '%' : '---%';
    }
}

document.addEventListener('DOMContentLoaded', () => new AimTrainer());
