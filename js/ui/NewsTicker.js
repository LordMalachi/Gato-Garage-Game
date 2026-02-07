/**
 * NewsTicker - Scrolling news bar at the bottom of the game area
 * Uses JS-driven positioning for consistent scroll speed regardless of content length
 */
class NewsTicker {
    constructor(state) {
        this.state = state;
        this.element = document.getElementById('news-content');
        this.container = document.getElementById('news-ticker');

        // Scroll speed in pixels per second
        this.scrollSpeed = 42;

        // Current scroll position (pixels)
        this.scrollX = 0;

        // Cached widths
        this.contentWidth = 0;
        this.containerWidth = 0;

        // Static headlines pool
        this.headlines = [
            // Garage life
            "Local cat opens garage, immediately naps on hood",
            "Cheese seen arguing with stubborn lug nut",
            "Garage cat caught sleeping in engine bay again",
            "Oil change completed in record 47 naps",
            "Mystery scratch found on every car this week",
            "Customer's car returned with bonus hairballs",
            "Suspicious purring heard coming from the engine",
            "Mechanic claims wrench 'ran away on its own'",
            "Break room fridge now 90% tuna cans",
            "Shop vac defeated by single hairball, story at 11",
            "Garage inspection passed, all 9 lives intact",
            "Lost keys found in usual spot: under the cat",

            // Economy & business
            "Catnip stocks soar to all-time high",
            "Cardboard box futures looking strong",
            "Yarn Ball Index up 12% this quarter",
            "Local tuna market destabilized by bulk buyer",
            "Economists warn of treat inflation",
            "String theory proves profitable investment",
            "Laser pointer industry sees dot-com boom",

            // Science & weather
            "Study: Cars run 40% smoother when purred at",
            "Scientists confirm: the red dot cannot be caught",
            "Forecast: 80% chance of sunbeams, 100% of naps",
            "Researchers discover optimal cardboard box size",
            "Breaking: gravity still works, glass still falls",
            "New study links chin scratches to productivity",
            "Weather: partly sunny with scattered zoomies",

            // Community
            "Mayor Whiskers promises free treats for all",
            "Dog chased from premises, perimeter secured",
            "Annual yarn ball tournament dates announced",
            "Local bird population 'concerned' about new garage",
            "Neighborhood watch: suspicious cucumber reported",
            "Town council approves new napping ordinance",
            "Missing sock mystery enters third week",
            "Community fish fry a huge success, literally",

            // Hiring & HR
            "Now hiring: professional belly rub technician",
            "Employee of the month: everyone (it's complicated)",
            "New hire orientation: where NOT to sharpen claws",
            "HR reminds staff: 3am zoomies are not overtime",
            "Benefits package now includes premium nap spots",

            // Reviews & testimonials
            "5 stars - 'Would get gently scratched again'",
            "Review: 'They fixed my car and judged me. 10/10'",
            "Customer: 'The cat stared at me for 20 minutes. Best service ever'",
            "'My car purrs now. Is that normal?' asks customer",

            // Cat philosophy
            "If it fits, it ships. If it sits, it stays",
            "Ancient Egyptians were right all along",
            "Weird noise? Best practice: meow back",
            "Today's wisdom: knock it off the table",
            "Reminder: everything is a bed if you believe",
            "The box is always better than what's inside",
            "You can't spell 'catastrophe' without 'cat'"
        ];

        // Dynamic event queue (game events get priority)
        this.newsQueue = [];

        // Last timestamp for animation
        this.lastTime = 0;
        this.animating = false;
        this.refreshTimer = null;
        this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.reducedMotion = this.motionQuery.matches;

        this.handleMotionPreferenceChange = this.handleMotionPreferenceChange.bind(this);
        if (this.motionQuery.addEventListener) {
            this.motionQuery.addEventListener('change', this.handleMotionPreferenceChange);
        } else if (this.motionQuery.addListener) {
            this.motionQuery.addListener(this.handleMotionPreferenceChange);
        }

        if (this.element && this.container) {
            this.refreshFeed();
            this.applyMotionPreference();
        }
    }

    /**
     * Add urgent news from game events
     */
    addNews(text) {
        this.newsQueue.push(text);
    }

    /**
     * Rebuild the scrolling text content
     */
    refreshFeed() {
        if (!this.element) return;

        let feedItems = [];

        // 1. Drain any queued game events
        while (this.newsQueue.length > 0) {
            feedItems.push(`\u2605 ${this.newsQueue.shift()} \u2605`);
        }

        // 2. Add a contextual headline based on game state
        if (this.state) {
            feedItems.push(this.getContextualNews());
        }

        // 3. Pick random unique headlines to fill the rest
        const shuffled = this.shuffleArray([...this.headlines]);
        const count = Math.max(6, 8 - feedItems.length);
        for (let i = 0; i < count && i < shuffled.length; i++) {
            feedItems.push(shuffled[i]);
        }

        this.element.textContent = feedItems.join("   +++   ");

        // Recalculate widths after content change
        this.containerWidth = this.container.offsetWidth;
        this.contentWidth = this.element.scrollWidth;

        if (this.reducedMotion) {
            this.scrollX = 0;
            this.applyPosition();
            return;
        }

        // Reset scroll to start off-screen right
        this.scrollX = this.containerWidth;
        this.applyPosition();
    }

    /**
     * Start the scroll animation loop
     */
    startScrolling() {
        if (this.animating) return;
        this.animating = true;
        this.lastTime = performance.now();
        this.tick = this.tick.bind(this);
        requestAnimationFrame(this.tick);
    }

    stopScrolling() {
        this.animating = false;
    }

    handleMotionPreferenceChange(event) {
        this.reducedMotion = event.matches;
        this.applyMotionPreference();
    }

    applyMotionPreference() {
        if (this.reducedMotion) {
            this.stopScrolling();
            this.scrollX = 0;
            this.applyPosition();

            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
            }
            this.refreshTimer = setInterval(() => {
                this.refreshFeed();
            }, 12000);
            return;
        }

        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }

        this.startScrolling();
    }

    /**
     * Animation frame callback
     */
    tick(now) {
        if (!this.animating) return;

        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        // Move left
        this.scrollX -= this.scrollSpeed * dt;

        // If the entire text has scrolled past the left edge, refresh and reset
        if (this.scrollX < -this.contentWidth) {
            this.refreshFeed();
        } else {
            this.applyPosition();
        }

        requestAnimationFrame(this.tick);
    }

    /**
     * Apply current scroll position to the element
     */
    applyPosition() {
        if (!this.element) return;
        const x = this.reducedMotion ? 0 : Math.round(this.scrollX);
        this.element.style.transform = `translate3d(${x}px, 0, 0)`;
    }

    /**
     * Generate news based on current game state
     */
    getContextualNews() {
        const s = this.state;
        if (s.prestigeCurrency > 0) return "Timeline anomaly detected near garage";
        if (s.currency > 1000000) return "Garage owner featured in 'Richest Cats Monthly'";
        if (s.workers && s.workers.length > 5) return "Garage workforce reaches 'adorable' levels";
        if (s.garageLevel > 10) return "Garage empire continues to expand";
        if (s.garageLevel > 5) return "Garage upgrading to double-wide napping area";
        if (s.carsRepaired > 100) return "100+ cars fixed! Mice considering unionizing";
        if (s.totalClicks > 5000) return "Click rates stabilizing, paws holding up";
        if (s.carsRepaired > 10) return "Business is booming, tuna reserves holding";
        return "It's a beautiful day at the garage";
    }

    /**
     * Fisher-Yates shuffle
     */
    shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}
