import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIMemory, SentimentAnalysis } from '../hooks/useAIMemory';

interface Props {
  isVisible: boolean;
  onClose: () => void;
}

const SentimentDashboard: React.FC<Props> = ({ isVisible, onClose }) => {
  const { sentimentTrend, fetchSentimentTrend, isLoading } = useAIMemory();
  const [selectedDays, setSelectedDays] = useState(7);

  useEffect(() => {
    if (isVisible) {
      loadSentimentTrend();
    }
  }, [isVisible, selectedDays]);

  const loadSentimentTrend = async () => {
    await fetchSentimentTrend(selectedDays);
  };

  const getSentimentEmoji = (sentiment: number) => {
    if (sentiment > 0.5) return '😊';
    if (sentiment > 0.2) return '🙂';
    if (sentiment > -0.2) return '😐';
    if (sentiment > -0.5) return '🙁';
    return '😢';
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.5) return 'text-green-400';
    if (sentiment > 0.2) return 'text-green-300';
    if (sentiment > -0.2) return 'text-yellow-400';
    if (sentiment > -0.5) return 'text-orange-400';
    return 'text-red-400';
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-400';
      case 'declining': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTrendEmoji = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const MetricCard = ({ label, value, max = 1, emoji, color = 'purple' }: {
    label: string;
    value: number;
    max?: number;
    emoji: string;
    color?: string;
  }) => {
    const percentage = Math.max(0, Math.min(100, (value / max) * 100));
    const colorClasses = {
      purple: 'bg-purple-500',
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    };

    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{emoji}</span>
            <span className="text-sm font-medium text-gray-300">{label}</span>
          </div>
          <span className="text-lg font-bold text-white">
            {(value * (max === 1 ? 100 : 1)).toFixed(1)}{max === 1 ? '%' : ''}
          </span>
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden border border-purple-500"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h3 className="text-2xl font-bold text-white flex items-center">
              📊 Sentiment Analysis
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl"
            >
              ✕
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex space-x-2">
              {[1, 7, 14, 30].map(days => (
                <button
                  key={days}
                  onClick={() => setSelectedDays(days)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedDays === days
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {days === 1 ? 'Today' : `${days} days`}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-96">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin text-purple-400 text-3xl mb-4">🔮</div>
                <p className="text-gray-400">Analyzing emotional patterns...</p>
              </div>
            ) : sentimentTrend ? (
              <div className="space-y-6">
                {/* Overall Sentiment */}
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {getSentimentEmoji(sentimentTrend.averageSentiment)}
                  </div>
                  <h4 className={`text-xl font-semibold mb-2 ${getSentimentColor(sentimentTrend.averageSentiment)}`}>
                    Overall Mood: {(sentimentTrend.averageSentiment * 100).toFixed(1)}%
                  </h4>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                    <span>{getTrendEmoji(sentimentTrend.trend)}</span>
                    <span className={getTrendColor(sentimentTrend.trend)}>
                      {sentimentTrend.trend === 'improving' ? 'Improving' :
                       sentimentTrend.trend === 'declining' ? 'Declining' : 'Stable'}
                    </span>
                    <span>•</span>
                    <span>{sentimentTrend.recentCount} messages analyzed</span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MetricCard
                    label="Engagement"
                    value={sentimentTrend.averageEngagement}
                    emoji="🎯"
                    color="blue"
                  />
                  <MetricCard
                    label="Stress Level"
                    value={sentimentTrend.averageStress}
                    emoji="😰"
                    color="orange"
                  />
                </div>

                {/* Insights */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h5 className="text-lg font-semibold text-white mb-3 flex items-center">
                    🧠 AI Insights
                  </h5>
                  <div className="space-y-2 text-sm text-gray-300">
                    {sentimentTrend.averageSentiment > 0.3 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-green-400">✓</span>
                        <span>You're having mostly positive conversations!</span>
                      </div>
                    )}
                    {sentimentTrend.averageEngagement > 0.7 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-400">✓</span>
                        <span>High engagement levels show deep connection.</span>
                      </div>
                    )}
                    {sentimentTrend.averageStress > 0.6 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-orange-400">⚠</span>
                        <span>Elevated stress detected. Consider relaxing topics.</span>
                      </div>
                    )}
                    {sentimentTrend.trend === 'improving' && (
                      <div className="flex items-center space-x-2">
                        <span className="text-green-400">📈</span>
                        <span>Your emotional state is improving over time!</span>
                      </div>
                    )}
                    {sentimentTrend.trend === 'declining' && (
                      <div className="flex items-center space-x-2">
                        <span className="text-red-400">📉</span>
                        <span>Consider talking about positive topics or taking a break.</span>
                      </div>
                    )}
                    {sentimentTrend.recentCount < 5 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">ℹ</span>
                        <span>More conversations needed for accurate analysis.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-purple-900 bg-opacity-50 border border-purple-500 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-purple-300 mb-2">💡 Tips for Better Conversations</h5>
                  <ul className="text-xs text-purple-200 space-y-1">
                    <li>• Share personal stories to build stronger connections</li>
                    <li>• Ask the ghost about their past experiences</li>
                    <li>• Express your emotions openly and honestly</li>
                    <li>• Try different conversation topics to discover interests</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-3xl mb-4">📊</div>
                <p className="text-gray-400">No sentiment data available</p>
                <p className="text-sm text-gray-500 mt-2">
                  Start chatting to generate sentiment analysis!
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SentimentDashboard;