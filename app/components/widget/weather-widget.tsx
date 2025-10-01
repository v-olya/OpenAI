import styles from './weather-widget.module.css';
// No need for useEffect here

// This widget uses the OpenAI Responses API for weather
export type WeatherData = {
    location?: string;
    temperature?: number;
    windspeed?: number;
    weathercode?: number;
    error?: string;
};

const weatherCodeMap: Record<number, string> = {
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

interface WeatherWidgetProps {
    weather: WeatherData | null;
}
const WeatherWidget = ({ weather }: WeatherWidgetProps) => {
    if (!weather) {
        return (
            <div className={styles.weatherWidget}>
                <div className={styles.weatherWidgetData}>
                    <h2>Enter a city</h2>
                    <p>to see the local weather, e.g.</p>
                    <p>
                        <br />
                        &apos;What is the weather like in London?&apos;
                    </p>
                </div>
            </div>
        );
    }
    if (weather.error) {
        return (
            <div className={styles.weatherWidget}>
                <div className={styles.weatherWidgetData}>
                    <p>Error: {weather.error}</p>
                </div>
            </div>
        );
    }
    const conditions =
        typeof weather.weathercode === 'number'
            ? weatherCodeMap[weather.weathercode]
            : '';
    return (
        <div className={styles.weatherWidget}>
            <div className={styles.weatherWidgetData}>
                <h2>{weather.location || 'Unknown location'}</h2>
                {typeof weather.temperature === 'number' && (
                    <h3 className={styles.weatherWidgetTemp}>
                        {weather.temperature}°C
                    </h3>
                )}
                <p>
                    {weather.windspeed !== undefined && (
                        <span>
                            Windspeed: {weather.windspeed} km/h
                            <br />
                        </span>
                    )}
                    {conditions && <span>{conditions}</span>}
                </p>
            </div>
        </div>
    );
};
export default WeatherWidget;
