import React, { useRef, useState, useEffect } from 'react';
import { useImageAnalysis, ImageAnalysis } from '../hooks/useImageAnalysis';

interface ImageUploadProps {
  onImageAnalyzed?: (analysis: ImageAnalysis) => void;
  personalityId?: string;
  className?: string;
  // Global analysis preferences as defaults
  defaultAnalysisGenre?: AnalysisGenre;
  defaultAnalysisMood?: AnalysisMood;
  defaultAnalysisDepth?: 'basic' | 'detailed' | 'artistic';
}

// Enhanced analysis preferences
type AnalysisGenre = 'supernatural' | 'horror' | 'mystery' | 'romantic' | 'artistic' | 'nature' | 'portrait' | 'abstract';
type AnalysisMood = 'mysterious' | 'peaceful' | 'dramatic' | 'ethereal' | 'dark' | 'hopeful' | 'intense' | 'whimsical';

interface AnalysisPreferences {
  genre?: AnalysisGenre;
  mood?: AnalysisMood;
  analysisDepth?: 'basic' | 'detailed' | 'artistic';
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImageAnalyzed, 
  personalityId, 
  className = '',
  defaultAnalysisGenre = 'supernatural',
  defaultAnalysisMood = 'mysterious', 
  defaultAnalysisDepth = 'detailed'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analysisPreferences, setAnalysisPreferences] = useState<AnalysisPreferences>({
    genre: defaultAnalysisGenre,
    mood: defaultAnalysisMood,
    analysisDepth: defaultAnalysisDepth
  });
  
  const { currentAnalysis, isAnalyzing, analyzeImage, clearAnalysis } = useImageAnalysis();

  // Sync with global defaults when they change
  useEffect(() => {
    setAnalysisPreferences(prev => ({
      genre: defaultAnalysisGenre,
      mood: defaultAnalysisMood,
      analysisDepth: defaultAnalysisDepth
    }));
  }, [defaultAnalysisGenre, defaultAnalysisMood, defaultAnalysisDepth]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Analyze the image with enhanced preferences
    const analysis = await analyzeImage(file, personalityId, analysisPreferences);
    if (analysis) {
      onImageAnalyzed?.(analysis);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleClear = () => {
    setPreviewUrl(null);
    clearAnalysis();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`image-upload max-w-[90vw] sm:max-w-lg mx-auto ${className}`}>
      {/* Analysis Preferences */}
      <div className="analysis-preferences mb-4 p-3 bg-purple-900/10 rounded-lg border border-purple-600/20">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-purple-200 font-medium text-sm">Analysis Preferences</h4>
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="text-purple-400 hover:text-purple-200 text-xs"
          >
            {showPreferences ? 'Hide' : 'Show'}
          </button>
        </div>
        
        {showPreferences && (
          <div className="space-y-3">
            {/* Genre Selection */}
            <div>
              <label className="block text-purple-300 text-xs mb-1">Analysis Style</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
                {(['supernatural', 'artistic', 'nature', 'portrait'] as AnalysisGenre[]).map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setAnalysisPreferences(prev => ({ ...prev, genre }))}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      analysisPreferences.genre === genre
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-800/30 text-purple-200 hover:bg-purple-700/40'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood Selection */}
            <div>
              <label className="block text-purple-300 text-xs mb-1">Mood Focus</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {(['mysterious', 'ethereal', 'dramatic', 'peaceful'] as AnalysisMood[]).map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setAnalysisPreferences(prev => ({ ...prev, mood }))}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      analysisPreferences.mood === mood
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-800/30 text-purple-200 hover:bg-purple-700/40'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Analysis Depth */}
            <div>
              <label className="block text-purple-300 text-xs mb-1">Analysis Depth</label>
              <div className="grid grid-cols-3 gap-1">
                {(['basic', 'detailed', 'artistic'] as const).map((depth) => (
                  <button
                    key={depth}
                    onClick={() => setAnalysisPreferences(prev => ({ ...prev, analysisDepth: depth }))}
                    className={`px-2 py-1 rounded text-xs transition-all ${
                      analysisPreferences.analysisDepth === depth
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-800/30 text-purple-200 hover:bg-purple-700/40'
                    }`}
                  >
                    {depth}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {!previewUrl ? (
        <div
          className={`upload-area border-2 border-dashed rounded-lg p-2 sm:p-4 text-center transition-colors duration-200 ${
            dragActive 
              ? 'border-purple-400 bg-purple-500/10' 
              : 'border-purple-500/50 bg-purple-500/5 hover:bg-purple-500/10'
          } ${isAnalyzing ? 'opacity-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
            disabled={isAnalyzing}
          />
          <div className="upload-content">
            <div className="upload-icon text-2xl sm:text-4xl mb-2 sm:mb-4">👁️</div>
            <p className="text-purple-200 mb-1 sm:mb-2 text-xs sm:text-sm">
              Share an image with the ghost
            </p>
            <p className="text-purple-400 text-xs sm:text-sm mb-2 sm:mb-4">
              The spirit can see through dimensions and will analyze what you show
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="upload-button bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-lg px-2 sm:px-4 py-1 sm:py-2 text-purple-200 text-xs sm:text-sm transition-colors duration-200 disabled:opacity-50"
            >
              {isAnalyzing ? 'Analyzing...' : 'Choose Image'}
            </button>
          </div>
        </div>
      ) : (
        <div className="image-preview bg-black/30 border border-purple-500/50 rounded-lg p-2 sm:p-4">
          <div className="preview-header flex justify-between items-center mb-2 sm:mb-4">
            <h3 className="text-purple-300 font-semibold flex items-center text-xs sm:text-base">
              👁️ Ghost Vision
            </h3>
            <button
              onClick={handleClear}
              className="text-purple-400 hover:text-purple-200 text-xs sm:text-sm"
              title="Clear Image"
            >
              ✕
            </button>
          </div>
          <div className="image-container mb-2 sm:mb-4">
            <img
              src={previewUrl}
              alt="Uploaded for ghost analysis"
              className="max-w-full max-h-40 sm:max-h-64 rounded-lg mx-auto block"
            />
          </div>
          {isAnalyzing && (
            <div className="analyzing text-center py-2 sm:py-4">
              <div className="text-purple-300 text-xs sm:text-sm mb-1 sm:mb-2">
                The ghost peers through the ethereal veil...
              </div>
              <div className="loading-spinner inline-block animate-spin text-purple-400">⚡</div>
            </div>
          )}
          {currentAnalysis && !isAnalyzing && (
            <div className="analysis-results space-y-2 sm:space-y-3">
              <div className="ghost-reaction bg-purple-900/20 rounded-lg p-2 sm:p-3">
                <div className="text-purple-200 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Ghost's Reaction:</div>
                <div className="text-purple-100 text-xs sm:text-sm italic">
                  "{currentAnalysis.ghostReaction}"
                </div>
              </div>
              <div className="analysis-mood flex items-center space-x-2 sm:space-x-4">
                <div className="mood-info">
                  <span className="text-purple-300 text-xs">Detected Mood:</span>
                  <span className="text-purple-100 text-xs sm:text-sm ml-1 sm:ml-2 capitalize">
                    {currentAnalysis.mood}
                  </span>
                </div>
                <div className="atmosphere-info">
                  <span className="text-purple-300 text-xs">Atmosphere:</span>
                  <span className="text-purple-100 text-xs sm:text-sm ml-1 sm:ml-2">
                    {currentAnalysis.atmosphere}
                  </span>
                </div>
              </div>
              <div className="detected-elements">
                <div className="grid grid-cols-2 gap-1 sm:gap-3 text-xs">
                  {currentAnalysis.objects.length > 0 && (
                    <div>
                      <span className="text-purple-300">Objects:</span>
                      <div className="text-purple-200 mt-1">
                        {currentAnalysis.objects.join(', ')}
                      </div>
                    </div>
                  )}
                  {currentAnalysis.colors.length > 0 && (
                    <div>
                      <span className="text-purple-300">Colors:</span>
                      <div className="text-purple-200 mt-1">
                        {currentAnalysis.colors.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {currentAnalysis.suggestions.length > 0 && (
                <div className="conversation-suggestions">
                  <div className="text-purple-300 text-xs mb-1 sm:mb-2">The ghost suggests discussing:</div>
                  <div className="suggestions-list space-y-0.5 sm:space-y-1">
                    {currentAnalysis.suggestions.map((suggestion, index) => (
                      <div key={index} className="suggestion text-purple-200 text-xs">
                        • {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Enhanced Analysis Fields */}
              {currentAnalysis.visualThemes && currentAnalysis.visualThemes.length > 0 && (
                <div className="visual-themes">
                  <div className="text-purple-300 text-xs mb-1">Visual Themes:</div>
                  <div className="flex flex-wrap gap-1">
                    {currentAnalysis.visualThemes.map((theme, index) => (
                      <span key={index} className="bg-purple-700/30 text-purple-200 px-2 py-1 rounded text-xs">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {currentAnalysis.storyPotential && (
                <div className="story-potential bg-purple-900/10 rounded p-2">
                  <div className="text-purple-300 text-xs mb-1">Story Inspiration:</div>
                  <div className="text-purple-200 text-xs">
                    <div className="mb-1">Genre: {currentAnalysis.storyPotential.genre}</div>
                    <div className="mb-1">Mood: {currentAnalysis.storyPotential.mood}</div>
                    {currentAnalysis.storyPotential.plotSuggestions && currentAnalysis.storyPotential.plotSuggestions.length > 0 && (
                      <div>
                        <div className="text-purple-300 text-xs mb-1 mt-2">Plot Ideas:</div>
                        {currentAnalysis.storyPotential.plotSuggestions.map((suggestion, index) => (
                          <div key={index} className="text-purple-200 text-xs">• {suggestion}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {currentAnalysis.artisticAnalysis && (
                <div className="artistic-analysis bg-purple-900/10 rounded p-2">
                  <div className="text-purple-300 text-xs mb-1">Artistic Perception:</div>
                  <div className="text-purple-200 text-xs space-y-1">
                    <div>Style: {currentAnalysis.artisticAnalysis.style}</div>
                    <div>Composition: {currentAnalysis.artisticAnalysis.composition}</div>
                    <div>Lighting: {currentAnalysis.artisticAnalysis.lighting}</div>
                    {currentAnalysis.artisticAnalysis.symbolism && currentAnalysis.artisticAnalysis.symbolism.length > 0 && (
                      <div>
                        Symbolism: {currentAnalysis.artisticAnalysis.symbolism.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="emotional-context bg-purple-900/10 rounded p-1 sm:p-2">
                <div className="text-purple-300 text-xs mb-1">Emotional Context:</div>
                <div className="flex items-center space-x-1 sm:space-x-2 text-xs">
                  <span className="text-purple-200">
                    {currentAnalysis.emotionalContext.dominantEmotion}
                  </span>
                  <span className="text-purple-400">
                    ({currentAnalysis.emotionalContext.intensity})
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;