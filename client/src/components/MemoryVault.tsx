import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIMemory, Memory } from '../hooks/useAIMemory';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  searchQuery?: string;
}

const MemoryVault: React.FC<Props> = ({ isVisible, onClose, searchQuery }) => {
  const { memories, fetchMemories, isLoading, error } = useAIMemory();
  const [search, setSearch] = useState(searchQuery || '');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);

  useEffect(() => {
    if (isVisible) {
      loadMemories();
    }
  }, [isVisible, search]);

  useEffect(() => {
    filterMemories();
  }, [memories, selectedType]);

  const loadMemories = async () => {
    await fetchMemories(search || undefined, 20);
  };

  const filterMemories = () => {
    let filtered = memories;
    
    if (selectedType !== 'all') {
      filtered = memories.filter(memory => memory.type === selectedType);
    }
    
    setFilteredMemories(filtered);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'preference': return '❤️';
      case 'conversation': return '💬';
      case 'emotion': return '😊';
      case 'behavior': return '🏃';
      case 'relationship': return '👥';
      case 'achievement': return '🏆';
      default: return '💭';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'preference': return 'bg-pink-900 border-pink-500';
      case 'conversation': return 'bg-blue-900 border-blue-500';
      case 'emotion': return 'bg-yellow-900 border-yellow-500';
      case 'behavior': return 'bg-green-900 border-green-500';
      case 'relationship': return 'bg-purple-900 border-purple-500';
      case 'achievement': return 'bg-orange-900 border-orange-500';
      default: return 'bg-gray-900 border-gray-500';
    }
  };

  const getImportanceColor = (importance: number) => {
    if (importance >= 8) return 'text-red-400';
    if (importance >= 6) return 'text-yellow-400';
    if (importance >= 4) return 'text-blue-400';
    return 'text-gray-400';
  };

  const memoryTypes = [
    { key: 'all', label: 'All', icon: '🧠' },
    { key: 'preference', label: 'Preferences', icon: '❤️' },
    { key: 'conversation', label: 'Conversations', icon: '💬' },
    { key: 'emotion', label: 'Emotions', icon: '😊' },
    { key: 'behavior', label: 'Behaviors', icon: '🏃' },
    { key: 'relationship', label: 'Relationships', icon: '👥' },
    { key: 'achievement', label: 'Achievements', icon: '🏆' }
  ];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-purple-500"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h3 className="text-2xl font-bold text-white flex items-center">
              🧠 Memory Vault
              <span className="text-sm text-gray-400 ml-2">
                ({filteredMemories.length} memories)
              </span>
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl"
            >
              ✕
            </button>
          </div>

          {/* Controls */}
          <div className="p-4 border-b border-gray-700 space-y-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search memories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none pl-10"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">🔍</div>
            </div>

            {/* Type Filter */}
            <div className="flex flex-wrap gap-2">
              {memoryTypes.map(type => (
                <button
                  key={type.key}
                  onClick={() => setSelectedType(type.key)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors flex items-center space-x-1 ${
                    selectedType === type.key
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Memory List */}
          <div className="flex-1 overflow-y-auto p-4 max-h-96">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin text-purple-400 text-3xl mb-4">🔮</div>
                <p className="text-gray-400">Accessing memories...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-400 text-3xl mb-4">❌</div>
                <p className="text-red-400">{error}</p>
              </div>
            ) : filteredMemories.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-3xl mb-4">🌫️</div>
                <p className="text-gray-400">No memories found</p>
                <p className="text-sm text-gray-500 mt-2">
                  {search ? 'Try a different search term' : 'Start chatting to create memories!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMemories.map((memory) => (
                  <motion.div
                    key={memory.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border ${getTypeColor(memory.type)}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getTypeIcon(memory.type)}</span>
                        <span className="text-sm text-gray-400 capitalize">
                          {memory.type.replace('_', ' ')}
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className={`text-xs ${getImportanceColor(memory.importance)}`}>
                            ★
                          </span>
                          <span className={`text-xs ${getImportanceColor(memory.importance)}`}>
                            {memory.importance.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {new Date(memory.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Accessed {memory.accessCount} times
                        </div>
                      </div>
                    </div>

                    <div className="text-gray-200 mb-2">
                      {memory.content}
                    </div>

                    {memory.tags && memory.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {memory.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 bg-gray-850">
            <div className="text-xs text-gray-500 text-center">
              Memories help ghosts remember your conversations and build deeper relationships
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MemoryVault;