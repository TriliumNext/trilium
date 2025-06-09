import log from '../../../log.js';
import type { ICacheManager, CachedNoteData, CachedQueryResults } from '../../interfaces/context_interfaces.js';

/**
 * Manages caching for context services
 * Provides a centralized caching system to avoid redundant operations
 */
export class CacheManager implements ICacheManager {
    // Cache for recently used context to avoid repeated lookups
    private noteDataCache = new Map<string, CachedNoteData<unknown>>();

    // Cache for recently used queries
    private queryCache = new Map<string, CachedQueryResults<unknown>>();

    // Default cache expiry (5 minutes)
    private defaultCacheExpiryMs = 5 * 60 * 1000;

    constructor() {
        this.setupCacheCleanup();
    }

    /**
     * Set up periodic cache cleanup
     */
    private setupCacheCleanup() {
        setInterval(() => {
            this.cleanupCache();
        }, 60000); // Run cleanup every minute
    }

    /**
     * Clean up expired cache entries
     */
    cleanupCache() {
        const now = Date.now();

        // Clean note data cache
        for (const [key, data] of this.noteDataCache.entries()) {
            if (now - data.timestamp > this.defaultCacheExpiryMs) {
                this.noteDataCache.delete(key);
            }
        }

        // Clean query cache
        for (const [key, data] of this.queryCache.entries()) {
            if (now - data.timestamp > this.defaultCacheExpiryMs) {
                this.queryCache.delete(key);
            }
        }
    }

    /**
     * Get cached note data
     */
    getNoteData<T>(noteId: string, type: string): T | null {
        const key = `${noteId}:${type}`;
        const cached = this.noteDataCache.get(key);

        if (cached && Date.now() - cached.timestamp < this.defaultCacheExpiryMs) {
            log.info(`Cache hit for note data: ${key}`);
            return cached.data as T;
        }

        return null;
    }

    /**
     * Store note data in cache
     */
    storeNoteData<T>(noteId: string, type: string, data: T): void {
        const key = `${noteId}:${type}`;
        this.noteDataCache.set(key, {
            timestamp: Date.now(),
            data
        });
        log.info(`Cached note data: ${key}`);
    }

    /**
     * Get cached query results
     */
    getQueryResults<T>(query: string, contextNoteId: string | null = null): T | null {
        const key = JSON.stringify({ query, contextNoteId });
        const cached = this.queryCache.get(key);

        if (cached && Date.now() - cached.timestamp < this.defaultCacheExpiryMs) {
            log.info(`Cache hit for query: ${query}`);
            return cached.results as T;
        }

        return null;
    }

    /**
     * Store query results in cache
     */
    storeQueryResults<T>(query: string, results: T, contextNoteId: string | null = null): void {
        const key = JSON.stringify({ query, contextNoteId });
        this.queryCache.set(key, {
            timestamp: Date.now(),
            results
        });
        log.info(`Cached query results: ${query}`);
    }

    /**
     * Clear all caches
     */
    clearAllCaches(): void {
        this.noteDataCache.clear();
        this.queryCache.clear();
        log.info('All context caches cleared');
    }
}

// Export singleton instance
export default new CacheManager();
