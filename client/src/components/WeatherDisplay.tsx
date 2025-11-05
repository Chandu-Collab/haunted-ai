import React, { useState, useEffect } from 'react';

interface WeatherData {
  condition: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  cloudCover: number;
  isNight: boolean;
  mood: 'gloomy' | 'cheerful' | 'mysterious' | 'energetic' | 'calm';
}

interface WeatherDisplayProps {
  className?: string;
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ className = '' }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/weather');
      if (response.ok) {
        const result = await response.json();
        setWeather(result.weather);
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeatherIcon = (condition: string, isNight: boolean): string => {
    const icons: Record<string, { day: string; night: string }> = {
      'Clear': { day: '☀️', night: '🌙' },
      'Clouds': { day: '☁️', night: '☁️' },
      'Rain': { day: '🌧️', night: '🌧️' },
      'Thunderstorm': { day: '⛈️', night: '⛈️' },
      'Snow': { day: '❄️', night: '❄️' },
      'Mist': { day: '🌫️', night: '🌫️' },
      'Fog': { day: '🌫️', night: '🌫️' }
    };
    
    const icon = icons[condition];
    return icon ? (isNight ? icon.night : icon.day) : '🌡️';
  };

  const getMoodIcon = (mood: string): string => {
    const moodIcons: Record<string, string> = {
      gloomy: '😔',
      cheerful: '😊',
      mysterious: '🔮',
      energetic: '⚡',
      calm: '😌'
    };
    return moodIcons[mood] || '👻';
  };

  const getMoodClass = (mood: string): string => {
    const moodClasses: Record<string, string> = {
      gloomy: 'text-blue-300',
      cheerful: 'text-yellow-300',
      mysterious: 'text-purple-300',
      energetic: 'text-orange-300',
      calm: 'text-green-300'
    };
    return moodClasses[mood] || 'text-gray-300';
  };

  const getSpiritalDescription = (weather: WeatherData): string => {
    const descriptions: Record<string, string> = {
      'Clear': weather.isNight 
        ? 'The veil between worlds grows thin under the clear night sky...'
        : 'Bright sunlight makes spirits harder to see, but they are still here...',
      'Clouds': 'The clouded sky provides perfect cover for supernatural manifestations...',
      'Rain': 'The rain creates a melancholic atmosphere that draws spirits closer...',
      'Thunderstorm': 'The storm\'s energy amplifies ghostly presence - perfect for hauntings...',
      'Snow': 'The pristine snow muffles earthly sounds, making spirit whispers clearer...',
      'Mist': 'The mist blurs the boundary between the living and dead worlds...',
      'Fog': 'Thick fog conceals otherworldly visitors walking among us...'
    };
    
    return descriptions[weather.condition] || 'The atmosphere feels charged with supernatural energy...';
  };

  if (isLoading) {
    return (
      <div className={`weather-display w-full max-w-full sm:max-w-md mx-auto px-2 sm:px-0 ${className}`}>
        <div className="weather-loading p-2 sm:p-3 bg-black/20 rounded-lg border border-purple-500/30">
          <div className="text-purple-300 text-xs sm:text-sm text-center">
            Reading the atmospheric omens...
          </div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className={`weather-display w-full max-w-full sm:max-w-md mx-auto px-2 sm:px-0 ${className}`}>
      <div className="weather-container p-2 sm:p-3 bg-black/20 rounded-lg border border-purple-500/30">
        <div className="weather-header flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2 sm:gap-0">
          <h3 className="text-purple-300 text-xs sm:text-sm font-semibold">Spiritual Atmosphere</h3>
          <button
            onClick={fetchWeather}
            className="text-purple-400 hover:text-purple-200 text-xs sm:text-sm"
            title="Refresh atmospheric readings"
          >
            🔄
          </button>
        </div>

        <div className="weather-main flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
          <div className="weather-icon text-xl sm:text-2xl">
            {getWeatherIcon(weather.condition, weather.isNight)}
          </div>
          <div className="weather-info flex-1">
            <div className="weather-temp text-purple-100 text-base sm:text-lg font-semibold">
              {weather.temperature}°C
            </div>
            <div className="weather-condition text-purple-200 text-xs sm:text-sm">
              {weather.description}
            </div>
          </div>
          <div className="weather-mood flex items-center space-x-1">
            <span className="mood-icon text-base sm:text-lg">
              {getMoodIcon(weather.mood)}
            </span>
            <span className={`mood-text text-xs sm:text-sm capitalize ${getMoodClass(weather.mood)}`}>
              {weather.mood}
            </span>
          </div>
        </div>

        <div className="weather-details grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 text-xs sm:text-sm">
          <div className="detail text-center">
            <div className="text-purple-400">Humidity</div>
            <div className="text-purple-200">{weather.humidity}%</div>
          </div>
          <div className="detail text-center">
            <div className="text-purple-400">Wind</div>
            <div className="text-purple-200">{weather.windSpeed} m/s</div>
          </div>
          <div className="detail text-center hidden sm:block">
            <div className="text-purple-400">Clouds</div>
            <div className="text-purple-200">{weather.cloudCover}%</div>
          </div>
          {/* On mobile, show clouds below */}
          <div className="detail text-center sm:hidden col-span-2">
            <div className="text-purple-400">Clouds</div>
            <div className="text-purple-200">{weather.cloudCover}%</div>
          </div>
        </div>

        <div className="spiritual-description bg-purple-900/20 rounded p-2 sm:p-3">
          <div className="text-purple-200 text-xs sm:text-sm italic">
            {getSpiritalDescription(weather)}
          </div>
        </div>

        <div className="time-indicator mt-2 text-center">
          <span className="text-purple-400 text-xs sm:text-sm">
            {weather.isNight ? '🌙 Night time - Peak spiritual activity' : '☀️ Day time - Spirits are present but subtle'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeatherDisplay;