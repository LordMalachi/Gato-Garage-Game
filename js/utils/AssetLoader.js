/**
 * AssetLoader - Preloads and manages game images
 */
class AssetLoader {
    constructor() {
        this.images = {};
        this.loaded = false;
        this.loadingPromise = null;
    }

    /**
     * Load all game assets
     * @returns {Promise} Resolves when all assets are loaded
     */
    loadAll() {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        const assets = {
            // Background
            garageBackground: 'assets/background/Garage Background.png',

            // Cheese (cat maid hero) sprites
            cheeseNormal: 'assets/sprites/Cheese/Cheese-Normal.png',
            cheeseWrench: 'assets/sprites/Cheese/Cheese-Wrench.png',
            cheeseGoodJob: 'assets/sprites/Cheese/Cheese-Good Job.png',
            cheeseAnnoyed: 'assets/sprites/Cheese/Cheese-Annoyed.png',

            // Car sprites - damaged versions (need repair)
            car001: 'assets/sprites/cars/car001.png',
            car006: 'assets/sprites/cars/car006.png',

            // Car sprites - clean versions (repaired)
            car002: 'assets/sprites/cars/car002.png',
            car003: 'assets/sprites/cars/car003.png',
            car004: 'assets/sprites/cars/car004.png',
            car005: 'assets/sprites/cars/car005.png'
        };

        const loadPromises = Object.entries(assets).map(([key, path]) => {
            return this.loadImage(key, path);
        });

        this.loadingPromise = Promise.all(loadPromises).then(() => {
            this.loaded = true;
            console.log('All assets loaded!');
            return this.images;
        });

        return this.loadingPromise;
    }

    /**
     * Load a single image
     * @param {string} key - Key to store the image under
     * @param {string} path - Path to the image file
     * @returns {Promise} Resolves when image is loaded
     */
    loadImage(key, path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[key] = img;
                console.log(`Loaded: ${key}`);
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Failed to load: ${path}`);
                // Resolve anyway to not block loading
                resolve(null);
            };
            img.src = path;
        });
    }

    /**
     * Get a loaded image
     * @param {string} key - Image key
     * @returns {HTMLImageElement|null} The loaded image or null
     */
    get(key) {
        return this.images[key] || null;
    }

    /**
     * Check if all assets are loaded
     * @returns {boolean}
     */
    isLoaded() {
        return this.loaded;
    }
}

// Global asset loader instance
const Assets = new AssetLoader();
