export interface WeatherData {
  condition: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  cloudCover: number;
  isNight: boolean;
  mood: 'gloomy' | 'cheerful' | 'mysterious' | 'energetic' | 'calm';
}

export class WeatherService {
  private apiKey: string;
  private lastWeatherUpdate: Date | null = null;
  private cachedWeather: WeatherData | null = null;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY || '';
  }

  async getCurrentWeather(lat?: number, lon?: number): Promise<WeatherData | null> {
    // Check cache first
    if (this.cachedWeather && this.lastWeatherUpdate && 
        Date.now() - this.lastWeatherUpdate.getTime() < this.CACHE_DURATION) {
      return this.cachedWeather;
    }

    try {
      if (!this.apiKey) {
        return this.getMockWeather();
      }

      // Use default coordinates if none provided (example: New York City)
      const latitude = lat || 40.7128;
      const longitude = lon || -74.0060;

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        console.warn('Weather API request failed, using mock data');
        return this.getMockWeather();
      }

      const data = await response.json();
      const weather = this.parseWeatherData(data);
      
      this.cachedWeather = weather;
      this.lastWeatherUpdate = new Date();
      
      return weather;
    } catch (error) {
      console.error('Error fetching weather:', error);
      return this.getMockWeather();
    }
  }

  private parseWeatherData(data: any): WeatherData {
    const condition = data.weather[0]?.main || 'Clear';
    const temperature = Math.round(data.main?.temp || 20);
    const description = data.weather[0]?.description || 'clear sky';
    const humidity = data.main?.humidity || 50;
    const windSpeed = data.wind?.speed || 0;
    const cloudCover = data.clouds?.all || 0;
    
    // Determine if it's night time
    const now = Date.now() / 1000;
    const sunrise = data.sys?.sunrise || 0;
    const sunset = data.sys?.sunset || 0;
    const isNight = now < sunrise || now > sunset;

    const mood = this.determineWeatherMood(condition, temperature, cloudCover, isNight);

    return {
      condition,
      temperature,
      description,
      humidity,
      windSpeed,
      cloudCover,
      isNight,
      mood
    };
  }

  private getMockWeather(): WeatherData {
    const conditions = ['Clear', 'Clouds', 'Rain', 'Thunderstorm', 'Snow', 'Mist'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 20;
    
    const temperature = Math.round(15 + Math.random() * 20); // 15-35°C
    const cloudCover = Math.round(Math.random() * 100);
    
    return {
      condition: randomCondition,
      temperature,
      description: this.getDescriptionForCondition(randomCondition),
      humidity: Math.round(30 + Math.random() * 70),
      windSpeed: Math.round(Math.random() * 20),
      cloudCover,
      isNight,
      mood: this.determineWeatherMood(randomCondition, temperature, cloudCover, isNight)
    };
  }

  private getDescriptionForCondition(condition: string): string {
    const descriptions: Record<string, string> = {
      'Clear': 'clear sky',
      'Clouds': 'few clouds',
      'Rain': 'light rain',
      'Thunderstorm': 'thunderstorm',
      'Snow': 'light snow',
      'Mist': 'misty'
    };
    return descriptions[condition] || 'unknown weather';
  }

  private determineWeatherMood(condition: string, temperature: number, cloudCover: number, isNight: boolean): WeatherData['mood'] {
    if (condition === 'Thunderstorm' || (isNight && cloudCover > 80)) {
      return 'mysterious';
    }
    
    if (condition === 'Rain' || condition === 'Snow' || cloudCover > 70) {
      return 'gloomy';
    }
    
    if (condition === 'Clear' && temperature > 25 && !isNight) {
      return 'energetic';
    }
    
    if (condition === 'Clear' && isNight) {
      return 'calm';
    }
    
    return 'cheerful';
  }

  generateWeatherPrompt(weather: WeatherData | null): string {
    if (!weather) return '';

    let prompt = '\n\n--- WEATHER CONTEXT ---\n';
    prompt += `Current weather: ${weather.condition} (${weather.description})\n`;
    prompt += `Temperature: ${weather.temperature}°C\n`;
    prompt += `Time: ${weather.isNight ? 'Night' : 'Day'}\n`;
    prompt += `Atmospheric mood: ${weather.mood}\n`;
    
    // Add contextual suggestions based on weather
    if (weather.condition === 'Thunderstorm') {
      prompt += 'The thunderstorm creates an ominous atmosphere perfect for ghost stories.\n';
    } else if (weather.condition === 'Rain') {
      prompt += 'The rain creates a melancholic mood that spirits often find compelling.\n';
    } else if (weather.isNight && weather.condition === 'Clear') {
      prompt += 'The clear night sky reveals the mystical connection between realms.\n';
    } else if (weather.condition === 'Mist' || weather.condition === 'Fog') {
      prompt += 'The mist provides perfect cover for supernatural manifestations.\n';
    }
    
    prompt += '--- END WEATHER ---\n\n';
    return prompt;
  }
}

export default WeatherService;