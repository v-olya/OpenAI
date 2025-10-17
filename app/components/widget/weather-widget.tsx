import styles from './weather-widget.module.scss';
import Image from 'next/image';
import type { WeatherWidgetProps } from '@/utils/types';
import {
    weatherCodeMap,
    formatLocalTime,
    getWeatherIconName,
} from '@/utils/weather';
import Panel from '../left-panel/panel';

const WeatherWidget = ({ weather }: WeatherWidgetProps) => {
    if (!weather) {
        return (
            <Panel>
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
            </Panel>
        );
    }
    if (weather.error) {
        return (
            <Panel>
                <p>Error: {weather.error}</p>
            </Panel>
        );
    }
    const conditions =
        typeof weather.weathercode === 'number'
            ? weatherCodeMap[weather.weathercode]
            : '';
    const iconName = getWeatherIconName(
        weather.weathercode,
        typeof weather.localHour === 'number' ? weather.localHour : undefined
    );

    return (
        <Panel>
            <h2>{weather.location || 'Unknown location'}</h2>
            <div className={styles['weather-widget-local-time']}>
                <span>Local time:</span>{' '}
                {weather.timezone
                    ? formatLocalTime(undefined, {
                          timeZone: weather.timezone,
                      })
                    : formatLocalTime()}
            </div>
            {typeof weather.temperature === 'number' && (
                <h3 className='emphasis'>{weather.temperature}°C</h3>
            )}
            <div className={styles['weather-widget-icon-container']}>
                <div className={styles['weather-widget-icon-wrapper']}>
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
            <div className={styles['weather-widget-info']}>
                <p>{conditions && <span>{conditions}</span>}</p>
                <p>
                    {weather.windspeed !== undefined && (
                        <span>Wind: {weather.windspeed} km/h</span>
                    )}
                </p>
            </div>
        </Panel>
    );
};
export default WeatherWidget;
