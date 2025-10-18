'use client';
import { Chat } from '../../components/chat/chat';
import WeatherWidget from '../../components/widget/weather-widget';
import { useState } from 'react';
import type { WeatherData } from '@/utils/types';

const WeatherDemo = () => {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

    const handleWeatherUpdate = (data: WeatherData) => {
        setWeatherData(data);
    };

    return (
        <main className='container'>
            <WeatherWidget weather={weatherData} />
            <Chat chatType='weather' onWeatherUpdate={handleWeatherUpdate} />
        </main>
    );
};

export default WeatherDemo;
