import styles from './weather-widget.module.css';
import Image from 'next/image';
// No need for useEffect here

// This widget uses the OpenAI Responses API for weather
export type WeatherData = {
    location?: string;
    temperature?: number;
    windspeed?: number;
    weathercode?: number;
    error?: string;
};

const weatherIconMap: Record<number, string> = {
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
                    <p>to see the local weather</p>
                    <p>
                        <br />
                        &quot;What is the weather like in London?&quot;,
                        <br />
                        <br />
                        &quot;Now in London&quot;,
                        <br />
                        <br /> or something else...
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
    // Determine if it's night (between 20:00 and 6:00)
    const now = new Date();
    const hour = now.getHours();
    const isNight = hour >= 20 || hour < 6;
    let iconName =
        typeof weather.weathercode === 'number' &&
        weatherIconMap[weather.weathercode]
            ? weatherIconMap[weather.weathercode]
            : 'unknown';
    // No need for cloudy override; weatherIconMap already maps cloudy codes to 'cloudy'.
    // Show clear-night icon for clear weather at night
    if (isNight && (weather.weathercode === 0 || weather.weathercode === 1)) {
        iconName = 'clear-night';
    }

    return (
        <div className={styles.weatherWidget}>
            <div className={styles.weatherWidgetData}>
                {/* Show location, then local time below */}
                <h2>{weather.location || 'Unknown location'}</h2>
                <div
                    style={{
                        textAlign: 'center',
                        fontSize: '1.1em',
                        color: '#fff',
                        marginBottom: '0.5em',
                    }}
                >
                    <span style={{ opacity: 0.8 }}>Local time:</span>{' '}
                    {now.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </div>
                {typeof weather.temperature === 'number' && (
                    <h3 className={styles.weatherWidgetTemp}>
                        {weather.temperature}°C
                    </h3>
                )}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: '1rem',
                    }}
                >
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        }}
                    >
                        <Image
                            src={`/weather-icons/${iconName}.svg`}
                            alt={
                                conditions ||
                                (iconName === 'cloudy'
                                    ? 'Cloudy'
                                    : 'Unknown weather')
                            }
                            width={64}
                            height={64}
                        />
                    </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <p style={{ margin: 0 }}>
                        {conditions && <span>{conditions}</span>}
                    </p>
                    <p style={{ margin: 0 }}>
                        {weather.windspeed !== undefined && (
                            <span>Windspeed: {weather.windspeed} km/h</span>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
};
export default WeatherWidget;
