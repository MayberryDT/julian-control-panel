/**
 * TransparencyLog - Simple event bus for logging API activity
 *
 * This allows the UI to subscribe to network events and show them to the user.
 * It does NOT store logs permanently, just in memory for the session.
 */

class TransparencyLogger {
    constructor() {
        this.listeners = new Set();
        this.logs = [];
    }

    /**
     * Subscribe to log events
     * @param {Function} callback - Function to call with new log entry
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.listeners.add(callback);
        // clean up
        return () => this.listeners.delete(callback);
    }

    /**
     * Internal method to broadcast logs
     * @param {Object} entry 
     */
    _emit(entry) {
        const logEntry = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            ...entry
        };
        this.logs.push(logEntry);
        // Keep only last 50 logs to prevent memory leak
        if (this.logs.length > 50) this.logs.shift();

        this.listeners.forEach(fn => fn(logEntry));
    }

    logRequest(method, url) {
        this._emit({
            type: 'REQUEST',
            method,
            url,
            status: 'pending'
        });
    }

    logResponse(method, url, status, ok) {
        this._emit({
            type: 'RESPONSE',
            method,
            url,
            status: status,
            ok: ok
        });
    }

    logError(source, message) {
        this._emit({
            type: 'ERROR',
            source,
            message
        });
    }

    getLogs() {
        return this.logs;
    }

    clear() {
        this.logs = [];
        this._emit({ type: 'CLEAR' });
    }
}

export const logger = new TransparencyLogger();
