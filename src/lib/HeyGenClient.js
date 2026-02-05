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
        // Fix for "Mime Type Mismatch" error (e.g. image/jpeg != image/png):
        // Browsers can sometimes misidentify file types. By sending the file 
        // as an ArrayBuffer and omitting the Content-Type header, we "un-restrict" 
        // the upload, allowing HeyGen's server to sniff the actual file content 
        // rather than relying on the browser's deduction.

        const buffer = await file.arrayBuffer();

        return this._fetch(UPLOAD_URL, {
            method: 'POST',
            body: buffer
        });
    },

    /**
     * Generate Video
     * @param {Object} payload 
     * @param {string} engine - 'v3' or 'v4'
     */
    async generateVideo(payload, engine = 'v4') {
        const endpoint = engine === 'v4' ? '/v2/video/av4/generate' : '/v2/video/generate';
        return this._fetch(`${BASE_URL}${endpoint}`, {
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
