/**
 * Reaction Time Test Game
 * Test your reflexes!
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
            case 'ready':
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'click':
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(1500, now + 0.1);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'early':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            case 'great':
                const notes = [800, 1000, 1200];
                notes.forEach((freq, i) => {
                    const o = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    o.connect(g);
                    g.connect(this.ctx.destination);
                    o.frequency.setValueAtTime(freq, now + i * 0.08);
                    g.gain.setValueAtTime(0.15, now + i * 0.08);
                    g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.15);
                    o.start(now + i * 0.08);
                    o.stop(now + i * 0.08 + 0.15);
                });
                return;
        }
    }
}

class ReactionGame {
    constructor() {
        this.attempts = [];
        this.currentAttempt = 0;
        this.startTime = null;
        this.timeoutId = null;
        this.state = 'intro'; // intro, waiting, ready, early, result
        
        this.sound = new SoundManager();
        
        this.initElements();
        this.bindEvents();
        this.loadHistory();
        this.updateBestTimeDisplay();
    }
    
    initElements() {
        // Screens
        this.screens = {
            intro: document.getElementById('intro'),
            waiting: document.getElementById('waiting'),
            ready: document.getElementById('ready'),
            early: document.getElementById('early'),
            result: document.getElementById('result')
        };
        
        // Buttons
        this.startBtn = document.getElementById('startBtn');
        this.tryAgainEarly = document.getElementById('tryAgainEarly');
        this.tryAgainBtn = document.getElementById('tryAgainBtn');
        this.shareBtn = document.getElementById('shareBtn');
        this.clearHistoryBtn = document.getElementById('clearHistory');
        
        // Result elements
        this.resultIcon = document.getElementById('resultIcon');
        this.resultTitle = document.getElementById('resultTitle');
        this.reactionTimeEl = document.getElementById('reactionTime');
        this.resultMessage = document.getElementById('resultMessage');
        this.attemptNumberEl = document.getElementById('attemptNumber');
        this.averageTimeEl = document.getElementById('averageTime');
        this.bestTimeEl = document.getElementById('bestTime');
        this.meterFill = document.getElementById('meterFill');
        
        // History
        this.historyList = document.getElementById('historyList');
        this.bestTimeDisplay = document.getElementById('bestTimeDisplay');
    }
    
    bindEvents() {
        this.startBtn.addEventListener('click', () => {
            this.sound.init();
            this.startTest();
        });
        this.tryAgainEarly.addEventListener('click', () => this.startTest());
        this.tryAgainBtn.addEventListener('click', () => this.startTest());
        this.shareBtn.addEventListener('click', () => this.shareResult());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        
        // Click handlers for game screens
        this.screens.waiting.addEventListener('click', () => this.handleClick());
        this.screens.ready.addEventListener('click', () => this.handleClick());
    }
    
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        this.screens[screenName].classList.add('active');
        this.state = screenName;
    }
    
    startTest() {
        this.showScreen('waiting');
        
        // Random delay between 1-5 seconds
        const delay = 1000 + Math.random() * 4000;
        
        this.timeoutId = setTimeout(() => {
            this.showScreen('ready');
            this.startTime = performance.now();
            this.sound.play('ready');
        }, delay);
    }
    
    handleClick() {
        if (this.state === 'waiting') {
            // Clicked too early
            clearTimeout(this.timeoutId);
            this.sound.play('early');
            this.showScreen('early');
        } else if (this.state === 'ready') {
            // Calculate reaction time
            const endTime = performance.now();
            const reactionTime = Math.round(endTime - this.startTime);
            this.sound.play('click');
            this.recordAttempt(reactionTime);
            this.showResult(reactionTime);
        }
    }
    
    recordAttempt(time) {
        this.currentAttempt++;
        this.attempts.push({
            attempt: this.currentAttempt,
            time: time,
            date: new Date().toISOString()
        });
        
        this.saveHistory();
        this.updateHistoryDisplay();
        this.updateBestTimeDisplay();
    }
    
    showResult(time) {
        this.showScreen('result');
        
        // Animate the time display
        this.animateNumber(this.reactionTimeEl, 0, time, 500);
        
        // Set icon and message based on performance
        const { icon, title, message } = this.getPerformanceInfo(time);
        this.resultIcon.textContent = icon;
        this.resultTitle.textContent = title;
        this.resultMessage.textContent = message;
        
        // Update stats
        this.attemptNumberEl.textContent = this.currentAttempt;
        this.averageTimeEl.textContent = this.getAverageTime() + 'ms';
        this.bestTimeEl.textContent = this.getBestTime() + 'ms';
        
        // Update speed meter (inverse - lower time = more fill)
        const maxTime = 500;
        const fillPercent = Math.max(0, Math.min(100, (1 - time / maxTime) * 100));
        setTimeout(() => {
            this.meterFill.style.width = fillPercent + '%';
        }, 100);
        
        // Celebrate if it's a good time
        if (time < 250) {
            this.sound.play('great');
            this.celebrate();
        }
    }
    
    getPerformanceInfo(time) {
        if (time < 150) {
            return { icon: '🚀', title: 'Insane!', message: 'Are you even human?!' };
        } else if (time < 200) {
            return { icon: '⚡', title: 'Lightning Fast!', message: 'Pro-level reflexes!' };
        } else if (time < 250) {
            return { icon: '🔥', title: 'Blazing!', message: 'Seriously impressive!' };
        } else if (time < 300) {
            return { icon: '✨', title: 'Great!', message: 'Above average reflexes!' };
        } else if (time < 400) {
            return { icon: '👍', title: 'Good!', message: 'Pretty solid reaction time!' };
        } else if (time < 500) {
            return { icon: '😊', title: 'Nice!', message: 'Room for improvement!' };
        } else {
            return { icon: '🐢', title: 'Keep Trying!', message: 'Practice makes perfect!' };
        }
    }
    
    animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * easeOut);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    getAverageTime() {
        if (this.attempts.length === 0) return '---';
        const sum = this.attempts.reduce((acc, a) => acc + a.time, 0);
        return Math.round(sum / this.attempts.length);
    }
    
    getBestTime() {
        if (this.attempts.length === 0) return null;
        return Math.min(...this.attempts.map(a => a.time));
    }
    
    updateBestTimeDisplay() {
        const best = this.getBestTime();
        this.bestTimeDisplay.textContent = best ? best + 'ms' : '---';
    }
    
    celebrate() {
        const colors = ['#f7a600', '#f54e00', '#22c55e', '#3b82f6', '#a855f7'];
        
        for (let i = 0; i < 30; i++) {
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
        
        // Add animation if not exists
        if (!document.querySelector('#confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = `
                @keyframes confettiFall {
                    to {
                        transform: translateY(100vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    shareResult() {
        const best = this.getBestTime();
        const text = `⚡ My reaction time: ${best}ms!\n\nCan you beat me? Try the Reaction Time Test!`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Reaction Time Test',
                text: text,
                url: window.location.href
            }).catch(() => {
                this.copyToClipboard(text);
            });
        } else {
            this.copyToClipboard(text);
        }
    }
    
    copyToClipboard(text) {
        navigator.clipboard.writeText(text + '\n' + window.location.href).then(() => {
            this.shareBtn.querySelector('span').textContent = 'Copied!';
            setTimeout(() => {
                this.shareBtn.querySelector('span').textContent = 'Share Result';
            }, 2000);
        });
    }
    
    // Local Storage
    saveHistory() {
        localStorage.setItem('reactionGame', JSON.stringify({
            attempts: this.attempts,
            currentAttempt: this.currentAttempt
        }));
    }
    
    loadHistory() {
        const saved = localStorage.getItem('reactionGame');
        if (saved) {
            const data = JSON.parse(saved);
            this.attempts = data.attempts || [];
            this.currentAttempt = data.currentAttempt || 0;
            this.updateHistoryDisplay();
        }
    }
    
    clearHistory() {
        this.attempts = [];
        this.currentAttempt = 0;
        localStorage.removeItem('reactionGame');
        this.updateHistoryDisplay();
        this.updateBestTimeDisplay();
    }
    
    updateHistoryDisplay() {
        if (this.attempts.length === 0) {
            this.historyList.innerHTML = '<li class="empty-state">No attempts yet. Start playing!</li>';
            return;
        }
        
        const best = this.getBestTime();
        const recentAttempts = this.attempts.slice(-10).reverse();
        
        this.historyList.innerHTML = recentAttempts.map(a => `
            <li>
                <span class="attempt-num">#${a.attempt}</span>
                <span class="attempt-time ${a.time === best ? 'best' : ''}">${a.time}ms</span>
            </li>
        `).join('');
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    new ReactionGame();
});
