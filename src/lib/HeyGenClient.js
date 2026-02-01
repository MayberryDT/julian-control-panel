import { keyVault } from './KeyVault';
import { logger } from './TransparencyLog';

const BASE_URL = 'https://api.heygen.com';
const UPLOAD_URL = 'https://upload.heygen.com/v1/asset';

/**
 * HeyGenClient - Direct client-side API interaction
 * Wraps fetch to provide auto-auth and transparency logging.
 */
export const heyGenClient = {

    /**
     * Generic fetch wrapper with logging and auth
     */
    async _fetch(url, options = {}) {
        const key = keyVault.getKey();
        if (!key) {
            const err = 'No API Key found. Please connect your Key.';
            logger.logError('Client', err);
            throw new Error(err);
        }

        const method = options.method || 'GET';
        // Log the attempt
        logger.logRequest(method, url);

        const headers = {
            'X-Api-Key': key,
            'Accept': 'application/json',
            ...(options.headers || {})
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Log the result
            logger.logResponse(method, url, response.status, response.ok);

            if (!response.ok) {
                const errorBody = await response.text();
                // Try parse JSON
                try {
                    const jsonErr = JSON.parse(errorBody);
                    throw new Error(jsonErr.message || jsonErr.error || 'HeyGen API Error');
                } catch (e) {
                    throw new Error(errorBody || `HTTP Error ${response.status}`);
                }
            }

            return await response.json();

        } catch (error) {
            logger.logError('Network', error.message);
            throw error;
        }
    },

    /**
     * Get list of voices
     */
    async getVoices() {
        return this._fetch(`${BASE_URL}/v2/voices`);
    },

    /**
     * Upload an image asset
     * @param {File} file 
     */
    async uploadAsset(file) {
        // Upload requires binary body and slightly different handling
        // Content-Type should NOT be set manually for fetch with binary/blob in some cases,
        // but HeyGen expects specific types. Let's try raw binary.

        let contentType = file.type || 'image/jpeg';

        // Ensure we send correct magic bytes/mime (simplified)
        // Similar logic to previous proxy but executed in browser

        return this._fetch(UPLOAD_URL, {
            method: 'POST',
            headers: {
                'Content-Type': contentType
            },
            body: file
        });
    },

    /**
     * Generate Video
     * @param {Object} payload 
     */
    async generateVideo(payload) {
        return this._fetch(`${BASE_URL}/v2/video/av4/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    },

    /**
     * Check Request Status (Polling)
     */
    async checkStatus(videoId) {
        return this._fetch(`${BASE_URL}/v1/video_status.get?video_id=${videoId}`);
    }
};
