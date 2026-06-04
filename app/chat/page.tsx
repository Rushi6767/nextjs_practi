// app/chat/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo, useRef, KeyboardEvent, ChangeEvent } from 'react';
import {
  Search, MessageCircle, Users, UserPlus, Settings, MoreVertical,
  Phone, Video, Clock, CheckCheck, Bell, Star, Pin, Archive, Trash2,
  User, Shield, Camera, Smile, Paperclip, Send, Mic, Image, File,
  MapPin, Gift, Edit, Reply, Forward, Copy, Flag, Heart, ThumbsUp,
  Laugh, Sad, Angry, X, Check, ChevronLeft, ChevronRight, Plus,
  Minus, Menu, Moon, Sun, LogOut, AlertCircle, Volume2, VolumeX,
  Eye, EyeOff, Download, Share2, Link, AtSign, Hash, Crown, Award
} from 'lucide-react';

// ============================================
// 📋 TYPE DEFINITIONS
// ============================================

interface ChatUser {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: string;
  isTyping: boolean;
  isBlocked: boolean;
  isFavorite: boolean;
  isMuted: boolean;
  typingTimeout?: NodeJS.Timeout;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  reactions: { emoji: string; userId: string }[];
  replyTo?: string;
  isPinned: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  readBy: string[];
  deliveredTo: string[];
  createdAt: string;
  updatedAt: string;
}

interface Chat {
  id: string;
  name: string;
  avatar?: string;
  type: 'private' | 'group';
  participants: string[];
  adminIds: string[];
  moderatorIds: string[];
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  isPinned: boolean;
  isMuted: boolean;
  createdAt: string;
  updatedAt: string;
  groupSettings?: {
    allowInvites: boolean;
    allowMedia: boolean;
    allowVoiceMessages: boolean;
    onlyAdminsCanSend: boolean;
  };
}

interface Notification {
  id: string;
  userId: string;
  chatId: string;
  messageId: string;
  type: 'message' | 'mention' | 'reaction' | 'reply';
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface TypingStatus {
  userId: string;
  chatId: string;
  isTyping: boolean;
}

// ============================================
// 🔧 UTILITY FUNCTIONS
// ============================================

const generateId = () => `_${Math.random().toString(36).substr(2, 9)}`;
const getCurrentTimestamp = () => new Date().toISOString();
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatMessageTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'away': return 'bg-yellow-500';
    case 'busy': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'online': return 'Online';
    case 'away': return 'Away';
    case 'busy': return 'Busy';
    default: return 'Offline';
  }
};

const truncateText = (text: string, maxLength: number = 30) => {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ============================================
// 🎨 EMOJI DATA
// ============================================

const EMOJI_CATEGORIES = {
  smileys: ['😊', '😄', '😅', '😂', '🤣', '😍', '🥰', '😘', '😗', '😙', '😚', '🥲', '😀', '😁', '😆', '😃', '😉', '😋', '😎', '🥳', '🤩', '😇', '🙃', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '💀', '☠️', '👻', '👽', '👾', '🤖', '💩', '😺', '😸', '😻', '😽', '🙀', '😿', '😹'],
  gestures: ['👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '🙇', '💁', '🙋', '🙆', '🙅', '🤷', '🤦', '🙎', '🙍', '💆', '💇', '🦰', '🦱', '🦳', '🦲'],
  objects: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '💨', '💦', '🎵', '🎶', '🔇', '🔈', '🔉', '🔊', '📢', '📣', '📯', '🔔', '🔕', '🎼', '🎧', '🎤', '🎶', '🎵'],
  food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🫒', '🥦', '🥬', '🥒', '🌶', '🫑', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🫖', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾'],
  activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🎻', '🪕', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰']
};

// ============================================
// 📦 MOCK DATA
// ============================================

const MOCK_USERS: ChatUser[] = [
  {
    id: 'current_user',
    username: 'john_doe',
    fullName: 'John Doe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    status: 'online',
    lastSeen: new Date().toISOString(),
    isTyping: false,
    isBlocked: false,
    isFavorite: true,
    isMuted: false
  },
  {
    id: 'alice_wonder',
    username: 'alice_w',
    fullName: 'Alice Wonder',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    status: 'online',
    lastSeen: new Date().toISOString(),
    isTyping: false,
    isBlocked: false,
    isFavorite: true,
    isMuted: false
  },
  {
    id: 'bob_marley',
    username: 'bob_m',
    fullName: 'Bob Marley',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    status: 'away',
    lastSeen: new Date(Date.now() - 3600000).toISOString(),
    isTyping: false,
    isBlocked: false,
    isFavorite: false,
    isMuted: false
  },
  {
    id: 'charlie_brown',
    username: 'charlie_b',
    fullName: 'Charlie Brown',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
    status: 'offline',
    lastSeen: new Date(Date.now() - 86400000).toISOString(),
    isTyping: false,
    isBlocked: false,
    isFavorite: false,
    isMuted: false
  },
  {
    id: 'diana_prince',
    username: 'diana_p',
    fullName: 'Diana Prince',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana',
    status: 'busy',
    lastSeen: new Date(Date.now() - 1800000).toISOString(),
    isTyping: false,
    isBlocked: false,
    isFavorite: false,
    isMuted: true
  },
  {
    id: 'elon_musk',
    username: 'elon_m',
    fullName: 'Elon Musk',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elon',
    status: 'online',
    lastSeen: new Date().toISOString(),
    isTyping: false,
    isBlocked: false,
    isFavorite: false,
    isMuted: false
  }
];

