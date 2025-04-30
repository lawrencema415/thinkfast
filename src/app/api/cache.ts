type CacheEntry<T> = {
  value: T;
  timestamp: number;
};

class Cache {
  private cache: Map<string, CacheEntry<unknown>>;
  private ttl: number;

  constructor(ttlMs: number = 24 * 60 * 60 * 1000) { // Default 24 hours
    this.cache = new Map();
    this.ttl = ttlMs;
  }

  set<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const previewCache = new Cache();

export const getPreviewCacheKey = (trackId: string): string => {
  return `spotify:preview:${trackId}`;
}; 