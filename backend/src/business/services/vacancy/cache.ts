import { CacheEntry, IndexVacancy } from './types';

export class VacancyCache {
  private cache = new Map<string, CacheEntry>();

  constructor(private ttlMs: number) {}

  get(courseCode: string): IndexVacancy[] | null {
    const key = courseCode.toUpperCase();
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  getStale(courseCode: string): IndexVacancy[] | null {
    const cached = this.cache.get(courseCode.toUpperCase());
    return cached ? cached.data : null;
  }

  set(courseCode: string, data: IndexVacancy[]): void {
    this.cache.set(courseCode.toUpperCase(), {
      data,
      timestamp: Date.now(),
      courseCode: courseCode.toUpperCase(),
    });
  }

  stats() {
    const entries = Array.from(this.cache.entries()).map(([code, entry]) => ({
      courseCode: code,
      ageMinutes: Math.round((Date.now() - entry.timestamp) / 1000 / 60),
      indexCount: entry.data.length,
    }));

    return {
      totalCachedCourses: this.cache.size,
      entries,
    };
  }

  clear(): number {
    const size = this.cache.size;
    this.cache.clear();
    return size;
  }
}