const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    chatId: 'chat_1',
    senderId: 'alice_wonder',
    receiverId: 'current_user',
    content: 'Hey! How are you doing today? 😊',
    type: 'text',
    reactions: [
      { emoji: '❤️', userId: 'current_user' },
      { emoji: '👍', userId: 'bob_marley' }
    ],
    replyTo: undefined,
    isPinned: false,
    isEdited: false,
    isDeleted: false,
    readBy: ['current_user', 'bob_marley'],
    deliveredTo: ['current_user', 'bob_marley', 'charlie_brown'],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'msg_2',
    chatId: 'chat_1',
    senderId: 'current_user',
    receiverId: 'alice_wonder',
    content: "I'm doing great! Thanks for asking. How about you?",
    type: 'text',
    reactions: [],
    replyTo: undefined,
    isPinned: false,
    isEdited: false,
    isDeleted: false,
    readBy: ['alice_wonder'],
    deliveredTo: ['alice_wonder'],
    createdAt: new Date(Date.now() - 3500000).toISOString(),
    updatedAt: new Date(Date.now() - 3500000).toISOString()
  },
  {
    id: 'msg_3',
    chatId: 'chat_1',
    senderId: 'alice_wonder',
    receiverId: 'current_user',
    content: 'I am wonderful! Just working on some new projects. 💪',
    type: 'text',
    reactions: [{ emoji: '🔥', userId: 'current_user' }],
    replyTo: undefined,
    isPinned: true,
    isEdited: false,
    isDeleted: false,
    readBy: ['current_user'],
    deliveredTo: ['current_user'],
    createdAt: new Date(Date.now() - 3400000).toISOString(),
    updatedAt: new Date(Date.now() - 3400000).toISOString()
  },
  {
    id: 'msg_4',
    chatId: 'chat_2',
    senderId: 'bob_marley',
    receiverId: 'current_user',
    content: "Check out this amazing music I found! 🎵",
    type: 'text',
    reactions: [{ emoji: '🎶', userId: 'current_user' }],
    replyTo: undefined,
    isPinned: false,
    isEdited: false,
    isDeleted: false,
    readBy: ['current_user'],
    deliveredTo: ['current_user'],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'msg_5',
    chatId: 'chat_2',
    senderId: 'current_user',
    receiverId: 'bob_marley',
    content: 'Sounds great! Send me the link!',
    type: 'text',
    reactions: [],
    replyTo: 'msg_4',
    isPinned: false,
    isEdited: false,
    isDeleted: false,
    readBy: ['bob_marley'],
    deliveredTo: ['bob_marley'],
    createdAt: new Date(Date.now() - 7100000).toISOString(),
    updatedAt: new Date(Date.now() - 7100000).toISOString()
  },
  {
    id: 'msg_6',
    chatId: 'chat_3',
    senderId: 'charlie_brown',
    receiverId: 'current_user',
    content: 'Hey, are we still meeting for lunch tomorrow?',
    type: 'text',
    reactions: [],
    replyTo: undefined,
    isPinned: false,
    isEdited: false,
    isDeleted: false,
    readBy: [],
    deliveredTo: ['current_user'],
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'msg_7',
    chatId: 'chat_4',
    senderId: 'diana_prince',
    receiverId: 'current_user',
    content: 'Happy Birthday! 🎉🎂🎁',
    type: 'text',
    reactions: [{ emoji: '🎉', userId: 'current_user' }, { emoji: '🎂', userId: 'bob_marley' }],
    replyTo: undefined,
    isPinned: true,
    isEdited: false,
    isDeleted: false,
    readBy: ['current_user'],
    deliveredTo: ['current_user'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'msg_8',
    chatId: 'chat_4',
    senderId: 'current_user',
    receiverId: 'diana_prince',
    content: 'Thank you so much Diana! 🥰',
    type: 'text',
    reactions: [{ emoji: '💖', userId: 'diana_prince' }],
    replyTo: 'msg_7',
    isPinned: false,
    isEdited: false,
    isDeleted: false,
    readBy: ['diana_prince'],
    deliveredTo: ['diana_prince'],
    createdAt: new Date(Date.now() - 86000000).toISOString(),
    updatedAt: new Date(Date.now() - 86000000).toISOString()
  },
  {
    id: 'msg_9',
    chatId: 'chat_5',
    senderId: 'elon_musk',
    receiverId: 'current_user',
    content: 'We need to talk about the Mars colony project 🚀',
    type: 'text',
    reactions: [],
    replyTo: undefined,
    isPinned: false,
    isEdited: false,
    isDeleted: false,
    readBy: ['current_user'],
    deliveredTo: ['current_user'],
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    updatedAt: new Date(Date.now() - 5400000).toISOString()
  },
  {
    id: 'msg_10',
    chatId: 'chat_5',
    senderId: 'current_user',
    receiverId: 'elon_musk',
    content: 'I\'m ready! When do we launch? 🌎➡️🔴',
    type: 'text',
    reactions: [{ emoji: '🚀', userId: 'elon_musk' }],
    replyTo: 'msg_9',
    isPinned: true,
    isEdited: false,
    isDeleted: false,
    readBy: ['elon_musk'],
    deliveredTo: ['elon_musk'],
    createdAt: new Date(Date.now() - 5300000).toISOString(),
    updatedAt: new Date(Date.now() - 5300000).toISOString()
  }
];

