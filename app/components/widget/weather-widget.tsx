import styles from './weather-widget.module.scss';
import Image from 'next/image';
import { WeatherWidgetProps } from '@/types';
import {
    weatherCodeMap,
    formatLocalTime,
    getWeatherIconName,
} from '@/utils/weather';

const WeatherWidget = ({ weather }: WeatherWidgetProps) => {
    if (!weather) {
        return (
            <div className={styles['weather-widget']}>
                <div className={styles['weather-widget-data']}>
                    <h2>Enter a city</h2>
                    <p>to see the local weather:</p>
                    <p>
                        <br />
                        &quot;What&apos;s the weather like in London?&quot;,
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
            <div className={styles['weather-widget']}>
                <div className={styles['weather-widget-data']}>
                    <p>Error: {weather.error}</p>
                </div>
            </div>
        );
    }
    const conditions =
        typeof weather.weathercode === 'number'
            ? weatherCodeMap[weather.weathercode]
            : '';
    const iconName = getWeatherIconName(weather.weathercode);

    return (
        <div className={styles['weather-widget']}>
            <div className={styles['weather-widget-data']}>
                <h2>{weather.location || 'Unknown location'}</h2>
                <div className={styles.weatherLocalTime}>
                    <span>Local time:</span> {formatLocalTime()}
                </div>
                {typeof weather.temperature === 'number' && (
                    <h3 className={styles['weather-widget-temp']}>
                        {weather.temperature}°C
                    </h3>
                )}
                <div className={styles['weather-icon-container']}>
                    <div className={styles['weather-icon-wrapper']}>
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
                <div className={styles['weather-info']}>
                    <p>{conditions && <span>{conditions}</span>}</p>
                    <p>
                        {weather.windspeed !== undefined && (
                            <span>Wind: {weather.windspeed} km/h</span>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
};
export default WeatherWidget;
