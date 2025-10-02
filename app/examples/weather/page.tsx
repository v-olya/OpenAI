'use client';
import styles from './page.module.css';
import { Chat } from '../../components/chat/chat';
import WeatherWidget from '../../components/widget/weather-widget';
import { useState, useEffect } from 'react';
const WeatherDemo = () => {
    const [weatherData, setWeatherData] = useState(null);

    const handleWeatherUpdate = (data: any) => {
        setWeatherData(data);
    };

    useEffect(() => {}, [weatherData]);

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <div className={styles.column}>
                    <WeatherWidget weather={weatherData} />
                </div>
                <div className={styles.chatContainer}>
                    <div className={styles.chat}>
                        <Chat onWeatherUpdate={handleWeatherUpdate} />
                    </div>
                </div>
            </div>
        </main>
    );
};

export default WeatherDemo;
