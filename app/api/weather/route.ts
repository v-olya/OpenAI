import { NextResponse } from 'next/server';
import { geocodeCity } from './geocode';

const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    let latitude = searchParams.get('lat');
    let longitude = searchParams.get('lon');
    const city = searchParams.get('city');

    // If city is provided, geocode it
    if (city && (!latitude || !longitude)) {
        const coords = await geocodeCity(city);
        if (!coords) {
            return NextResponse.json(
                { error: `Could not find coordinates for city: ${city}` },
                { status: 400 }
            );
        }
        latitude = coords.lat;
        longitude = coords.lon;
    }

    // If no coordinates after geocoding, return error
    if (!latitude || !longitude) {
        return NextResponse.json(
            { error: 'No coordinates found for requested city.' },
            { status: 400 }
        );
    }

    const url = `${WEATHER_API_URL}?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch weather data' },
                { status: 500 }
            );
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: 'Weather API error', details: String(error) },
            { status: 500 }
        );
    }
}
