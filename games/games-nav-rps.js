/**
 * Floating Games Navigation - For Rock Paper Scissors (different folder structure)
 */
(function() {
    const currentPath = window.location.pathname;
    
    // Games with paths relative to rock_paper_scissors folder
    const games = [
        { path: 'memory', name: 'Memory Match', emoji: '🧠', href: '../games/memory/index.html' },
        { path: 'snake', name: 'Snake', emoji: '🐍', href: '../games/snake/index.html' },
        { path: '2048', name: '2048', emoji: '🔢', href: '../games/2048/index.html' },
        { path: 'aim-trainer', name: 'Aim Trainer', emoji: '🎯', href: '../games/aim-trainer/index.html' },
        { path: 'typing-test', name: 'Typing Test', emoji: '⌨️', href: '../games/typing-test/index.html' },
        { path: 'reaction', name: 'Reaction Time', emoji: '⚡', href: '../games/reaction/index.html' },
        { path: 'rock_paper_scissors', name: 'Rock Paper Scissors', emoji: '✂️', href: '../rock_paper_scissors/index.html' }
    ];
    
    // Create floating games button HTML
    const floatingGames = document.createElement('div');
    floatingGames.className = 'floating-games';
    floatingGames.id = 'floatingGames';
    
    let menuHtml = `
        <button class="games-toggle" id="gamesToggle" aria-label="Open games menu">
            <span class="toggle-icon">🎮</span>
            <span class="toggle-text">Games</span>
        </button>
        <div class="games-menu">
            <div class="games-menu-header">Switch Game</div>
    `;
    
    games.forEach(game => {
        const isCurrent = currentPath.includes(game.path);
        menuHtml += `
            <a href="${game.href}" class="game-link ${isCurrent ? 'current' : ''}">
                <span class="game-emoji">${game.emoji}</span>
                <span class="game-name">${game.name}</span>
            </a>
        `;
    });
    
    menuHtml += `
            <a href="../index.html#projects" class="game-link" style="border-top: 1px solid rgba(255,255,255,0.05); margin-top: 0.5rem; padding-top: 0.75rem;">
                <span class="game-emoji">🏠</span>
                <span class="game-name">Back to Portfolio</span>
            </a>
        </div>
    `;
    
    floatingGames.innerHTML = menuHtml;
    document.body.appendChild(floatingGames);
    
    // Toggle menu
    const toggle = document.getElementById('gamesToggle');
    const menu = floatingGames.querySelector('.games-menu');
    
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        floatingGames.classList.toggle('open');
    });
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!floatingGames.contains(e.target)) {
            floatingGames.classList.remove('open');
        }
    });
    
    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            floatingGames.classList.remove('open');
        }
    });
})();

