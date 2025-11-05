import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Environment = 'graveyard' | 'mansion' | 'forest' | 'catacombs';
export type TimeOfDay = 'day' | 'night';
export type Season = 'halloween' | 'winter' | 'spring' | 'default';

export interface ThemeState {
  isMobile: boolean;
  environment: Environment;
  timeOfDay: TimeOfDay;
  season: Season;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'x-large';
  motionReduced: boolean;
  setEnvironment: (env: Environment) => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  setSeason: (season: Season) => void;
  setHighContrast: (enabled: boolean) => void;
  setFontSize: (size: 'normal' | 'large' | 'x-large') => void;
  setMotionReduced: (reduced: boolean) => void;
}

const ThemeContext = createContext<ThemeState | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Detect mobile device for responsive adaptation
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640 || /Mobi|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  // Default values can be enhanced with logic (e.g., detect time/season)
  const [environment, setEnvironment] = useState<Environment>('graveyard');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('night');
  const [season, setSeason] = useState<Season>('default');
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'x-large'>('normal');
  const [motionReduced, setMotionReduced] = useState(false);

  // Example: auto-detect time of day
  useEffect(() => {
    const hour = new Date().getHours();
    setTimeOfDay(hour >= 6 && hour < 18 ? 'day' : 'night');
  }, []);

  // Example: auto-detect season (can be improved)
  useEffect(() => {
    const month = new Date().getMonth();
    if (month === 9) setSeason('halloween');
    else if (month === 11 || month === 0) setSeason('winter');
    else if (month >= 2 && month <= 4) setSeason('spring');
    else setSeason('default');
  }, []);

  return (
    <ThemeContext.Provider value={{
      environment,
      timeOfDay,
      season,
      highContrast,
      fontSize,
      motionReduced,
      isMobile,
      setEnvironment,
      setTimeOfDay,
      setSeason,
      setHighContrast,
      setFontSize,
      setMotionReduced,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
