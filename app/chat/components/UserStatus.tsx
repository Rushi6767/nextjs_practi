'use client';

import { useState, useEffect } from 'react';
import { Circle, Clock, Moon, XCircle } from 'lucide-react';

interface UserStatusProps {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function UserStatus({ 
  userId, 
  status, 
  lastSeen, 
  showLabel = false,
  size = 'md'
}: UserStatusProps) {
  const [isTyping, setIsTyping] = useState(false);

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400'
  };

  const statusLabels = {
    online: 'Online',
    away: 'Away',
    busy: 'Busy',
    offline: 'Offline'
  };

  const statusIcons = {
    online: Circle,
    away: Clock,
    busy: Moon,
    offline: XCircle
  };

  const Icon = statusIcons[status];
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`${sizeClasses[size]} ${statusColors[status]} rounded-full`} />
        {isTyping && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        )}
      </div>
      {showLabel && (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {statusLabels[status]}
          {status === 'offline' && lastSeen && (
            <span className="text-xs text-gray-400 ml-1">
              (Last seen {lastSeen})
            </span>
          )}
        </span>
      )}
    </div>
  );
}