const MOCK_CHATS: Chat[] = [
  {
    id: 'chat_1',
    name: 'Alice Wonder',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    type: 'private',
    participants: ['current_user', 'alice_wonder'],
    adminIds: ['current_user'],
    moderatorIds: [],
    lastMessage: MOCK_MESSAGES[2],
    unreadCount: 0,
    isArchived: false,
    isPinned: true,
    isMuted: false,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'chat_2',
    name: 'Bob Marley',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    type: 'private',
    participants: ['current_user', 'bob_marley'],
    adminIds: ['current_user'],
    moderatorIds: [],
    lastMessage: MOCK_MESSAGES[4],
    unreadCount: 1,
    isArchived: false,
    isPinned: false,
    isMuted: false,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'chat_3',
    name: 'Charlie Brown',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
    type: 'private',
    participants: ['current_user', 'charlie_brown'],
    adminIds: ['current_user'],
    moderatorIds: [],
    lastMessage: MOCK_MESSAGES[5],
    unreadCount: 1,
    isArchived: false,
    isPinned: false,
    isMuted: false,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'chat_4',
    name: 'Diana Prince',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana',
    type: 'private',
    participants: ['current_user', 'diana_prince'],
    adminIds: ['current_user'],
    moderatorIds: [],
    lastMessage: MOCK_MESSAGES[7],
    unreadCount: 0,
    isArchived: false,
    isPinned: false,
    isMuted: true,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'chat_5',
    name: 'Elon Musk',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elon',
    type: 'private',
    participants: ['current_user', 'elon_musk'],
    adminIds: ['current_user'],
    moderatorIds: [],
    lastMessage: MOCK_MESSAGES[9],
    unreadCount: 0,
    isArchived: false,
    isPinned: false,
    isMuted: false,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'chat_6',
    name: 'Team Awesome',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=team',
    type: 'group',
    participants: ['current_user', 'alice_wonder', 'bob_marley', 'charlie_brown'],
    adminIds: ['current_user'],
    moderatorIds: ['alice_wonder'],
    lastMessage: undefined,
    unreadCount: 3,
    isArchived: false,
    isPinned: false,
    isMuted: false,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
    groupSettings: {
      allowInvites: true,
      allowMedia: true,
      allowVoiceMessages: true,
      onlyAdminsCanSend: false
    }
  }
];

// ============================================
// 🎵 SOUND NOTIFICATIONS (Web Audio API)
// ============================================

class SoundManager {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  toggle() {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  playNewMessage() {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.2);
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }

  playTyping() {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = 600;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.05);
    } catch (error) {
      console.error('Failed to play typing sound:', error);
    }
  }
}

// ============================================
// 🎯 MAIN COMPONENT
// ============================================

