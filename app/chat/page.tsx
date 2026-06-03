'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, MessageCircle, Users, UserPlus, 
  Settings, MoreVertical, Phone, Video,
  Clock, CheckCheck, Bell, Star,
  Pin, Archive, Trash2, User, Crown,
  Shield, Camera, Smile, Paperclip, Send,
  Mic, Image, File, MapPin, Gift
} from 'lucide-react';

// Types
interface ChatUser {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: string;
  isTyping: boolean;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isBlocked: boolean;
  isFavorite: boolean;
  lastMessage?: Message;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'location';
  timestamp: string;
  readAt?: string;
  deliveredAt?: string;
  isEdited: boolean;
  isDeleted: boolean;
  replyTo?: string;
  attachments?: Attachment[];
  reactions?: Reaction[];
}

interface Attachment {
  id: string;
  type: 'image' | 'file' | 'audio' | 'video';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

interface Reaction {
  emoji: string;
  userId: string;
  timestamp: string;
}

interface ChatRoom {
  id: string;
  name?: string;
  avatar?: string;
  type: 'direct' | 'group' | 'channel';
  participants: ChatUser[];
  messages: Message[];
  lastActivity: string;
  createdBy: string;
  createdAt: string;
  isGroup: boolean;
  groupAdmins?: string[];
  groupSettings?: {
    allowInvites: boolean;
    allowMedia: boolean;
    allowVoiceMessages: boolean;
  };
}

// Mock Data
const mockUsers: ChatUser[] = [
  {
    id: 'user1',
    username: 'alice',
    fullName: 'Alice Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    status: 'online',
    lastSeen: '2024-01-15T14:30:00Z',
    isTyping: false,
    unreadCount: 3,
    isPinned: true,
    isMuted: false,
    isBlocked: false,
    isFavorite: true,
    lastMessage: {
      id: 'msg1',
      senderId: 'user1',
      receiverId: 'currentUser',
      content: 'Hey! How are you doing?',
      type: 'text',
      timestamp: '2024-01-15T14:25:00Z',
      isEdited: false,
      isDeleted: false
    }
  },
  {
    id: 'user2',
    username: 'bob',
    fullName: 'Bob Smith',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    status: 'away',
    lastSeen: '2024-01-15T13:45:00Z',
    isTyping: false,
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    isBlocked: false,
    isFavorite: false
  },
  // Add more mock users...
];

const mockMessages: Message[] = [
  {
    id: 'm1',
    senderId: 'user1',
    receiverId: 'currentUser',
    content: 'Hello! Welcome to the chat! 👋',
    type: 'text',
    timestamp: '2024-01-15T14:00:00Z',
    isEdited: false,
    isDeleted: false,
    reactions: [
      { emoji: '👋', userId: 'user2', timestamp: '2024-01-15T14:01:00Z' }
    ]
  },
  // Add more messages...
];

export default function ChatPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'favorites'>('all');

  // WebSocket connection would be here
  // const { sendMessage, isConnected, messages: wsMessages } = useWebSocket();

  const filteredChats = mockUsers.filter(user => 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachment) return;

    const message: Message = {
      id: `msg_${Date.now()}`,
      senderId: 'currentUser',
      receiverId: selectedChat?.id || '',
      content: newMessage.trim(),
      type: attachment ? 'file' : 'text',
      timestamp: new Date().toISOString(),
      isEdited: false,
      isDeleted: false,
      attachments: attachment ? [{
        id: `att_${Date.now()}`,
        type: 'file',
        url: URL.createObjectURL(attachment),
        name: attachment.name,
        size: attachment.size,
        mimeType: attachment.type
      }] : undefined
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setAttachment(null);
    // WebSocket send would go here
  };

  const handleTyping = () => {
    // WebSocket typing indicator would go here
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex h-screen max-w-7xl mx-auto">
        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-blue-500" />
                Messages
              </h1>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <UserPlus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mt-3">
              {['all', 'unread', 'favorites'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter as any)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    activeFilter === filter
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredChats.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedChat(user)}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                  selectedChat?.id === user.id ? 'bg-blue-50 dark:bg-gray-700' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${
                      user.status === 'online' ? 'bg-green-500' :
                      user.status === 'away' ? 'bg-yellow-500' :
                      user.status === 'busy' ? 'bg-red-500' :
                      'bg-gray-400'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {user.fullName}
                        {user.isFavorite && (
                          <Star className="w-3.5 h-3.5 text-yellow-400 inline ml-1" fill="currentColor" />
                        )}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {user.lastMessage && formatTime(user.lastMessage.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex-1">
                        {user.lastMessage?.content || 'No messages yet'}
                      </p>
                      {user.unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                          {user.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Online Status */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={mockUsers[0].avatar}
                  alt="Current User"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 bg-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Your Profile</p>
                <p className="text-xs text-green-500">Online</p>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedChat.avatar}
                    alt={selectedChat.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selectedChat.fullName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedChat.status === 'online' ? 'Online' : 
                       selectedChat.status === 'away' ? 'Away' :
                       selectedChat.status === 'busy' ? 'Busy' : 'Offline'}
                      {selectedChat.isTyping && (
                        <span className="text-blue-500 ml-2">typing...</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <Phone className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <Video className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((message, index) => {
                  const isOwn = message.senderId === 'currentUser';
                  const showAvatar = index === 0 || messages[index - 1]?.senderId !== message.senderId;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                        {!isOwn && showAvatar && (
                          <img
                            src={mockUsers.find(u => u.id === message.senderId)?.avatar}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full object-cover mt-1"
                          />
                        )}
                        <div className={`${
                          isOwn 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                        } rounded-2xl px-4 py-2 shadow-sm`}>
                          {message.type === 'text' && (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          )}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2">
                              {message.attachments.map(att => (
                                <div key={att.id} className="flex items-center gap-2 p-2 bg-black/5 rounded">
                                  <File className="w-4 h-4" />
                                  <span className="text-sm truncate">{att.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {message.reactions.map((reaction, i) => (
                                <span key={i} className="text-sm">{reaction.emoji}</span>
                              ))}
                            </div>
                          )}
                          <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                            {formatTime(message.timestamp)}
                            {isOwn && message.readAt && (
                              <span className="ml-1">✓✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-end gap-2">
                  <div className="flex-1 flex items-end gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                      <Smile className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={() => document.getElementById('fileInput')?.click()}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                      <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <input
                      id="fileInput"
                      type="file"
                      className="hidden"
                      onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                    />
                    <textarea
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent outline-none resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-[40px] max-h-[120px]"
                      rows={1}
                    />
                    <button
                      onClick={() => setIsRecording(!isRecording)}
                      className={`p-1 rounded transition-colors ${
                        isRecording ? 'text-red-500 bg-red-100 dark:bg-red-900/20' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Mic className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && !attachment}
                    className="p-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <MessageCircle className="w-20 h-20 mb-4 opacity-20" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Select a conversation
              </h2>
              <p className="text-center max-w-sm">
                Choose a chat from the sidebar or start a new conversation with someone
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}