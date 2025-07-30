// I am too dumb for managing caching stuff so yea claude wrote this

import { MMKV } from "react-native-mmkv";

export interface CacheConfig {
    ttl?: number;
    maxAge?: number; 
    maxSize?: number;
    maxEntries?: number;
    
    validator?: (cachedData: any, context?: any) => boolean;
    
    compress?: boolean;
    
    encrypt?: boolean;
}

interface CacheEntry<T = any> {
    data: T;
    timestamp: number;
    expiresAt?: number;
    metadata?: {
        size: number;
        version?: string;
        tags?: string[];
        dependencies?: string[];
        [key: string]: any;
    };
}

interface CacheStats {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    lastCleanup: number;
}

// Predefined cache configurations for different content types
export const CACHE_CONFIGS = {
    // Study plans - expire daily, invalidate on progress change
    STUDY_PLANS: {
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        maxEntries: 10,
        validator: (cached: any, context: any) => {
            if (!context) return true;
            const { examType, daysLeft, progressHash } = context;
            return cached.metadata?.examType === examType &&
                   cached.metadata?.daysLeft === daysLeft &&
                   cached.metadata?.progressHash === progressHash;
        }
    } as CacheConfig,
    
    // Notes - longer TTL, version-based invalidation
    NOTES: {
        ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
        maxSize: 10 * 1024 * 1024, // 10MB
        compress: true,
        validator: (cached: any, context: any) => {
            if (!context?.version) return true;
            return cached.metadata?.version === context.version;
        }
    } as CacheConfig,
    
    // Quizzes - medium TTL, subject-based
    QUIZZES: {
        ttl: 3 * 24 * 60 * 60 * 1000, // 3 days
        maxEntries: 50,
        compress: true
    } as CacheConfig,
    
    // User progress - short TTL, frequent updates
    PROGRESS: {
        ttl: 60 * 60 * 1000, // 1 hour
        maxEntries: 20
    } as CacheConfig,
    
    // Static content - long TTL
    STATIC_CONTENT: {
        ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
        maxSize: 50 * 1024 * 1024, // 50MB
        compress: true
    } as CacheConfig,
    
    // Temporary data - very short TTL
    TEMP: {
        ttl: 5 * 60 * 1000, // 5 minutes
        maxEntries: 100
    } as CacheConfig,
    
    // Session data - no expiration but cleared on app restart
    SESSION: {
        maxEntries: 50
    } as CacheConfig
} as const;

class CacheManager {
    private storage: MMKV;
    private stats: CacheStats;
    private readonly STATS_KEY = 'cache.stats';
    private readonly PREFIX = 'cache.';

    constructor(storage: MMKV) {
        this.storage = storage;
        this.stats = this.loadStats();
        this.cleanup();
    }

    /**
     * Generate cache key with prefix
     */
    private generateKey(namespace: string, key: string): string {
        return `${this.PREFIX}${namespace}.${key}`;
    }

    /**
     * Simple hash function for generating keys
     */
    private hash(input: string): string {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }


    // Def compressing it 
    private compress(data: any): string {
        return JSON.stringify(data);
    }

    private decompress(data: string): any {
        return JSON.parse(data);
    }

    private loadStats(): CacheStats {
        try {
            const statsStr = this.storage.getString(this.STATS_KEY);
            if (statsStr) {
                return JSON.parse(statsStr);
            }
        } catch (error) {
            console.warn('Failed to load cache stats:', error);
        }
        
        return {
            totalEntries: 0,
            totalSize: 0,
            hitRate: 0,
            missRate: 0,
            lastCleanup: Date.now()
        };
    }

    private saveStats(): void {
        try {
            this.storage.set(this.STATS_KEY, JSON.stringify(this.stats));
        } catch (error) {
            console.warn('Failed to save cache stats:', error);
        }
    }

    private isValid<T>(entry: CacheEntry<T>, config: CacheConfig, context?: any): boolean {
        const now = Date.now();
        
        // Check expiration
        if (entry.expiresAt && now > entry.expiresAt) {
            return false;
        }
        
        // Check TTL
        if (config.ttl && (now - entry.timestamp) > config.ttl) {
            return false;
        }
        
        // Check max age
        if (config.maxAge && (now - entry.timestamp) > config.maxAge) {
            return false;
        }
        
        // Custom validation
        if (config.validator && !config.validator(entry, context)) {
            return false;
        }
        
        return true;
    }

