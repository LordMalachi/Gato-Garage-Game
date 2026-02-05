/**
 * Gato Garage - Main Entry Point
 *
 * An idle clicker game where you run a garage with cat-maid mechanics.
 * Click to repair cars, hire workers, buy upgrades, and build your empire!
 *
 * Starring: Cheese the Maid (Gato-san)
 */

// Global game instance
let game = null;

/**
 * Initialize the game when DOM is ready
 */
function initGame() {
    console.log('=================================');
    console.log('  GATO GARAGE - Idle Mechanic');
    console.log('  Starring Cheese the Maid');
    console.log('=================================');

    try {
        // Create and initialize game
        game = new Game();
        game.init();

        // Make game accessible from console for debugging
        window.game = game;

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                game.saveManager.save();
            }
        });

        // Save before page unload
        window.addEventListener('beforeunload', () => {
            game.shutdown();
        });

        console.log('Game initialized successfully!');
        console.log('Tip: Access "game" in console for debugging');

    } catch (error) {
        console.error('Failed to initialize game:', error);
        showErrorMessage('Failed to start game. Please refresh the page.');
    }
}

/**
 * Show error message to user
 * @param {string} message - Error message
 */
function showErrorMessage(message) {
    const container = document.getElementById('game-container');
    if (container) {
        container.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #f87171;
                font-family: 'Press Start 2P', monospace;
                font-size: 12px;
                text-align: center;
                padding: 20px;
            ">
                <div style="margin-bottom: 20px;">ERROR</div>
                <div style="color: #94a3b8; font-size: 8px;">${message}</div>
                <button onclick="location.reload()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    font-family: 'Press Start 2P', monospace;
                    font-size: 8px;
                    background: #1e3a5f;
                    color: #fef3c7;
                    border: 2px solid #4ade80;
                    cursor: pointer;
                ">RETRY</button>
            </div>
        `;
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
