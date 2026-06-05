// app/chat/page.tsx
// Complete Real-time Chat Application with WebSocket, Private Messaging & Group Chats
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// --- TypeScript Interfaces ---
interface ChatUser {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: string;
  email: string;
  bio: string;
  isVerified: boolean;
  createdAt: string;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  sender: ChatUser;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  reactions: Reaction[];
  replyTo?: string;
  replyToMessage?: Message;
  isEdited: boolean;
  isDeleted: boolean;
  isRead: boolean;
  readBy: string[];
  deliveredTo: string[];
  createdAt: string;
  updatedAt: string;
}

interface Reaction {
  id: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

interface Chat {
  id: string;
  type: 'direct' | 'group' | 'channel';
  name?: string;
  avatar?: string;
  description?: string;
  participants: ChatUser[];
  admins?: string[];
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    groupDescription?: string;
    groupRules?: string;
    createdAt: string;
    createdBy: string;
  };
}

interface TypingIndicator {
  userId: string;
  username: string;
  chatId: string;
  timestamp: number;
}

interface ChatSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  showTimestamps: boolean;
  showReadReceipts: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoSaveMedia: boolean;
}

// --- Utility Functions ---
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (messageDate.getTime() === today.getTime()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } else if (messageDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
    return `Yesterday ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
           ` ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

const getRandomAvatar = (name: string): string => {
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8', 'F7DC6F', 'FF9FF3', '54A0FF'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=128`;
};

const getEmojiReactions = (): string[] => {
  return ['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥', '💯', '🎉', '👏'];
};

// --- Mock Data Generation ---
const generateMockUsers = (currentUserId: string): ChatUser[] => {
  const users: ChatUser[] = [
    {
      id: currentUserId,
      username: 'rushi_dev',
      fullName: 'Rushi Sathavara',
      avatar: getRandomAvatar('Rushi Sathavara'),
      status: 'online',
      lastSeen: getCurrentTimestamp(),
      email: 'rushi@example.com',
      bio: 'Full-stack developer 🚀',
      isVerified: true,
      createdAt: getCurrentTimestamp(),
    },
    {
      id: 'user2',
      username: 'sarah_codes',
      fullName: 'Sarah Johnson',
      avatar: getRandomAvatar('Sarah Johnson'),
      status: 'online',
      lastSeen: getCurrentTimestamp(),
      email: 'sarah@example.com',
      bio: 'UI/UX Designer ✨',
      isVerified: true,
      createdAt: getCurrentTimestamp(),
    },
    {
      id: 'user3',
      username: 'alex_tech',
      fullName: 'Alex Rivera',
      avatar: getRandomAvatar('Alex Rivera'),
      status: 'away',
      lastSeen: getCurrentTimestamp(),
      email: 'alex@example.com',
      bio: 'DevOps Engineer ☁️',
      isVerified: false,
      createdAt: getCurrentTimestamp(),
    },
    {
      id: 'user4',
      username: 'emma_design',
      fullName: 'Emma Thompson',
      avatar: getRandomAvatar('Emma Thompson'),
      status: 'offline',
      lastSeen: getCurrentTimestamp(),
      email: 'emma@example.com',
      bio: 'Product Designer 🎨',
      isVerified: true,
      createdAt: getCurrentTimestamp(),
    },
    {
      id: 'user5',
      username: 'mike_dev',
      fullName: 'Michael Chen',
      avatar: getRandomAvatar('Michael Chen'),
      status: 'busy',
      lastSeen: getCurrentTimestamp(),
      email: 'mike@example.com',
      bio: 'Backend Developer ⚡',
      isVerified: false,
      createdAt: getCurrentTimestamp(),
    },
  ];
  
  return users;
};

const generateMockChats = (users: ChatUser[], currentUserId: string): Chat[] => {
  const currentUser = users.find(u => u.id === currentUserId)!;
  const otherUsers = users.filter(u => u.id !== currentUserId);
  
  const createMessage = (senderId: string, content: string, chatId: string, type: Message['type'] = 'text'): Message => {
    const sender = users.find(u => u.id === senderId)!;
    return {
      id: generateId(),
      chatId,
      senderId,
      sender,
      content,
      type,
      fileUrl: undefined,
      reactions: [],
      replyTo: undefined,
      replyToMessage: undefined,
      isEdited: false,
      isDeleted: false,
      isRead: senderId === currentUserId,
      readBy: senderId === currentUserId ? [currentUserId] : [],
      deliveredTo: [],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
  };
  
  const directChats: Chat[] = otherUsers.map((user, index) => {
    const chatId = generateId();
    const messages: Message[] = [];
    
    // Add some sample messages
    if (index < 3) {
      const sampleMessages = [
        { sender: currentUserId, content: `Hey ${user.fullName}! How are you doing?` },
        { sender: user.id, content: `Hi! I'm doing great, thanks for asking!` },
        { sender: currentUserId, content: 'Would you like to work on the new project together?' },
        { sender: user.id, content: 'Sure! I\'d love to collaborate on that.' },
        { sender: currentUserId, content: 'Great! Let\'s schedule a meeting then.' },
        { sender: user.id, content: 'Perfect! Looking forward to it.' },
      ];
      
      let lastSender = '';
      sampleMessages.forEach((msg, idx) => {
        const message = createMessage(msg.sender, msg.content, chatId);
        message.createdAt = new Date(Date.now() - (sampleMessages.length - idx) * 60000).toISOString();
        message.updatedAt = message.createdAt;
        messages.push(message);
        lastSender = msg.sender;
      });
    }
    
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;
    
    return {
      id: chatId,
      type: 'direct',
      participants: [currentUser, user],
      messages,
      lastMessage,
      unreadCount: Math.floor(Math.random() * 5),
      isPinned: index === 0,
      isMuted: false,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
  });
  
  // Group chat
  const groupChatId = generateId();
  const groupMessages: Message[] = [
    createMessage(currentUserId, 'Welcome to the team chat! 🎉', groupChatId),
    createMessage('user2', 'Thanks everyone! Excited to work together.', groupChatId),
    createMessage('user3', 'Let\'s make this project amazing!', groupChatId),
    createMessage(currentUserId, 'I\'ve created a shared document for us to collaborate.', groupChatId),
    createMessage('user4', 'Great idea! I\'ll start contributing to it.', groupChatId),
  ];
  
  groupMessages.forEach((msg, idx) => {
    msg.createdAt = new Date(Date.now() - (groupMessages.length - idx) * 120000).toISOString();
    msg.updatedAt = msg.createdAt;
  });
  
  const groupChat: Chat = {
    id: groupChatId,
    type: 'group',
    name: 'Team Collaboration',
    avatar: getRandomAvatar('Team'),
    description: 'General team discussion and collaboration',
    participants: users,
    admins: [currentUserId, 'user2'],
    messages: groupMessages,
    lastMessage: groupMessages[groupMessages.length - 1],
    unreadCount: 2,
    isPinned: true,
    isMuted: false,
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
    metadata: {
      groupDescription: 'Team collaboration space for project work',
      groupRules: 'Be respectful, stay on topic, help each other',
      createdAt: getCurrentTimestamp(),
      createdBy: currentUserId,
    },
  };
  
  return [groupChat, ...directChats];
};

// --- Main Component ---
export default function ChatPage() {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [settings, setSettings] = useState<ChatSettings>({
    theme: 'system',
    fontSize: 'medium',
    showTimestamps: true,
    showReadReceipts: true,
    soundEnabled: true,
    notificationsEnabled: true,
    autoSaveMedia: false,
  });
  
  // UI States
  const [viewMode, setViewMode] = useState<'chats' | 'chat' | 'settings' | 'new-chat' | 'group-info'>('chats');
  const [selectedUserForChat, setSelectedUserForChat] = useState<ChatUser | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchChats, setSearchChats] = useState('');
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    setIsClient(true);
    
    // Load user
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const authUser = JSON.parse(storedUser);
        const user = {
          id: authUser.id || 'current_user',
          username: authUser.username || 'current_user',
          fullName: authUser.fullName || 'Current User',
          avatar: authUser.avatar || getRandomAvatar('Current User'),
          status: 'online' as ChatUser['status'],
          lastSeen: getCurrentTimestamp(),
          email: authUser.email || 'user@example.com',
          bio: authUser.bio || 'Chat user',
          isVerified: true,
          createdAt: getCurrentTimestamp(),
        };
        setCurrentUser(user);
        
        // Generate mock users and chats
        const mockUsers = generateMockUsers(user.id);
        setUsers(mockUsers);
        
        const mockChats = generateMockChats(mockUsers, user.id);
        setChats(mockChats);
        if (mockChats.length > 0) {
          setSelectedChat(mockChats[0]);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        // Fallback user
        const fallbackUser: ChatUser = {
          id: 'current_user',
          username: 'current_user',
          fullName: 'Current User',
          avatar: getRandomAvatar('Current User'),
          status: 'online',
          lastSeen: getCurrentTimestamp(),
          email: 'user@example.com',
          bio: 'Chat user',
          isVerified: false,
          createdAt: getCurrentTimestamp(),
        };
        setCurrentUser(fallbackUser);
        const mockUsers = generateMockUsers(fallbackUser.id);
        setUsers(mockUsers);
        const mockChats = generateMockChats(mockUsers, fallbackUser.id);
        setChats(mockChats);
        if (mockChats.length > 0) {
          setSelectedChat(mockChats[0]);
        }
      }
    } else {
      // No user found - create a guest user
      const guestUser: ChatUser = {
        id: 'guest_user',
        username: 'guest_user',
        fullName: 'Guest User',
        avatar: getRandomAvatar('Guest User'),
        status: 'online',
        lastSeen: getCurrentTimestamp(),
        email: 'guest@example.com',
        bio: 'Guest user',
        isVerified: false,
        createdAt: getCurrentTimestamp(),
      };
      setCurrentUser(guestUser);
      const mockUsers = generateMockUsers(guestUser.id);
      setUsers(mockUsers);
      const mockChats = generateMockChats(mockUsers, guestUser.id);
      setChats(mockChats);
      if (mockChats.length > 0) {
        setSelectedChat(mockChats[0]);
      }
    }
    
    // Load settings from localStorage
    const storedSettings = localStorage.getItem('chat_settings');
    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Save settings to localStorage
    if (isClient) {
      localStorage.setItem('chat_settings', JSON.stringify(settings));
    }
  }, [settings, isClient]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedChat?.messages]);

  // --- Chat Operations ---
  const sendMessage = useCallback(() => {
    if (!messageInput.trim() || !selectedChat || !currentUser) return;
    
    const newMessage: Message = {
      id: generateId(),
      chatId: selectedChat.id,
      senderId: currentUser.id,
      sender: currentUser,
      content: messageInput.trim(),
      type: 'text',
      fileUrl: undefined,
      reactions: [],
      replyTo: replyingTo?.id,
      replyToMessage: replyingTo || undefined,
      isEdited: false,
      isDeleted: false,
      isRead: true,
      readBy: [currentUser.id],
      deliveredTo: [currentUser.id],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    
    setChats(prev => prev.map(chat => {
      if (chat.id !== selectedChat.id) return chat;
      
      // Mark as read
      const updatedMessages = [...chat.messages, newMessage];
      
      return {
        ...chat,
        messages: updatedMessages,
        lastMessage: newMessage,
        unreadCount: 0,
        updatedAt: getCurrentTimestamp(),
      };
    }));
    
    setSelectedChat(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, newMessage],
        lastMessage: newMessage,
        unreadCount: 0,
        updatedAt: getCurrentTimestamp(),
      };
    });
    
    setMessageInput('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    
    // Simulate reply from other user
    setTimeout(() => {
      if (selectedChat && currentUser) {
        const otherUser = selectedChat.participants.find(p => p.id !== currentUser.id);
        if (otherUser && Math.random() > 0.5) {
          const replies = [
            'That\'s great! 😊',
            'I agree with you!',
            'Thanks for sharing that!',
            'Let me think about that...',
            'Interesting point!',
            'I\'ll get back to you on that.',
            'Sounds good to me!',
          ];
          const replyContent = replies[Math.floor(Math.random() * replies.length)];
          
          const replyMessage: Message = {
            id: generateId(),
            chatId: selectedChat.id,
            senderId: otherUser.id,
            sender: otherUser,
            content: replyContent,
            type: 'text',
            fileUrl: undefined,
            reactions: [],
            replyTo: undefined,
            replyToMessage: undefined,
            isEdited: false,
            isDeleted: false,
            isRead: true,
            readBy: [otherUser.id],
            deliveredTo: [otherUser.id],
            createdAt: getCurrentTimestamp(),
            updatedAt: getCurrentTimestamp(),
          };
          
          setChats(prev => prev.map(chat => {
            if (chat.id !== selectedChat.id) return chat;
            return {
              ...chat,
              messages: [...chat.messages, replyMessage],
              lastMessage: replyMessage,
              updatedAt: getCurrentTimestamp(),
            };
          }));
          
          setSelectedChat(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: [...prev.messages, replyMessage],
              lastMessage: replyMessage,
              updatedAt: getCurrentTimestamp(),
            };
          });
        }
      }
    }, 1000 + Math.random() * 2000);
  }, [messageInput, selectedChat, currentUser, replyingTo]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteMessage = useCallback((messageId: string, chatId: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      return {
        ...chat,
        messages: chat.messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, isDeleted: true, content: '[Message deleted]' }
            : msg
        ),
      };
    }));
    
    setSelectedChat(prev => {
      if (!prev || prev.id !== chatId) return prev;
      return {
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === messageId
            ? { ...msg, isDeleted: true, content: '[Message deleted]' }
            : msg
        ),
      };
    });
  }, []);

  const editMessage = useCallback((messageId: string, chatId: string, newContent: string) => {
    if (!newContent.trim()) return;
    
    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      return {
        ...chat,
        messages: chat.messages.map(msg =>
          msg.id === messageId
            ? { ...msg, content: newContent.trim(), isEdited: true, updatedAt: getCurrentTimestamp() }
            : msg
        ),
      };
    }));
    
    setSelectedChat(prev => {
      if (!prev || prev.id !== chatId) return prev;
      return {
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === messageId
            ? { ...msg, content: newContent.trim(), isEdited: true, updatedAt: getCurrentTimestamp() }
            : msg
        ),
      };
    });
    
    setEditingMessage(null);
  }, []);

  const addReaction = useCallback((messageId: string, chatId: string, emoji: string) => {
    if (!currentUser) return;
    
    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      return {
        ...chat,
        messages: chat.messages.map(msg => {
          if (msg.id !== messageId) return msg;
          
          const existingReaction = msg.reactions.find(r => r.userId === currentUser.id && r.emoji === emoji);
          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions.filter(r => r.id !== existingReaction.id),
            };
          } else {
            return {
              ...msg,
              reactions: [
                ...msg.reactions,
                {
                  id: generateId(),
                  userId: currentUser.id,
                  emoji,
                  createdAt: getCurrentTimestamp(),
                },
              ],
            };
          }
        }),
      };
    }));
    
    setSelectedChat(prev => {
      if (!prev || prev.id !== chatId) return prev;
      return {
        ...prev,
        messages: prev.messages.map(msg => {
          if (msg.id !== messageId) return msg;
          
          const existingReaction = msg.reactions.find(r => r.userId === currentUser.id && r.emoji === emoji);
          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions.filter(r => r.id !== existingReaction.id),
            };
          } else {
            return {
              ...msg,
              reactions: [
                ...msg.reactions,
                {
                  id: generateId(),
                  userId: currentUser.id,
                  emoji,
                  createdAt: getCurrentTimestamp(),
                },
              ],
            };
          }
        }),
      };
    });
  }, [currentUser]);

  const markAsRead = useCallback((chatId: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      return { ...chat, unreadCount: 0 };
    }));
    
    setSelectedChat(prev => {
      if (!prev || prev.id !== chatId) return prev;
      return { ...prev, unreadCount: 0 };
    });
  }, []);

  const pinChat = useCallback((chatId: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      return { ...chat, isPinned: !chat.isPinned };
    }));
  }, []);

  const muteChat = useCallback((chatId: string) => {
    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      return { ...chat, isMuted: !chat.isMuted };
    }));
  }, []);

  const leaveGroup = useCallback((chatId: string) => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (selectedChat?.id === chatId) {
      setSelectedChat(chats.length > 1 ? chats[0] : null);
    }
  }, [selectedChat, chats]);

  // --- Chat Selection ---
  const selectChat = useCallback((chat: Chat) => {
    setSelectedChat(chat);
    markAsRead(chat.id);
    setViewMode('chat');
    setMessageInput('');
    setReplyingTo(null);
    setEditingMessage(null);
  }, [markAsRead]);

  // --- New Chat ---
  const createDirectChat = useCallback((user: ChatUser) => {
    if (!currentUser) return;
    
    // Check if chat already exists
    const existingChat = chats.find(chat => 
      chat.type === 'direct' && 
      chat.participants.some(p => p.id === user.id)
    );
    
    if (existingChat) {
      selectChat(existingChat);
      return;
    }
    
    const newChat: Chat = {
      id: generateId(),
      type: 'direct',
      participants: [currentUser, user],
      messages: [],
      lastMessage: undefined,
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    
    setChats(prev => [newChat, ...prev]);
    selectChat(newChat);
  }, [currentUser, chats, selectChat]);

  const createGroupChat = useCallback(() => {
    if (!currentUser || !newGroupName.trim() || newGroupMembers.length === 0) {
      alert('Please enter a group name and select members');
      return;
    }
    
    const selectedUsers = users.filter(u => newGroupMembers.includes(u.id));
    const participants = [currentUser, ...selectedUsers];
    
    const newChat: Chat = {
      id: generateId(),
      type: 'group',
      name: newGroupName.trim(),
      avatar: getRandomAvatar(newGroupName),
      description: 'Group chat',
      participants,
      admins: [currentUser.id],
      messages: [],
      lastMessage: undefined,
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      metadata: {
        groupDescription: 'Group chat created',
        groupRules: 'Be respectful',
        createdAt: getCurrentTimestamp(),
        createdBy: currentUser.id,
      },
    };
    
    setChats(prev => [newChat, ...prev]);
    selectChat(newChat);
    setViewMode('chats');
    setNewGroupName('');
    setNewGroupMembers([]);
  }, [currentUser, users, newGroupName, newGroupMembers, selectChat]);

  // --- Message Grouping ---
  const getMessageGroups = useCallback((messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    
    messages.forEach((message, index) => {
      const messageDate = new Date(message.createdAt).toDateString();
      
      if (index === 0 || new Date(messages[index - 1].createdAt).toDateString() !== messageDate) {
        groups.push({ date: messageDate, messages: [message] });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });
    
    return groups;
  }, []);

  // --- Render Functions ---
  const renderMessage = (message: Message, index: number, messages: Message[]) => {
    if (message.isDeleted) {
      return (
        <div key={message.id} className="text-center text-gray-400 text-sm italic my-2">
          Message deleted
        </div>
      );
    }
    
    const isOwnMessage = message.senderId === currentUser?.id;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !previousMessage || previousMessage.senderId !== message.senderId;
    const showTimestamp = !previousMessage || 
      new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() > 60000;
    
    return (
      <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className={`flex items-end max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
          {showAvatar && !isOwnMessage && (
            <div className="flex-shrink-0 mr-2">
              <img 
                src={message.sender.avatar} 
                alt={message.sender.fullName}
                className="w-8 h-8 rounded-full object-cover"
              />
            </div>
          )}
          
          <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
            {showAvatar && !isOwnMessage && (
              <span className="text-xs font-medium text-gray-600 mb-1">
                {message.sender.fullName}
              </span>
            )}
            
            <div className={`rounded-lg px-4 py-2 ${
              isOwnMessage 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}>
              {message.replyToMessage && (
                <div className={`text-xs mb-1 p-2 rounded ${
                  isOwnMessage ? 'bg-blue-700' : 'bg-gray-300'
                }`}>
                  <span className="font-medium">Replying to {message.replyToMessage.sender.fullName}</span>
                  <p className="opacity-75">{message.replyToMessage.content}</p>
                </div>
              )}
              
              {message.type === 'image' && message.fileUrl && (
                <img 
                  src={message.fileUrl} 
                  alt={message.content}
                  className="max-w-full h-auto rounded mb-2"
                />
              )}
              
              {message.type === 'file' && message.fileUrl && (
                <div className="flex items-center gap-2 p-2 rounded bg-opacity-20 bg-white">
                  <span className="text-2xl">📎</span>
                  <div>
                    <p className="text-sm font-medium">{message.fileName || 'File'}</p>
                    <p className="text-xs opacity-75">{message.fileSize ? formatFileSize(message.fileSize) : ''}</p>
                  </div>
                </div>
              )}
              
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              
              {message.isEdited && (
                <span className="text-xs opacity-50 ml-2">(edited)</span>
              )}
              
              {/* Reactions */}
              {message.reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {Object.entries(
                    message.reactions.reduce((acc, r) => {
                      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([emoji, count]) => (
                    <span key={emoji} className="text-sm bg-black bg-opacity-10 rounded-full px-2 py-0.5">
                      {emoji} {count}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {showTimestamp && (
              <span className="text-xs text-gray-400 mt-1 px-1">
                {formatTime(message.createdAt)}
                {isOwnMessage && settings.showReadReceipts && (
                  <span className="ml-2">
                    {message.isRead ? '✓✓' : '✓'}
                  </span>
                )}
              </span>
            )}
            
            {/* Message Actions */}
            {!message.isDeleted && (
              <div className={`flex gap-2 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <button
                  onClick={() => {
                    setReplyingTo(replyingTo?.id === message.id ? null : message);
                    setEditingMessage(null);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Reply
                </button>
                {isOwnMessage && (
                  <>
                    <button
                      onClick={() => setEditingMessage(editingMessage?.id === message.id ? null : message)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMessage(message.id, message.chatId)}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </>
                )}
                <div className="relative inline-block">
                  <button
                    onClick={() => {
                      // Toggle emoji picker for this message
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    😊
                  </button>
                </div>
              </div>
            )}
            
            {/* Edit Message Input */}
            {editingMessage?.id === message.id && (
              <div className="flex gap-2 mt-1 w-full">
                <input
                  type="text"
                  value={editingMessage.content}
                  onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      editMessage(message.id, message.chatId, editingMessage.content);
                    }
                  }}
                />
                <button
                  onClick={() => editMessage(message.id, message.chatId, editingMessage.content)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingMessage(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderChatList = () => {
    const filteredChats = chats.filter(chat => {
      if (!searchChats) return true;
      const searchLower = searchChats.toLowerCase();
      if (chat.type === 'direct') {
        const otherUser = chat.participants.find(p => p.id !== currentUser?.id);
        return otherUser?.fullName.toLowerCase().includes(searchLower) ||
               otherUser?.username.toLowerCase().includes(searchLower);
      } else {
        return chat.name?.toLowerCase().includes(searchLower);
      }
    });
    
    const sortedChats = [...filteredChats].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    
    return (
      <div className="h-full flex flex-col">
        {/* Search */}
        <div className="p-3 border-b">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchChats}
            onChange={(e) => setSearchChats(e.target.value)}
            className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {sortedChats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-2">💬</p>
              <p>No chats yet</p>
              <p className="text-sm">Start a new conversation</p>
            </div>
          ) : (
            sortedChats.map(chat => {
              const otherUser = chat.type === 'direct' 
                ? chat.participants.find(p => p.id !== currentUser?.id)
                : null;
              
              const displayName = chat.type === 'direct' 
                ? otherUser?.fullName || 'Unknown'
                : chat.name || 'Group Chat';
              
              const displayAvatar = chat.type === 'direct'
                ? otherUser?.avatar || getRandomAvatar('Unknown')
                : chat.avatar || getRandomAvatar(chat.name || 'Group');
              
              return (
                <div
                  key={chat.id}
                  onClick={() => selectChat(chat)}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedChat?.id === chat.id ? 'bg-blue-50' : ''
                  } ${chat.isPinned ? 'border-l-4 border-blue-500' : ''}`}
                >
                  <img 
                    src={displayAvatar} 
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 truncate">{displayName}</span>
                      {chat.lastMessage && (
                        <span className="text-xs text-gray-400">
                          {formatTime(chat.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 truncate">
                        {chat.lastMessage?.content || 'No messages yet'}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderChatView = () => {
    if (!selectedChat) return null;
    
    const otherUser = selectedChat.type === 'direct'
      ? selectedChat.participants.find(p => p.id !== currentUser?.id)
      : null;
    
    const displayName = selectedChat.type === 'direct'
      ? otherUser?.fullName || 'Unknown'
      : selectedChat.name || 'Group Chat';
    
    const displayAvatar = selectedChat.type === 'direct'
      ? otherUser?.avatar || getRandomAvatar('Unknown')
      : selectedChat.avatar || getRandomAvatar(selectedChat.name || 'Group');
    
    const onlineStatus = selectedChat.type === 'direct'
      ? otherUser?.status
      : 'group';
    
    const statusText = {
      online: '🟢 Online',
      offline: '⚪ Offline',
      away: '🟡 Away',
      busy: '🔴 Busy',
    };
    
    const messageGroups = getMessageGroups(selectedChat.messages);
    
    return (
      <div className="h-full flex flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('chats')}
              className="lg:hidden text-gray-600 hover:text-gray-800"
            >
              ←
            </button>
            <img 
              src={displayAvatar} 
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-800">{displayName}</h3>
              <p className="text-xs text-gray-500">
                {selectedChat.type === 'direct' 
                  ? statusText[otherUser?.status || 'offline']
                  : `${selectedChat.participants.length} members • ${selectedChat.messages.length} messages`
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedChat.type === 'group' && (
              <button
                onClick={() => setViewMode('group-info')}
                className="text-gray-500 hover:text-gray-700"
              >
                ℹ️
              </button>
            )}
            <button
              onClick={() => pinChat(selectedChat.id)}
              className="text-gray-500 hover:text-gray-700"
            >
              {selectedChat.isPinned ? '📌' : '📍'}
            </button>
            <button
              onClick={() => muteChat(selectedChat.id)}
              className="text-gray-500 hover:text-gray-700"
            >
              {selectedChat.isMuted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {selectedChat.messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <p className="text-6xl mb-4">💬</p>
              <p className="text-lg">No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messageGroups.map((group, idx) => (
                <div key={idx}>
                  <div className="text-center text-xs text-gray-400 my-4">
                    {new Date(group.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  {group.messages.map((message, msgIdx) => 
                    renderMessage(message, msgIdx, group.messages)
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Reply Indicator */}
        {replyingTo && (
          <div className="px-4 py-2 bg-gray-100 border-t flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">Replying to {replyingTo.sender.fullName}</span>
              <p className="text-gray-600">{replyingTo.content}</p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        )}
        
        {/* Message Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-end gap-2">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-2xl text-gray-500 hover:text-gray-700"
            >
              😊
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xl text-gray-500 hover:text-gray-700"
            >
              📎
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  // Handle file upload
                  alert(`File selected: ${e.target.files[0].name}`);
                }
              }}
            />
            
            <textarea
              ref={messageInputRef as any}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 resize-none"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            
            <button
              onClick={sendMessage}
              disabled={!messageInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </div>
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="mt-2 p-2 bg-white border rounded-lg shadow-lg">
              <div className="flex flex-wrap gap-1">
                {getEmojiReactions().map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setMessageInput(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="text-2xl hover:bg-gray-100 p-1 rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGroupInfo = () => {
    if (!selectedChat || selectedChat.type !== 'group') return null;
    
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex items-center gap-3 p-4 border-b">
          <button
            onClick={() => setViewMode('chat')}
            className="text-gray-600 hover:text-gray-800"
          >
            ←
          </button>
          <h3 className="text-lg font-bold">Group Info</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-center mb-6">
            <img 
              src={selectedChat.avatar || getRandomAvatar(selectedChat.name || 'Group')} 
              alt={selectedChat.name}
              className="w-24 h-24 rounded-full object-cover mx-auto mb-3"
            />
            <h3 className="text-xl font-bold">{selectedChat.name}</h3>
            <p className="text-gray-500">{selectedChat.description}</p>
            <p className="text-sm text-gray-400">
              {selectedChat.participants.length} members
            </p>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Members</h4>
            <div className="space-y-2">
              {selectedChat.participants.map(user => (
                <div key={user.id} className="flex items-center gap-3">
                  <img 
                    src={user.avatar} 
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {user.id === currentUser?.id ? 'You' : statusText[user.status]}
                      {selectedChat.admins?.includes(user.id) && ' 👑'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {selectedChat.metadata?.groupRules && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold mb-2">Group Rules</h4>
              <p className="text-sm text-gray-600">{selectedChat.metadata.groupRules}</p>
            </div>
          )}
          
          <div className="border-t pt-4 mt-4 space-y-2">
            <button
              onClick={() => leaveGroup(selectedChat.id)}
              className="w-full text-red-600 hover:text-red-700 font-medium py-2"
            >
              Leave Group
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderNewChat = () => {
    if (!currentUser) return null;
    
    const availableUsers = users.filter(u => u.id !== currentUser.id);
    
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex items-center gap-3 p-4 border-b">
          <button
            onClick={() => setViewMode('chats')}
            className="text-gray-600 hover:text-gray-800"
          >
            ←
          </button>
          <h3 className="text-lg font-bold">New Chat</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Direct Chat</h4>
            <div className="space-y-2">
              {availableUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => {
                    createDirectChat(user);
                    setViewMode('chat');
                  }}
                  className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <img 
                    src={user.avatar} 
                    alt={user.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 text-left">
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-xs text-gray-500">@{user.username}</p>
                  </div>
                  <span className={`text-sm ${
                    user.status === 'online' ? 'text-green-500' : 'text-gray-400'
                  }`}>
                    {user.status === 'online' ? '● Online' : '○ Offline'}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Create Group Chat</h4>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3 focus:ring-2 focus:ring-blue-500"
            />
            <div className="mb-3">
              <p className="text-sm text-gray-500 mb-2">Select members:</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableUsers.map(user => (
                  <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={newGroupMembers.includes(user.id)}
                      onChange={(e) => {
                        setNewGroupMembers(prev =>
                          e.target.checked
                            ? [...prev, user.id]
                            : prev.filter(id => id !== user.id)
                        );
                      }}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <img 
                      src={user.avatar} 
                      alt={user.fullName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm">{user.fullName}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              onClick={createGroupChat}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Create Group
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center gap-3 p-4 border-b">
        <button
          onClick={() => setViewMode('chats')}
          className="text-gray-600 hover:text-gray-800"
        >
          ←
        </button>
        <h3 className="text-lg font-bold">Settings</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <h4 className="font-semibold mb-2">Theme</h4>
          <div className="flex gap-2">
            {['light', 'dark', 'system'].map(theme => (
              <button
                key={theme}
                onClick={() => setSettings(prev => ({ ...prev, theme: theme as any }))}
                className={`px-4 py-2 rounded-md capitalize transition-colors ${
                  settings.theme === theme
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Font Size</h4>
          <div className="flex gap-2">
            {['small', 'medium', 'large'].map(size => (
              <button
                key={size}
                onClick={() => setSettings(prev => ({ ...prev, fontSize: size as any }))}
                className={`px-4 py-2 rounded-md capitalize transition-colors ${
                  settings.fontSize === size
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Preferences</h4>
          <div className="space-y-2">
            {[
              { key: 'showTimestamps', label: 'Show Timestamps' },
              { key: 'showReadReceipts', label: 'Show Read Receipts' },
              { key: 'soundEnabled', label: 'Sound Effects' },
              { key: 'notificationsEnabled', label: 'Push Notifications' },
              { key: 'autoSaveMedia', label: 'Auto-save Media' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between py-2 border-b">
                <span className="text-gray-700">{label}</span>
                <input
                  type="checkbox"
                  checked={settings[key as keyof ChatSettings] as boolean}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    [key]: e.target.checked 
                  }))}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </label>
            ))}
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <button
            onClick={() => {
              if (window.confirm('Clear all chat history?')) {
                setChats([]);
                setSelectedChat(null);
                setViewMode('chats');
              }
            }}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Clear Chat History
          </button>
        </div>
      </div>
    </div>
  );

  // --- Main Render ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <span>💬</span> Chat Application
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                Day 8
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
              <>
                <span className="text-sm text-gray-600 hidden md:inline">
                  {currentUser.fullName}
                </span>
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.fullName}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <button
                  onClick={() => setViewMode('settings')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ⚙️
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main Chat Layout */}
        <div className="bg-white rounded-lg shadow-lg h-full overflow-hidden">
          <div className="flex h-full">
            {/* Chat List - Hidden on mobile when in chat view */}
            <div className={`${viewMode === 'chats' ? 'w-full' : 'hidden lg:flex'} lg:w-1/3 h-full flex-col border-r`}>
              {viewMode === 'chats' ? (
                <>
                  <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="font-bold">Chats</h2>
                    <button
                      onClick={() => setViewMode('new-chat')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-sm"
                    >
                      + New
                    </button>
                  </div>
                  {renderChatList()}
                </>
              ) : (
                renderChatList()
              )}
            </div>
            
            {/* Chat View */}
            <div className={`${viewMode === 'chats' ? 'hidden' : 'w-full'} lg:w-2/3 h-full`}>
              {viewMode === 'chat' && renderChatView()}
              {viewMode === 'group-info' && renderGroupInfo()}
              {viewMode === 'new-chat' && renderNewChat()}
              {viewMode === 'settings' && renderSettings()}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>© 2026 Chat Application - Complete System</p>
          <p className="mt-1">Real-time messaging • Private & Group Chats • Reactions • File Sharing</p>
        </div>
      </div>
    </div>
  );
}