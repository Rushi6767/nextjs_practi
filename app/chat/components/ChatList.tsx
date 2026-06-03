'use client';

import { useState } from 'react';
import { Search, Filter, Pin, Star, MoreVertical } from 'lucide-react';

interface ChatListProps {
  chats: any[];
  onSelect: (chat: any) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function ChatList({ chats, onSelect, searchTerm, onSearchChange }: ChatListProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'pinned'>('all');

  const filteredChats = chats.filter(chat => {
    if (filter === 'unread') return chat.unreadCount > 0;
    if (filter === 'pinned') return chat.isPinned;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              filter === 'unread' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('pinned')}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              filter === 'pinned' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            Pinned
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onSelect(chat)}
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <img
                  src={chat.avatar}
                  alt={chat.fullName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${
                  chat.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {chat.fullName}
                    {chat.isPinned && (
                      <Pin className="w-3.5 h-3.5 text-blue-500 inline ml-1" />
                    )}
                    {chat.isFavorite && (
                      <Star className="w-3.5 h-3.5 text-yellow-400 inline ml-1" fill="currentColor" />
                    )}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {chat.lastMessage?.timestamp}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {chat.lastMessage?.content}
                </p>
                {chat.unreadCount > 0 && (
                  <div className="mt-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full inline-block">
                    {chat.unreadCount}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}