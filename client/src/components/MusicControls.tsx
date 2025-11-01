import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Track {
  name: string;
  url: string;
  duration?: number;
  description: string;
}

interface MusicControlsProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  volume?: number; // External volume control (0-1)
  onVolumeChange?: (volume: number) => void; // External volume change handler
  className?: string;
  // Music control props
  isPlaying: boolean;
  currentTrack: Track | null;
  tracks: Track[];
  play: (track?: Track, options?: any) => Promise<void>;
  pause: () => void;
  stop: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  isSupported: boolean;
  onTrackSelect?: (trackIndex: number) => void; // Track selection callback
}

const MusicControls: React.FC<MusicControlsProps> = ({ 
  isEnabled, 
  onToggle, 
  volume: externalVolume,
  onVolumeChange: externalVolumeChange,
  className = '',
  // Music control props
  isPlaying,
  currentTrack,
  tracks,
  play,
  pause,
  stop,
  nextTrack,
  previousTrack,
  isSupported,
  onTrackSelect
}) => {
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);

  // Use external volume if provided, otherwise default to 0.3
  const currentVolume = externalVolume !== undefined ? externalVolume : 0.3;
  const setCurrentVolume = externalVolumeChange || (() => {});

  const handlePlayPause = async () => {
    if (isPlaying) {
      pause();
    } else {
      await play(tracks[selectedTrackIndex], { loop: true });
    }
  };

  const handleTrackChange = async (index: number) => {
    setSelectedTrackIndex(index);
    onTrackSelect?.(index);
    if (isPlaying) {
      await play(tracks[index], { loop: true });
    }
  };

  if (!isSupported) {
    return (
      <div className={`text-haunted-400 text-sm ${className}`}>
        Background music not supported in this browser
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Music Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-haunted-200 font-medium">Background Music</label>
        <button
          onClick={() => {
            onToggle(!isEnabled);
            if (isEnabled && isPlaying) {
              stop();
            }
          }}
          className={`w-12 h-6 rounded-full transition-colors ${
            isEnabled ? 'bg-haunted-600' : 'bg-haunted-800'
          } relative`}
        >
          <motion.div
            className="w-5 h-5 bg-white rounded-full absolute top-0.5"
            animate={{ x: isEnabled ? 24 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {isEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          {/* Current Track Display */}
          {currentTrack && (
            <div className="bg-haunted-800/30 rounded-lg p-3 border border-haunted-700/30">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={isPlaying ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: isPlaying ? Infinity : 0 }}
                  className="text-lg"
                >
                  🎵
                </motion.div>
                <div className="flex-1">
                  <h4 className="text-haunted-100 font-medium text-sm">
                    {currentTrack.name}
                  </h4>
                  <p className="text-haunted-400 text-xs">
                    {currentTrack.description}
                  </p>
                </div>
                <div className="text-xs text-haunted-300">
                  {isPlaying ? 'Playing' : 'Paused'}
                </div>
              </div>
            </div>
          )}

          {/* Track Selection - ENABLED for Continuous Music */}
          <div>
            <label className="text-haunted-300 text-sm block mb-2">
              Ambient Track (Continuous Playback)
            </label>
            <select
              value={selectedTrackIndex}
              onChange={(e) => handleTrackChange(parseInt(e.target.value))}
              className="w-full bg-haunted-800/60 border border-haunted-700/50 rounded-lg px-3 py-2 text-haunted-100 text-sm focus:outline-none focus:ring-2 focus:ring-haunted-500/50"
              title="Select which track to play continuously"
            >
              {tracks.map((track, index) => (
                <option key={index} value={index}>
                  {track.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-haunted-400 mt-1">
              🎵 Selected track will play until you pause or switch
            </p>
          </div>

          {/* Volume Control */}
          <div>
            <label className="text-haunted-300 text-sm block mb-2">
              Volume ({Math.round(currentVolume * 100)}%)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={currentVolume}
              onChange={(e) => setCurrentVolume(parseFloat(e.target.value))}
              className="w-full accent-haunted-600"
            />
          </div>

          {/* Playback Controls - ENABLED */}
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={previousTrack}
              className="p-2 bg-haunted-800/40 text-haunted-100 rounded-lg hover:bg-haunted-700/40"
              title="Previous Track"
            >
              ⏮️
            </button>
            
            <button
              onClick={handlePlayPause}
              className="p-3 bg-haunted-600/60 hover:bg-haunted-500/60 rounded-lg transition-colors flex items-center justify-center min-w-[3rem]"
              title={isPlaying ? "Pause Music" : "Play Music"}
            >
              <motion.span
                key={isPlaying ? 'pause' : 'play'}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-lg"
              >
                {isPlaying ? '⏸️' : '▶️'}
              </motion.span>
            </button>

            <button
              onClick={nextTrack}
              className="p-2 bg-haunted-800/40 text-haunted-100 rounded-lg hover:bg-haunted-700/40"
              title="Next Track"
            >
              ⏭️
            </button>

            <button
              onClick={stop}
              className="p-2 bg-haunted-700/60 hover:bg-haunted-600/60 rounded-lg transition-colors"
              title="Stop Music"
            >
              ⏹️
            </button>
          </div>

          {/* Info */}
          <div className="text-xs text-haunted-400 bg-haunted-800/30 rounded-lg p-3 space-y-2">
            <p className="mb-1">
              <strong>Tracks:</strong> {tracks.length} terrifying horror ambiences
            </p>
            <p className="mb-2 text-haunted-300">
              <strong>Manual Controls:</strong> Enabled - Play, pause, switch, and stop music as you wish
            </p>
            <p className="mb-2 text-haunted-300">
              <strong>Featured Horror Tracks:</strong> Nightmare Asylum, Demon's Lair, Torture Chamber, Blood Moon Rising, Purgatory Gates & more!
            </p>
            {/* Track Categories */}
            <div className="border-t border-haunted-700/30 pt-2">
              <p className="font-semibold text-haunted-300 mb-1">Horror Categories:</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="text-red-400">💀 Supernatural</span>
                <span className="text-purple-400">🔮 Demonic</span>
                <span className="text-blue-400">🌙 Atmospheric</span>
                <span className="text-orange-400">🔥 Intense</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MusicControls;