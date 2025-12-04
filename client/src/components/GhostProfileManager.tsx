import React, { useState } from 'react';
import useGhostProfiles, { GhostProfile, GhostPersonalityTrait, VoiceTone, ActivityLevel } from '../hooks/useGhostProfiles';

// Add line-clamp styles if not available in Tailwind
const styles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

const VOICE_TONES: VoiceTone[] = ['whisper', 'echo', 'normal', 'deep', 'high', 'robotic', 'ethereal'];
const ACTIVITY_LEVELS: ActivityLevel[] = ['passive', 'moderate', 'active', 'very_active'];
const EMOJIS = ['👻', '💀', '🦴', '🧙', '🧟', '🦇', '🕸️', '🪦', '🧞', '🧛', '🌙', '⚡', '🔮', '💫'];
const COLORS = ['#8a4fff', '#ff4fa3', '#4fffa3', '#ffd700', '#00bfff', '#ff6347', '#9370db', '#32cd32', '#ff8c00', '#dc143c'];

interface FormData {
  name: string;
  backstory: string;
  emoji: string;
  color: string;
  personalityTraits: GhostPersonalityTrait[];
  activityLevel: ActivityLevel;
  voiceSettings: {
    tone: VoiceTone;
    speed: number;
    pitch: number;
    volume: number;
  };
  preferences: {
    conversationStyle: 'mysterious' | 'formal' | 'casual' | 'poetic' | 'friendly' | 'dramatic';
    responseLength: 'short' | 'medium' | 'long' | 'variable';
    preferredTopics: string[];
    preferredTimeToAppear: 'any' | 'night' | 'day' | 'twilight' | 'midnight';
    avoidTopics: string[];
    emotionalTone: 'neutral' | 'melancholic' | 'playful' | 'wise' | 'mysterious' | 'protective';
  };
  abilities: {
    canManipulateWeather: boolean;
    canInfluenceElectronics: boolean;
    canAccessMemories: boolean;
    canPredictFuture: boolean;
    knowledgeAreas: string[];
  };
}

const initialFormData: FormData = {
  name: '',
  backstory: '',
  emoji: '👻',
  color: '#8a4fff',
  personalityTraits: [],
  activityLevel: 'moderate',
  voiceSettings: {
    tone: 'whisper',
    speed: 1.0,
    pitch: 1.0,
    volume: 0.8
  },
  preferences: {
    conversationStyle: 'mysterious',
    responseLength: 'medium',
    preferredTopics: [],
    preferredTimeToAppear: 'any',
    avoidTopics: [],
    emotionalTone: 'neutral'
  },
  abilities: {
    canManipulateWeather: false,
    canInfluenceElectronics: false,
    canAccessMemories: false,
    canPredictFuture: false,
    knowledgeAreas: []
  }
};

