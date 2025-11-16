// Voice effect type for settings
type VoiceEffectOption = 'none' | 'echo' | 'reverb' | 'whisper' | 'robot';
import React, { Suspense, memo, useState, useEffect, useCallback, useRef } from 'react';
import { useTheme, Environment, TimeOfDay, Season } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { GhostPersonality } from '../utils/ghostPersonalities';
import useAuth from '../hooks/useAuth';

import _VoiceControls from './VoiceControls';
import _MusicControls from './MusicControls';
import _PersonalitySelector from './PersonalitySelector';
import _EmojiReactions from './EmojiReactions';
import _AchievementSystem from './AchievementSystem';
import _EnergyBar from './EnergyBar';
import _MessageEffects from './MessageEffects';
import _AvatarUpload from './AvatarUpload';
import _NicknameInput from './NicknameInput';
import _RoomDecoration from './RoomDecoration';
import _GhostAppearanceCustomizer from './GhostAppearanceCustomizer';
import _PersonalRituals from './PersonalRituals';
import _Motion3DControls, { Motion3DSettings } from './Motion3DControls';

const VoiceControls = memo(_VoiceControls);
const MusicControls = memo(_MusicControls);
const PersonalitySelector = memo(_PersonalitySelector);
const EmojiReactions = memo(_EmojiReactions);
const AchievementSystem = memo(_AchievementSystem);
const EnergyBar = memo(_EnergyBar);
const MessageEffects = memo(_MessageEffects);
const AvatarUpload = memo(_AvatarUpload);
const NicknameInput = memo(_NicknameInput);
const RoomDecoration = memo(_RoomDecoration);
const GhostAppearanceCustomizer = memo(_GhostAppearanceCustomizer);
const PersonalRituals = memo(_PersonalRituals);
const Motion3DControls = memo(_Motion3DControls);

