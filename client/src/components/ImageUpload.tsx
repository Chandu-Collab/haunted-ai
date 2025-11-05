import React, { useRef, useState } from 'react';
import { useImageAnalysis, ImageAnalysis } from '../hooks/useImageAnalysis';

interface ImageUploadProps {
  onImageAnalyzed?: (analysis: ImageAnalysis) => void;
  personalityId?: string;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImageAnalyzed, 
  personalityId, 
  className = '' 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const { currentAnalysis, isAnalyzing, analyzeImage, clearAnalysis } = useImageAnalysis();

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

    // Analyze the image
    const analysis = await analyzeImage(file, personalityId);
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