const GhostProfileManager: React.FC = () => {
  // Inject styles
  React.useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const { ghosts, loading, error, fetchGhosts, createGhost, updateGhost, deleteGhost, cloneGhost } = useGhostProfiles();
  const [form, setForm] = useState<FormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'personality' | 'voice' | 'preferences' | 'abilities'>('basic');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newKnowledge, setNewKnowledge] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (section: keyof FormData, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  const handleTraitToggle = (trait: GhostPersonalityTrait) => {
    setForm(prev => ({
      ...prev,
      personalityTraits: prev.personalityTraits.includes(trait)
        ? prev.personalityTraits.filter(t => t !== trait)
        : [...prev.personalityTraits, trait]
    }));
  };

  const addTopic = () => {
    if (newTopic.trim()) {
      setForm(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          preferredTopics: [...prev.preferences.preferredTopics, newTopic.trim()]
        }
      }));
      setNewTopic('');
    }
  };

  const removeTopic = (index: number) => {
    setForm(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        preferredTopics: prev.preferences.preferredTopics.filter((_, i) => i !== index)
      }
    }));
  };

  const addKnowledge = () => {
    if (newKnowledge.trim()) {
      setForm(prev => ({
        ...prev,
        abilities: {
          ...prev.abilities,
          knowledgeAreas: [...prev.abilities.knowledgeAreas, newKnowledge.trim()]
        }
      }));
      setNewKnowledge('');
    }
  };

  const removeKnowledge = (index: number) => {
    setForm(prev => ({
      ...prev,
      abilities: {
        ...prev.abilities,
        knowledgeAreas: prev.abilities.knowledgeAreas.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.backstory.trim()) {
      alert('Please fill in at least the name and backstory');
      return;
    }

    setCreating(true);
    try {
      const ghostData = {
        name: form.name.trim(),
        backstory: form.backstory.trim(),
        emoji: form.emoji,
        color: form.color,
        personalityTraits: form.personalityTraits,
        activityLevel: form.activityLevel,
        voiceSettings: form.voiceSettings,
        preferences: {
          favoriteTopics: form.preferences.preferredTopics,
          conversationStyle: form.preferences.conversationStyle as any,
          responseLength: form.preferences.responseLength as any,
          preferredTimeToAppear: form.preferences.preferredTimeToAppear as any,
          useEmojis: true
        },
        abilities: form.abilities
      };

      if (editingId) {
        await updateGhost(editingId, ghostData);
      } else {
        await createGhost(ghostData);
      }
      
      // Reset form
      setForm(initialFormData);
      setEditingId(null);
      setActiveTab('basic');
      setShowAdvanced(false);
    } catch (error) {
      console.error('Error saving ghost:', error);
      alert('Failed to save ghost profile');
    }
    setCreating(false);
  };

  const handleEdit = (ghost: GhostProfile) => {
    setForm({
      name: ghost.name,
      backstory: ghost.backstory,
      emoji: ghost.emoji,
      color: ghost.color || '#8a4fff',
      personalityTraits: ghost.personalityTraits || [],
      activityLevel: ghost.activityLevel || 'moderate',
      voiceSettings: {
        tone: ghost.voiceSettings?.tone || 'whisper',
        speed: ghost.voiceSettings?.speed || 1.0,
        pitch: ghost.voiceSettings?.pitch || 1.0,
        volume: ghost.voiceSettings?.volume || 0.8
      },
      preferences: {
        conversationStyle: (ghost.preferences?.conversationStyle as any) || 'mysterious',
        responseLength: (ghost.preferences?.responseLength as any) || 'medium',
        preferredTopics: ghost.preferences?.favoriteTopics || [],
        preferredTimeToAppear: (ghost.preferences?.preferredTimeToAppear as any) || 'any',
        avoidTopics: [],
        emotionalTone: 'neutral'
      },
      abilities: {
        canManipulateWeather: ghost.abilities?.canManipulateWeather || false,
        canInfluenceElectronics: ghost.abilities?.canInfluenceElectronics || false,
        canAccessMemories: ghost.abilities?.canAccessMemories || false,
        canPredictFuture: ghost.abilities?.canPredictFuture || false,
        knowledgeAreas: ghost.abilities?.knowledgeAreas || []
      }
    });
    setEditingId(ghost.id);
    setShowAdvanced(true);
    setActiveTab('basic');
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the ghost "${name}"?`)) {
      try {
        await deleteGhost(id);
      } catch (error) {
        console.error('Error deleting ghost:', error);
        alert('Failed to delete ghost profile');
      }
    }
  };

  const handleClone = async (id: string, name: string) => {
    try {
      await cloneGhost(id, `${name} (Copy)`);
    } catch (error) {
      console.error('Error cloning ghost:', error);
      alert('Failed to clone ghost profile');
    }
  };

  React.useEffect(() => {
    fetchGhosts();
  }, []);

  return (
    <div className="p-4 bg-haunted-900 rounded-xl border border-haunted-700 max-w-4xl w-full mx-auto mt-6 max-h-[80vh] overflow-y-auto">
      <h2 className="text-lg font-bold mb-4 text-center text-purple-200">👻 Ghost Profile Manager</h2>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* Ghost List */}
      <div>
        <div className="flex items-center justify-between mb-4 p-3 bg-haunted-800 rounded-lg border border-haunted-600">
          <h3 className="text-base font-semibold text-purple-200 flex items-center gap-2">
            👻 Existing Ghosts 
            <span className="px-2 py-1 bg-purple-700 rounded text-xs">
              {ghosts.length}
            </span>
          </h3>
          <button
            onClick={() => fetchGhosts()}
            className="px-3 py-1 bg-haunted-600 rounded text-white hover:bg-haunted-500 transition-colors text-xs"
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-purple-300">Loading ghosts...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ghosts.map(ghost => (
                <div
                  key={ghost.id}
                  className="p-4 rounded-lg bg-haunted-800 border border-haunted-600 hover:border-purple-500 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{ghost.emoji}</span>
                      <div>
                        <h4 className="font-bold text-sm text-purple-200">{ghost.name}</h4>
                        {ghost.stats && (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>📊 {ghost.stats.timesUsed || 0} uses</span>
                            {ghost.stats.userRating && (
                              <span>⭐ {ghost.stats.userRating.toFixed(1)}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: ghost.color || '#8a4fff' }}
                      />
                      {ghost.activityLevel && (
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          ghost.activityLevel === 'very_active' ? 'bg-red-900/50 text-red-300' :
                          ghost.activityLevel === 'active' ? 'bg-orange-900/50 text-orange-300' :
                          ghost.activityLevel === 'moderate' ? 'bg-yellow-900/50 text-yellow-300' :
                          'bg-gray-900/50 text-gray-300'
                        }`}>
                          {ghost.activityLevel.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Backstory */}
                  <div className="mb-3">
                    <p className="text-xs text-purple-300 line-clamp-2">
                      {ghost.backstory}
                    </p>
                  </div>
                  
                  {/* Personality Traits */}
                  {ghost.personalityTraits && ghost.personalityTraits.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 mb-1">Traits:</p>
                      <div className="flex flex-wrap gap-1">
                        {ghost.personalityTraits.slice(0, 3).map(trait => (
                          <span
                            key={trait}
                            className="px-2 py-0.5 bg-purple-700/60 rounded text-xs text-purple-200 capitalize"
                          >
                            {trait}
                          </span>
                        ))}
                        {ghost.personalityTraits.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-700/60 rounded text-xs text-gray-300">
                            +{ghost.personalityTraits.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Voice & Preferences Info */}
                  {(ghost.voiceSettings?.tone || ghost.preferences?.conversationStyle) && (
                    <div className="mb-3 p-2 bg-haunted-700/50 rounded border border-haunted-600/50">
                      <p className="text-xs text-gray-400 mb-1">Settings:</p>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {ghost.voiceSettings?.tone && (
                          <div className="flex items-center gap-1">
                            <span className="text-blue-400">🗣️</span>
                            <span className="text-gray-300 capitalize">{ghost.voiceSettings.tone}</span>
                          </div>
                        )}
                        {ghost.preferences?.conversationStyle && (
                          <div className="flex items-center gap-1">
                            <span className="text-green-400">💬</span>
                            <span className="text-gray-300 capitalize">{ghost.preferences.conversationStyle}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Abilities */}
                  {ghost.abilities && Object.values(ghost.abilities).some(v => Array.isArray(v) ? v.length > 0 : v) && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 mb-1">Abilities:</p>
                      <div className="flex flex-wrap gap-1">
                        {ghost.abilities.canManipulateWeather && (
                          <span className="px-1 py-0.5 bg-blue-900/50 text-blue-300 rounded text-xs">🌦️</span>
                        )}
                        {ghost.abilities.canInfluenceElectronics && (
                          <span className="px-1 py-0.5 bg-yellow-900/50 text-yellow-300 rounded text-xs">⚡</span>
                        )}
                        {ghost.abilities.canAccessMemories && (
                          <span className="px-1 py-0.5 bg-green-900/50 text-green-300 rounded text-xs">🧠</span>
                        )}
                        {ghost.abilities.canPredictFuture && (
                          <span className="px-1 py-0.5 bg-purple-900/50 text-purple-300 rounded text-xs">🔮</span>
                        )}
                        {ghost.abilities.knowledgeAreas && ghost.abilities.knowledgeAreas.length > 0 && (
                          <span className="px-1 py-0.5 bg-orange-900/50 text-orange-300 rounded text-xs">
                            📚 {ghost.abilities.knowledgeAreas.length}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t border-haunted-600">
                    <button
                      onClick={() => handleEdit(ghost)}
                      className="flex-1 px-2 py-1 bg-blue-700 hover:bg-blue-600 rounded text-white transition-colors text-xs"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleClone(ghost.id, ghost.name)}
                      className="flex-1 px-2 py-1 bg-green-700 hover:bg-green-600 rounded text-white transition-colors text-xs"
                    >
                      📋 Clone
                    </button>
                    <button
                      onClick={() => handleDelete(ghost.id, ghost.name)}
                      className="px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-white transition-colors text-xs"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {ghosts.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-4xl mb-2">👻</p>
                <p className="text-sm">No ghosts found</p>
                <p className="text-xs mt-1">Create your first ghost below</p>
              </div>
            )}
          </>
        )}

        {/* Advanced Ghost Creator */}
        <div className="mt-6 pt-4 border-t border-haunted-600">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-4 py-3 bg-purple-700 hover:bg-purple-600 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {showAdvanced ? '🔼 Hide Creator' : '🔽 Show Creator'}
          </button>
        </div>

        {showAdvanced && (
          <div className="mt-4 p-4 bg-haunted-800 rounded-lg border border-haunted-600">
            <h3 className="text-base font-semibold text-purple-200 mb-4">
              {editingId ? '✏️ Edit Ghost' : '✨ Create Ghost'}
            </h3>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-4 bg-haunted-700 p-1 rounded">
              {[
                { id: 'basic', label: 'Basic', icon: '📋' },
                { id: 'personality', label: 'Personality', icon: '🎭' },
                { id: 'voice', label: 'Voice', icon: '🗣️' },
                { id: 'preferences', label: 'Settings', icon: '⚙️' },
                { id: 'abilities', label: 'Abilities', icon: '✨' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-700 to-purple-600 text-white shadow-lg scale-105'
                      : 'text-gray-300 hover:bg-haunted-500 hover:text-white'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {/* Basic Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 bg-haunted-700 border border-haunted-600 rounded text-white text-sm placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors"
                      placeholder="Enter ghost name..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Backstory *</label>
                    <textarea
                      value={form.backstory}
                      onChange={(e) => handleInputChange('backstory', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-haunted-700 border border-haunted-600 rounded text-white text-sm placeholder-gray-400 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                      placeholder="Brief history and personality..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Emoji</label>
                      <div className="grid grid-cols-6 gap-1 p-2 bg-haunted-700 rounded">
                        {EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleInputChange('emoji', emoji)}
                            className={`p-1 rounded text-lg hover:bg-haunted-600 transition-colors ${
                              form.emoji === emoji ? 'bg-purple-700 ring-1 ring-purple-400' : 'bg-haunted-600'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Color</label>
                      <div className="space-y-2">
                        <div className="grid grid-cols-6 gap-1">
                          {COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => handleInputChange('color', color)}
                              className={`w-6 h-6 rounded border-2 transition-all ${
                                form.color === color ? 'border-white scale-110' : 'border-gray-600 hover:border-gray-400'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <input
                          type="color"
                          value={form.color}
                          onChange={(e) => handleInputChange('color', e.target.value)}
                          className="w-full h-8 rounded border border-haunted-600 bg-haunted-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Personality Tab */}
              {activeTab === 'personality' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Personality Traits</label>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-1 p-2 bg-haunted-700 rounded">
                      {[
                        'mysterious', 'playful', 'ancient', 'wise', 'mischievous', 'melancholic', 
                        'protective', 'vengeful', 'curious', 'lonely', 'dramatic', 'sarcastic',
                        'gentle', 'fierce', 'scholarly', 'artistic', 'warrior', 'trickster',
                        'romantic', 'dark', 'light', 'chaotic', 'orderly', 'emotional'
                      ].map(trait => (
                        <button
                          key={trait}
                          onClick={() => handleTraitToggle(trait as GhostPersonalityTrait)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors capitalize ${
                            form.personalityTraits.includes(trait as GhostPersonalityTrait)
                              ? 'bg-purple-700 text-white border border-purple-400'
                              : 'bg-haunted-600 text-gray-300 border border-haunted-500 hover:bg-haunted-500 hover:text-white'
                          }`}
                        >
                          {trait}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Activity Level</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                      {ACTIVITY_LEVELS.map(level => (
                        <button
                          key={level}
                          onClick={() => handleInputChange('activityLevel', level)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors capitalize ${
                            form.activityLevel === level
                              ? 'bg-purple-700 text-white'
                              : 'bg-haunted-600 text-gray-300 hover:bg-haunted-500 hover:text-white'
                          }`}
                        >
                          {level.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Voice Tab */}
              {activeTab === 'voice' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Voice Tone</label>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-1">
                      {VOICE_TONES.map(tone => (
                        <button
                          key={tone}
                          onClick={() => handleNestedChange('voiceSettings', 'tone', tone)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors capitalize ${
                            form.voiceSettings.tone === tone
                              ? 'bg-purple-700 text-white'
                              : 'bg-haunted-600 text-gray-300 hover:bg-haunted-500 hover:text-white'
                          }`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-2 bg-haunted-700 rounded">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1 text-center">
                        Speed: {form.voiceSettings.speed.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={form.voiceSettings.speed}
                        onChange={(e) => handleNestedChange('voiceSettings', 'speed', parseFloat(e.target.value))}
                        className="w-full h-2 accent-purple-500 rounded appearance-none slider"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1 text-center">
                        Pitch: {form.voiceSettings.pitch.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={form.voiceSettings.pitch}
                        onChange={(e) => handleNestedChange('voiceSettings', 'pitch', parseFloat(e.target.value))}
                        className="w-full h-2 accent-purple-500 rounded appearance-none slider"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1 text-center">
                        Volume: {form.voiceSettings.volume.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={form.voiceSettings.volume}
                        onChange={(e) => handleNestedChange('voiceSettings', 'volume', parseFloat(e.target.value))}
                        className="w-full h-2 accent-purple-500 rounded appearance-none slider"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Conversation Style</label>
                      <select
                        value={form.preferences.conversationStyle}
                        onChange={(e) => handleNestedChange('preferences', 'conversationStyle', e.target.value)}
                        className="w-full px-2 py-1 bg-haunted-700 border border-haunted-600 rounded text-white text-xs focus:border-purple-500 focus:outline-none"
                      >
                        <option value="mysterious">Mysterious</option>
                        <option value="friendly">Friendly</option>
                        <option value="formal">Formal</option>
                        <option value="casual">Casual</option>
                        <option value="poetic">Poetic</option>
                        <option value="dramatic">Dramatic</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Response Length</label>
                      <select
                        value={form.preferences.responseLength}
                        onChange={(e) => handleNestedChange('preferences', 'responseLength', e.target.value)}
                        className="w-full px-2 py-1 bg-haunted-700 border border-haunted-600 rounded text-white text-xs focus:border-purple-500 focus:outline-none"
                      >
                        <option value="short">Short</option>
                        <option value="medium">Medium</option>
                        <option value="long">Long</option>
                        <option value="variable">Variable</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Preferred Time</label>
                      <select
                        value={form.preferences.preferredTimeToAppear}
                        onChange={(e) => handleNestedChange('preferences', 'preferredTimeToAppear', e.target.value)}
                        className="w-full px-2 py-1 bg-haunted-700 border border-haunted-600 rounded text-white text-xs focus:border-purple-500 focus:outline-none"
                      >
                        <option value="any">Any Time</option>
                        <option value="night">Night</option>
                        <option value="day">Day</option>
                        <option value="twilight">Twilight</option>
                        <option value="midnight">Midnight</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Emotional Tone</label>
                      <select
                        value={form.preferences.emotionalTone}
                        onChange={(e) => handleNestedChange('preferences', 'emotionalTone', e.target.value)}
                        className="w-full px-2 py-1 bg-haunted-700 border border-haunted-600 rounded text-white text-xs focus:border-purple-500 focus:outline-none"
                      >
                        <option value="neutral">Neutral</option>
                        <option value="melancholic">Melancholic</option>
                        <option value="playful">Playful</option>
                        <option value="wise">Wise</option>
                        <option value="mysterious">Mysterious</option>
                        <option value="protective">Protective</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Preferred Topics</label>
                    <div className="flex gap-1 mb-2">
                      <input
                        type="text"
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        placeholder="Add topic..."
                        className="flex-1 px-2 py-1 bg-haunted-700 border border-haunted-600 rounded text-white text-xs focus:border-purple-500 focus:outline-none"
                      />
                      <button
                        onClick={addTopic}
                        className="px-2 py-1 bg-purple-700 hover:bg-purple-600 rounded text-white text-xs transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {form.preferences.preferredTopics.map((topic, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-haunted-600 rounded text-xs text-purple-200 flex items-center gap-1"
                        >
                          {topic}
                          <button
                            onClick={() => removeTopic(index)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Abilities Tab */}
              {activeTab === 'abilities' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Special Abilities</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={form.abilities.canManipulateWeather}
                          onChange={(e) => handleNestedChange('abilities', 'canManipulateWeather', e.target.checked)}
                          className="w-3 h-3 text-purple-600 bg-haunted-700 border-haunted-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-purple-200 text-xs">🌦️ Weather</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={form.abilities.canInfluenceElectronics}
                          onChange={(e) => handleNestedChange('abilities', 'canInfluenceElectronics', e.target.checked)}
                          className="w-3 h-3 text-purple-600 bg-haunted-700 border-haunted-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-purple-200 text-xs">⚡ Electronics</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={form.abilities.canAccessMemories}
                          onChange={(e) => handleNestedChange('abilities', 'canAccessMemories', e.target.checked)}
                          className="w-3 h-3 text-purple-600 bg-haunted-700 border-haunted-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-purple-200 text-xs">🧠 Memories</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={form.abilities.canPredictFuture}
                          onChange={(e) => handleNestedChange('abilities', 'canPredictFuture', e.target.checked)}
                          className="w-3 h-3 text-purple-600 bg-haunted-700 border-haunted-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-purple-200 text-xs">🔮 Future</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Knowledge Areas</label>
                    <div className="flex gap-1 mb-2">
                      <input
                        type="text"
                        value={newKnowledge}
                        onChange={(e) => setNewKnowledge(e.target.value)}
                        placeholder="Add knowledge..."
                        className="flex-1 px-2 py-1 bg-haunted-700 border border-haunted-600 rounded text-white text-xs focus:border-purple-500 focus:outline-none"
                      />
                      <button
                        onClick={addKnowledge}
                        className="px-2 py-1 bg-purple-700 hover:bg-purple-600 rounded text-white text-xs transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {form.abilities.knowledgeAreas.map((area, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-haunted-600 rounded text-xs text-purple-200 flex items-center gap-1"
                        >
                          {area}
                          <button
                            onClick={() => removeKnowledge(index)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 pt-3 border-t border-haunted-600">
              <button
                onClick={handleSubmit}
                disabled={creating}
                className="flex-1 px-3 py-2 bg-purple-700 hover:bg-purple-600 disabled:bg-haunted-600 rounded text-white font-medium text-sm transition-colors disabled:cursor-not-allowed"
              >
                {creating ? '🔄 Saving...' : (editingId ? '✨ Update' : '🎆 Create')}
              </button>
              
              {editingId && (
                <button
                  onClick={() => {
                    setForm(initialFormData);
                    setEditingId(null);
                    setActiveTab('basic');
                  }}
                  className="px-3 py-2 bg-haunted-600 hover:bg-haunted-500 rounded text-white font-medium text-sm transition-colors"
                >
                  ❌ Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GhostProfileManager;
