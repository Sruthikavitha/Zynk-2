/**
 * Geocoding Service
 * Supports OpenStreetMap Nominatim (default, keyless, rate-limited to 1 req/sec)
 * and Google Maps Geocoding API (if GOOGLE_MAPS_API_KEY is configured).
 */

export interface GeocodeCoordinates {
  lat: number;
  lng: number;
}

export interface AddressComponents {
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

class GeocodingService {
  private cache = new Map<string, GeocodeCoordinates | null>();
  private lastRequestTime = 0;
  private queue: Promise<void> = Promise.resolve();

  /**
   * Geocodes an address object into latitude and longitude.
   */
  public async geocodeAddress(address: AddressComponents): Promise<GeocodeCoordinates | null> {
    const { street, area, city, state, postalCode } = address;

    // Try progressively broader query candidates
    const candidates: string[] = [];

    // 1. Full address
    const full = [street, area, city, state, postalCode].filter(Boolean).join(', ');
    if (full) candidates.push(full);

    // 2. Cleaned street (strip door/flat numbers like '12, ') + area + city
    if (street) {
      const cleanedStreet = street.replace(/^[0-9A-Za-z\/\-#,\s]+,\s*/, '').trim();
      if (cleanedStreet && cleanedStreet !== street) {
        const cleanedFull = [cleanedStreet, area, city, state, postalCode].filter(Boolean).join(', ');
        if (cleanedFull) candidates.push(cleanedFull);
      }
    }

    // 3. Area + City + State
    if (area || city) {
      const areaCity = [area, city, state || 'Tamil Nadu', postalCode].filter(Boolean).join(', ');
      if (areaCity && !candidates.includes(areaCity)) candidates.push(areaCity);
    }

    // 4. City + State + PostalCode
    if (city) {
      const cityState = [city, state || 'Tamil Nadu', postalCode].filter(Boolean).join(', ');
      if (cityState && !candidates.includes(cityState)) candidates.push(cityState);
    }

    for (const query of candidates) {
      const coords = await this.geocodeQuery(query);
      if (coords) {
        return coords;
      }
    }

    return null;
  }

  /**
   * Geocodes a free-form location string (e.g. "Gandhipuram, Coimbatore").
   */
  public async geocodeLocationString(query: string): Promise<GeocodeCoordinates | null> {
    if (!query || !query.trim()) return null;
    return this.geocodeQuery(query.trim());
  }

  /**
   * Geocodes a specific query string with in-memory caching and rate limiting.
   */
  private async geocodeQuery(query: string): Promise<GeocodeCoordinates | null> {
    const normalizedKey = query.trim().toLowerCase();

    if (this.cache.has(normalizedKey)) {
      return this.cache.get(normalizedKey) || null;
    }

    try {
      const googleApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
      let coords: GeocodeCoordinates | null = null;

      if (googleApiKey) {
        coords = await this.geocodeWithGoogle(query, googleApiKey);
      } else {
        coords = await this.geocodeWithNominatim(query);
      }

      this.cache.set(normalizedKey, coords);
      return coords;
    } catch (err: any) {
      console.warn(`[GEOCODE] Warning: Geocoding failed for "${query}":`, err.message || err);
      this.cache.set(normalizedKey, null);
      return null;
    }
  }

  /**
   * Geocoding via Google Maps Geocoding API.
   */
  private async geocodeWithGoogle(query: string, apiKey: string): Promise<GeocodeCoordinates | null> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) return null;

      const data: any = await res.json();
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const loc = data.results[0].geometry.location;
        return {
          lat: Number(loc.lat),
          lng: Number(loc.lng),
        };
      }
      return null;
    } catch {
      clearTimeout(timeout);
      return null;
    }
  }

  /**
   * Geocoding via OpenStreetMap Nominatim.
   * Respects Nominatim usage policy: proper User-Agent and max 1 request/second.
   */
  private async geocodeWithNominatim(query: string): Promise<GeocodeCoordinates | null> {
    // Chain onto the queue to serialize requests and enforce >= 1100ms interval
    return new Promise((resolve) => {
      this.queue = this.queue.then(async () => {
        try {
          const now = Date.now();
          const elapsed = now - this.lastRequestTime;
          if (elapsed < 1100) {
            await new Promise((r) => setTimeout(r, 1100 - elapsed));
          }
          this.lastRequestTime = Date.now();

          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);

          const res = await fetch(url, {
            headers: {
              'User-Agent': 'ZYNK-Food-Delivery-Platform/1.0 (sruthiravichandran4@gmail.com)',
              'Accept': 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timeout);

          if (!res.ok) {
            resolve(null);
            return;
          }

          const data: any = await res.json();
          if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
            resolve({
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
            });
            return;
          }

          resolve(null);
        } catch {
          resolve(null);
        }
      });
    });
  }
}

export const geocodingService = new GeocodingService();
export default geocodingService;
