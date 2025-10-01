import React from "react";
import styles from "./weather-widget.module.css";

interface WeatherWidgetProps {
  location?: string;
  temperature?: string | number;
  conditions?: string;
  isEmpty?: boolean;
  error?: string;
  isLoading?: boolean;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  location = "---",
  temperature = "---",
  conditions = "Sunny",
  isEmpty = false,
  error,
  isLoading = false,
}) => {
  const conditionClassMap = {
    Cloudy: styles.weatherBGCloudy,
    Sunny: styles.weatherBGSunny,
    Rainy: styles.weatherBGRainy,
    Snowy: styles.weatherBGSnowy,
    Windy: styles.weatherBGWindy,
  };

  if (error) {
    return (
      <div className={`${styles.weatherWidget} ${styles.weatherError}`}>
        <div className={styles.weatherWidgetData}>
          <p>Error getting weather</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={`${styles.weatherWidget} ${styles.weatherEmptyState}`}>
        <div className={styles.weatherWidgetData}>
          <h2>Enter a city</h2>
          <p>to see the local weather, e.g.</p>
          <p>
            <br />
            "What is the weather like in London?"
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${styles.weatherWidget} ${styles.weatherLoading}`}>
        <div className={styles.weatherWidgetData}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const weatherClass = `${styles.weatherWidget} ${
    conditionClassMap[conditions] || styles.weatherBGSunny
  }`;

  return (
    <div className={weatherClass}>
      <div className={styles.weatherWidgetData}>
        <p>{location}</p>
        <h2>{temperature !== "---" ? `${temperature}°F` : temperature}</h2>
        <p>{conditions}</p>
      </div>
    </div>
  );
};

export default WeatherWidget;
