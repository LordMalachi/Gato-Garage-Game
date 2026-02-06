/**
 * NewsTicker - Manages the scrolling text at the bottom
 * distinctive feature of the "Polish" update
 */
class NewsTicker {
    constructor(state) {
        this.state = state;
        this.element = document.getElementById('news-content');
        this.container = document.getElementById('news-ticker');

        // Static headlines
        this.headlines = [
            "Local cat opens garage",
            "Catnip stocks soar",
            "Study: Cars run smoother when purred at",
            "50% chance of sunbeams",
            "Red dots - catchable?",
            "New 'Auto-Petter 3000' released",
            "Dog chased away by manager",
            "Invest in cardboard boxes",
            "Purring lowers stress",
            "Gato Garage wins napping championship",
            "Ancient Egyptians were right",
            "Weird noise? Meow back",
            "5 stars, would get scratched again",
            "Hiring belly rubbers",
            "Mayor Whiskers promises treats"
        ];

        // Dynamic event queue
        this.newsQueue = [];
        this.currentFeed = "";

        if (this.element) {
            // Fill initial feed
            this.refreshFeed();

            // Listen for animation repeat to refresh items
            this.element.addEventListener('animationiteration', () => {
                this.refreshFeed();
            });
        }
    }

    /**
     * Add urgent news (prepends to queue)
     */
    addNews(text) {
        this.newsQueue.unshift(text); // Add to front
        // Force refresh if critical? Nah, let it scroll naturally or it jumps
        // But we DO want to see it soon.
        // For now, it will appear in next batch.
    }

    /**
     * Rebuild the scrolling text content
     */
    refreshFeed() {
        if (!this.element) return;

        let feedItems = [];

        // 1. Add any queued important news
        while (this.newsQueue.length > 0) {
            feedItems.push(`★ ${this.newsQueue.shift()} ★`);
        }

        // 2. Add contextual news
        if (this.state) {
            feedItems.push(this.getContextualNews());
        }

        // 3. Fill rest with random headlines
        // We want a long string to fill ~30s of scrolling
        for (let i = 0; i < 5; i++) {
            const randomHeadline = this.headlines[Math.floor(Math.random() * this.headlines.length)];
            feedItems.push(randomHeadline);
        }

        // Join with separators
        this.element.textContent = feedItems.join("   +++   ");
    }

    /**
     * Generate news based on current game state
     */
    getContextualNews() {
        if (this.state.prestigeCurrency > 0) return "Garage looking distinctively timeline-shifted";
        if (this.state.currency > 1000000) return "Owner featured in 'Richest Cats'";
        if (this.state.garageLevel > 5) return "Garage expanding rapidly";
        if (this.state.totalClicks > 5000) return "Click rates stabilizing";
        return "Garage running smoothly";
    }
}
