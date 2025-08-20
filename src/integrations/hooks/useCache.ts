import { useCallback, useRef, useState } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface UseCacheProps<T> {
  maxSize?: number;
  defaultTTL?: number; // in milliseconds
}

export const useCache = <T>({
  maxSize = 100,
  defaultTTL = 10 * 60 * 1000, // 10 minutes
}: UseCacheProps<T> = {}) => {
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const [, setUpdateTrigger] = useState(0);

  const forceUpdate = () => setUpdateTrigger((prev) => prev + 1);

  const get = useCallback((key: string): T | null => {
    const entry = cacheRef.current.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      cacheRef.current.delete(key);
      forceUpdate();
      return null;
    }

    return entry.data;
  }, []);

  const set = useCallback(
    (key: string, data: T, ttl: number = defaultTTL) => {
      // Implement LRU eviction if at max size
      if (cacheRef.current.size >= maxSize && !cacheRef.current.has(key)) {
        // Remove oldest entry
        const firstKey = cacheRef.current.keys().next().value;
        if (firstKey) {
          cacheRef.current.delete(firstKey);
        }
      }

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      };

      cacheRef.current.set(key, entry);
      forceUpdate();
    },
    [maxSize, defaultTTL]
  );

  const remove = useCallback((key: string) => {
    const deleted = cacheRef.current.delete(key);
    if (deleted) {
      forceUpdate();
    }
    return deleted;
  }, []);

  const clear = useCallback(() => {
    cacheRef.current.clear();
    forceUpdate();
  }, []);

  const has = useCallback((key: string): boolean => {
    const entry = cacheRef.current.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      cacheRef.current.delete(key);
      forceUpdate();
      return false;
    }

    return true;
  }, []);

  const size = cacheRef.current.size;

  return {
    get,
    set,
    remove,
    clear,
    has,
    size,
  };
};


