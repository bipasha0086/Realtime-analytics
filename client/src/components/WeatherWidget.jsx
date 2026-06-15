import { useState, useEffect } from 'react';
import './WeatherWidget.css';

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated weather data
    const generateWeatherData = () => {
      const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'];
      const temperature = Math.floor(Math.random() * (30 - 15) + 15); // 15-30°C
      const humidity = Math.floor(Math.random() * (90 - 30) + 30); // 30-90%
      const windSpeed = Math.floor(Math.random() * 30); // 0-30 km/h

      return {
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        temperature,
        humidity,
        windSpeed,
        timestamp: new Date()
      };
    };

    // Update weather every 5 minutes
    const updateWeather = () => {
      setWeather(generateWeatherData());
      setLoading(false);
    };

    updateWeather();
    const interval = setInterval(updateWeather, 300000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="weather-widget loading">Loading weather data...</div>;
  }

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'Sunny':
        return '☀️';
      case 'Cloudy':
        return '☁️';
      case 'Rainy':
        return '🌧️';
      case 'Partly Cloudy':
        return '⛅';
      default:
        return '🌤️';
    }
  };

  return (
    <div className="weather-widget">
      <h3>Local Weather</h3>
      <div className="weather-content">
        <div className="weather-icon">
          {getWeatherIcon(weather.condition)}
        </div>
        <div className="weather-details">
          <div className="temperature">
            {weather.temperature}°C
          </div>
          <div className="condition">
            {weather.condition}
          </div>
          <div className="weather-stats">
            <div className="stat">
              <span className="label">Humidity:</span>
              <span className="value">{weather.humidity}%</span>
            </div>
            <div className="stat">
              <span className="label">Wind:</span>
              <span className="value">{weather.windSpeed} km/h</span>
            </div>
          </div>
          <div className="timestamp">
            Last updated: {weather.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;