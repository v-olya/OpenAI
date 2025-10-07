'use client';
import styles from './page.module.scss';
import { Chat } from '../../components/chat/chat';
import WeatherWidget from '../../components/widget/weather-widget';
import { useState, useEffect } from 'react';
import { WeatherData } from '@/app/types';

const WeatherDemo = () => {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

    const handleWeatherUpdate = (data: WeatherData) => {
        setWeatherData(data);
    };

    useEffect(() => {}, [weatherData]);

    return (
        <main className={styles.main}>
            <div className={`${styles.container} container`}>
                <div className={`${styles.column} layout-column`}>
                    <WeatherWidget weather={weatherData} />
                </div>
                <div
                    className={`${styles['chat-container']} layout-chat-container`}
                >
                    <div className={`${styles.chat} layout-chat`}>
                        <Chat onWeatherUpdate={handleWeatherUpdate} />
                    </div>
                </div>
            </div>
        </main>
    );
};

export default WeatherDemo;
