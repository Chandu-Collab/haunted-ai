export interface WeatherData {
  condition: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  cloudCover: number;
  isNight: boolean;
  moonPhase?: string;
  barometricPressure?: number;
  uvIndex?: number;
  visibility?: number;
  mood: 'gloomy' | 'cheerful' | 'mysterious' | 'energetic' | 'calm' | 'ominous' | 'mystical' | 'eerie';
  spiritualIntensity: number; // 0-100
  paranormalActivity: number; // 0-100
  veilThinness: number; // 0-100 (how thin the veil between worlds is)
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

export class WeatherService {
  private apiKey: string;
  private lastWeatherUpdate: Date | null = null;
  private cachedWeather: WeatherData | null = null;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // Reduced to 10 minutes for more current data

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
        console.warn('No WEATHER_API_KEY found in environment, using mock weather data');
        return this.getMockWeather(lat, lon);
      }

      // Use provided coordinates or default location
      const latitude = lat || 40.7128;
      const longitude = lon || -74.0060;
      
      console.log(`Fetching real weather for coordinates: ${latitude}, ${longitude}`);

      // Get both current weather and additional atmospheric data
      const [weatherResponse, geocodingResponse] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`),
        fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${this.apiKey}`).catch(() => null)
      ]);

      if (!weatherResponse.ok) {
        console.warn(`Weather API request failed with status ${weatherResponse.status}: ${weatherResponse.statusText}`);
        
        // Try to get more accurate local weather if the exact location fails
        if (weatherResponse.status === 404 || weatherResponse.status === 400) {
          console.log('Trying nearby weather stations...');
          return await this.getNearbyWeatherAverage(latitude, longitude);
        }
        
        return this.getMockWeather(lat, lon);
      }

      const weatherData = await weatherResponse.json();
      console.log('Raw weather data from API:', JSON.stringify(weatherData, null, 2));
      
      // Get precise location data from reverse geocoding
      let preciseLocationData: any = null;
      if (geocodingResponse && geocodingResponse.ok) {
        const geocodingData = await geocodingResponse.json();
        if (Array.isArray(geocodingData) && geocodingData.length > 0) {
          preciseLocationData = geocodingData[0];
          console.log('Precise location from reverse geocoding:', JSON.stringify(preciseLocationData, null, 2));
        }
      }
      
      const weather = this.parseWeatherData(weatherData, latitude, longitude, preciseLocationData);
      
      this.cachedWeather = weather;
      this.lastWeatherUpdate = new Date();
      
      return weather;
    } catch (error) {
      console.error('Error fetching weather:', error);
      return this.getMockWeather(lat, lon);
    }
  }

  // Method to get weather from multiple nearby stations for better accuracy
  private async getNearbyWeatherAverage(lat: number, lon: number): Promise<WeatherData | null> {
    try {
      console.log('Getting weather from nearby stations for better accuracy...');
      
      // Define small offsets to check nearby weather stations
      const offsets = [
        { lat: 0, lon: 0 }, // Exact location
        { lat: 0.01, lon: 0 }, // ~1km north
        { lat: -0.01, lon: 0 }, // ~1km south  
        { lat: 0, lon: 0.01 }, // ~1km east
        { lat: 0, lon: -0.01 } // ~1km west
      ];

      const weatherPromises = offsets.map(offset => 
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat + offset.lat}&lon=${lon + offset.lon}&appid=${this.apiKey}&units=metric`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      );

      const weatherResults = await Promise.all(weatherPromises);
      const validResults = weatherResults.filter((result: any) => result && result.main && result.main.temp);

      if (validResults.length === 0) {
        return this.getMockWeather(lat, lon);
      }

      // Average the temperatures for more accuracy
      const avgTemp = validResults.reduce((sum: number, result: any) => sum + result.main.temp, 0) / validResults.length;
      
      // Use the first valid result as base and update temperature with average
      const baseResult: any = validResults[0];
      baseResult.main.temp = avgTemp;
      
      console.log(`Averaged temperature from ${validResults.length} stations: ${avgTemp.toFixed(1)}°C`);
      
      return this.parseWeatherData(baseResult, lat, lon);
    } catch (error) {
      console.error('Error getting nearby weather average:', error);
      return this.getMockWeather(lat, lon);
    }
  }

  private parseWeatherData(data: any, lat: number, lon: number, preciseLocation?: any): WeatherData {
    const condition = data.weather[0]?.main || 'Clear';
    // Keep more precision for temperature - don't round too aggressively
    const temperature = Number((data.main?.temp || 20).toFixed(1)); // One decimal place
    const description = data.weather[0]?.description || 'clear sky';
    
    console.log(`Parsed weather data - Raw temp: ${data.main?.temp}°C -> Processed: ${temperature}°C, Condition: ${condition}`);
    console.log(`Feels like: ${data.main?.feels_like}°C, Min: ${data.main?.temp_min}°C, Max: ${data.main?.temp_max}°C`);
    
    // Use precise location data if available, fallback to weather API data
    const locationInfo = {
      city: preciseLocation?.name || data.name || 'Unknown',
      country: preciseLocation?.country || data.sys?.country || 'Unknown',
      state: preciseLocation?.state || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    console.log('Location info:', locationInfo);
    const humidity = data.main?.humidity || 50;
    const windSpeed = data.wind?.speed || 0;
    const cloudCover = data.clouds?.all || 0;
    const barometricPressure = data.main?.pressure || 1013;
    const visibility = data.visibility || 10000;
    
    // Determine if it's night time
    const now = Date.now() / 1000;
    const sunrise = data.sys?.sunrise || 0;
    const sunset = data.sys?.sunset || 0;
    const isNight = now < sunrise || now > sunset;
    
    // Calculate moon phase (approximate)
    const moonPhase = this.calculateMoonPhase(new Date());
    
    // Calculate spiritual atmosphere factors
    const spiritualFactors = this.calculateSpiritualAtmosphere({
      condition,
      temperature,
      humidity,
      cloudCover,
      windSpeed,
      barometricPressure,
      visibility,
      isNight,
      moonPhase,
      latitude: lat,
      longitude: lon
    });

    const mood = this.determineWeatherMood(condition, temperature, cloudCover, isNight, spiritualFactors);

    return {
      condition,
      temperature,
      description,
      humidity,
      windSpeed,
      cloudCover,
      isNight,
      moonPhase,
      barometricPressure,
      visibility,
      mood,
      spiritualIntensity: spiritualFactors.spiritualIntensity,
      paranormalActivity: spiritualFactors.paranormalActivity,
      veilThinness: spiritualFactors.veilThinness,
      location: {
        city: locationInfo.city,
        country: locationInfo.country,
        state: locationInfo.state,
        timezone: locationInfo.timezone,
        coordinates: {
          lat: lat,
          lon: lon
        }
      }
    };
  }

  private getMockWeather(lat?: number, lon?: number): WeatherData {
    console.log('🎭 Using MOCK weather data - Add WEATHER_API_KEY to .env for real weather');
    const conditions = ['Clear', 'Clouds', 'Rain', 'Thunderstorm', 'Snow', 'Mist', 'Fog'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 20;
    
    const temperature = Math.round(15 + Math.random() * 20);
    const cloudCover = Math.round(Math.random() * 100);
    const humidity = Math.round(30 + Math.random() * 70);
    const windSpeed = Math.round(Math.random() * 20);
    const barometricPressure = 990 + Math.round(Math.random() * 40);
    const visibility = Math.round(1000 + Math.random() * 9000);
    
    const moonPhase = this.calculateMoonPhase(new Date());
    
    // Calculate spiritual atmosphere for mock data
    const spiritualFactors = this.calculateSpiritualAtmosphere({
      condition: randomCondition,
      temperature,
      humidity,
      cloudCover,
      windSpeed,
      barometricPressure,
      visibility,
      isNight,
      moonPhase,
      latitude: lat || 40.7128,
      longitude: lon || -74.0060
    });
    
    return {
      condition: randomCondition,
      temperature,
      description: this.getDescriptionForCondition(randomCondition),
      humidity,
      windSpeed,
      cloudCover,
      isNight,
      moonPhase,
      barometricPressure,
      visibility,
      mood: this.determineWeatherMood(randomCondition, temperature, cloudCover, isNight, spiritualFactors),
      spiritualIntensity: spiritualFactors.spiritualIntensity,
      paranormalActivity: spiritualFactors.paranormalActivity,
      veilThinness: spiritualFactors.veilThinness,
      location: {
        city: 'Mystery Location',
        country: 'Ethereal Realm',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
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

  private determineWeatherMood(condition: string, temperature: number, cloudCover: number, isNight: boolean, spiritualFactors: any): WeatherData['mood'] {
    // Enhanced mood calculation based on spiritual atmosphere
    if (condition === 'Thunderstorm' || spiritualFactors.veilThinness > 80) {
      return 'ominous';
    }
    
    if ((condition === 'Fog' || condition === 'Mist') && isNight) {
      return 'mystical';
    }
    
    if (spiritualFactors.paranormalActivity > 75) {
      return 'eerie';
    }
    
    if (condition === 'Rain' || condition === 'Snow' || cloudCover > 70) {
      return spiritualFactors.spiritualIntensity > 60 ? 'mysterious' : 'gloomy';
    }
    
    if (condition === 'Clear' && temperature > 25 && !isNight) {
      return 'energetic';
    }
    
    if (condition === 'Clear' && isNight && spiritualFactors.veilThinness > 50) {
      return 'mystical';
    }
    
    if (condition === 'Clear' && isNight) {
      return 'calm';
    }
    
    return spiritualFactors.spiritualIntensity > 40 ? 'mysterious' : 'cheerful';
  }

  generateWeatherPrompt(weather: WeatherData | null): string {
    if (!weather) return '';

    let prompt = '\n\n--- SPIRITUAL ATMOSPHERE CONTEXT ---\n';
    prompt += `Location: ${weather.location?.city}, ${weather.location?.country}\n`;
    prompt += `Weather: ${weather.condition} (${weather.description})\n`;
    prompt += `Temperature: ${weather.temperature}°C\n`;
    prompt += `Time: ${weather.isNight ? 'Night' : 'Day'}\n`;
    prompt += `Moon Phase: ${weather.moonPhase || 'Unknown'}\n`;
    prompt += `Spiritual Intensity: ${weather.spiritualIntensity}/100\n`;
    prompt += `Paranormal Activity: ${weather.paranormalActivity}/100\n`;
    prompt += `Veil Thinness: ${weather.veilThinness}/100\n`;
    prompt += `Overall Mood: ${weather.mood}\n`;
    
    // Enhanced contextual suggestions based on spiritual atmosphere
    if (weather.condition === 'Thunderstorm') {
      prompt += 'The thunderstorm charges the atmosphere with electric energy, making spirits more active and the veil between worlds thinner.\n';
    } else if (weather.condition === 'Rain') {
      prompt += 'The rain creates a melancholic mood that resonates with wandering souls and enhances spiritual sensitivity.\n';
    } else if (weather.condition === 'Fog' || weather.condition === 'Mist') {
      prompt += 'The mist provides perfect concealment for supernatural manifestations and allows spirits to move more freely between realms.\n';
    } else if (weather.isNight && weather.condition === 'Clear') {
      prompt += 'The clear night sky opens celestial pathways and strengthens the connection to otherworldly energies.\n';
    } else if (weather.condition === 'Snow') {
      prompt += 'The snow creates a hushed, ethereal atmosphere that muffles sound and enhances mystical experiences.\n';
    }
    
    // Moon phase influences
    if (weather.moonPhase === 'New Moon') {
      prompt += 'The new moon brings heightened psychic sensitivity and makes the veil between worlds particularly thin.\n';
    } else if (weather.moonPhase === 'Full Moon') {
      prompt += 'The full moon amplifies spiritual energy and increases paranormal activity significantly.\n';
    }
    
    // Spiritual intensity guidance
    if (weather.spiritualIntensity > 80) {
      prompt += 'The spiritual atmosphere is extremely intense - perfect for profound supernatural encounters.\n';
    } else if (weather.spiritualIntensity > 60) {
      prompt += 'Strong spiritual energy permeates the area - expect heightened ghostly activity.\n';
    } else if (weather.spiritualIntensity > 40) {
      prompt += 'Moderate spiritual presence detected - spirits are active but subtle.\n';
    }
    
    prompt += '--- END SPIRITUAL ATMOSPHERE ---\n\n';
    return prompt;
  }

  // Calculate moon phase for spiritual atmosphere
  private calculateMoonPhase(date: Date): string {
    const phases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
    const knownNewMoon = new Date('2000-01-06'); // Known new moon date
    const daysSinceKnown = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const phaseIndex = Math.floor((daysSinceKnown % 29.53) / 29.53 * 8);
    return phases[phaseIndex] || 'Unknown';
  }

  // Calculate comprehensive spiritual atmosphere factors
  private calculateSpiritualAtmosphere(factors: any): { spiritualIntensity: number; paranormalActivity: number; veilThinness: number } {
    let spiritualIntensity = 30; // Base level
    let paranormalActivity = 25; // Base level  
    let veilThinness = 20; // Base level

    // Weather condition influences
    if (factors.condition === 'Thunderstorm') {
      spiritualIntensity += 40;
      paranormalActivity += 35;
      veilThinness += 45;
    } else if (factors.condition === 'Fog' || factors.condition === 'Mist') {
      spiritualIntensity += 25;
      paranormalActivity += 30;
      veilThinness += 35;
    } else if (factors.condition === 'Rain') {
      spiritualIntensity += 15;
      paranormalActivity += 10;
      veilThinness += 20;
    } else if (factors.condition === 'Snow') {
      spiritualIntensity += 20;
      paranormalActivity += 15;
      veilThinness += 25;
    }

    // Time influences
    if (factors.isNight) {
      spiritualIntensity += 25;
      paranormalActivity += 30;
      veilThinness += 20;
    }

    // Moon phase influences
    if (factors.moonPhase === 'Full Moon') {
      spiritualIntensity += 30;
      paranormalActivity += 35;
      veilThinness += 25;
    } else if (factors.moonPhase === 'New Moon') {
      spiritualIntensity += 20;
      paranormalActivity += 15;
      veilThinness += 40;
    }

    // Atmospheric pressure influences (low pressure = higher spiritual activity)
    if (factors.barometricPressure < 1000) {
      const pressureFactor = (1000 - factors.barometricPressure) / 20;
      spiritualIntensity += pressureFactor;
      paranormalActivity += pressureFactor;
      veilThinness += pressureFactor * 1.5;
    }

    // Humidity influences
    if (factors.humidity > 80) {
      spiritualIntensity += 10;
      paranormalActivity += 15;
    }

    // Wind influences
    if (factors.windSpeed > 15) {
      spiritualIntensity += 8;
      paranormalActivity += 12;
    }

    // Visibility influences (low visibility = higher spiritual activity)
    if (factors.visibility < 5000) {
      const visibilityFactor = (5000 - factors.visibility) / 500;
      spiritualIntensity += visibilityFactor;
      paranormalActivity += visibilityFactor * 1.2;
      veilThinness += visibilityFactor * 0.8;
    }

    // Temperature influences (extreme temperatures affect spiritual energy)
    if (factors.temperature < 5 || factors.temperature > 30) {
      spiritualIntensity += 10;
      paranormalActivity += 8;
    }

    // Cap values at 100
    spiritualIntensity = Math.min(100, Math.round(spiritualIntensity));
    paranormalActivity = Math.min(100, Math.round(paranormalActivity));
    veilThinness = Math.min(100, Math.round(veilThinness));

    return { spiritualIntensity, paranormalActivity, veilThinness };
  }
}

export default WeatherService;