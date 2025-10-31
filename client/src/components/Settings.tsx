import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme, Environment, TimeOfDay, Season } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceControls from './VoiceControls';
import MusicControls from './MusicControls';
import PersonalitySelector from './PersonalitySelector';
import EmojiReactions from './EmojiReactions';
const FortuneTelling = React.lazy(() => import('./FortuneTelling'));
const SeanceMode = React.lazy(() => import('./SeanceMode'));
const GhostGames = React.lazy(() => import('./GhostGames'));
const SpellCasting = React.lazy(() => import('./SpellCasting'));
const RoomExplorer = React.lazy(() => import('./RoomExplorer'));
const AuthModal = React.lazy(() => import('./AuthModal'));
import AchievementSystem from './AchievementSystem';
import EnergyBar from './EnergyBar';
import MessageEffects from './MessageEffects';
import type { GhostPersonality } from '../utils/ghostPersonalities';
import useAuth from '../hooks/useAuth';
import AvatarUpload from './AvatarUpload';
import NicknameInput from './NicknameInput';
import RoomDecoration from './RoomDecoration';
import GhostAppearanceCustomizer from './GhostAppearanceCustomizer';
import PersonalRituals from './PersonalRituals';

interface Track {
  name: string;
  url: string;
  duration?: number;
  description: string;
}

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    soundEnabled: boolean;
    voiceEnabled: boolean;
    musicEnabled: boolean;
    musicVolume: number;
    particleCount: number;
    ghostIntensity: number;
    theme: 'dark' | 'darker' | 'midnight';
    ghostPersonality: GhostPersonality;
    lightningEnabled?: boolean;
    fogEnabled?: boolean;
    eyeTrackingEnabled?: boolean;
    textSpiritsEnabled?: boolean;
  };
  onSettingsChange: (newSettings: any) => void;
  onSettingsClose?: (hasChanges: boolean, selectedTrackIndex?: number) => void; // Updated to include track index
  // Music control props to pass down
  musicControls: {
    isPlaying: boolean;
    currentTrack: Track | null;
    tracks: Track[];
    play: (track?: Track, options?: any) => Promise<void>;
    pause: () => void;
    stop: () => void;
    nextTrack: () => void;
    previousTrack: () => void;
    isSupported: boolean;
  };
  availablePersonalities?: GhostPersonality[];
  sessionId?: string;
  currentRoomId?: number;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, settings, onSettingsChange, onSettingsClose, musicControls, availablePersonalities, sessionId, currentRoomId }) => {
  const [localSettings, setLocalSettings] = useState({
    ...settings,
    lightningEnabled: settings.lightningEnabled ?? true,
    fogEnabled: settings.fogEnabled ?? true,
    eyeTrackingEnabled: settings.eyeTrackingEnabled ?? true,
    textSpiritsEnabled: settings.textSpiritsEnabled ?? true,
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [initialSettings] = useState(localSettings);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0); // Track the selected music track
  // Interactive feature modals
  const [showFortune, setShowFortune] = useState(false);
  const [showSeance, setShowSeance] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [showSpell, setShowSpell] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const handleChange = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    // Track if any changes have been made
    console.log('🔧 Settings changed:', key, '=', value, 'hasChanges will be set to true');
    setHasChanges(true);
  };

  // Debounce settings updates to avoid flooding parent with rapid updates
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    // Wait before sending settings upstream (300ms)
    debounceRef.current = window.setTimeout(() => {
      onSettingsChange(localSettings);
    }, 300) as unknown as number;
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [localSettings]);

  const handleClose = () => {
    // Reset hasChanges when modal closes
    const changesWereMade = hasChanges;
    console.log('🔧 Settings modal closing, changesWereMade:', changesWereMade);
    setHasChanges(false);
    
    // Call the close callback with information about whether changes were made
    if (onSettingsClose) {
      console.log('🔧 Calling onSettingsClose with changesWereMade:', changesWereMade, 'selectedTrack:', selectedTrackIndex);
      onSettingsClose(changesWereMade, selectedTrackIndex); // Pass the selected track index
    }
    
    onClose();
  };

  // Reset tracking when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setHasChanges(false);
    }
  }, [isOpen]);

  // Memoized open handlers for modals to avoid creating new callbacks each render
  const openFortune = useCallback(() => { console.log('open fortune'); setShowFortune(true); }, []);
  const openSeance = useCallback(() => { console.log('open seance'); setShowSeance(true); }, []);
  const openGames = useCallback(() => { console.log('open games'); setShowGames(true); }, []);
  const openSpell = useCallback(() => { console.log('open spell'); setShowSpell(true); }, []);
  const openExplore = useCallback(() => { console.log('open explore'); setShowRooms(true); }, []);

  const {
    environment,
    setEnvironment,
    timeOfDay,
    setTimeOfDay,
    season,
    setSeason,
    highContrast,
    setHighContrast,
    fontSize,
    setFontSize,
    motionReduced,
    setMotionReduced
  } = useTheme();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          key="settings"
          className="bg-haunted-900/95 border border-haunted-700/50 rounded-2xl max-w-md w-full backdrop-blur-md max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-haunted-700/30">
            <h2 className="text-xl font-bold text-haunted-100 ghost-text">
              👻 Spectral Settings
            </h2>
            <button
              onClick={handleClose}
              className="text-haunted-400 hover:text-haunted-200 transition-colors p-1"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
               style={{ maxHeight: 'calc(90vh - 140px)' }}>
            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-haunted-200 font-medium">Sound Effects</label>
              <button
                onClick={() => handleChange('soundEnabled', !localSettings.soundEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  localSettings.soundEnabled ? 'bg-haunted-600' : 'bg-haunted-800'
                } relative`}
              >
                <motion.div
                  className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                  animate={{ x: localSettings.soundEnabled ? 24 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {/* Voice Controls */}
            <VoiceControls
              isEnabled={localSettings.voiceEnabled}
              onToggle={(enabled) => handleChange('voiceEnabled', enabled)}
            />

            {/* Music Controls */}
            <MusicControls
              isEnabled={localSettings.musicEnabled}
              onToggle={(enabled) => handleChange('musicEnabled', enabled)}
              volume={localSettings.musicVolume / 100} // Convert to 0-1 scale
              onVolumeChange={(volume) => handleChange('musicVolume', Math.round(volume * 100))} // Convert back to 0-100
              isPlaying={musicControls.isPlaying}
              currentTrack={musicControls.currentTrack}
              tracks={musicControls.tracks}
              play={musicControls.play}
              pause={musicControls.pause}
              stop={musicControls.stop}
              nextTrack={musicControls.nextTrack}
              previousTrack={musicControls.previousTrack}
              isSupported={musicControls.isSupported}
              onTrackSelect={setSelectedTrackIndex} // Pass track selection handler
            />

            {/* Ghost Personality Selector */}
            <PersonalitySelector
              selectedPersonality={localSettings.ghostPersonality}
              onPersonalityChange={(personality) => handleChange('ghostPersonality', personality)}
              availablePersonalities={availablePersonalities}
            />

            {/* Particle Count */}
            <div>
              <label className="text-haunted-200 font-medium block mb-2">
                Particle Intensity ({localSettings.particleCount})
              </label>
              <input
                type="range"
                min="20"
                max="100"
                value={localSettings.particleCount}
                onChange={e => handleChange('particleCount', parseInt(e.target.value))}
                className="w-full accent-haunted-600"
              />
            </div>

            {/* Ghost Intensity */}
            <div>
              <label className="text-haunted-200 font-medium block mb-2">
                Ghost Activity ({localSettings.ghostIntensity}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={localSettings.ghostIntensity}
                onChange={e => handleChange('ghostIntensity', parseInt(e.target.value))}
                className="w-full accent-haunted-600"
              />
            </div>

            {/* Theme Selection */}
            <div>
              <label className="text-haunted-200 font-medium block mb-2">Theme</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {(['dark', 'darker', 'midnight'] as const).map(theme => (
                  <button
                    key={theme}
                    onClick={() => handleChange('theme', theme)}
                    className={`p-3 rounded-lg border text-sm capitalize transition-all ${
                      localSettings.theme === theme
                        ? 'border-haunted-500 bg-haunted-800/50 text-haunted-100'
                        : 'border-haunted-700/50 bg-haunted-900/50 text-haunted-300 hover:border-haunted-600'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
              {/* Environment Selection */}
              <label className="text-haunted-200 font-medium block mb-2 mt-4">Environment</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {(['graveyard', 'mansion', 'forest', 'catacombs'] as Environment[]).map(env => (
                  <button
                    key={env}
                    onClick={() => setEnvironment(env)}
                    className={`p-2 rounded-lg border text-xs capitalize transition-all ${
                      environment === env
                        ? 'border-haunted-500 bg-haunted-800/50 text-haunted-100'
                        : 'border-haunted-700/50 bg-haunted-900/50 text-haunted-300 hover:border-haunted-600'
                    }`}
                  >
                    {env}
                  </button>
                ))}
              </div>
              {/* Time of Day Selection */}
              <label className="text-haunted-200 font-medium block mb-2 mt-4">Time of Day</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {(['day', 'night'] as TimeOfDay[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeOfDay(t)}
                    className={`p-2 rounded-lg border text-xs capitalize transition-all ${
                      timeOfDay === t
                        ? 'border-haunted-500 bg-haunted-800/50 text-haunted-100'
                        : 'border-haunted-700/50 bg-haunted-900/50 text-haunted-300 hover:border-haunted-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {/* Season Selection */}
              <label className="text-haunted-200 font-medium block mb-2 mt-4">Season</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {(['default', 'halloween', 'winter', 'spring'] as Season[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setSeason(s)}
                    className={`p-2 rounded-lg border text-xs capitalize transition-all ${
                      season === s
                        ? 'border-haunted-500 bg-haunted-800/50 text-haunted-100'
                        : 'border-haunted-700/50 bg-haunted-900/50 text-haunted-300 hover:border-haunted-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {/* Accessibility Controls */}
              <label className="text-haunted-200 font-medium block mb-2 mt-4">Accessibility</label>
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  onClick={() => setHighContrast(!highContrast)}
                  className={`p-2 rounded-lg border text-xs transition-all ${
                    highContrast ? 'border-yellow-400 bg-yellow-900/50 text-yellow-100' : 'border-haunted-700/50 bg-haunted-900/50 text-haunted-300 hover:border-haunted-600'
                  }`}
                  aria-pressed={highContrast}
                >
                  High Contrast
                </button>
                <button
                  onClick={() => setMotionReduced(!motionReduced)}
                  className={`p-2 rounded-lg border text-xs transition-all ${
                    motionReduced ? 'border-blue-400 bg-blue-900/50 text-blue-100' : 'border-haunted-700/50 bg-haunted-900/50 text-haunted-300 hover:border-haunted-600'
                  }`}
                  aria-pressed={motionReduced}
                >
                  Reduce Motion
                </button>
                <button
                  onClick={() => setFontSize(fontSize === 'normal' ? 'large' : fontSize === 'large' ? 'x-large' : 'normal')}
                  className={`p-2 rounded-lg border text-xs transition-all ${
                    fontSize !== 'normal' ? 'border-green-400 bg-green-900/50 text-green-100' : 'border-haunted-700/50 bg-haunted-900/50 text-haunted-300 hover:border-haunted-600'
                  }`}
                  aria-pressed={fontSize !== 'normal'}
                >
                  Font Size: {fontSize}
                </button>
              </div>
            </div>

            {/* Visual Effects Settings */}
            <div>
              <label className="text-haunted-200 font-medium block mb-3">Visual Effects</label>
              <div className="space-y-3">
                {/* Lightning Effects */}
                <div className="flex items-center justify-between">
                  <span className="text-haunted-300 text-sm">Lightning Flashes</span>
                  <button
                    onClick={() => handleChange('lightningEnabled', !localSettings.lightningEnabled)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      localSettings.lightningEnabled ? 'bg-haunted-600' : 'bg-haunted-800'
                    } relative`}
                  >
                    <motion.div
                      className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                      animate={{ x: localSettings.lightningEnabled ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Fog Effects */}
                <div className="flex items-center justify-between">
                  <span className="text-haunted-300 text-sm">Fog/Mist</span>
                  <button
                    onClick={() => handleChange('fogEnabled', !localSettings.fogEnabled)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      localSettings.fogEnabled ? 'bg-haunted-600' : 'bg-haunted-800'
                    } relative`}
                  >
                    <motion.div
                      className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                      animate={{ x: localSettings.fogEnabled ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Eye Tracking */}
                <div className="flex items-center justify-between">
                  <span className="text-haunted-300 text-sm">Eye Tracking</span>
                  <button
                    onClick={() => handleChange('eyeTrackingEnabled', !localSettings.eyeTrackingEnabled)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      localSettings.eyeTrackingEnabled ? 'bg-haunted-600' : 'bg-haunted-800'
                    } relative`}
                  >
                    <motion.div
                      className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                      animate={{ x: localSettings.eyeTrackingEnabled ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Floating Text Spirits */}
                <div className="flex items-center justify-between">
                  <span className="text-haunted-300 text-sm">Text Spirits</span>
                  <button
                    onClick={() => handleChange('textSpiritsEnabled', !localSettings.textSpiritsEnabled)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      localSettings.textSpiritsEnabled ? 'bg-haunted-600' : 'bg-haunted-800'
                    } relative`}
                  >
                    <motion.div
                      className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                      animate={{ x: localSettings.textSpiritsEnabled ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Features */}
            <div>
              <label className="text-haunted-200 font-medium block mb-3">Interactive Play</label>
        <div className="grid grid-cols-2 gap-2">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openFortune} className="p-3 bg-haunted-800 rounded">🔮 Fortune</motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openSeance} className="p-3 bg-haunted-800 rounded">🔔 Séance</motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openGames} className="p-3 bg-haunted-800 rounded">🧩 Games</motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openSpell} className="p-3 bg-haunted-800 rounded">✨ Spell</motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openExplore} className="p-3 bg-haunted-800 rounded">🗺️ Explore</motion.button>
                <div className="p-3 bg-haunted-900 rounded">
                  <div className="text-haunted-300 text-sm">Energy</div>
                  <EnergyBar sessionId={sessionId} />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-haunted-200 font-medium block mb-2">Achievements</label>
                <AchievementSystem sessionId={sessionId} />
              </div>
              <div className="mt-4">
                <label className="text-haunted-200 font-medium block mb-2">Account</label>
                <div className="flex space-x-2">
                  <button onClick={() => setShowAuth(true)} className="px-3 py-2 bg-haunted-800 rounded">Sign in / Sign up</button>
                </div>
              </div>
            </div>

            {/* Avatar Upload */}
            <AvatarUpload />
            {/* Nickname Input */}
            <NicknameInput />

            {/* Ghost Appearance Customization */}
            <GhostAppearanceCustomizer />

            {/* Personal Rituals */}
            <PersonalRituals />

            {/* Room Decoration */}
            {typeof currentRoomId === 'number' && currentRoomId > 0 && (
              <RoomDecoration roomId={currentRoomId} />
            )}
          </div>

          {/* Fixed Footer */}
          <div className="p-6 border-t border-haunted-700/30">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-haunted-300 hover:text-haunted-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    {/* Feature modals (client-only, lazy-loaded into a portal) */}
    <React.Suspense key="settings-suspense-modals" fallback={null}>
      <FortuneTelling key="fortune" isOpen={showFortune} onClose={() => setShowFortune(false)} sessionId={sessionId} />
      <SeanceMode key="seance" isOpen={showSeance} onClose={() => setShowSeance(false)} sessionId={sessionId} />
      <GhostGames key="games" isOpen={showGames} onClose={() => setShowGames(false)} sessionId={sessionId} />
      <SpellCasting key="spell" isOpen={showSpell} onClose={() => setShowSpell(false)} sessionId={sessionId} />
      <RoomExplorer key="rooms" isOpen={showRooms} onClose={() => setShowRooms(false)} sessionId={sessionId} />
      <AuthModal key="auth" isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </React.Suspense>
    </AnimatePresence>
  );
};

export default Settings;