    /**
     * Set cache entry
     */
    set<T>(
        namespace: string, 
        key: string, 
        data: T, 
        config: CacheConfig = {},
        metadata?: any
    ): boolean {
        try {
            const cacheKey = this.generateKey(namespace, key);
            const now = Date.now();
            
            const entry: CacheEntry<T> = {
                data,
                timestamp: now,
                expiresAt: config.ttl ? now + config.ttl : undefined,
                metadata: {
                    size: JSON.stringify(data).length,
                    ...metadata
                }
            };
            
            const serialized = config.compress ? 
                this.compress(entry) : JSON.stringify(entry);
            
            this.storage.set(cacheKey, serialized);
            
            // Update stats
            this.stats.totalEntries++;
            this.stats.totalSize += entry.metadata!.size;
            this.saveStats();
            
            console.log(`📦 Cached: ${namespace}.${key} (${entry.metadata!.size}B)`);
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    /**
     * Get cache entry
     */
    get<T>(
        namespace: string, 
        key: string, 
        config: CacheConfig = {},
        context?: any
    ): T | null {
        try {
            const cacheKey = this.generateKey(namespace, key);
            const serialized = this.storage.getString(cacheKey);
            
            if (!serialized) {
                this.stats.missRate++;
                return null;
            }
            
            const entry: CacheEntry<T> = config.compress ? 
                this.decompress(serialized) : JSON.parse(serialized);
            
            if (!this.isValid(entry, config, context)) {
                this.delete(namespace, key);
                this.stats.missRate++;
                return null;
            }
            
            this.stats.hitRate++;
            console.log(`📋 Cache hit: ${namespace}.${key}`);
            return entry.data;
        } catch (error) {
            console.error('Cache get error:', error);
            this.stats.missRate++;
            return null;
        }
    }

    /**
     * Get or set (fetch if not in cache)
     */
    async getOrSet<T>(
        namespace: string,
        key: string,
        fetcher: () => Promise<T>,
        config: CacheConfig = {},
        context?: any,
        metadata?: any
    ): Promise<T> {
        // Try to get from cache first
        const cached = this.get<T>(namespace, key, config, context);
        if (cached !== null) {
            return cached;
        }
        
        // Fetch new data
        console.log(`🔄 Cache miss, fetching: ${namespace}.${key}`);
        const data = await fetcher();
        
        // Cache the result
        this.set(namespace, key, data, config, metadata);
        
        return data;
    }

    /**
     * Delete cache entry
     */
    delete(namespace: string, key: string): boolean {
        try {
            const cacheKey = this.generateKey(namespace, key);
            const exists = this.storage.contains(cacheKey);
            
            if (exists) {
                this.storage.delete(cacheKey);
                this.stats.totalEntries--;
                console.log(`🗑️ Deleted cache: ${namespace}.${key}`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    }

    /**
     * Clear entire namespace
     */
    clearNamespace(namespace: string): number {
        try {
            const prefix = this.generateKey(namespace, '');
            const keys = this.storage.getAllKeys().filter(key => key.startsWith(prefix));
            
            keys.forEach(key => this.storage.delete(key));
            
            console.log(`🧹 Cleared namespace: ${namespace} (${keys.length} entries)`);
            return keys.length;
        } catch (error) {
            console.error('Clear namespace error:', error);
            return 0;
        }
    }

    /**
     * Clear all cache
     */
    clearAll(): void {
        try {
            const cacheKeys = this.storage.getAllKeys().filter(key => 
                key.startsWith(this.PREFIX) && key !== this.STATS_KEY
            );
            
            cacheKeys.forEach(key => this.storage.delete(key));
            
            // Reset stats
            this.stats = {
                totalEntries: 0,
                totalSize: 0,
                hitRate: 0,
                missRate: 0,
                lastCleanup: Date.now()
            };
            this.saveStats();
            
            console.log(`🧹 Cleared all cache (${cacheKeys.length} entries)`);
        } catch (error) {
            console.error('Clear all error:', error);
        }
    }

    /**
     * Cleanup expired entries
     */
    cleanup(): number {
        try {
            const now = Date.now();
            const cacheKeys = this.storage.getAllKeys().filter(key => 
                key.startsWith(this.PREFIX) && key !== this.STATS_KEY
            );
            
            let cleaned = 0;
            
            cacheKeys.forEach(key => {
                try {
                    const serialized = this.storage.getString(key);
                    if (!serialized) return;
                    
                    const entry: CacheEntry = JSON.parse(serialized);
                    
                    if (entry.expiresAt && now > entry.expiresAt) {
                        this.storage.delete(key);
                        cleaned++;
                    }
                } catch (error) {
                    this.storage.delete(key);
                    cleaned++;
                }
            });
            
            if (cleaned > 0) {
                this.stats.totalEntries -= cleaned;
                this.stats.lastCleanup = now;
                this.saveStats();
            }
            
            return cleaned;
        } catch (error) {
            console.error('Cleanup error:', error);
            return 0;
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        return { ...this.stats };
    }

    /**
     * Get namespace info
     */
    getNamespaceInfo(namespace: string): {
        entries: number;
        totalSize: number;
        keys: string[];
    } {
        try {
            const prefix = this.generateKey(namespace, '');
            const keys = this.storage.getAllKeys().filter(key => key.startsWith(prefix));
            
            let totalSize = 0;
            keys.forEach(key => {
                try {
                    const data = this.storage.getString(key);
                    if (data) totalSize += data.length;
                } catch {}
            });
            
            return {
                entries: keys.length,
                totalSize,
                keys: keys.map(key => key.replace(prefix, ''))
            };
        } catch (error) {
            console.error('Get namespace info error:', error);
            return { entries: 0, totalSize: 0, keys: [] };
        }
    }

    /**
     * Check if key exists in cache
     */
    has(namespace: string, key: string): boolean {
        const cacheKey = this.generateKey(namespace, key);
        return this.storage.contains(cacheKey);
    }

    /**
     * Generate cache key from object (useful for complex keys)
     */
    generateCacheKey(obj: any): string {
        const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
        return this.hash(str);
    }
}

// Convenience functions for specific content types
export class StudyPlanCache {
    constructor(private cache: CacheManager) {}
    
    async getTodaysPlan(examType: string, daysLeft: number, progressHash: string, fetcher: () => Promise<any>) {
        const key = `${examType}-${daysLeft}-${this.cache.generateCacheKey({ examType, daysLeft })}`;
        const context = { examType, daysLeft, progressHash };
        
        return this.cache.getOrSet(
            'study_plans',
            key,
            fetcher,
            CACHE_CONFIGS.STUDY_PLANS,
            context,
            { examType, daysLeft, progressHash }
        );
    }
}

export class NotesCache {
    constructor(private cache: CacheManager) {}
    
    async getNotes(subject: string, topic: string, version: string, fetcher: () => Promise<any>) {
        const key = `${subject}-${topic}`;
        const context = { version };
        
        return this.cache.getOrSet(
            'notes',
            key,
            fetcher,
            CACHE_CONFIGS.NOTES,
            context,
            { subject, topic, version }
        );
    }
}

export class QuizCache {
    constructor(private cache: CacheManager) {}
    
    async getQuiz(subject: string, topic: string, difficulty: string, fetcher: () => Promise<any>) {
        const key = `${subject}-${topic}-${difficulty}`;
        
        return this.cache.getOrSet(
            'quizzes',
            key,
            fetcher,
            CACHE_CONFIGS.QUIZZES,
            undefined,
            { subject, topic, difficulty }
        );
    }
}

export const createCacheManager = (storage: MMKV) => {
    return new CacheManager(storage);
};

export { CacheManager };

// Usage Examples:
/*
// Initialize
const cacheManager = createCacheManager(storage);
const studyPlanCache = new StudyPlanCache(cacheManager);
const notesCache = new NotesCache(cacheManager);
const quizCache = new QuizCache(cacheManager);

// Study Plans
const plan = await studyPlanCache.getTodaysPlan('JEE', 45, 'hash123', async () => {
    return await generateAIPlan();
});

// Notes
const notes = await notesCache.getNotes('Physics', 'Electrostatics', 'v1.0', async () => {
    return await fetchNotesFromAPI();
});

// Quizzes
const quiz = await quizCache.getQuiz('Math', 'Calculus', 'hard', async () => {
    return await generateQuiz();
});

// Generic usage
await cacheManager.getOrSet('user_data', 'preferences', async () => {
    return await fetchUserPreferences();
}, CACHE_CONFIGS.PROGRESS);

// Manual cache operations
cacheManager.set('temp_data', 'calculation', result, CACHE_CONFIGS.TEMP);
const result = cacheManager.get('temp_data', 'calculation', CACHE_CONFIGS.TEMP);

// Cache management
cacheManager.clearNamespace('quizzes');
cacheManager.cleanup();
const stats = cacheManager.getStats();
*/