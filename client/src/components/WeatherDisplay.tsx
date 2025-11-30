import React, { useState, useEffect } from 'react';

interface WeatherData {
  condition: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  cloudCover?: number;
  pressure?: number;
  barometricPressure?: number;
  visibility?: number;
  isNight: boolean;
  moonPhase?: string;
  spiritualIntensity?: number;
  paranormalActivity?: number;
  veilThinness?: number;
  mood: 'gloomy' | 'cheerful' | 'mysterious' | 'energetic' | 'calm';
  location?: {
    city: string;
    country: string;
    state?: string;
    timezone: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  };
}

interface SpiritualAtmosphereData {
  location: {
    city: string;
    country: string;
    timezone: string;
  };
  spiritualIntensity: number;
  paranormalActivity: number;
  veilThinness: number;
  moonPhase: string;
  mood: string;
  isNight: boolean;
  weather: {
    condition: string;
    description: string;
    temperature: number;
  };
  atmosphericFactors: {
    humidity: number;
    pressure: number;
    windSpeed: number;
    visibility: number;
  };
}

interface WeatherDisplayProps {
  className?: string;
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ className = '' }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [spiritualData, setSpiritualData] = useState<SpiritualAtmosphereData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    requestLocationAndFetchWeather();
  }, []);

  const requestLocationAndFetchWeather = async () => {
    setIsLoading(true);
    setLocationError(null);

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by browser');
      fetchRandomWeather();
      return;
    }

    // Request user's location
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`Location acquired: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
        await fetchSpiritualAtmosphere(latitude, longitude);
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        setLocationError('Location access denied');
        fetchRandomWeather();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for better accuracy
        maximumAge: 60000 // Cache for 1 minute only for more current location
      }
    );
  };

  const fetchSpiritualAtmosphere = async (lat: number, lon: number) => {
    try {
      const response = await fetch('/api/chat/spiritual-atmosphere', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lon }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setSpiritualData(result.data);
          // Convert spiritual data to weather format for compatibility
          setWeather({
            condition: result.data.weather.condition,
            temperature: result.data.weather.temperature,
            description: result.data.weather.description,
            humidity: result.data.atmosphericFactors.humidity,
            windSpeed: result.data.atmosphericFactors.windSpeed,
            pressure: result.data.atmosphericFactors.pressure,
            visibility: result.data.atmosphericFactors.visibility,
            isNight: result.data.isNight,
            moonPhase: result.data.moonPhase,
            spiritualIntensity: result.data.spiritualIntensity,
            paranormalActivity: result.data.paranormalActivity,
            veilThinness: result.data.veilThinness,
            mood: result.data.mood as WeatherData['mood'],
            location: result.data.location,
          });
        }
      } else {
        throw new Error('Failed to fetch spiritual atmosphere');
      }
    } catch (error) {
      console.error('Error fetching spiritual atmosphere:', error);
      // Fallback to regular weather
      fetchWeatherWithCoords(lat, lon);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeatherWithCoords = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`/api/chat/weather?lat=${lat}&lon=${lon}`);
      if (response.ok) {
        const result = await response.json();
        setWeather(result.weather);
      }
    } catch (error) {
      console.error('Error fetching weather with coordinates:', error);
      fetchRandomWeather();
    }
  };

  const fetchRandomWeather = async () => {
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
            🌙 Reading spiritual atmosphere from your location...
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
          <h3 className="text-purple-300 text-xs sm:text-sm font-semibold">
            🔮 Spiritual Atmosphere
          </h3>
          <button
            onClick={requestLocationAndFetchWeather}
            className="text-purple-400 hover:text-purple-200 text-xs sm:text-sm"
            title="Refresh atmospheric readings"
          >
            🔄
          </button>
        </div>

        {/* Location Display */}
        {weather.location && (
          <div className="location-info text-xs text-purple-400 mb-2">
            📍 {weather.location.city}
            {weather.location.state && `, ${weather.location.state}`}
            , {weather.location.country}
            {weather.location.coordinates && (
              <div className="coordinates text-xs text-purple-500">
                🗺️ {weather.location.coordinates.lat.toFixed(4)}, {weather.location.coordinates.lon.toFixed(4)}
              </div>
            )}
          </div>
        )}

        {/* Location Error */}
        {locationError && (
          <div className="location-error text-xs text-orange-400 mb-2">
            ⚠️ {locationError} - using mystical location
          </div>
        )}

        <div className="weather-main flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
          <div className="weather-icon text-xl sm:text-2xl">
            {getWeatherIcon(weather.condition, weather.isNight)}
          </div>
          <div className="weather-info flex-1">
            <div className="weather-temp text-purple-100 text-sm sm:text-lg font-semibold">
              {weather.temperature}°C
            </div>
            <div className="weather-condition text-purple-300 text-xs sm:text-sm">
              {weather.description}
            </div>
            {weather.moonPhase && (
              <div className="moon-phase text-purple-400 text-xs">
                🌙 {weather.moonPhase}
              </div>
            )}
          </div>
        </div>

        {/* Spiritual Metrics */}
        {spiritualData && (
          <div className="spiritual-metrics mb-3 grid grid-cols-3 gap-2">
            <div className="metric text-center">
              <div className="metric-value text-purple-200 text-xs font-bold">
                {spiritualData.spiritualIntensity}/100
              </div>
              <div className="metric-label text-purple-400 text-xs">
                ✨ Intensity
              </div>
            </div>
            <div className="metric text-center">
              <div className="metric-value text-purple-200 text-xs font-bold">
                {spiritualData.paranormalActivity}/100
              </div>
              <div className="metric-label text-purple-400 text-xs">
                👻 Activity
              </div>
            </div>
            <div className="metric text-center">
              <div className="metric-value text-purple-200 text-xs font-bold">
                {spiritualData.veilThinness}/100
              </div>
              <div className="metric-label text-purple-400 text-xs">
                🌌 Veil Thin
              </div>
            </div>
          </div>
        )}

        <div className="weather-details grid grid-cols-2 gap-1 sm:gap-2 text-xs mb-2">
          <div className="detail text-purple-400">
            💧 {weather.humidity}%
          </div>
          <div className="detail text-purple-400">
            🌪️ {weather.windSpeed} m/s
          </div>
          {weather.pressure && (
            <div className="detail text-purple-400">
              📊 {weather.pressure} hPa
            </div>
          )}
          {weather.visibility && (
            <div className="detail text-purple-400">
              👁️ {(weather.visibility / 1000).toFixed(1)}km
            </div>
          )}
        </div>

        <div className="weather-mood flex items-center space-x-2 mb-2">
          <span className="text-sm sm:text-base">{getMoodIcon(weather.mood)}</span>
          <span className={`text-xs sm:text-sm ${getMoodClass(weather.mood)}`}>
            {weather.mood.charAt(0).toUpperCase() + weather.mood.slice(1)} energy
          </span>
        </div>

        <div className="weather-description text-purple-300 text-xs leading-relaxed">
          {getSpiritalDescription(weather)}
        </div>
      </div>
    </div>
  );
};

export default WeatherDisplay;