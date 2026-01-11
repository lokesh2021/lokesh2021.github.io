/**
 * Rock Paper Scissors Game
 * Modern interactive version
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
            case 'select':
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'countdown':
                osc.frequency.setValueAtTime(300, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'shoot':
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'win':
                const winNotes = [523, 659, 784];
                winNotes.forEach((freq, i) => {
                    const o = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    o.connect(g);
                    g.connect(this.ctx.destination);
                    o.frequency.setValueAtTime(freq, now + i * 0.1);
                    g.gain.setValueAtTime(0.15, now + i * 0.1);
                    g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
                    o.start(now + i * 0.1);
                    o.stop(now + i * 0.1 + 0.2);
                });
                return;
            case 'lose':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            case 'tie':
                osc.frequency.setValueAtTime(400, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'victory':
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
            case 'defeat':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.6);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
                osc.start(now);
                osc.stop(now + 0.6);
                break;
        }
    }
}

class RockPaperScissors {
    constructor() {
        this.playerScore = 0;
        this.computerScore = 0;
        this.roundNumber = 1;
        this.winningScore = 5;
        this.isPlaying = false;
        
        this.choices = {
            rock: '🪨',
            paper: '📄',
            scissors: '✂️'
        };
        
        this.sound = new SoundManager();
        
        this.initElements();
        this.bindEvents();
    }
    
    initElements() {
        // Screens
        this.introScreen = document.getElementById('intro');
        this.gameScreen = document.getElementById('game');
        this.victoryScreen = document.getElementById('victory');
        
        // Game elements
        this.playerScoreEl = document.getElementById('playerScore');
        this.computerScoreEl = document.getElementById('computerScore');
        this.playerHand = document.getElementById('playerHand');
        this.computerHand = document.getElementById('computerHand');
        this.resultDisplay = document.getElementById('resultDisplay');
        this.roundNumberEl = document.getElementById('roundNumber');
        
        // Victory elements
        this.victoryIcon = document.getElementById('victoryIcon');
        this.victoryTitle = document.getElementById('victoryTitle');
        this.victoryMessage = document.getElementById('victoryMessage');
        this.finalPlayerScore = document.getElementById('finalPlayerScore');
        this.finalComputerScore = document.getElementById('finalComputerScore');
        this.totalRounds = document.getElementById('totalRounds');
        
        // Buttons
        this.startBtn = document.getElementById('startGame');
        this.resetBtn = document.getElementById('resetGame');
        this.playAgainBtn = document.getElementById('playAgain');
        this.choiceBtns = document.querySelectorAll('.choice-btn');
    }
    
    bindEvents() {
        this.startBtn.addEventListener('click', () => {
            this.sound.init();
            this.startGame();
        });
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.playAgainBtn.addEventListener('click', () => this.resetGame());
        
        this.choiceBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.isPlaying) {
                    this.sound.play('select');
                    this.play(e.currentTarget.dataset.choice);
                }
            });
        });
    }
    
    startGame() {
        this.introScreen.classList.remove('active');
        this.gameScreen.classList.add('active');
    }
    
    async play(playerChoice) {
        this.isPlaying = true;
        this.disableButtons();
        
        // Reset hands
        this.playerHand.classList.remove('winner', 'loser');
        this.computerHand.classList.remove('winner', 'loser');
        this.resultDisplay.querySelector('.result-text').className = 'result-text';
        
        // Show selection
        this.highlightChoice(playerChoice);
        
        // Shake animation
        this.resultDisplay.querySelector('.result-text').textContent = 'Rock...';
        await this.animateHands();
        
        // Get computer choice
        const computerChoice = this.getComputerChoice();
        
        // Show choices
        this.playerHand.querySelector('.hand-emoji').textContent = this.choices[playerChoice];
        this.computerHand.querySelector('.hand-emoji').textContent = this.choices[computerChoice];
        
        // Determine winner
        const result = this.getResult(playerChoice, computerChoice);
        
        // Update UI
        await this.delay(300);
        this.showResult(result, playerChoice, computerChoice);
        
        // Check for game end
        if (this.playerScore >= this.winningScore || this.computerScore >= this.winningScore) {
            await this.delay(1500);
            this.endGame();
        } else {
            this.roundNumber++;
            this.roundNumberEl.textContent = this.roundNumber;
        }
        
        this.enableButtons();
        this.isPlaying = false;
    }
    
    async animateHands() {
        const playerEmoji = this.playerHand.querySelector('.hand-emoji');
        const computerEmoji = this.computerHand.querySelector('.hand-emoji');
        
        this.playerHand.classList.add('shake');
        this.computerHand.classList.add('shake');
        
        // Countdown animation
        const countdowns = ['Rock...', 'Paper...', 'Scissors...', 'Shoot!'];
        for (let i = 0; i < countdowns.length; i++) {
            this.resultDisplay.querySelector('.result-text').textContent = countdowns[i];
            if (i < 3) {
                this.sound.play('countdown');
            } else {
                this.sound.play('shoot');
            }
            await this.delay(400);
        }
        
        this.playerHand.classList.remove('shake');
        this.computerHand.classList.remove('shake');
    }
    
    getComputerChoice() {
        const choices = ['rock', 'paper', 'scissors'];
        return choices[Math.floor(Math.random() * choices.length)];
    }
    
    getResult(player, computer) {
        if (player === computer) return 'tie';
        
        const wins = {
            rock: 'scissors',
            paper: 'rock',
            scissors: 'paper'
        };
        
        if (wins[player] === computer) {
            this.playerScore++;
            this.playerScoreEl.textContent = this.playerScore;
            return 'win';
        } else {
            this.computerScore++;
            this.computerScoreEl.textContent = this.computerScore;
            return 'lose';
        }
    }
    
    showResult(result, playerChoice, computerChoice) {
        const resultText = this.resultDisplay.querySelector('.result-text');
        
        if (result === 'win') {
            resultText.textContent = `You win! ${this.capitalize(playerChoice)} beats ${computerChoice}`;
            resultText.classList.add('win');
            this.playerHand.classList.add('winner');
            this.computerHand.classList.add('loser');
            this.sound.play('win');
            this.celebrateWin();
        } else if (result === 'lose') {
            resultText.textContent = `AI wins! ${this.capitalize(computerChoice)} beats ${playerChoice}`;
            resultText.classList.add('lose');
            this.computerHand.classList.add('winner');
            this.playerHand.classList.add('loser');
            this.sound.play('lose');
        } else {
            resultText.textContent = `It's a tie! Both chose ${playerChoice}`;
            resultText.classList.add('tie');
            this.sound.play('tie');
        }
    }
    
    celebrateWin() {
        // Simple confetti effect
        for (let i = 0; i < 20; i++) {
            this.createConfetti();
        }
    }
    
    createConfetti() {
        const confetti = document.createElement('div');
        const colors = ['#f7a600', '#f54e00', '#22c55e', '#3b82f6', '#a855f7'];
        
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
        
        // Add animation if not exists
        if (!document.querySelector('#confetti-animation')) {
            const style = document.createElement('style');
            style.id = 'confetti-animation';
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
        
        setTimeout(() => confetti.remove(), 4000);
    }
    
    endGame() {
        this.gameScreen.classList.remove('active');
        this.victoryScreen.classList.add('active');
        
        const playerWon = this.playerScore > this.computerScore;
        
        this.victoryIcon.textContent = playerWon ? '🏆' : '😢';
        this.victoryTitle.textContent = playerWon ? 'You Won!' : 'AI Wins!';
        this.victoryTitle.className = playerWon ? 'win' : 'lose';
        this.victoryMessage.textContent = `Final Score: ${this.playerScore} - ${this.computerScore}`;
        
        this.finalPlayerScore.textContent = this.playerScore;
        this.finalComputerScore.textContent = this.computerScore;
        this.totalRounds.textContent = this.roundNumber;
        
        if (playerWon) {
            this.sound.play('victory');
            for (let i = 0; i < 50; i++) {
                setTimeout(() => this.createConfetti(), i * 50);
            }
        } else {
            this.sound.play('defeat');
        }
    }
    
    resetGame() {
        this.playerScore = 0;
        this.computerScore = 0;
        this.roundNumber = 1;
        
        this.playerScoreEl.textContent = '0';
        this.computerScoreEl.textContent = '0';
        this.roundNumberEl.textContent = '1';
        
        this.playerHand.querySelector('.hand-emoji').textContent = '❓';
        this.computerHand.querySelector('.hand-emoji').textContent = '❓';
        this.playerHand.classList.remove('winner', 'loser');
        this.computerHand.classList.remove('winner', 'loser');
        
        const resultText = this.resultDisplay.querySelector('.result-text');
        resultText.textContent = 'Choose your weapon!';
        resultText.className = 'result-text';
        
        this.choiceBtns.forEach(btn => btn.classList.remove('selected'));
        
        this.victoryScreen.classList.remove('active');
        this.introScreen.classList.remove('active');
        this.gameScreen.classList.add('active');
    }
    
    highlightChoice(choice) {
        this.choiceBtns.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.choice === choice) {
                btn.classList.add('selected');
            }
        });
    }
    
    disableButtons() {
        this.choiceBtns.forEach(btn => btn.disabled = true);
    }
    
    enableButtons() {
        this.choiceBtns.forEach(btn => btn.disabled = false);
    }
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    new RockPaperScissors();
});