const FortuneTelling = React.lazy(() => import('./FortuneTelling'));
const SeanceMode = React.lazy(() => import('./SeanceMode'));
const GhostGames = React.lazy(() => import('./GhostGames'));
const SpellCasting = React.lazy(() => import('./SpellCasting'));
const RoomExplorer = React.lazy(() => import('./RoomExplorer'));
const AuthModal = React.lazy(() => import('./AuthModal'));

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
    language?: string;
    lightningEnabled?: boolean;
    fogEnabled?: boolean;
    eyeTrackingEnabled?: boolean;
    textSpiritsEnabled?: boolean;
    roomWallpaper?: string | null;
    motion3DSettings?: Motion3DSettings;
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
  voiceEffect: VoiceEffectOption;
  setVoiceEffect: React.Dispatch<React.SetStateAction<VoiceEffectOption>>;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, settings, onSettingsChange, onSettingsClose, musicControls, availablePersonalities, sessionId, currentRoomId, voiceEffect, setVoiceEffect }) => {
  const [localSettings, setLocalSettings] = useState({
    ...settings,
    language: settings.language || 'en',
    lightningEnabled: settings.lightningEnabled ?? true,
    fogEnabled: settings.fogEnabled ?? true,
    eyeTrackingEnabled: settings.eyeTrackingEnabled ?? true,
    textSpiritsEnabled: settings.textSpiritsEnabled ?? true,
    roomWallpaper: settings.roomWallpaper || null,
    motion3DSettings: settings.motion3DSettings || {
      enabled: true,
      effect: 'float' as const,
      intensity: 5,
      speed: 1,
      autoPlay: true,
      applyToImages: true,
      applyToBackgrounds: true,
      applyToAvatars: false
    },
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  const [initialSettings] = useState(localSettings);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0); // Track the selected music track
  
  // Sync props with local state when settings change externally
  useEffect(() => {
    const newSettings = {
      ...settings,
      language: settings.language || 'en',
      lightningEnabled: settings.lightningEnabled ?? true,
      fogEnabled: settings.fogEnabled ?? true,
      eyeTrackingEnabled: settings.eyeTrackingEnabled ?? true,
      textSpiritsEnabled: settings.textSpiritsEnabled ?? true,
      roomWallpaper: settings.roomWallpaper || null,
      motion3DSettings: settings.motion3DSettings || {
        enabled: true,
        effect: 'float' as const,
        intensity: 5,
        speed: 1,
        autoPlay: true,
        applyToImages: true,
        applyToBackgrounds: true,
        applyToAvatars: false
      },
    };
    
    console.log('🔄 Settings component: External settings changed, syncing local state', {
      newPersonality: settings.ghostPersonality.name,
      currentPersonality: localSettings.ghostPersonality.name,
      personalityChanged: settings.ghostPersonality.id !== localSettings.ghostPersonality.id
    });
    
    setLocalSettings(newSettings);
  }, [
    settings.ghostPersonality.id, 
    settings.soundEnabled, 
    settings.musicEnabled, 
    settings.voiceEnabled,
    settings.theme,
    settings.language,
    settings.lightningEnabled,
    settings.fogEnabled,
    settings.eyeTrackingEnabled,
    settings.textSpiritsEnabled,
    settings.roomWallpaper
  ]);
  
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
    // Instantly send settings upstream (no debounce)
    onSettingsChange(localSettings);
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
  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          key="settings"
          className="bg-haunted-900/95 border border-haunted-700/50 rounded-2xl max-w-xs sm:max-w-md w-full backdrop-blur-md max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-2 sm:p-6 border-b border-haunted-700/30">
            <h2 className="text-base sm:text-xl font-bold text-haunted-100 ghost-text">
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
    <div className="flex-1 overflow-y-auto p-2 sm:p-6 space-y-3 sm:space-y-6 custom-scrollbar"
      style={{ maxHeight: 'calc(90vh - 140px)' }}>
      {/* Sound Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-haunted-200 font-medium text-xs sm:text-sm">Sound Effects</label>
        <button
          onClick={() => handleChange('soundEnabled', !localSettings.soundEnabled)}
          className={`w-10 sm:w-12 h-5 sm:h-6 rounded-full transition-colors ${localSettings.soundEnabled ? 'bg-haunted-600' : 'bg-haunted-800'} relative`}
        >
          <motion.div
            className="w-4 sm:w-5 h-4 sm:h-5 bg-white rounded-full absolute top-0.5"
            animate={{ x: localSettings.soundEnabled ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>
      {/* Visual Effects Sliders */}
      <div className="space-y-3">
        <div>
          <label className="text-haunted-200 font-medium block mb-1 sm:mb-2 text-xs sm:text-sm">Particle Effects ({localSettings.particleCount})</label>
          <input
            type="range"
            min="0"
            max="100"
            value={localSettings.particleCount}
            onChange={(e) => handleChange('particleCount', parseInt(e.target.value))}
            className="w-full h-2 bg-haunted-800/60 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="text-xs text-haunted-400 mt-0.5 sm:mt-1">Control floating particles and ghost orbs</div>
        </div>
        <div>
          <label className="text-haunted-200 font-medium block mb-1 sm:mb-2 text-xs sm:text-sm">Ghost Intensity ({localSettings.ghostIntensity}%)</label>
          <input
            type="range"
            min="0"
            max="100"
            value={localSettings.ghostIntensity}
            onChange={(e) => handleChange('ghostIntensity', parseInt(e.target.value))}
            className="w-full h-2 bg-haunted-800/60 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="text-xs text-haunted-400 mt-0.5 sm:mt-1">Adjust overall ghost presence and effects</div>
        </div>
      </div>

      {/* Memoized and lazy-loaded heavy sections */}
      <Suspense fallback={<div className="text-haunted-400 text-xs">Loading controls...</div>}>
        <VoiceControls isEnabled={localSettings.voiceEnabled} onToggle={(enabled) => handleChange('voiceEnabled', enabled)} />
      </Suspense>
      {localSettings.voiceEnabled && (
        <div className="mt-2">
          <label className="text-haunted-200 font-medium block mb-1 sm:mb-2 text-xs sm:text-sm">Ghost Voice Effect</label>
          <select
            value={voiceEffect}
            onChange={e => setVoiceEffect(e.target.value as VoiceEffectOption)}
            className="w-full bg-haunted-800/60 border border-haunted-700/50 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-haunted-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-haunted-500/50"
          >
            <option value="none">None (Normal Ghost)</option>
            <option value="whisper">Whisper</option>
            <option value="echo">Echo</option>
            <option value="reverb">Reverb</option>
            <option value="robot">Robot</option>
          </select>
          <div className="text-xs text-haunted-400 mt-0.5 sm:mt-1">Try different effects for extra spooky voices!</div>
        </div>
      )}
      <Suspense fallback={<div className="text-haunted-400 text-xs">Loading music controls...</div>}>
        <MusicControls
          isEnabled={localSettings.musicEnabled}
          onToggle={(enabled) => handleChange('musicEnabled', enabled)}
          volume={localSettings.musicVolume / 100}
          onVolumeChange={(volume) => handleChange('musicVolume', Math.round(volume * 100))}
          isPlaying={musicControls.isPlaying}
          currentTrack={musicControls.currentTrack}
          tracks={musicControls.tracks}
          play={musicControls.play}
          pause={musicControls.pause}
          stop={musicControls.stop}
          nextTrack={musicControls.nextTrack}
          previousTrack={musicControls.previousTrack}
          isSupported={musicControls.isSupported}
          onTrackSelect={setSelectedTrackIndex}
        />
      </Suspense>
      <Suspense fallback={<div className="text-haunted-400 text-xs">Loading personality selector...</div>}>
        <PersonalitySelector
          selectedPersonality={localSettings.ghostPersonality}
          onPersonalityChange={(personality) => handleChange('ghostPersonality', personality)}
          availablePersonalities={availablePersonalities}
        />
      </Suspense>
      {/* Theme, environment, and accessibility controls */}
      <div className="mt-4 space-y-2">
      {/* Language selection for AI replies */}
      <div className="mt-2">
        <label className="text-haunted-200 font-medium block mb-1 sm:mb-2 text-xs sm:text-sm">AI Reply Language</label>
        <select
          value={localSettings.language || 'en'}
          onChange={e => handleChange('language', e.target.value)}
          className="w-full bg-haunted-800/60 border border-haunted-700/50 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-haunted-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-haunted-500/50"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="ru">Russian</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
          <option value="ko">Korean</option>
          <option value="hi">Hindi</option>
          <option value="ar">Arabic</option>
          <option value="pt">Portuguese</option>
        </select>
        <div className="text-xs text-haunted-400 mt-0.5 sm:mt-1">Choose the language for ghost replies.</div>
      </div>
        <label className="text-haunted-200 font-medium block mb-1 sm:mb-2 text-xs sm:text-sm">Theme</label>
        <select
          value={settings.theme}
          onChange={e => handleChange('theme', e.target.value)}
          className="w-full bg-haunted-800/60 border border-haunted-700/50 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-haunted-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-haunted-500/50"
        >
          <option value="dark">Dark</option>
          <option value="darker">Darker</option>
          <option value="midnight">Midnight</option>
        </select>
        <div className="flex flex-wrap gap-2 mt-2">
          <div>
            <label className="text-haunted-200 text-xs">Environment</label>
            <select
              value={environment}
              onChange={e => setEnvironment(e.target.value as Environment)}
              className="ml-1 bg-haunted-800/60 border border-haunted-700/50 rounded px-2 py-1 text-haunted-100 text-xs"
            >
              <option value="graveyard">Graveyard</option>
              <option value="mansion">Mansion</option>
              <option value="forest">Forest</option>
              <option value="catacombs">Catacombs</option>
            </select>
          </div>
          <div>
            <label className="text-haunted-200 text-xs">Time</label>
            <select
              value={timeOfDay}
              onChange={e => setTimeOfDay(e.target.value as TimeOfDay)}
              className="ml-1 bg-haunted-800/60 border border-haunted-700/50 rounded px-2 py-1 text-haunted-100 text-xs"
            >
              <option value="day">Day</option>
              <option value="night">Night</option>
            </select>
          </div>
          <div>
            <label className="text-haunted-200 text-xs">Season</label>
            <select
              value={season}
              onChange={e => setSeason(e.target.value as Season)}
              className="ml-1 bg-haunted-800/60 border border-haunted-700/50 rounded px-2 py-1 text-haunted-100 text-xs"
            >
              <option value="default">Default</option>
              <option value="halloween">Halloween</option>
              <option value="winter">Winter</option>
              <option value="spring">Spring</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <div>
            <label className="text-haunted-200 text-xs">High Contrast</label>
            <input
              type="checkbox"
              checked={highContrast}
              onChange={e => setHighContrast(e.target.checked)}
              className="ml-1 align-middle"
            />
          </div>
          <div>
            <label className="text-haunted-200 text-xs">Font Size</label>
            <select
              value={fontSize}
              onChange={e => setFontSize(e.target.value as 'normal' | 'large' | 'x-large')}
              className="ml-1 bg-haunted-800/60 border border-haunted-700/50 rounded px-2 py-1 text-haunted-100 text-xs"
            >
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="x-large">Extra Large</option>
            </select>
          </div>
          <div>
            <label className="text-haunted-200 text-xs">Reduce Motion</label>
            <input
              type="checkbox"
              checked={motionReduced}
              onChange={e => setMotionReduced(e.target.checked)}
              className="ml-1 align-middle"
            />
          </div>
        </div>
      </div>

      {/* Visual Effects Toggles */}
      <div className="space-y-3">
        <label className="text-haunted-200 font-medium block mb-2 text-xs sm:text-sm">Visual Effects</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between">
            <label className="text-haunted-200 text-xs">Lightning</label>
            <button
              onClick={() => handleChange('lightningEnabled', !localSettings.lightningEnabled)}
              className={`w-8 h-4 rounded-full transition-colors ${
                localSettings.lightningEnabled ? 'bg-haunted-600' : 'bg-haunted-800'
              } relative`}
            >
              <motion.div
                className="w-3 h-3 bg-white rounded-full absolute top-0.5"
                animate={{ x: localSettings.lightningEnabled ? 16 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-haunted-200 text-xs">Fog Effects</label>
            <button
              onClick={() => handleChange('fogEnabled', !localSettings.fogEnabled)}
              className={`w-8 h-4 rounded-full transition-colors ${
                localSettings.fogEnabled ? 'bg-haunted-600' : 'bg-haunted-800'
              } relative`}
            >
              <motion.div
                className="w-3 h-3 bg-white rounded-full absolute top-0.5"
                animate={{ x: localSettings.fogEnabled ? 16 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-haunted-200 text-xs">Eye Tracking</label>
            <button
              onClick={() => handleChange('eyeTrackingEnabled', !localSettings.eyeTrackingEnabled)}
              className={`w-8 h-4 rounded-full transition-colors ${
                localSettings.eyeTrackingEnabled ? 'bg-haunted-600' : 'bg-haunted-800'
              } relative`}
            >
              <motion.div
                className="w-3 h-3 bg-white rounded-full absolute top-0.5"
                animate={{ x: localSettings.eyeTrackingEnabled ? 16 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-haunted-200 text-xs">Text Spirits</label>
            <button
              onClick={() => handleChange('textSpiritsEnabled', !localSettings.textSpiritsEnabled)}
              className={`w-8 h-4 rounded-full transition-colors ${
                localSettings.textSpiritsEnabled ? 'bg-haunted-600' : 'bg-haunted-800'
              } relative`}
            >
              <motion.div
                className="w-3 h-3 bg-white rounded-full absolute top-0.5"
                animate={{ x: localSettings.textSpiritsEnabled ? 16 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 3D Motion Effects */}
      <Suspense fallback={<div className="text-haunted-400 text-xs">Loading 3D effects...</div>}>
        <Motion3DControls 
          onSettingsChange={(motion3DSettings) => handleChange('motion3DSettings', motion3DSettings)}
          appSettings={localSettings}
        />
      </Suspense>

      {/* Background Wallpaper */}
      <div className="space-y-2">
        <label className="text-haunted-200 font-medium block mb-2 text-xs sm:text-sm">Room Background</label>
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                try {
                  // Use data URL instead of blob URL for better reliability
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const dataUrl = event.target?.result as string;
                    console.log('📁 Local image uploaded as data URL:', {
                      fileName: file.name,
                      fileSize: file.size,
                      fileType: file.type,
                      dataUrlLength: dataUrl.length
                    });
                    handleChange('roomWallpaper', dataUrl);
                  };
                  reader.onerror = (error) => {
                    console.error('❌ Failed to read image file:', error);
                    alert('Failed to process image file. Please try again.');
                  };
                  reader.readAsDataURL(file);
                } catch (error) {
                  console.error('❌ Error processing image:', error);
                  alert('Error processing image. Please try a different image.');
                }
              }
            }}
            className="w-full bg-haunted-800/60 border border-haunted-700/50 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-haunted-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-haunted-500/50"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleChange('roomWallpaper', null)}
              className="px-2 py-1 bg-haunted-700 rounded text-white text-xs hover:bg-haunted-600 transition-colors"
            >
              Clear Background
            </button>
            <button
              onClick={() => {
                // Set a default spooky background
                handleChange('roomWallpaper', '/uploads/room-wallpapers/graveyard-bg.jpg');
              }}
              className="px-2 py-1 bg-haunted-700 rounded text-white text-xs hover:bg-haunted-600 transition-colors"
            >
              Default Spooky
            </button>
          </div>
          <div className="text-xs text-haunted-400">Upload a custom background image for your ghostly realm</div>
        </div>
      </div>
      {/* ...existing code for sliders, theme, environment, accessibility, etc... */}
      {/* Memoized heavy components */}
      <Suspense fallback={<div className="text-haunted-400 text-xs">Loading energy bar...</div>}>
        <EnergyBar sessionId={sessionId} />
      </Suspense>
      <Suspense fallback={<div className="text-haunted-400 text-xs">Loading achievements...</div>}>
        <AchievementSystem sessionId={sessionId} />
      </Suspense>
      <Suspense fallback={<div className="text-haunted-400 text-xs">Loading avatar upload...</div>}>
        <AvatarUpload />
      </Suspense>
      <Suspense fallback={<div className="text-haunted-400 text-xs">Loading nickname input...</div>}>
        <NicknameInput />
      </Suspense>
      <Suspense fallback={<div className="text-haunted-400 text-xs">Loading ghost appearance customizer...</div>}>
        <GhostAppearanceCustomizer />
      </Suspense>
      <Suspense fallback={<div className="text-haunted-400 text-xs">Loading personal rituals...</div>}>
        <PersonalRituals />
      </Suspense>
      {typeof currentRoomId === 'number' && currentRoomId > 0 && (
        <Suspense fallback={<div className="text-haunted-400 text-xs">Loading room decoration...</div>}>
          <RoomDecoration roomId={currentRoomId} />
        </Suspense>
      )}
    </div>

          {/* Fixed Footer */}
          <div className="p-2 sm:p-6 border-t border-haunted-700/30">
            <div className="flex justify-end gap-2 sm:gap-3">
              <button
                onClick={onClose}
                className="px-2 sm:px-4 py-1 sm:py-2 text-haunted-300 hover:text-haunted-100 transition-colors text-xs sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    {/* Feature modals (client-only, lazy-loaded into a portal, moved outside scrollable content) */}
    {showFortune && (
      <Suspense fallback={null}>
        <FortuneTelling key="fortune" isOpen={showFortune} onClose={() => setShowFortune(false)} sessionId={sessionId} />
      </Suspense>
    )}
    {showSeance && (
      <Suspense fallback={null}>
        <SeanceMode key="seance" isOpen={showSeance} onClose={() => setShowSeance(false)} sessionId={sessionId} />
      </Suspense>
    )}
    {showGames && (
      <Suspense fallback={null}>
        <GhostGames key="games" isOpen={showGames} onClose={() => setShowGames(false)} sessionId={sessionId} />
      </Suspense>
    )}
    {showSpell && (
      <Suspense fallback={null}>
        <SpellCasting key="spell" isOpen={showSpell} onClose={() => setShowSpell(false)} sessionId={sessionId} />
      </Suspense>
    )}
    {showRooms && (
      <Suspense fallback={null}>
        <RoomExplorer key="rooms" isOpen={showRooms} onClose={() => setShowRooms(false)} sessionId={sessionId} />
      </Suspense>
    )}
    {showAuth && (
      <Suspense fallback={null}>
        <AuthModal key="auth" isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </Suspense>
    )}
    </AnimatePresence>
  );
};

export default Settings;