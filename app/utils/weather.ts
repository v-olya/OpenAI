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
                error: "Sorry, I couldn't find that city. Please check the spelling or try another location.",
            };
        }
        const lat = geoData[0].lat;
        const lon = geoData[0].lon;
        // Fetch weather from Open-Meteo
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) {
            return {
                location,
                error: `Weather API error: ${weatherRes.status}`,
            };
        }
        const weatherData = await weatherRes.json();
        if (!weatherData.current_weather) {
            return { location, error: 'No weather data' };
        }
        return {
            location,
            temperature: weatherData.current_weather.temperature,
            unit: 'C',
            weathercode: weatherData.current_weather.weathercode,
            windspeed: weatherData.current_weather.windspeed,
            error: undefined,
        };
    } catch (error) {
        return { location, error: String(error) };
    }
};

export { getWeather };