export default function ChatPage() {
  // State
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [searchMessages, setSearchMessages] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{[key: string]: boolean}>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const soundManager = useRef<SoundManager>(new SoundManager());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // 📦 LOCAL STORAGE OPERATIONS
  // ============================================

  const loadData = useCallback(() => {
    try {
      // Load users
      const storedUsers = localStorage.getItem('chat_users');
      const userData = storedUsers ? JSON.parse(storedUsers) : MOCK_USERS;
      setUsers(userData);

      // Load current user from auth
      const authUser = localStorage.getItem('auth_user');
      if (authUser) {
        const parsedAuth = JSON.parse(authUser);
        const currentChatUser = userData.find((u: ChatUser) => u.username === parsedAuth.username) || userData[0];
        setCurrentUser(currentChatUser);
      } else {
        setCurrentUser(userData[0]);
      }

      // Load chats
      const storedChats = localStorage.getItem('chat_chats');
      const chatData = storedChats ? JSON.parse(storedChats) : MOCK_CHATS;
      setChats(chatData);

      // Load messages
      const storedMessages = localStorage.getItem('chat_messages');
      const messageData = storedMessages ? JSON.parse(storedMessages) : MOCK_MESSAGES;
      setMessages(messageData);

      // Load notifications
      const storedNotifications = localStorage.getItem('chat_notifications');
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      }

      // Load settings
      const darkMode = localStorage.getItem('chat_dark_mode') === 'true';
      setIsDarkMode(darkMode);
      const sound = localStorage.getItem('chat_sound_enabled') !== 'false';
      setSoundEnabled(sound);

    } catch (error) {
      console.error('Failed to load chat data:', error);
      setUsers(MOCK_USERS);
      setChats(MOCK_CHATS);
      setMessages(MOCK_MESSAGES);
    }
  }, []);

  const saveData = useCallback(() => {
    try {
      localStorage.setItem('chat_users', JSON.stringify(users));
      localStorage.setItem('chat_chats', JSON.stringify(chats));
      localStorage.setItem('chat_messages', JSON.stringify(messages));
      localStorage.setItem('chat_notifications', JSON.stringify(notifications));
      localStorage.setItem('chat_dark_mode', String(isDarkMode));
      localStorage.setItem('chat_sound_enabled', String(soundEnabled));
    } catch (error) {
      console.error('Failed to save chat data:', error);
    }
  }, [users, chats, messages, notifications, isDarkMode, soundEnabled]);

  // ============================================
  // 🔄 SAVE DATA ON CHANGE
  // ============================================

  useEffect(() => {
    saveData();
  }, [users, chats, messages, notifications, isDarkMode, soundEnabled, saveData]);

  // ============================================
  // 📊 INITIALIZE DATA
  // ============================================

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================
  // 📱 RESPONSIVE HANDLING
  // ============================================

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (mobile) {
        setShowChatList(!selectedChat);
      } else {
        setShowChatList(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedChat]);

  // ============================================
  // 💬 MESSAGE OPERATIONS
  // ============================================

  const getChatMessages = useCallback((chatId: string) => {
    return messages
      .filter(msg => msg.chatId === chatId && !msg.isDeleted)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages]);

  const sendMessage = useCallback((content: string, type: 'text' | 'image' | 'file' | 'voice' = 'text') => {
    if (!selectedChat || !currentUser) return;

    const newMsg: Message = {
      id: generateId(),
      chatId: selectedChat.id,
      senderId: currentUser.id,
      receiverId: selectedChat.type === 'private' ? selectedChat.participants.find(id => id !== currentUser.id) || '' : '',
      content,
      type,
      reactions: [],
      replyTo: replyingTo?.id,
      isPinned: false,
      isEdited: false,
      isDeleted: false,
      readBy: [currentUser.id],
      deliveredTo: [currentUser.id],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    setMessages(prev => [...prev, newMsg]);

    // Update chat last message
    setChats(prev => prev.map(chat => {
      if (chat.id === selectedChat.id) {
        return {
          ...chat,
          lastMessage: newMsg,
          updatedAt: getCurrentTimestamp()
        };
      }
      return chat;
    }));

    // Send notification to other participants
    const otherParticipants = selectedChat.participants.filter(id => id !== currentUser.id);
    otherParticipants.forEach(userId => {
      const newNotification: Notification = {
        id: generateId(),
        userId,
        chatId: selectedChat.id,
        messageId: newMsg.id,
        type: 'message',
        content: `${currentUser.fullName}: ${content}`,
        isRead: false,
        createdAt: getCurrentTimestamp()
      };
      setNotifications(prev => [...prev, newNotification]);
    });

    // Clear reply
    setReplyingTo(null);
    setNewMessage('');
    setShowEmojiPicker(false);

    // Play sound
    if (soundEnabled) {
      soundManager.current.playNewMessage();
    }

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [selectedChat, currentUser, replyingTo, soundEnabled]);

  const editMessage = useCallback((messageId: string, newContent: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          content: newContent,
          isEdited: true,
          updatedAt: getCurrentTimestamp()
        };
      }
      return msg;
    }));
    setEditingMessage(null);
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          isDeleted: true,
          content: 'This message was deleted',
          updatedAt: getCurrentTimestamp()
        };
      }
      return msg;
    }));
  }, []);

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    if (!currentUser) return;

    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions.find(r => r.userId === currentUser.id && r.emoji === emoji);
        const reactions = existingReaction
          ? msg.reactions.filter(r => !(r.userId === currentUser.id && r.emoji === emoji))
          : [...msg.reactions, { emoji, userId: currentUser.id }];
        return { ...msg, reactions };
      }
      return msg;
    }));
    setShowReactions(null);
  }, [currentUser]);

  const togglePinMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, isPinned: !msg.isPinned };
      }
      return msg;
    }));
  }, []);

  const markAsRead = useCallback((chatId: string) => {
    if (!currentUser) return;

    setMessages(prev => prev.map(msg => {
      if (msg.chatId === chatId && !msg.readBy.includes(currentUser.id)) {
        return { ...msg, readBy: [...msg.readBy, currentUser.id] };
      }
      return msg;
    }));

    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, unreadCount: 0 };
      }
      return chat;
    }));
  }, [currentUser]);

  // ============================================
  // ⌨️ TYPING INDICATOR
  // ============================================

  const handleTyping = useCallback((isTyping: boolean) => {
    if (!selectedChat || !currentUser) return;

    setIsTyping(isTyping);

    // Broadcast typing status to other participants
    const otherParticipants = selectedChat.participants.filter(id => id !== currentUser.id);
    otherParticipants.forEach(userId => {
      setTypingUsers(prev => ({
        ...prev,
        [userId]: isTyping
      }));
    });

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        otherParticipants.forEach(userId => {
          setTypingUsers(prev => ({
            ...prev,
            [userId]: false
          }));
        });
      }, 3000);
    }
  }, [selectedChat, currentUser]);

  // ============================================
  // 📋 CHAT OPERATIONS
  // ============================================

  const selectChat = useCallback((chat: Chat) => {
    setSelectedChat(chat);
    markAsRead(chat.id);
    if (isMobileView) {
      setShowChatList(false);
    }
  }, [markAsRead, isMobileView]);

  const createGroupChat = useCallback((name: string, participantIds: string[]) => {
    if (!currentUser) return;

    const newChat: Chat = {
      id: generateId(),
      name,
      type: 'group',
      participants: [currentUser.id, ...participantIds],
      adminIds: [currentUser.id],
      moderatorIds: [],
      unreadCount: 0,
      isArchived: false,
      isPinned: false,
      isMuted: false,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      groupSettings: {
        allowInvites: true,
        allowMedia: true,
        allowVoiceMessages: true,
        onlyAdminsCanSend: false
      }
    };

    setChats(prev => [...prev, newChat]);
    selectChat(newChat);
  }, [currentUser, selectChat]);

  const archiveChat = useCallback((chatId: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, isArchived: !chat.isArchived };
      }
      return chat;
    }));
  }, []);

  const togglePinChat = useCallback((chatId: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, isPinned: !chat.isPinned };
      }
      return chat;
    }));
  }, []);

  const toggleMuteChat = useCallback((chatId: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, isMuted: !chat.isMuted };
      }
      return chat;
    }));
  }, []);

  // ============================================
  // 🔍 SEARCH AND FILTER
  // ============================================

  const filteredChats = useMemo(() => {
    let filtered = chats.filter(chat => !chat.isArchived || showArchived);

    if (searchTerm) {
      filtered = filtered.filter(chat => {
        if (chat.type === 'private') {
          const otherUser = users.find(u => chat.participants.includes(u.id) && u.id !== currentUser?.id);
          return otherUser?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 otherUser?.username.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return chat.name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Sort: pinned first, then by last message time
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [chats, searchTerm, showArchived, users, currentUser]);

  const filteredMessages = useMemo(() => {
    if (!selectedChat) return [];
    let msgs = getChatMessages(selectedChat.id);
    
    if (searchMessages) {
      msgs = msgs.filter(msg => 
        msg.content.toLowerCase().includes(searchMessages.toLowerCase())
      );
    }

    // Pinned messages at top
    return msgs.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [selectedChat, messages, searchMessages, getChatMessages]);

  // ============================================
  // 🎨 RENDER HELPERS
  // ============================================

  const renderAvatar = (userId: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const user = users.find(u => u.id === userId);
    if (!user) return null;

    const sizes = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12'
    };

    const statusSizes = {
      sm: 'w-2.5 h-2.5',
      md: 'w-3 h-3',
      lg: 'w-3.5 h-3.5'
    };

    return (
      <div className="relative flex-shrink-0">
        <img
          src={user.avatar}
          alt={user.fullName}
          className={`${sizes[size]} rounded-full object-cover border-2 border-white dark:border-gray-800`}
        />
        <div className={`absolute bottom-0 right-0 ${statusSizes[size]} rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(user.status)}`} />
        {typingUsers[userId] && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        )}
      </div>
    );
  };

  const renderMessageBubble = (message: Message) => {
    const isOwn = message.senderId === currentUser?.id;
    const sender = users.find(u => u.id === message.senderId);
    const repliedTo = message.replyTo ? messages.find(m => m.id === message.replyTo) : null;

    return (
      <div
        key={message.id}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 group`}
      >
        <div className={`flex items-start gap-2 max-w-[85%] md:max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
          {!isOwn && renderAvatar(message.senderId, 'sm')}
          
          <div className="relative">
            {repliedTo && (
              <div className={`mb-1 px-3 py-1.5 rounded-lg text-sm border-l-4 ${isOwn ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400' : 'bg-gray-100 dark:bg-gray-700 border-gray-400'} text-gray-600 dark:text-gray-300`}>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                  <Reply className="w-3 h-3" />
                  <span>Replying to {users.find(u => u.id === repliedTo.senderId)?.fullName}</span>
                </div>
                <p className="text-sm line-clamp-1">{repliedTo.content}</p>
              </div>
            )}
            
            <div className={`
              rounded-2xl px-4 py-2.5 shadow-sm transition-all
              ${isOwn 
                ? 'bg-blue-500 text-white' 
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              }
            `}>
              {!isOwn && (
                <p className="text-xs font-semibold mb-1 text-blue-500 dark:text-blue-400">
                  {sender?.fullName}
                </p>
              )}
              
              {message.type === 'text' && (
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              )}
              
              {message.type === 'image' && message.fileUrl && (
                <div className="mt-1">
                  <img
                    src={message.fileUrl}
                    alt="Image"
                    className="max-w-full max-h-60 rounded-lg object-cover"
                    loading="lazy"
                  />
                  {message.content && <p className="text-sm mt-1">{message.content}</p>}
                </div>
              )}
              
              {message.type === 'file' && message.fileUrl && (
                <div className="mt-1 bg-black/5 dark:bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <File className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{message.fileName}</p>
                      <p className="text-xs opacity-70">{formatFileSize(message.fileSize || 0)}</p>
                    </div>
                    <button className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {message.reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {message.reactions.map((reaction, idx) => (
                    <span
                      key={idx}
                      className="text-sm bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                      onClick={() => toggleReaction(message.id, reaction.emoji)}
                    >
                      {reaction.emoji}
                    </span>
                  ))}
                </div>
              )}
              
              <div className={`flex items-center gap-2 mt-1 text-xs ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                <span>{formatMessageTime(message.createdAt)}</span>
                {message.isEdited && <span>(edited)</span>}
                {isOwn && message.readBy.length > 1 && (
                  <CheckCheck className="w-3.5 h-3.5 text-green-400" />
                )}
                {isOwn && message.deliveredTo.length > 1 && !message.readBy.includes(message.receiverId) && (
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                )}
                {message.isPinned && (
                  <Pin className="w-3 h-3 text-yellow-500" fill="currentColor" />
                )}
              </div>
            </div>
            
            {/* Message Actions */}
            <div className={`absolute top-0 ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1 border border-gray-200 dark:border-gray-700`}>
              <button
                onClick={() => setReplyingTo(message)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Reply"
              >
                <Reply className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => setShowReactions(showReactions === message.id ? null : message.id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="React"
              >
                <Heart className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
              </button>
              {isOwn && (
                <>
                  <button
                    onClick={() => setEditingMessage(message)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => deleteMessage(message.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </>
              )}
              <button
                onClick={() => togglePinMessage(message.id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title={message.isPinned ? 'Unpin' : 'Pin'}
              >
                <Pin className={`w-3.5 h-3.5 ${message.isPinned ? 'text-yellow-500' : 'text-gray-600 dark:text-gray-300'}`} />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(message.content);
                  showToastMessage('Message copied to clipboard!', 'success');
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Copy"
              >
                <Copy className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            
            {/* Reaction Picker */}
            {showReactions === message.id && (
              <div className="absolute -bottom-12 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-700 flex gap-1 z-50">
                {['❤️', '👍', '😂', '😮', '😢', '🔥', '🎉'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => toggleReaction(message.id, emoji)}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  // ============================================
  // ⌨️ KEYBOARD SHORTCUTS
  // ============================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (newMessage.trim()) {
          sendMessage(newMessage);
        }
      }
      if (e.key === 'Escape') {
        setShowEmojiPicker(false);
        setReplyingTo(null);
        setEditingMessage(null);
        setShowReactions(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('messageSearch')?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown as any);
    return () => document.removeEventListener('keydown', handleKeyDown as any);
  }, [newMessage, sendMessage]);

  // ============================================
  // 🔄 SIMULATED WEBSOCKET
  // ============================================

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      if (!currentUser) return;

      // Simulate incoming messages from other users
      const randomUser = users.find(u => u.id !== currentUser.id && Math.random() > 0.85);
      if (randomUser && selectedChat) {
        const chat = chats.find(c => c.participants.includes(randomUser.id) && c.participants.includes(currentUser.id));
        if (chat) {
          const mockMessage: Message = {
            id: generateId(),
            chatId: chat.id,
            senderId: randomUser.id,
            receiverId: currentUser.id,
            content: ['Hey there!', 'What\'s up?', 'How are you?', 'Great to see you!', 'Any plans for today?'][Math.floor(Math.random() * 5)],
            type: 'text',
            reactions: [],
            replyTo: undefined,
            isPinned: false,
            isEdited: false,
            isDeleted: false,
            readBy: [],
            deliveredTo: [],
            createdAt: getCurrentTimestamp(),
            updatedAt: getCurrentTimestamp()
          };

          setMessages(prev => [...prev, mockMessage]);
          setChats(prev => prev.map(c => {
            if (c.id === chat.id) {
              return {
                ...c,
                lastMessage: mockMessage,
                unreadCount: c.id === selectedChat.id ? 0 : c.unreadCount + 1,
                updatedAt: getCurrentTimestamp()
              };
            }
            return c;
          }));

          if (chat.id !== selectedChat.id && !chat.isMuted && soundEnabled) {
            soundManager.current.playNewMessage();
            showToastMessage(`New message from ${randomUser.fullName}`, 'info');
          }
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [users, currentUser, selectedChat, chats, soundEnabled]);

  // ============================================
  // 🎨 RENDER
  // ============================================

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-down">
          <div className={`
            px-4 py-3 rounded-lg shadow-lg flex items-center gap-3
            ${showToast.type === 'success' ? 'bg-green-500 text-white' :
              showToast.type === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'}
          `}>
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{showToast.message}</p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex h-screen max-w-7xl mx-auto">
        {/* Chat List Sidebar */}
        {(!isMobileView || (isMobileView && showChatList)) && (
          <div className={`${isMobileView ? 'w-full' : 'w-80'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-blue-500" />
                  Messages
                </h1>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    title="Toggle Dark Mode"
                  >
                    {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
                  </button>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
                  >
                    {soundEnabled ? <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : <VolumeX className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
                  </button>
                  <button
                    onClick={() => createGroupChat('New Group', [])}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    title="New Group Chat"
                  >
                    <Users className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowArchived(false)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    !showArchived ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setShowArchived(true)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    showArchived ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  Archived
                </button>
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">No conversations found</p>
                </div>
              ) : (
                filteredChats.map(chat => {
                  const isPrivate = chat.type === 'private';
                  const otherUser = isPrivate ? users.find(u => chat.participants.includes(u.id) && u.id !== currentUser?.id) : null;
                  const displayName = isPrivate ? otherUser?.fullName || 'Unknown' : chat.name;
                  const displayAvatar = isPrivate ? otherUser?.avatar : chat.avatar;
                  const status = isPrivate ? otherUser?.status : 'offline';
                  const lastMessage = chat.lastMessage;
                  const isUnread = chat.unreadCount > 0;

                  return (
                    <div
                      key={chat.id}
                      onClick={() => selectChat(chat)}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                        selectedChat?.id === chat.id ? 'bg-blue-50 dark:bg-gray-700' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={displayAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                            alt={displayName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          {status && (
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(status)}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1">
                              {displayName}
                              {chat.isPinned && <Pin className="w-3.5 h-3.5 text-blue-500 ml-1" />}
                              {chat.type === 'group' && <Users className="w-3.5 h-3.5 text-gray-400 ml-1" />}
                            </h3>
                            {lastMessage && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                                {formatTime(lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex-1">
                              {lastMessage ? (
                                lastMessage.senderId === currentUser?.id ? `You: ${lastMessage.content}` : lastMessage.content
                              ) : 'No messages yet'}
                            </p>
                            {isUnread && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full flex-shrink-0">
                                {chat.unreadCount}
                              </span>
                            )}
                            {chat.isMuted && <VolumeX className="w-3.5 h-3.5 text-gray-400 ml-2 flex-shrink-0" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Current User */}
            {currentUser && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(currentUser.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {currentUser.fullName}
                    </p>
                    <p className="text-xs text-green-500">Online</p>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('auth_user');
                      window.location.href = '/auth';
                    }}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat Window */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Chat Header */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isMobileView && (
                  <button
                    onClick={() => setShowChatList(true)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                )}
                {(() => {
                  const isPrivate = selectedChat.type === 'private';
                  const otherUser = isPrivate ? users.find(u => selectedChat.participants.includes(u.id) && u.id !== currentUser?.id) : null;
                  const displayName = isPrivate ? otherUser?.fullName || 'Unknown' : selectedChat.name;
                  const displayAvatar = isPrivate ? otherUser?.avatar : selectedChat.avatar;
                  const status = isPrivate ? otherUser?.status : 'online';

                  return (
                    <>
                      <img
                        src={displayAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                        alt={displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          {displayName}
                          {selectedChat.type === 'group' && <Users className="w-4 h-4 text-gray-400" />}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedChat.type === 'private' ? (
                            typingUsers[otherUser?.id || ''] ? (
                              <span className="text-blue-500">Typing...</span>
                            ) : (
                              getStatusLabel(status)
                            )
                          ) : (
                            `${selectedChat.participants.length} members`
                          )}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => togglePinChat(selectedChat.id)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  title={selectedChat.isPinned ? 'Unpin Chat' : 'Pin Chat'}
                >
                  <Pin className={`w-5 h-5 ${selectedChat.isPinned ? 'text-blue-500' : 'text-gray-600 dark:text-gray-300'}`} />
                </button>
                <button
                  onClick={() => toggleMuteChat(selectedChat.id)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  title={selectedChat.isMuted ? 'Unmute Chat' : 'Mute Chat'}
                >
                  {selectedChat.isMuted ? <VolumeX className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
                </button>
                <button
                  onClick={() => archiveChat(selectedChat.id)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  title={selectedChat.isArchived ? 'Unarchive Chat' : 'Archive Chat'}
                >
                  <Archive className={`w-5 h-5 ${selectedChat.isArchived ? 'text-yellow-500' : 'text-gray-600 dark:text-gray-300'}`} />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>

            {/* Message Search */}
            <div className="px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="messageSearch"
                  type="text"
                  placeholder="Search messages..."
                  value={searchMessages}
                  onChange={(e) => setSearchMessages(e.target.value)}
                  className="w-full pl-10 pr-4 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">No messages yet</p>
                  <p className="text-sm">Start the conversation by sending a message</p>
                </div>
              ) : (
                <>
                  {filteredMessages.map(renderMessageBubble)}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Reply Indicator */}
            {replyingTo && (
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Reply className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Replying to {users.find(u => u.id === replyingTo.senderId)?.fullName}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{replyingTo.content}</p>
                  </div>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            )}

            {/* Edit Message Indicator */}
            {editingMessage && (
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">Editing message</p>
                </div>
                <button
                  onClick={() => setEditingMessage(null)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-end gap-2">
                <div className="flex-1 flex items-end gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex-shrink-0"
                  >
                    <Smile className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*,audio/*,.pdf,.doc,.docx,.txt';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            const content = e.target?.result as string;
                            if (file.type.startsWith('image/')) {
                              sendMessage('📷 Image', 'image');
                            } else if (file.type.startsWith('audio/')) {
                              sendMessage('🎤 Voice message', 'voice');
                            } else {
                              sendMessage(`📎 ${file.name}`, 'file');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex-shrink-0"
                  >
                    <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => {
                      if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
                        showToastMessage('Recording voice message...', 'info');
                        setTimeout(() => {
                          sendMessage('🎤 Voice message', 'voice');
                          showToastMessage('Voice message sent!', 'success');
                        }, 3000);
                      }
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors flex-shrink-0"
                  >
                    <Mic className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  {editingMessage ? (
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (newMessage.trim()) {
                            editMessage(editingMessage.id, newMessage);
                            setNewMessage('');
                          }
                        }
                      }}
                      placeholder="Edit message..."
                      className="flex-1 bg-transparent outline-none resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-[40px] max-h-[120px]"
                      rows={1}
                    />
                  ) : (
                    <textarea
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (newMessage.trim()) {
                            sendMessage(newMessage);
                          }
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent outline-none resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-[40px] max-h-[120px]"
                      rows={1}
                    />
                  )}
                </div>
                <button
                  onClick={() => {
                    if (editingMessage) {
                      if (newMessage.trim()) {
                        editMessage(editingMessage.id, newMessage);
                        setNewMessage('');
                      }
                    } else if (newMessage.trim()) {
                      sendMessage(newMessage);
                    }
                  }}
                  disabled={!newMessage.trim()}
                  className="p-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors flex-shrink-0"
                >
                  {editingMessage ? <Edit className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                </button>
              </div>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 max-h-60 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJI_CATEGORIES.smileys.map((emoji, index) => (
                      <button
                        key={`smiley-${index}`}
                        onClick={() => {
                          setNewMessage(prev => prev + emoji);
                          setShowEmojiPicker(false);
                          inputRef.current?.focus();
                        }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-xl"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-2 text-xs text-gray-400 dark:text-gray-500">
                <div className="flex items-center gap-4">
                  <span>Ctrl+Enter to send</span>
                  <span>Escape to close</span>
                </div>
                {isTyping && (
                  <div className="flex items-center gap-1">
                    <span className="animate-pulse">●</span>
                    <span>Typing...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // No chat selected
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-24 h-24 mb-4 opacity-20" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Select a conversation
            </h2>
            <p className="text-center max-w-sm">
              Choose a chat from the sidebar or start a new conversation
            </p>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}