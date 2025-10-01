"use client";

import React, { useState } from "react";
import styles from "./page.module.css";
import { Chat } from "../../components/chat/chat";
import WeatherWidget from "../../components/widget/weather-widget";

interface WeatherData {
  location?: string;
  temperature?: number;
  conditions?: string;
  error?: string;
}

const AllFeatures = () => {
  const [weatherData, setWeatherData] = useState<WeatherData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const isEmpty = Object.keys(weatherData).length === 0;

  const handleWeatherUpdate = (data: WeatherData) => {
    setIsLoading(false);
    if (data.error) {
      setError(data.error);
      return;
    }
    setError(undefined);
    setWeatherData(data);
  };

  const handleWeatherRequest = () => {
    setIsLoading(true);
    setError(undefined);
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.column}>
          <WeatherWidget
            location={weatherData.location}
            temperature={weatherData.temperature}
            conditions={weatherData.conditions}
            isEmpty={isEmpty}
            error={error}
            isLoading={isLoading}
          />
        </div>
        <div className={styles.chatContainer}>
          <div className={styles.chat}>
            <Chat
              onWeatherUpdate={handleWeatherUpdate}
              onWeatherRequest={handleWeatherRequest}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default AllFeatures;
