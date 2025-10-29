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
    <div className="flex items-center space-x-2">
      {EMOJIS.map(e => (
        <button
          key={e}
          onClick={() => { if (!disabled) reactToMessage(messageId, e); }}
          className={`px-2 py-1 rounded-md transition-transform ${disabled ? 'bg-haunted-900 cursor-not-allowed opacity-60' : 'bg-haunted-800 hover:scale-105'}`}
          title={disabled ? 'Sign in to react' : `React ${e}`}
          disabled={disabled}
        >
          {e}
        </button>
      ))}

      <div className="text-haunted-300 text-sm">{reactions.join(' ')}</div>
    </div>
  );
}

export default React.memo(EmojiReactions);
