import { ErrorMessages } from '@/utils/types';

export const isNightTime = (hour?: number): boolean => {
    const currentHour = typeof hour === 'number' ? hour : new Date().getHours();
    return currentHour >= 20 || currentHour < 6;
};

export const formatLocalTime = (
    date?: Date,
    options?: { timeZone?: string }
): string => {
    const timeToFormat = date ?? new Date();
    const tz = options?.timeZone;
    const intlOpts: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        ...(tz ? { timeZone: tz } : {}),
    };

    return timeToFormat.toLocaleTimeString([], intlOpts);
};

export const getWeatherIconName = (
    weathercode?: number,
    hour?: number
): string => {
    if (typeof weathercode !== 'number' || !weatherIconMap[weathercode]) {
        return 'unknown';
    }

    let iconName = weatherIconMap[weathercode];

    // Show clear-night icon for clear weather at night
    if (isNightTime(hour) && (weathercode === 0 || weathercode === 1)) {
        iconName = 'clear-night';
    }

    return iconName;
};

// Weather code mappings for displaying weather conditions and icons
export const weatherIconMap: Record<number, string> = {
    0: 'sun',
    1: 'sun',
    2: 'cloudy',
    3: 'cloudy',
    45: 'cloudy',
    48: 'cloudy',
    51: 'rain',
    53: 'rain',
    55: 'rain',
    56: 'rain',
    57: 'rain',
    61: 'rain',
    63: 'rain',
    65: 'rain',
    66: 'rain',
    67: 'rain',
    71: 'snow',
    73: 'snow',
    75: 'snow',
    77: 'snow',
    80: 'rain',
    81: 'rain',
    82: 'rain',
    85: 'snow',
    86: 'snow',
    95: 'thunder',
    96: 'thunder',
    99: 'thunder',
};

export const weatherCodeMap: Record<number, string> = {
    0: 'Clear',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
};

const getWeather = async (location: string) => {
    try {
        // Geocode location to get lat/lon
        const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
                location
            )}`
        );
        const geoData = await geoRes.json();
        if (!Array.isArray(geoData) || geoData.length === 0) {
            return {
                location,
                error: ErrorMessages.LOCATION_NOT_FOUND,
            };
        }
        const lat = geoData[0].lat;
        const lon = geoData[0].lon;
        const country = geoData[0].address?.country || '';
        const displayName = geoData[0].display_name || '';

        // Fetch weather from Open-Meteo with timezone
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) {
            return {
                location,
                error: ErrorMessages.WEATHER_API_ERROR,
            };
        }
        const weatherData = await weatherRes.json();
        if (!weatherData.current_weather) {
            return { location, error: ErrorMessages.NO_WEATHER_DATA };
        }
        return {
            location: country ? `${location}, ${country}` : location,
            resolvedName: displayName,
            temperature: weatherData.current_weather.temperature,
            unit: 'C',
            weathercode: weatherData.current_weather.weathercode,
            windspeed: weatherData.current_weather.windspeed,
            timezone: weatherData.timezone,
            error: undefined,
        };
    } catch (error) {
        return { location, error: String(error) };
    }
};

export { getWeather };
