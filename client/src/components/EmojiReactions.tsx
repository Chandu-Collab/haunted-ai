import React from 'react';
import useGhostInteractions from '../hooks/useGhostInteractions';

interface Props {
  messageId: string;
  sessionId?: string;
  disabled?: boolean;
}

const EMOJIS = ['👻','🎃','🕯️','💀','😱','✨'];

function EmojiReactions({ messageId, sessionId, disabled = false }: Props) {
  const { state, reactToMessage } = useGhostInteractions(sessionId);
  const reactions = state.emojiReactions[messageId] || [];

  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      {EMOJIS.map(e => (
        <button
          key={e}
          onClick={() => { if (!disabled) reactToMessage(messageId, e); }}
          className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-md transition-transform text-base sm:text-lg ${disabled ? 'bg-haunted-900 cursor-not-allowed opacity-60' : 'bg-haunted-800 hover:scale-105'}`}
          title={disabled ? 'Sign in to react' : `React ${e}`}
          disabled={disabled}
        >
          {e}
        </button>
      ))}

      <div className="text-haunted-300 text-xs sm:text-sm">{reactions.join(' ')}</div>
    </div>
  );
}

export default React.memo(EmojiReactions);
