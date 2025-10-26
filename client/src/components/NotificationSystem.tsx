import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ notifications, onRemove }) => {
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.duration !== 0) { // 0 means persistent
        const timer = setTimeout(() => {
          onRemove(notification.id);
        }, notification.duration || 3000);
        
        return () => clearTimeout(timer);
      }
    });
  }, [notifications, onRemove]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'info': return '👻';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '👻';
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500/50 bg-green-900/20 text-green-100';
      case 'info': return 'border-haunted-500/50 bg-haunted-900/20 text-haunted-100';
      case 'warning': return 'border-yellow-500/50 bg-yellow-900/20 text-yellow-100';
      case 'error': return 'border-red-500/50 bg-red-900/20 text-red-100';
      default: return 'border-haunted-500/50 bg-haunted-900/20 text-haunted-100';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`
              border rounded-lg p-4 backdrop-blur-sm shadow-lg cursor-pointer
              ${getColors(notification.type)}
            `}
            onClick={() => onRemove(notification.id)}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">
                {getIcon(notification.type)}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">
                  {notification.title}
                </h4>
                {notification.message && (
                  <p className="text-xs opacity-90 mt-1">
                    {notification.message}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(notification.id);
                }}
                className="text-xs opacity-60 hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationSystem;