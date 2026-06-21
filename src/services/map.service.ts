export interface MapLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface RouteResult {
  distanceKm: number;
  geometry: [number, number][]; // coordinates array for polyline
}

/**
 * Search location coordinates using OpenStreetMap Nominatim API
 */
export async function searchLocations(query: string): Promise<MapLocation[]> {
  if (!query || query.trim().length < 3) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "EcoTrackAI/1.0",
      },
    });

    if (!res.ok) throw new Error("Search request failed");

    const data = await res.json();
    return data.map((item: any) => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch (error) {
    console.error("Nominatim search error:", error);
    return [];
  }
}

/**
 * Calculate route between two coordinates using OSRM API
 */
export async function getRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<RouteResult | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);

    if (!res.ok) throw new Error("OSRM routing request failed");

    const data = await res.json();
    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    const distanceKm = route.distance / 1000; // convert meters to km

    // OSRM returns coordinates as [lng, lat], Leaflet polyline expects [lat, lng]
    const geometry: [number, number][] = route.geometry.coordinates.map((coord: [number, number]) => [
      coord[1],
      coord[0],
    ]);

    return {
      distanceKm,
      geometry,
    };
  } catch (error) {
    console.error("OSRM routing error:", error);
    return null;
  }
}
