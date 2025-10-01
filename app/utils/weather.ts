const getWeather = async (location: string) => {
    try {
        // Use absolute URL for server-side fetch
        let baseUrl = '';
        if (typeof window === 'undefined') {
            // Node.js: build absolute URL from env or default
            baseUrl =
                process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        }
        const url = `${baseUrl}/api/weather?city=${encodeURIComponent(
            location
        )}`;
        const res = await fetch(url);
        if (!res.ok) {
            let errorMsg = `Weather API error: ${res.status}`;
            try {
                const errData = await res.json();
                if (errData.error) errorMsg = errData.error;
            } catch {}
            return {
                location,
                error: errorMsg,
            };
        }
        const data = await res.json();
        if (data.error || !data.current_weather) {
            return {
                location,
                temperature: undefined,
                unit: 'C',
                weathercode: undefined,
                windspeed: undefined,
                error: data.error || 'No weather data',
            };
        }
        return {
            location,
            temperature: data.current_weather.temperature,
            unit: 'C',
            weathercode: data.current_weather.weathercode,
            windspeed: data.current_weather.windspeed,
            error: undefined,
        };
    } catch (error) {
        return {
            location,
            error: String(error),
        };
    }
};

export { getWeather };
