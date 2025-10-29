import React from 'react';
import useGhostInteractions from '../hooks/useGhostInteractions';

interface Props {
  messageId: string;
  sessionId?: string;
}

const EMOJIS = ['👻','🎃','🕯️','💀','😱','✨'];

function EmojiReactions({ messageId, sessionId }: Props) {
  const { state, reactToMessage } = useGhostInteractions(sessionId);
  const reactions = state.emojiReactions[messageId] || [];

  return (
    <div className="flex items-center space-x-2">
      {EMOJIS.map(e => (
        <button
          key={e}
          onClick={() => reactToMessage(messageId, e)}
          className="px-2 py-1 bg-haunted-800 rounded-md hover:scale-105 transition-transform"
          title={`React ${e}`}
        >
          {e}
        </button>
      ))}

      <div className="text-haunted-300 text-sm">{reactions.join(' ')}</div>
    </div>
  );
}

export default React.memo(EmojiReactions);
