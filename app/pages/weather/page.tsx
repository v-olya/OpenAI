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
            <div className={styles.container}>
                <WeatherWidget weather={weatherData} />
                <Chat onWeatherUpdate={handleWeatherUpdate} />
            </div>
        </main>
    );
};

export default WeatherDemo;
