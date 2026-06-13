import { db } from '@/lib/db';

const API_URL = 'https://api.carbonintensity.org.uk';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache duration

export interface FuelSourceData {
  source: string;
  percentage: number;
  color: string;
}

export interface GridData {
  intensity: number;
  status: 'low' | 'moderate' | 'high';
  fuelMix: FuelSourceData[];
  fetchedAt: Date;
}

const FUEL_COLORS: Record<string, string> = {
  solar: 'hsl(48, 90%, 50%)',
  wind: 'hsl(152, 68%, 55%)',
  nuclear: 'hsl(200, 85%, 55%)',
  hydro: 'hsl(180, 60%, 45%)',
  biomass: 'hsl(90, 45%, 50%)',
  gas: 'hsl(30, 10%, 55%)',
  coal: 'hsl(0, 0%, 30%)',
  imports: 'hsl(280, 60%, 60%)',
  other: 'hsl(0, 0%, 50%)',
};

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Generate realistic mock grid data as fallback
export function getMockGridData(): GridData {
  const hour = new Date().getHours();
  // Solar is higher during mid-day
  const solarPct = (hour > 6 && hour < 18) ? Math.round(15 + Math.sin((hour - 6) * Math.PI / 12) * 15) : 0;
  // Wind varies randomly between 15% and 35%
  const windPct = Math.round(20 + Math.sin(Date.now() / 3600000) * 10);
  const nuclearPct = 20;
  const hydroPct = 2;
  const biomassPct = 6;
  const gasPct = 100 - (solarPct + windPct + nuclearPct + hydroPct + biomassPct);

  const rawFuelMix = [
    { fuel: 'solar', perc: solarPct },
    { fuel: 'wind', perc: windPct },
    { fuel: 'nuclear', perc: nuclearPct },
    { fuel: 'hydro', perc: hydroPct },
    { fuel: 'biomass', perc: biomassPct },
    { fuel: 'gas', perc: Math.max(0, gasPct) },
  ];

  // Calculate weighted average intensity
  // Gas: 400g/kWh, Coal: 900g/kWh, nuclear/wind/solar/hydro/biomass: ~0-20g/kWh
  const intensity = Math.round((gasPct * 400 + nuclearPct * 12 + windPct * 11 + solarPct * 40) / 100);

  let status: 'low' | 'moderate' | 'high' = 'moderate';
  if (intensity <= 100) status = 'low';
  else if (intensity >= 250) status = 'high';

  const fuelMix = rawFuelMix
    .map((item) => ({
      source: capitalize(item.fuel),
      percentage: item.perc,
      color: FUEL_COLORS[item.fuel] || FUEL_COLORS.other,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return {
    intensity,
    status,
    fuelMix,
    fetchedAt: new Date(),
  };
}

/**
 * Fetches the latest carbon intensity and fuel mix.
 * Utilizes sqlite DB cache to prevent rate-limiting the external API.
 */
export async function getLatestGridData(): Promise<GridData> {
  const region = 'uk';
  const now = new Date();

  try {
    // Check if we have a valid cache in the database
    const cached = await db.carbonIntensityCache.findFirst({
      where: {
        region,
        expiresAt: {
          gt: now,
        },
      },
    });

    if (cached) {
      let fuelMix = [];
      try {
        fuelMix = JSON.parse(cached.fuelMix);
      } catch (e) {
        console.error('Failed to parse cached fuel mix:', e);
      }
      return {
        intensity: cached.intensity,
        status: cached.intensity <= 100 ? 'low' : cached.intensity >= 250 ? 'high' : 'moderate',
        fuelMix,
        fetchedAt: cached.fetchedAt,
      };
    }

    // Cache expired or missing, fetch fresh data from API
    console.log('Fetching live carbon intensity data from API...');
    const [intensityRes, generationRes] = await Promise.all([
      fetch(`${API_URL}/intensity`, { signal: AbortSignal.timeout(4000) }),
      fetch(`${API_URL}/generation`, { signal: AbortSignal.timeout(4000) }),
    ]);

    if (!intensityRes.ok || !generationRes.ok) {
      throw new Error('API request failed');
    }

    const intensityData = await intensityRes.json();
    const generationData = await generationRes.json();

    const intensity = intensityData?.data?.[0]?.intensity?.actual ?? 150;
    const mix = generationData?.data?.generationmix ?? [];

    let status: 'low' | 'moderate' | 'high' = 'moderate';
    if (intensity <= 100) status = 'low';
    else if (intensity >= 250) status = 'high';

    const fuelMix = mix.map((item: { fuel: string; perc: number }) => ({
      source: capitalize(item.fuel),
      percentage: item.perc,
      color: FUEL_COLORS[item.fuel.toLowerCase()] || FUEL_COLORS.other,
    })).sort((a: { percentage: number }, b: { percentage: number }) => b.percentage - a.percentage);

    const data: GridData = {
      intensity,
      status,
      fuelMix,
      fetchedAt: now,
    };

    // Store in cache
    const expiresAt = new Date(now.getTime() + CACHE_TTL_MS);
    await db.carbonIntensityCache.create({
      data: {
        region,
        intensity,
        fuelMix: JSON.stringify(fuelMix),
        fetchedAt: now,
        expiresAt,
      },
    });

    return data;
  } catch (error) {
    console.warn('Failed to fetch real-time carbon data, falling back to mock:', error);
    return getMockGridData();
  }
}
