import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIMemory, GhostRelationship } from '../hooks/useAIMemory';

interface Props {
  ghostPersonalityId: string;
  isVisible: boolean;
  onClose: () => void;
}

const RelationshipTracker: React.FC<Props> = ({ ghostPersonalityId, isVisible, onClose }) => {
  const { currentRelationship, getRelationshipStatus, isLoading } = useAIMemory();
  const [relationship, setRelationship] = useState<GhostRelationship | null>(null);
  
  useEffect(() => {
    if (isVisible && ghostPersonalityId) {
      loadRelationship();
    }
  }, [isVisible, ghostPersonalityId]);
  
  useEffect(() => {
    if (currentRelationship) {
      setRelationship(currentRelationship);
    }
  }, [currentRelationship]);

  const loadRelationship = async () => {
    const rel = await getRelationshipStatus(ghostPersonalityId);
    if (rel) {
      setRelationship(rel);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enemy': return 'text-red-400';
      case 'rival': return 'text-orange-400';
      case 'stranger': return 'text-gray-400';
      case 'acquaintance': return 'text-blue-400';
      case 'friend': return 'text-green-400';
      case 'close_friend': return 'text-green-300';
      case 'confidant': return 'text-purple-400';
      case 'soulmate': return 'text-pink-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'enemy': return '💀';
      case 'rival': return '⚔️';
      case 'stranger': return '👻';
      case 'acquaintance': return '🤝';
      case 'friend': return '😊';
      case 'close_friend': return '💫';
      case 'confidant': return '🔮';
      case 'soulmate': return '💖';
      default: return '❓';
    }
  };

  const ProgressBar = ({ label, value, max = 100, color = 'purple' }: {
    label: string;
    value: number;
    max?: number;
    color?: string;
  }) => {
    const percentage = Math.max(0, Math.min(100, (value / max) * 100));
    const colorClasses = {
      purple: 'bg-purple-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      pink: 'bg-pink-500'
    };

    return (
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-300">{label}</span>
          <span className="text-gray-400">{Math.round(value)}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-purple-500"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              👻 Ghost Relationship
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin text-purple-400 text-2xl mb-2">🔮</div>
              <p className="text-gray-400">Reading spiritual connection...</p>
            </div>
          ) : relationship ? (
            <div className="space-y-4">
              {/* Relationship Status */}
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">{getStatusEmoji(relationship.status)}</div>
                <h4 className={`text-lg font-semibold ${getStatusColor(relationship.status)}`}>
                  {relationship.status.replace('_', ' ').toUpperCase()}
                </h4>
                <p className="text-sm text-gray-400 mt-2">
                  {relationship.conversationCount} conversations • {Math.floor(relationship.totalInteractionTime / 60)} minutes
                </p>
              </div>

              {/* Relationship Metrics */}
              <div className="space-y-3">
                <ProgressBar 
                  label="Trust Level" 
                  value={relationship.trust + 100} 
                  max={200} 
                  color="green" 
                />
                <ProgressBar 
                  label="Intimacy" 
                  value={relationship.intimacy} 
                  color="pink" 
                />
                <ProgressBar 
                  label="Fear Level" 
                  value={relationship.fear} 
                  color="red" 
                />
                <ProgressBar 
                  label="Affection" 
                  value={relationship.affection} 
                  color="purple" 
                />
              </div>

              {/* Milestones */}
              {relationship.milestones && relationship.milestones.length > 0 && (
                <div className="mt-6">
                  <h5 className="text-sm font-semibold text-gray-300 mb-2">🏆 Milestones</h5>
                  <div className="space-y-1">
                    {relationship.milestones.map((milestone, index) => (
                      <div key={index} className="text-xs text-gray-400 flex items-center">
                        <span className="mr-2">•</span>
                        {milestone}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Relationship Notice */}
              {relationship.isNew && (
                <div className="bg-purple-900 bg-opacity-50 border border-purple-500 rounded-lg p-3 mt-4">
                  <p className="text-xs text-purple-300">
                    ✨ This is a new spiritual connection. Keep talking to develop your relationship!
                  </p>
                </div>
              )}

              {/* Last Interaction */}
              {relationship.lastInteraction && (
                <div className="text-xs text-gray-500 text-center mt-4">
                  Last interaction: {new Date(relationship.lastInteraction).toLocaleDateString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👻</div>
              <p className="text-gray-400">No spiritual connection found.</p>
              <p className="text-sm text-gray-500 mt-2">
                Start chatting to build a relationship!
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RelationshipTracker;