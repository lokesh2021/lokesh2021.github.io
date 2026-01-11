/**
 * 2048 Game
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
            case 'move':
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
            case 'merge':
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            case 'bigMerge':
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
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
            case 'gameOver':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
        }
    }
}

class Game2048 {
    constructor() {
        this.size = 4;
        this.grid = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('2048_best') || '0');
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;
        this.previousState = null;
        
        // Touch handling
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        this.sound = new SoundManager();
        
        this.initElements();
        this.bindEvents();
        this.initGame();
    }
    
    initElements() {
        this.boardEl = document.getElementById('gameBoard');
        this.scoreEl = document.getElementById('score');
        this.bestScoreEl = document.getElementById('bestScore');
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        this.winOverlay = document.getElementById('winOverlay');
        this.finalScoreEl = document.getElementById('finalScore');
        this.undoBtn = document.getElementById('undoBtn');
        
        this.bestScoreEl.textContent = this.bestScore;
    }
    
    bindEvents() {
        document.getElementById('newGame').addEventListener('click', () => {
            this.sound.init();
            this.initGame();
        });
        document.getElementById('tryAgain').addEventListener('click', () => this.initGame());
        document.getElementById('keepPlaying').addEventListener('click', () => this.continueGame());
        document.getElementById('newGameWin').addEventListener('click', () => this.initGame());
        this.undoBtn.addEventListener('click', () => this.undo());
        
        // Keyboard events - prevent page scroll on arrow keys
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
            this.handleKeydown(e);
        }, { passive: false });
        
        // Touch events
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    }
    
    initGame() {
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;
        this.previousState = null;
        
        this.gameOverOverlay.classList.remove('active');
        this.winOverlay.classList.remove('active');
        this.undoBtn.disabled = true;
        
        this.addRandomTile();
        this.addRandomTile();
        this.updateDisplay();
    }
    
    addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }
        
        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
            return { r, c };
        }
        return null;
    }
    
    handleKeydown(e) {
        if (this.gameOver && !this.keepPlaying) return;
        
        const keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'w': 'up',
            'W': 'up',
            's': 'down',
            'S': 'down',
            'a': 'left',
            'A': 'left',
            'd': 'right',
            'D': 'right'
        };
        
        if (keyMap[e.key]) {
            e.preventDefault();
            this.sound.init();
            this.move(keyMap[e.key]);
        }
    }
    
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }
    
    handleTouchEnd(e) {
        if (this.gameOver && !this.keepPlaying) return;
        
        const deltaX = e.changedTouches[0].clientX - this.touchStartX;
        const deltaY = e.changedTouches[0].clientY - this.touchStartY;
        const minSwipe = 50;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > minSwipe) {
                this.sound.init();
                this.move(deltaX > 0 ? 'right' : 'left');
            }
        } else {
            if (Math.abs(deltaY) > minSwipe) {
                this.sound.init();
                this.move(deltaY > 0 ? 'down' : 'up');
            }
        }
    }
    
    move(direction) {
        // Save state for undo
        this.previousState = {
            grid: this.grid.map(row => [...row]),
            score: this.score
        };
        
        let moved = false;
        const mergedPositions = [];
        let hadBigMerge = false;
        
        // Rotate grid to always process left-to-right
        let rotations = { 'left': 0, 'up': 3, 'right': 2, 'down': 1 }[direction];
        
        for (let i = 0; i < rotations; i++) {
            this.grid = this.rotateGrid(this.grid);
        }
        
        // Process each row
        for (let r = 0; r < this.size; r++) {
            const result = this.processRow(this.grid[r]);
            if (result.moved) moved = true;
            if (result.hadBigMerge) hadBigMerge = true;
            this.grid[r] = result.row;
            
            // Track merged positions
            result.mergedIndices.forEach(c => {
                let pos = { r, c };
                for (let i = 0; i < (4 - rotations) % 4; i++) {
                    pos = this.rotatePosition(pos);
                }
                mergedPositions.push(pos);
            });
        }
        
        // Rotate back
        for (let i = 0; i < (4 - rotations) % 4; i++) {
            this.grid = this.rotateGrid(this.grid);
        }
        
        if (moved) {
            if (hadBigMerge) {
                this.sound.play('bigMerge');
            } else if (mergedPositions.length > 0) {
                this.sound.play('merge');
            } else {
                this.sound.play('move');
            }
            
            const newTile = this.addRandomTile();
            this.updateDisplay(newTile, mergedPositions);
            this.undoBtn.disabled = false;
            
            // Check for win
            if (!this.won && !this.keepPlaying && this.hasWon()) {
                this.won = true;
                this.sound.play('win');
                setTimeout(() => {
                    this.winOverlay.classList.add('active');
                }, 300);
            }
            
            // Check for game over
            if (this.isGameOver()) {
                this.gameOver = true;
                this.sound.play('gameOver');
                setTimeout(() => {
                    this.finalScoreEl.textContent = this.score;
                    this.gameOverOverlay.classList.add('active');
                }, 300);
            }
        } else {
            this.previousState = null;
        }
    }
    
    processRow(row) {
        const originalRow = [...row];
        
        // Remove zeros (slide tiles to the left)
        let newRow = row.filter(x => x !== 0);
        const mergedIndices = [];
        let hadBigMerge = false;
        
        // Merge tiles
        for (let i = 0; i < newRow.length - 1; i++) {
            if (newRow[i] === newRow[i + 1]) {
                newRow[i] *= 2;
                this.score += newRow[i];
                if (newRow[i] >= 128) hadBigMerge = true;
                newRow.splice(i + 1, 1);
                mergedIndices.push(i);
            }
        }
        
        // Pad with zeros
        while (newRow.length < this.size) {
            newRow.push(0);
        }
        
        // Check if anything changed
        const moved = JSON.stringify(originalRow) !== JSON.stringify(newRow);
        
        return { row: newRow, moved, mergedIndices, hadBigMerge };
    }
    
    rotateGrid(grid) {
        const newGrid = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                newGrid[c][this.size - 1 - r] = grid[r][c];
            }
        }
        return newGrid;
    }
    
    rotatePosition(pos) {
        return { r: pos.c, c: this.size - 1 - pos.r };
    }
    
    hasWon() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 2048) return true;
            }
        }
        return false;
    }
    
    isGameOver() {
        // Check for empty cells
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) return false;
            }
        }
        
        // Check for possible merges
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const val = this.grid[r][c];
                if (r < this.size - 1 && this.grid[r + 1][c] === val) return false;
                if (c < this.size - 1 && this.grid[r][c + 1] === val) return false;
            }
        }
        
        return true;
    }
    
    continueGame() {
        this.keepPlaying = true;
        this.winOverlay.classList.remove('active');
    }
    
    undo() {
        if (!this.previousState) return;
        
        this.grid = this.previousState.grid;
        this.score = this.previousState.score;
        this.previousState = null;
        this.undoBtn.disabled = true;
        this.gameOver = false;
        this.gameOverOverlay.classList.remove('active');
        this.updateDisplay();
    }
    
    updateDisplay(newTilePos = null, mergedPositions = []) {
        // Update score
        this.scoreEl.textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('2048_best', this.bestScore);
            this.bestScoreEl.textContent = this.bestScore;
        }
        
        // Render board
        this.boardEl.innerHTML = '';
        
        // Background cells
        for (let i = 0; i < this.size * this.size; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            this.boardEl.appendChild(cell);
        }
        
        // Get actual computed values from CSS
        const computedStyle = getComputedStyle(document.documentElement);
        const tileSize = parseInt(computedStyle.getPropertyValue('--tile-size')) || 100;
        const gap = parseInt(computedStyle.getPropertyValue('--gap')) || 12;
        
        // Tiles
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const value = this.grid[r][c];
                if (value !== 0) {
                    const tile = document.createElement('div');
                    
                    let tileClass = `tile tile-${value <= 2048 ? value : 'super'}`;
                    
                    // Add animation classes
                    if (newTilePos && newTilePos.r === r && newTilePos.c === c) {
                        tileClass += ' new';
                    }
                    if (mergedPositions.some(p => p.r === r && p.c === c)) {
                        tileClass += ' merged';
                    }
                    
                    tile.className = tileClass;
                    tile.textContent = value;
                    tile.style.top = `${gap + r * (tileSize + gap)}px`;
                    tile.style.left = `${gap + c * (tileSize + gap)}px`;
                    
                    this.boardEl.appendChild(tile);
                }
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new Game2048());
