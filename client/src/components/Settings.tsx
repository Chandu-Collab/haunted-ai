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
  voiceEffect: VoiceEffectOption;
  setVoiceEffect: React.Dispatch<React.SetStateAction<VoiceEffectOption>>;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, settings, onSettingsChange, onSettingsClose, musicControls, availablePersonalities, sessionId, currentRoomId, voiceEffect, setVoiceEffect }) => {
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