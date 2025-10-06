import { ErrorMessages } from '@/app/types';

// Time and weather utility functions
export const isNightTime = (hour?: number): boolean => {
    const currentHour = hour ?? new Date().getHours();
    return currentHour >= 20 || currentHour < 6;
};

export const formatLocalTime = (date?: Date): string => {
    const timeToFormat = date ?? new Date();
    return timeToFormat.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const getWeatherIconName = (weathercode?: number): string => {
    if (typeof weathercode !== 'number' || !weatherIconMap[weathercode]) {
        return 'unknown';
    }

    let iconName = weatherIconMap[weathercode];

    // Show clear-night icon for clear weather at night
    if (isNightTime() && (weathercode === 0 || weathercode === 1)) {
        iconName = 'clear-night';
    }

    return iconName;
};

// Weather code mappings for displaying weather conditions and icons
export const weatherIconMap: Record<number, string> = {
    0: 'sun', // Clear
    1: 'sun', // Mainly clear
    2: 'cloudy', // Partly cloudy
    3: 'cloudy', // Overcast
    45: 'cloudy', // Fog
    48: 'cloudy', // Depositing rime fog
    51: 'rain', // Light drizzle
    53: 'rain', // Moderate drizzle
    55: 'rain', // Dense drizzle
    56: 'rain', // Light freezing drizzle
    57: 'rain', // Dense freezing drizzle
    61: 'rain', // Slight rain
    63: 'rain', // Moderate rain
    65: 'rain', // Heavy rain
    66: 'rain', // Light freezing rain
    67: 'rain', // Heavy freezing rain
    71: 'snow', // Slight snow fall
    73: 'snow', // Moderate snow fall
    75: 'snow', // Heavy snow fall
    77: 'snow', // Snow grains
    80: 'rain', // Slight rain showers
    81: 'rain', // Moderate rain showers
    82: 'rain', // Violent rain showers
    85: 'snow', // Slight snow showers
    86: 'snow', // Heavy snow showers
    95: 'thunder', // Thunderstorm
    96: 'thunder', // Thunderstorm with slight hail
    99: 'thunder', // Thunderstorm with heavy hail
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
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
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
            temperature: weatherData.current_weather.temperature,
            unit: 'C',
            weathercode: weatherData.current_weather.weathercode,
            windspeed: weatherData.current_weather.windspeed,
            timezone: weatherData.timezone,
            timezone_offset: weatherData.timezone_abbreviation,
            error: undefined,
        };
    } catch (error) {
        return { location, error: String(error) };
    }
};

export { getWeather };
