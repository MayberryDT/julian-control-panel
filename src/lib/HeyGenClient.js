import { keyVault } from './KeyVault';
import { logger } from './TransparencyLog';

const BASE_URL = '/api/heygen';
const UPLOAD_URL = '/api/heygen-upload/v1/asset';

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
     * Get list of avatars (v2 library)
     */
    async getAvatars() {
        return this._fetch(`${BASE_URL}/v2/avatars`);
    },

    /**
     * Get list of photo avatar groups
     */
    async getAvatarGroups() {
        return this._fetch(`${BASE_URL}/v2/avatar_group.list`);
    },

    /**
     * Get looks in an avatar group
     */
    async getGroupDetails(groupId) {
        return this._fetch(`${BASE_URL}/v2/avatar_group/${groupId}/avatars`);
    },

    /**
     * Upload an image asset
     * @param {File} file 
     */
    async uploadAsset(file) {
        // Hard-fix for "Mime Type Mismatch" error:
        // By sniffing the file's "Magic Bytes" (the first few bytes), we ensure
        // the Content-Type header strictly matches what HeyGen's backend detects,
        // preventing errors caused by browsers misidentifying files based on extensions.

        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer.slice(0, 4));

        let contentType = file.type || 'image/jpeg';

        // Sniff PNG: 89 50 4E 47
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
            contentType = 'image/png';
        }
        // Sniff JPEG: FF D8 FF
        else if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
            contentType = 'image/jpeg';
        }

        return this._fetch(UPLOAD_URL, {
            method: 'POST',
            headers: {
                'Content-Type': contentType
            },
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
     * DISCOVERY: Get Talking Photos (V1 Legacy)
     */
    async getTalkingPhotosV1() {
        return this._fetch(`${BASE_URL}/v1/talking_photo.list`);
    },

    /**
     * DISCOVERY: Get Account Assets (V1)
     */
    async getAssetsV1() {
        return this._fetch(`${BASE_URL}/v1/asset.list`);
    },

    /**
     * Check Request Status (Polling)
     */
    async checkStatus(videoId) {
        return this._fetch(`${BASE_URL}/v1/video_status.get?video_id=${videoId}`);
    }
};
