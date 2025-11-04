// Client-side caching utilities for performance optimization

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    });

    // Also store in localStorage for persistence across sessions
    try {
      localStorage.setItem(
        `agrilink_cache_${key}`,
        JSON.stringify({
          data,
          timestamp: Date.now(),
          expiresIn: ttl,
        })
      );
    } catch (error) {
      console.warn('Failed to store in localStorage:', error);
    }
  }

  get<T>(key: string): T | null {
    // First check memory cache
    const memoryItem = this.cache.get(key);
    if (memoryItem && !this.isExpired(memoryItem)) {
      return memoryItem.data;
    }

    // Then check localStorage
    try {
      const stored = localStorage.getItem(`agrilink_cache_${key}`);
      if (stored) {
        const item: CacheItem<T> = JSON.parse(stored);
        if (!this.isExpired(item)) {
          // Restore to memory cache
          this.cache.set(key, item);
          return item.data;
        } else {
          // Clean up expired item
          localStorage.removeItem(`agrilink_cache_${key}`);
        }
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }

    return null;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    try {
      localStorage.removeItem(`agrilink_cache_${key}`);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  invalidatePattern(pattern: string): void {
    // Invalidate all keys matching pattern
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.invalidate(key));

    // Also clean localStorage
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('agrilink_cache_') && key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clean localStorage:', error);
    }
  }

  clear(): void {
    this.cache.clear();
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('agrilink_cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.expiresIn;
  }
}

export const cache = new CacheManager();

// Cache keys for different data types
export const CACHE_KEYS = {
  PRODUCTS: 'products',
  PRODUCT_CATEGORY: (category: string) => `products_category_${category}`,
  SEARCH_RESULTS: (query: string) => `search_${query}`,
  USER_PROFILE: (userId: string) => `profile_${userId}`,
  PRICE_PREDICTION: (category: string, location: string) => `price_${category}_${location}`,
  RECOMMENDATIONS: (userId: string) => `recommendations_${userId}`,
};
