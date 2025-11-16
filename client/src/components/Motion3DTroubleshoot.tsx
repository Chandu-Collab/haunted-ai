import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Motion3DTroubleshootProps {
  appSettings: any;
}

const Motion3DTroubleshoot: React.FC<Motion3DTroubleshootProps> = ({ appSettings }) => {
  const [showDebug, setShowDebug] = useState(false);

  const checks = [
    {
      name: "Background Image Set",
      status: !!appSettings.roomWallpaper,
      value: appSettings.roomWallpaper ? "✓ Image uploaded" : "❌ No background image"
    },
    {
      name: "Image Source Type",
      status: !!appSettings.roomWallpaper,
      value: appSettings.roomWallpaper 
        ? appSettings.roomWallpaper.startsWith('data:') 
          ? "📊 Local data URL" 
          : appSettings.roomWallpaper.startsWith('blob:') 
            ? "🔗 Local blob URL" 
            : appSettings.roomWallpaper.startsWith('/')
              ? "📁 Server file"
              : "🌐 External URL"
        : "❌ No image"
    },
    {
      name: "3D Effects Enabled", 
      status: appSettings.motion3DSettings?.enabled,
      value: appSettings.motion3DSettings?.enabled ? "✓ Enabled" : "❌ Disabled"
    },
    {
      name: "Background Effects Enabled",
      status: appSettings.motion3DSettings?.applyToBackgrounds,
      value: appSettings.motion3DSettings?.applyToBackgrounds ? "✓ Enabled" : "❌ Disabled"
    },
    {
      name: "Effect Type",
      status: !!appSettings.motion3DSettings?.effect,
      value: appSettings.motion3DSettings?.effect || "None"
    },
    {
      name: "Intensity",
      status: (appSettings.motion3DSettings?.intensity || 0) > 0,
      value: `${appSettings.motion3DSettings?.intensity || 0}/10`
    },
    {
      name: "Auto-Play",
      status: appSettings.motion3DSettings?.autoPlay,
      value: appSettings.motion3DSettings?.autoPlay ? "✓ Enabled" : "❌ Disabled"
    }
  ];

  const allGood = checks.every(check => check.status);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-haunted-200 font-medium text-xs sm:text-sm">3D Background Troubleshoot</label>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className={`px-3 py-1 rounded text-xs transition-colors ${
            allGood ? 'bg-green-700 text-white' : 'bg-yellow-700 text-white'
          }`}
        >
          {allGood ? '✓ Working' : '⚠ Check Setup'}
        </button>
      </div>

      <AnimatePresence>
        {showDebug && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-haunted-800/30 rounded p-3 border border-haunted-700/30"
          >
            <div className="space-y-2">
              <h4 className="text-haunted-200 text-sm font-medium mb-2">Background 3D Effects Status:</h4>
              
              {checks.map((check, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className={`${check.status ? 'text-green-400' : 'text-red-400'}`}>
                    {check.name}:
                  </span>
                  <span className={`${check.status ? 'text-green-300' : 'text-red-300'}`}>
                    {check.value}
                  </span>
                </div>
              ))}

              {!allGood && (
                <div className="mt-3 p-2 bg-yellow-900/30 rounded border border-yellow-600/30">
                  <h5 className="text-yellow-400 text-xs font-medium mb-1">Quick Fix Steps:</h5>
                  <ul className="text-yellow-300 text-xs space-y-1">
                    {!appSettings.roomWallpaper && (
                      <li>• Upload a background image in the "Room Background" section above</li>
                    )}
                    {appSettings.roomWallpaper && (appSettings.roomWallpaper.startsWith('blob:') || appSettings.roomWallpaper.startsWith('data:')) && (
                      <li>• Local image detected - check browser console for loading errors</li>
                    )}
                    {!appSettings.motion3DSettings?.enabled && (
                      <li>• Enable "3D Motion Effects" toggle</li>
                    )}
                    {!appSettings.motion3DSettings?.applyToBackgrounds && (
                      <li>• Enable "Background Images" in the "Apply Effects To" section</li>
                    )}
                    {(appSettings.motion3DSettings?.intensity || 0) === 0 && (
                      <li>• Increase the "Intensity" slider above 0</li>
                    )}
                  </ul>
                </div>
              )}

              {allGood && appSettings.roomWallpaper && (appSettings.roomWallpaper.startsWith('blob:') || appSettings.roomWallpaper.startsWith('data:')) && (
                <div className="mt-3 p-2 bg-blue-900/30 rounded border border-blue-600/30">
                  <p className="text-blue-400 text-xs">
                    ℹ️ Local image detected. If effects aren't working, try refreshing the page or re-uploading the image.
                    Check the browser console (F12) for any loading errors.
                  </p>
                </div>
              )}

              {allGood && (
                <div className="mt-3 p-2 bg-green-900/30 rounded border border-green-600/30">
                  <p className="text-green-400 text-xs">
                    ✓ Everything looks good! Your background should have 3D motion effects.
                    Try hovering over the background or wait for auto-animations.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Motion3DTroubleshoot;