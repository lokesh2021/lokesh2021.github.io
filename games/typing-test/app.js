/**
 * Typing Speed Test
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
            case 'key':
                osc.frequency.setValueAtTime(800 + Math.random() * 200, now);
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                osc.start(now);
                osc.stop(now + 0.03);
                break;
            case 'error':
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                osc.start(now);
                osc.stop(now + 0.12);
                break;
            case 'complete':
                const notes = [523, 659, 784, 1047];
                notes.forEach((freq, i) => {
                    const o = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    o.connect(g);
                    g.connect(this.ctx.destination);
                    o.frequency.setValueAtTime(freq, now + i * 0.12);
                    g.gain.setValueAtTime(0.15, now + i * 0.12);
                    g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.25);
                    o.start(now + i * 0.12);
                    o.stop(now + i * 0.12 + 0.25);
                });
                return;
            case 'tick':
                osc.frequency.setValueAtTime(1000, now);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
                osc.start(now);
                osc.stop(now + 0.02);
                break;
        }
    }
}

class TypingTest {
    constructor() {
        this.duration = 30;
        this.timer = 0;
        this.timerInterval = null;
        this.isRunning = false;
        this.isFinished = false;
        
        this.text = '';
        this.currentIndex = 0;
        this.correctChars = 0;
        this.errorChars = 0;
        this.totalTyped = 0;
        this.lastErrorCount = 0;
        
        this.sound = new SoundManager();
        
        this.quotes = [
            "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!",
            "Programming is the art of telling another human being what one wants the computer to do. Code is like humor, when you have to explain it, it's bad.",
            "The best error message is the one that never shows up. First, solve the problem, then write the code. Code never lies, comments sometimes do.",
            "Software is a great combination between artistry and engineering. Any fool can write code that a computer can understand, good programmers write code that humans can understand.",
            "Talk is cheap, show me the code. Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code.",
            "The most important property of a program is whether it accomplishes the intention of its user. Simplicity is the soul of efficiency.",
            "Before software can be reusable it first has to be usable. The function of good software is to make the complex appear to be simple.",
            "One of the best programming skills you can have is knowing when to walk away for a while. Debugging is twice as hard as writing the code in the first place.",
            "Good code is its own best documentation. As you're about to add a comment, ask yourself, how can I improve the code so that this comment isn't needed?",
            "Programming isn't about what you know; it's about what you can figure out. The only way to learn a new programming language is by writing programs in it."
        ];
        
        this.initElements();
        this.bindEvents();
        this.loadBestScores();
    }
    
    initElements() {
        this.screens = {
            intro: document.getElementById('intro'),
            game: document.getElementById('game'),
            results: document.getElementById('results')
        };
        
        this.textDisplay = document.getElementById('textDisplay');
        this.inputArea = document.getElementById('inputArea');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.wpmDisplay = document.getElementById('wpmDisplay');
        this.accuracyDisplay = document.getElementById('accuracyDisplay');
        
        this.durationButtons = document.querySelectorAll('.duration-btn');
    }
    
    bindEvents() {
        document.getElementById('startGame').addEventListener('click', () => {
            this.sound.init();
            this.startGame();
        });
        document.getElementById('playAgain').addEventListener('click', () => this.startGame());
        document.getElementById('backToMenu').addEventListener('click', () => this.showScreen('intro'));
        
        this.durationButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.durationButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.duration = parseInt(btn.dataset.time);
            });
        });
        
        this.inputArea.addEventListener('input', () => this.handleInput());
        this.inputArea.addEventListener('keydown', (e) => this.handleKeydown(e));
    }
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens[screenName].classList.add('active');
        
        if (screenName === 'game') {
            this.inputArea.focus();
        }
    }
    
    startGame() {
        this.resetGame();
        this.generateText();
        this.renderText();
        this.showScreen('game');
        this.inputArea.focus();
    }
    
    resetGame() {
        this.timer = this.duration;
        this.currentIndex = 0;
        this.correctChars = 0;
        this.errorChars = 0;
        this.totalTyped = 0;
        this.lastErrorCount = 0;
        this.isRunning = false;
        this.isFinished = false;
        
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.inputArea.value = '';
        this.inputArea.disabled = false;
        this.textDisplay.style.transform = 'translateY(0)';
        this.updateStats();
    }
    
    generateText() {
        // Pick 2-3 random quotes and combine
        const shuffled = [...this.quotes].sort(() => Math.random() - 0.5);
        this.text = shuffled.slice(0, 3).join(' ');
    }
    
    renderText() {
        this.textDisplay.innerHTML = this.text.split('').map((char, index) => {
            let className = 'char';
            if (index === this.currentIndex) className += ' current';
            return `<span class="${className}" data-index="${index}">${char}</span>`;
        }).join('');
        
        this.timerDisplay.textContent = this.timer;
    }
    
    handleKeydown(e) {
        // Tab + Enter to restart
        if (e.key === 'Tab') {
            e.preventDefault();
            this.tabPressed = true;
            setTimeout(() => this.tabPressed = false, 500);
        }
        if (e.key === 'Enter' && this.tabPressed) {
            e.preventDefault();
            this.startGame();
        }
    }
    
    handleInput() {
        if (this.isFinished) return;
        
        // Start timer on first input
        if (!this.isRunning) {
            this.isRunning = true;
            this.startTimer();
        }
        
        const inputValue = this.inputArea.value;
        const inputLength = inputValue.length;
        
        // Reset counts
        this.correctChars = 0;
        this.errorChars = 0;
        this.currentIndex = inputLength;
        this.totalTyped = inputLength;
        
        // Update character states
        const chars = this.textDisplay.querySelectorAll('.char');
        chars.forEach((charEl, index) => {
            charEl.classList.remove('correct', 'error', 'current');
            
            if (index < inputLength) {
                if (inputValue[index] === this.text[index]) {
                    charEl.classList.add('correct');
                    this.correctChars++;
                } else {
                    charEl.classList.add('error');
                    this.errorChars++;
                }
            } else if (index === inputLength) {
                charEl.classList.add('current');
            }
        });
        
        // Play sounds
        if (this.errorChars > this.lastErrorCount) {
            this.sound.play('error');
        } else if (inputLength > 0) {
            this.sound.play('key');
        }
        this.lastErrorCount = this.errorChars;
        
        this.updateStats();
        
        // Auto-scroll text
        if (this.currentIndex > 0) {
            const currentChar = this.textDisplay.querySelector('.char.current');
            if (currentChar) {
                const container = this.textDisplay;
                const charTop = currentChar.offsetTop;
                if (charTop > container.clientHeight / 2) {
                    container.style.transform = `translateY(-${charTop - 50}px)`;
                }
            }
        }
        
        // Check if text is completed
        if (inputLength >= this.text.length) {
            this.endGame();
        }
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer--;
            this.timerDisplay.textContent = this.timer;
            
            if (this.timer <= 5 && this.timer > 0) {
                this.sound.play('tick');
            }
            
            this.updateStats();
            
            if (this.timer <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    updateStats() {
        // Calculate WPM (words = chars / 5)
        const timeElapsed = (this.duration - this.timer) / 60 || 1/60; // Avoid division by zero
        const words = this.correctChars / 5;
        const wpm = Math.round(words / timeElapsed) || 0;
        
        // Calculate accuracy
        const accuracy = this.totalTyped > 0 
            ? Math.round((this.correctChars / this.totalTyped) * 100)
            : 100;
        
        this.wpmDisplay.textContent = wpm;
        this.accuracyDisplay.textContent = accuracy + '%';
    }
    
    endGame() {
        this.isFinished = true;
        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.inputArea.disabled = true;
        
        this.sound.play('complete');
        
        // Calculate final stats
        const timeElapsed = (this.duration - this.timer) / 60 || this.duration / 60;
        const words = this.correctChars / 5;
        const wpm = Math.round(words / timeElapsed) || 0;
        const accuracy = this.totalTyped > 0 
            ? Math.round((this.correctChars / this.totalTyped) * 100)
            : 0;
        const wordsTyped = this.inputArea.value.trim().split(/\s+/).filter(w => w.length > 0).length;
        
        // Update results screen
        document.getElementById('finalWPM').textContent = wpm;
        document.getElementById('finalAccuracy').textContent = accuracy + '%';
        document.getElementById('accuracyBar').style.width = accuracy + '%';
        document.getElementById('charsTyped').textContent = this.totalTyped;
        document.getElementById('correctChars').textContent = this.correctChars;
        document.getElementById('errorChars').textContent = this.errorChars;
        document.getElementById('wordsTyped').textContent = wordsTyped;
        
        // Check for best scores
        const bestWPM = parseInt(localStorage.getItem('typing_best_wpm') || '0');
        const bestAcc = parseInt(localStorage.getItem('typing_best_acc') || '0');
        
        let isNewRecord = false;
        if (wpm > bestWPM) {
            localStorage.setItem('typing_best_wpm', wpm);
            isNewRecord = true;
        }
        if (accuracy > bestAcc) {
            localStorage.setItem('typing_best_acc', accuracy);
            isNewRecord = true;
        }
        
        document.getElementById('newRecord').style.display = isNewRecord ? 'block' : 'none';
        this.loadBestScores();
        
        setTimeout(() => this.showScreen('results'), 500);
    }
    
    loadBestScores() {
        const bestWPM = localStorage.getItem('typing_best_wpm');
        const bestAcc = localStorage.getItem('typing_best_acc');
        
        document.getElementById('bestWPM').textContent = bestWPM || '---';
        document.getElementById('bestAccuracy').textContent = bestAcc ? bestAcc + '%' : '---';
    }
}

document.addEventListener('DOMContentLoaded', () => new TypingTest());
