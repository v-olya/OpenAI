// Geocoding utility for any city using OpenStreetMap Nominatim
export async function geocodeCity(
    city: string
): Promise<{ lat: string; lon: string } | null> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        city
    )}`;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        if (data.length === 0) return null;
        return { lat: data[0].lat, lon: data[0].lon };
    } catch {
        return null;
    }
}
