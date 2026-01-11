/**
 * Memory Match Game
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
            case 'flip':
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'match':
                osc.frequency.setValueAtTime(523, now);
                gain.gain.setValueAtTime(0.2, now);
                osc.start(now);
                setTimeout(() => {
                    osc.frequency.setValueAtTime(659, this.ctx.currentTime);
                }, 100);
                setTimeout(() => {
                    osc.frequency.setValueAtTime(784, this.ctx.currentTime);
                }, 200);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.stop(now + 0.4);
                break;
            case 'noMatch':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
                break;
            case 'win':
                const notes = [523, 659, 784, 1047];
                notes.forEach((freq, i) => {
                    const o = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    o.connect(g);
                    g.connect(this.ctx.destination);
                    o.frequency.setValueAtTime(freq, now + i * 0.15);
                    g.gain.setValueAtTime(0.2, now + i * 0.15);
                    g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
                    o.start(now + i * 0.15);
                    o.stop(now + i * 0.15 + 0.3);
                });
                return;
        }
    }
}

class MemoryGame {
    constructor() {
        this.gridSize = 4;
        this.theme = 'emoji';
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.isLocked = false;
        
        this.sound = new SoundManager();
        
        this.themes = {
            emoji: ['😀', '😎', '🥳', '😍', '🤩', '😜', '🤗', '😇', '🤠', '🥸', '😈', '👻', '👽', '🤖', '💀', '🎃', '🦄', '🐉', '🌈', '⭐', '🔥', '💎', '🎵', '🎮', '🚀', '🌙', '🍀', '🎯', '💡', '🎪', '🎭', '🎨'],
            tech: ['💻', '🖥️', '📱', '⌨️', '🖱️', '💾', '📀', '🔌', '🔋', '📡', '🛰️', '🤖', '⚙️', '🔧', '💡', '🔬', '🧬', '⚡', '🌐', '☁️', '🔒', '🔑', '📊', '📈', '🎮', '🕹️', '📷', '🎬', '🎧', '🎤', '📺', '⏰'],
            animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞'],
            food: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧀', '🥚', '🍳', '🥓', '🥞', '🧇', '🍖', '🍗', '🥩', '🍤', '🍣', '🍱', '🍛', '🍜', '🍝', '🍰', '🎂', '🧁', '🍩', '🍪', '🍫', '🍬', '🍭', '🍮', '🍯', '🍓', '🍒']
        };
        
        this.initElements();
        this.bindEvents();
        this.loadBestScore();
    }
    
    initElements() {
        this.screens = {
            intro: document.getElementById('intro'),
            game: document.getElementById('game'),
            victory: document.getElementById('victory')
        };
        
        this.gameBoard = document.getElementById('gameBoard');
        this.timerEl = document.getElementById('timer');
        this.movesEl = document.getElementById('moves');
        this.matchedEl = document.getElementById('matched');
        this.bestScoreDisplay = document.getElementById('bestScoreDisplay');
        
        this.diffButtons = document.querySelectorAll('.diff-btn');
        this.themeButtons = document.querySelectorAll('.theme-btn');
    }
    
    bindEvents() {
        document.getElementById('startGame').addEventListener('click', () => {
            this.sound.init();
            this.startGame();
        });
        document.getElementById('restartGame').addEventListener('click', () => this.restartGame());
        document.getElementById('backToMenu').addEventListener('click', () => this.showScreen('intro'));
        document.getElementById('playAgain').addEventListener('click', () => this.restartGame());
        document.getElementById('changeDifficulty').addEventListener('click', () => this.showScreen('intro'));
        
        this.diffButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.diffButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.gridSize = parseInt(btn.dataset.size);
                this.updateBestScoreDisplay();
            });
        });
        
        this.themeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.themeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.theme = btn.dataset.theme;
            });
        });
    }
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens[screenName].classList.add('active');
        
        if (screenName === 'intro') {
            this.stopTimer();
        }
    }
    
    startGame() {
        this.resetGame();
        this.createCards();
        this.renderBoard();
        this.showScreen('game');
        this.startTimer();
    }
    
    restartGame() {
        this.resetGame();
        this.createCards();
        this.renderBoard();
        this.showScreen('game');
        this.startTimer();
    }
    
    resetGame() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.timer = 0;
        this.isLocked = false;
        this.stopTimer();
        this.updateStats();
    }
    
    createCards() {
        const totalPairs = (this.gridSize * this.gridSize) / 2;
        const symbols = this.themes[this.theme].slice(0, totalPairs);
        
        // Create pairs
        const cardSymbols = [...symbols, ...symbols];
        
        // Shuffle
        for (let i = cardSymbols.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cardSymbols[i], cardSymbols[j]] = [cardSymbols[j], cardSymbols[i]];
        }
        
        this.cards = cardSymbols.map((symbol, index) => ({
            id: index,
            symbol: symbol,
            isFlipped: false,
            isMatched: false
        }));
        
        this.matchedEl.textContent = `0/${totalPairs}`;
    }
    
    renderBoard() {
        this.gameBoard.className = `game-board size-${this.gridSize}`;
        this.gameBoard.innerHTML = '';
        
        this.cards.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.dataset.id = card.id;
            
            cardEl.innerHTML = `
                <div class="card-inner">
                    <div class="card-front"></div>
                    <div class="card-back">${card.symbol}</div>
                </div>
            `;
            
            cardEl.addEventListener('click', () => this.flipCard(card.id));
            this.gameBoard.appendChild(cardEl);
        });
    }
    
    flipCard(cardId) {
        if (this.isLocked) return;
        
        const card = this.cards[cardId];
        if (card.isFlipped || card.isMatched) return;
        if (this.flippedCards.length >= 2) return;
        
        // Flip the card
        card.isFlipped = true;
        this.flippedCards.push(card);
        
        this.sound.play('flip');
        
        const cardEl = this.gameBoard.querySelector(`[data-id="${cardId}"]`);
        cardEl.classList.add('flipped');
        
        // Check for match
        if (this.flippedCards.length === 2) {
            this.moves++;
            this.updateStats();
            this.checkMatch();
        }
    }
    
    checkMatch() {
        const [card1, card2] = this.flippedCards;
        
        if (card1.symbol === card2.symbol) {
            // Match!
            card1.isMatched = true;
            card2.isMatched = true;
            this.matchedPairs++;
            
            this.sound.play('match');
            
            const cardEl1 = this.gameBoard.querySelector(`[data-id="${card1.id}"]`);
            const cardEl2 = this.gameBoard.querySelector(`[data-id="${card2.id}"]`);
            cardEl1.classList.add('matched');
            cardEl2.classList.add('matched');
            
            this.updateStats();
            this.flippedCards = [];
            
            // Check for win
            if (this.matchedPairs === this.cards.length / 2) {
                setTimeout(() => this.endGame(), 500);
            }
        } else {
            // No match
            this.isLocked = true;
            this.sound.play('noMatch');
            
            setTimeout(() => {
                card1.isFlipped = false;
                card2.isFlipped = false;
                
                const cardEl1 = this.gameBoard.querySelector(`[data-id="${card1.id}"]`);
                const cardEl2 = this.gameBoard.querySelector(`[data-id="${card2.id}"]`);
                cardEl1.classList.remove('flipped');
                cardEl2.classList.remove('flipped');
                
                this.flippedCards = [];
                this.isLocked = false;
            }, 1000);
        }
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateStats();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateStats() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        this.timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.movesEl.textContent = this.moves;
        this.matchedEl.textContent = `${this.matchedPairs}/${this.cards.length / 2}`;
    }
    
    calculateScore() {
        // Score formula: base points - time penalty - move penalty
        const basePoints = this.gridSize * 1000;
        const timePenalty = this.timer * 2;
        const movePenalty = this.moves * 5;
        return Math.max(0, basePoints - timePenalty - movePenalty);
    }
    
    endGame() {
        this.stopTimer();
        this.sound.play('win');
        
        const score = this.calculateScore();
        
        document.getElementById('finalTime').textContent = this.timerEl.textContent;
        document.getElementById('finalMoves').textContent = this.moves;
        document.getElementById('finalScore').textContent = score;
        
        // Check for best score
        const bestScore = this.getBestScore();
        const newRecordEl = document.getElementById('newRecord');
        
        if (!bestScore || score > bestScore) {
            this.saveBestScore(score);
            newRecordEl.style.display = 'block';
            this.celebrate();
        } else {
            newRecordEl.style.display = 'none';
        }
        
        this.showScreen('victory');
    }
    
    getBestScore() {
        const key = `memory_best_${this.gridSize}`;
        return parseInt(localStorage.getItem(key)) || 0;
    }
    
    saveBestScore(score) {
        const key = `memory_best_${this.gridSize}`;
        localStorage.setItem(key, score);
        this.updateBestScoreDisplay();
    }
    
    loadBestScore() {
        this.updateBestScoreDisplay();
    }
    
    updateBestScoreDisplay() {
        const best = this.getBestScore();
        this.bestScoreDisplay.textContent = best ? best : '---';
        
        // Update label
        const label = this.bestScoreDisplay.previousElementSibling;
        if (label) {
            label.textContent = `Best Score (${this.gridSize}×${this.gridSize})`;
        }
    }
    
    celebrate() {
        const colors = ['#f7a600', '#f54e00', '#22c55e', '#3b82f6', '#a855f7'];
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: fixed;
                    width: 10px;
                    height: 10px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    left: ${Math.random() * 100}vw;
                    top: -10px;
                    border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                    z-index: 1000;
                    pointer-events: none;
                    animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
                `;
                document.body.appendChild(confetti);
                setTimeout(() => confetti.remove(), 4000);
            }, i * 30);
        }
        
        if (!document.querySelector('#confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = `@keyframes confettiFall { to { transform: translateY(100vh) rotate(720deg); opacity: 0; } }`;
            document.head.appendChild(style);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new MemoryGame());
