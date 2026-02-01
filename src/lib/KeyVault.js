/**
 * KeyVault - Securely manages the HeyGen API Key
 *
 * Policies:
 * - Key is always held in memory._key
 * - If remember=true, key is also in localStorage
 * - getKey() returns the in-memory key first, then checks localStorage
 * - clearKey() wipes both
 * - NEVER logs the key
 */

const STORAGE_KEY = 'HEYGEN_API_KEY';

class KeyVault {
    constructor() {
        this._key = null;
        this._remember = false;

        // Load from storage on init if available
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            this._key = saved;
            this._remember = true;
        }
    }

    /**
     * Get the API Key
     * @returns {string|null} The API key or null
     */
    getKey() {
        return this._key;
    }

    /**
     * Set the API Key
     * @param {string} key - The HeyGen API Key
     * @param {boolean} remember - Whether to persist to localStorage
     */
    setKey(key, remember = false) {
        this._key = key;
        this._remember = remember;

        if (remember) {
            localStorage.setItem(STORAGE_KEY, key);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    /**
     * Clear the API Key completely
     */
    clearKey() {
        this._key = null;
        this._remember = false;
        localStorage.removeItem(STORAGE_KEY);
        // Optional: Clear other app-namespace items if we add them later
    }

    /**
     * Check if the key is currently persisted
     * @returns {boolean}
     */
    isRemembered() {
        return this._remember;
    }
}

// Singleton instance
export const keyVault = new KeyVault();
