import React, { useState } from 'react';
import useGhostInteractions from '../hooks/useGhostInteractions';

interface Props {
  messageId: string;
  sessionId?: string;
  disabled?: boolean;
}

// Organized emoji sections
const EMOJI_SECTIONS = {
  haunted: {
    label: '👻 Haunted',
    emojis: ['👻', '🎃', '💀', '🕯️', '⚱️', '🔮', '🧙‍♀️', '🧛‍♂️', '🧟‍♀️', '☠️', '🕷️', '🦇', '🕸️', '⚰️', '🪦', '🌑', '🌚']
  },
  ghostly: {
    label: '🌫️ Ghostly',
    emojis: ['🌫️', '💨', '🌪️', '❄️', '🌑', '🌙', '⚰️', '🕳️', '👤', '🌀', '🌌', '👥', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌃', '🌆', '🌉']
  },
  emotions: {
    label: '😂 Emotions',
    emojis: ['😂', '🤣', '😆', '😹', '😍', '🥰', '😘', '😱', '😨', '😰', '🤯', '😵', '😳', '😬', '🥶', '😲', '😯', '🤐', '😦', '😧', '😮', '😵‍💫', '🤤']
  },
  interactive: {
    label: '👏 Interactive', 
    emojis: ['👍', '👎', '👏', '🙌', '👋', '✋', '🤝', '👊', '✌️', '🤞', '💪', '🫶', '🤟', '🤘', '👌', '🤏', '✊', '👈', '👉', '👆', '👇', '☝️', '🫵']
  },
  magical: {
    label: '✨ Magical',
    emojis: ['✨', '🌟', '⭐', '💫', '🔥', '⚡', '🌙', '🔮', '🪄', '🎭', '🌈', '💎', '🌠', '💥', '🌞', '☀️', '🌛', '🌜', '🌝', '⚛️', '🔯', '🕉️']
  },
  love: {
    label: '💕 Love',
    emojis: ['💕', '💖', '💗', '💙', '💜', '🖤', '🤍', '❤️', '🧡', '💛', '💚', '💯', '💘', '💝', '💞', '💓', '💔', '❣️', '💟', '♥️', '😻', '🥰']
  },
  thinking: {
    label: '🤔 Thinking',
    emojis: ['🤔', '🧐', '🤨', '😏', '🙄', '😒', '😑', '😐', '😶', '🤷‍♀️', '🤷‍♂️', '💭', '🧠', '💡', '❓', '❔', '❗', '❕', '⁉️', '‼️', '💬', '🗨️']
  },
  scary: {
    label: '😈 Scary',
    emojis: ['😈', '👺', '👹', '🤬', '😠', '😡', '💥', '🌋', '🗯️', '💢', '👿', '💀', '☠️', '🔥', '⚡', '💣', '🗲', '⚔️', '🔪', '🩸', '🌪️', '🌊']
  },
  celebration: {
    label: '🎉 Celebration',
    emojis: ['🎉', '🎊', '🎈', '🍾', '🥂', '🎆', '🎇', '🎁', '🥳', '🎪', '🎭', '🎨', '🎵', '🎶', '🎼', '🏆', '🥇', '🥈', '🥉', '🎯', '🎲', '🃏']
  },
  animals: {
    label: '🐱 Animals',
    emojis: ['🐱', '🐶', '🐺', '🦊', '🐸', '🐙', '🕷️', '🦇', '🐍', '🦎', '🐲', '🐉', '🦈', '🐊', '🐀', '🐁', '🐈‍⬛', '🐾', '🦉', '🕊️', '🐦‍⬛', '🐧']
  }
};

// Quick access - most used emojis from each section
const DEFAULT_EMOJIS = [
  '👻', '🎃', '💀', '🕯️',  // haunted
  '🌫️', '💨', '🌙',       // ghostly
  '👍', '👎', '👏', '🙌',   // interactive
  '😂', '😍', '😱', '🤔',   // emotions  
  '✨', '🔥', '⚡', '💫',    // magical
  '💕', '💖', '🎉', '🥳'    // love & celebration
];

function EmojiReactions({ messageId, sessionId, disabled = false }: Props) {
  const { state, reactToMessage, removeReaction } = useGhostInteractions(sessionId);
  const reactions = state.emojiReactions[messageId] || {};
  const [showSections, setShowSections] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleEmojiClick = (emoji: string) => {
    if (disabled) return;
    
    // If user already reacted with this emoji, remove it; otherwise add it
    if (reactions[emoji]) {
      removeReaction(messageId, emoji);
    } else {
      reactToMessage(messageId, emoji);
    }
  };

  const getEmojisToShow = () => {
    if (!showSections) return DEFAULT_EMOJIS;
    
    if (activeSection && EMOJI_SECTIONS[activeSection as keyof typeof EMOJI_SECTIONS]) {
      return EMOJI_SECTIONS[activeSection as keyof typeof EMOJI_SECTIONS].emojis;
    }
    
    return DEFAULT_EMOJIS;
  };

  return (
    <div className="space-y-3">
      {/* Section selector (only show when sections are expanded) */}
      {showSections && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveSection(null)}
              className={`px-2 py-1 rounded-lg text-xs transition-all ${
                !activeSection 
                  ? 'bg-haunted-500 text-white' 
                  : 'bg-haunted-800/70 text-haunted-300 hover:bg-haunted-700'
              }`}
            >
              Popular
            </button>
            {Object.entries(EMOJI_SECTIONS).map(([key, section]) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`px-2 py-1 rounded-lg text-xs transition-all flex items-center gap-1 ${
                  activeSection === key
                    ? 'bg-haunted-500 text-white' 
                    : 'bg-haunted-800/70 text-haunted-300 hover:bg-haunted-700'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emoji reaction buttons */}
      <div className="flex flex-wrap items-center gap-1">
        {getEmojisToShow().map(emoji => {
          const count = reactions[emoji] || 0;
          const isActive = count > 0;
          
          return (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className={`
                relative px-2 py-1 rounded-lg transition-all duration-200 text-lg
                ${disabled 
                  ? 'bg-haunted-900 cursor-not-allowed opacity-60' 
                  : isActive
                    ? 'bg-haunted-600 hover:bg-haunted-500 scale-105 shadow-md' 
                    : 'bg-haunted-800/70 hover:bg-haunted-700 hover:scale-105'
                }
                ${isActive ? 'ring-2 ring-haunted-400/50' : ''}
              `}
              title={disabled ? 'Sign in to react' : `${isActive ? 'Remove' : 'Add'} ${emoji} reaction`}
              disabled={disabled}
            >
              <span className="block">{emoji}</span>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-haunted-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
        
        {/* Toggle sections button */}
        <button
          onClick={() => {
            setShowSections(!showSections);
            if (!showSections) setActiveSection(null);
          }}
          className="ml-1 px-3 py-1 rounded-lg bg-haunted-700/80 hover:bg-haunted-600 text-haunted-300 text-sm transition-all duration-200 font-medium"
          title={showSections ? 'Show less' : 'Browse sections'}
        >
          {showSections ? '−' : '⋯'}
        </button>
      </div>

      {/* Active reactions summary */}
      {Object.keys(reactions).length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {Object.entries(reactions).map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="bg-haunted-800/60 hover:bg-haunted-700/60 px-2 py-1 rounded-full text-haunted-200 flex items-center gap-1.5 transition-all duration-200 text-sm"
              title={`Remove ${emoji} reaction`}
            >
              <span className="text-base">{emoji}</span>
              <span className="text-haunted-400 font-medium">{count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default React.memo(EmojiReactions);
