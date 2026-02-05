/**
 * NumberFormatter - Utility for formatting large numbers in idle game style
 */
const NumberFormatter = {
    // Standard suffixes for large numbers
    suffixes: [
        '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
        'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg'
    ],

    /**
     * Format a number with suffix notation
     * @param {number} num - Number to format
     * @param {number} [decimals=2] - Decimal places
     * @returns {string} Formatted number string
     */
    format(num, decimals = 2) {
        if (num === null || num === undefined || isNaN(num)) {
            return '0';
        }

        // Handle negative numbers
        const sign = num < 0 ? '-' : '';
        num = Math.abs(num);

        // Small numbers don't need formatting
        if (num < 1000) {
            return sign + Math.floor(num).toString();
        }

        // Calculate the tier (each tier is 1000x)
        const tier = Math.floor(Math.log10(num) / 3);

        // If we've exceeded our suffix list, use scientific notation
        if (tier >= this.suffixes.length) {
            return sign + num.toExponential(decimals);
        }

        // Scale the number and format with suffix
        const scaled = num / Math.pow(1000, tier);
        const formatted = scaled.toFixed(decimals);

        // Remove trailing zeros after decimal point
        const trimmed = parseFloat(formatted).toString();

        return sign + trimmed + this.suffixes[tier];
    },

    /**
     * Format as currency with $ symbol
     * @param {number} num - Number to format
     * @param {number} [decimals=2] - Decimal places
     * @returns {string} Formatted currency string
     */
    formatCurrency(num, decimals = 2) {
        return '$' + this.format(num, decimals);
    },

    /**
     * Format with per-second notation
     * @param {number} num - Number to format
     * @returns {string} Formatted rate string
     */
    formatRate(num) {
        return this.format(num, 1) + '/s';
    },

    /**
     * Format time duration in human readable format
     * @param {number} ms - Duration in milliseconds
     * @returns {string} Formatted time string
     */
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    },

    /**
     * Format percentage
     * @param {number} value - Decimal value (0.5 = 50%)
     * @param {number} [decimals=0] - Decimal places
     * @returns {string} Formatted percentage string
     */
    formatPercent(value, decimals = 0) {
        return (value * 100).toFixed(decimals) + '%';
    },

    /**
     * Parse a formatted number string back to a number
     * @param {string} str - Formatted string
     * @returns {number} Parsed number
     */
    parse(str) {
        if (!str || typeof str !== 'string') return 0;

        // Remove currency symbols and whitespace
        str = str.replace(/[$,\s]/g, '').toUpperCase();

        // Find suffix
        for (let i = this.suffixes.length - 1; i >= 0; i--) {
            const suffix = this.suffixes[i].toUpperCase();
            if (suffix && str.endsWith(suffix)) {
                const numPart = parseFloat(str.slice(0, -suffix.length));
                return numPart * Math.pow(1000, i);
            }
        }

        return parseFloat(str) || 0;
    }
};
