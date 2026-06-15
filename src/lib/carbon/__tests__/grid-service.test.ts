import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockFindFirst = vi.fn();
const mockCreate = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    carbonIntensityCache: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

import { getMockGridData, getLatestGridData } from '../grid-service';

describe('grid-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Stub global fetch
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getMockGridData', () => {
    it('should generate valid mock data', () => {
      const data = getMockGridData();
      expect(data).toHaveProperty('intensity');
      expect(typeof data.intensity).toBe('number');
      expect(['low', 'moderate', 'high']).toContain(data.status);
      expect(Array.isArray(data.fuelMix)).toBe(true);
      expect(data.fuelMix.length).toBeGreaterThan(0);
      expect(data.fetchedAt).toBeInstanceOf(Date);
    });
  });

  describe('getLatestGridData', () => {
    it('should return cached data if available and not expired', async () => {
      const mockCached = {
        region: 'uk',
        intensity: 85,
        fuelMix: JSON.stringify([
          { source: 'Wind', percentage: 50, color: 'hsl(152, 68%, 55%)' },
          { source: 'Solar', percentage: 50, color: 'hsl(48, 90%, 50%)' },
        ]),
        fetchedAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 10), // 10 mins in future
      };

      mockFindFirst.mockResolvedValue(mockCached);

      const result = await getLatestGridData();

      expect(mockFindFirst).toHaveBeenCalled();
      expect(result.intensity).toBe(85);
      expect(result.status).toBe('low');
      expect(result.fuelMix).toHaveLength(2);
      expect(result.fuelMix[0].source).toBe('Wind');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON in cached data and return empty fuelMix', async () => {
      const mockCached = {
        region: 'uk',
        intensity: 300,
        fuelMix: '{invalid-json}',
        fetchedAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 10),
      };

      mockFindFirst.mockResolvedValue(mockCached);

      const result = await getLatestGridData();

      expect(result.intensity).toBe(300);
      expect(result.status).toBe('high');
      expect(result.fuelMix).toEqual([]);
    });

    it('should fetch fresh data if cache is missing or expired, and save to cache', async () => {
      mockFindFirst.mockResolvedValue(null);

      const mockIntensityResponse = {
        data: [{ intensity: { actual: 120 } }]
      };

      const mockGenerationResponse = {
        data: {
          generationmix: [
            { fuel: 'solar', perc: 10.5 },
            { fuel: 'wind', perc: 40.5 },
            { fuel: 'gas', perc: 49.0 },
          ]
        }
      };

      // Mock fetch resolving sequentially
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockIntensityResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGenerationResponse,
        } as Response);

      const result = await getLatestGridData();

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.intensity).toBe(120);
      expect(result.status).toBe('moderate');
      expect(result.fuelMix).toHaveLength(3);
      expect(result.fuelMix[0].source).toBe('Gas'); // sorted desc by perc
      expect(result.fuelMix[0].percentage).toBe(49.0);

      // Verify stored in cache
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should fallback to mock data if fetch fails', async () => {
      mockFindFirst.mockResolvedValue(null);

      // Fetch rejects (simulating network error)
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network failure'));

      const result = await getLatestGridData();

      expect(result).toHaveProperty('intensity');
      expect(result.fuelMix.length).toBeGreaterThan(0);
    });

    it('should fallback to mock data if API response is not ok', async () => {
      mockFindFirst.mockResolvedValue(null);

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
      } as Response);

      const result = await getLatestGridData();

      expect(result).toHaveProperty('intensity');
    });
  });
});
