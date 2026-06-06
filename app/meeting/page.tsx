// app/meeting/page.tsx
// Complete Video Conferencing & Meeting Application with Room Management & Real-time Features
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// --- TypeScript Interfaces ---
interface MeetingUser {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isMutedByHost: boolean;
  role: 'host' | 'co-host' | 'participant' | 'viewer';
  joinedAt: string;
  lastActive: string;
  deviceInfo: {
    camera?: string;
    microphone?: string;
    browser: string;
    os: string;
  };
}

interface Meeting {
  id: string;
  title: string;
  description: string;
  hostId: string;
  host: MeetingUser;
  participants: MeetingUser[];
  settings: MeetingSettings;
  status: 'scheduled' | 'active' | 'ended' | 'recording';
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  recordingStatus: 'idle' | 'recording' | 'paused' | 'stopped';
  recordingUrl?: string;
  chat: MeetingMessage[];
  polls: Poll[];
  reactions: MeetingReaction[];
  waitingRoom: MeetingUser[];
  breakouts: BreakoutRoom[];
  analytics: MeetingAnalytics;
  createdAt: string;
  updatedAt: string;
}

interface MeetingSettings {
  allowJoinBeforeHost: boolean;
  requirePassword: boolean;
  password?: string;
  muteOnJoin: boolean;
  videoOnJoin: boolean;
  allowScreenSharing: boolean;
  allowChat: boolean;
  allowPolls: boolean;
  allowReactions: boolean;
  allowRaiseHand: boolean;
  recordMeeting: boolean;
  maxParticipants: number;
  waitingRoomEnabled: boolean;
  breakoutRoomsEnabled: boolean;
  autoRecording: boolean;
}

interface MeetingMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  type: 'text' | 'system' | 'poll' | 'reaction';
  timestamp: string;
  isPinned: boolean;
  replyTo?: string;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  isAnonymous: boolean;
  resultsVisible: boolean;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

interface MeetingReaction {
  id: string;
  userId: string;
  userName: string;
  emoji: string;
  timestamp: string;
}

interface BreakoutRoom {
  id: string;
  name: string;
  participants: string[];
  hostId: string;
  isActive: boolean;
  duration: number;
  createdAt: string;
}

interface MeetingAnalytics {
  totalParticipants: number;
  maxConcurrent: number;
  averageDuration: number;
  totalMessages: number;
  totalReactions: number;
  pollResponses: number;
  screenShareDuration: number;
  recordingDuration: number;
}

interface MeetingRecording {
  id: string;
  meetingId: string;
  fileName: string;
  fileSize: number;
  duration: number;
  createdAt: string;
  status: 'processing' | 'ready' | 'failed';
  url?: string;
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
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  } else if (mins > 0) {
    return `${mins}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

const getRandomAvatar = (name: string): string => {
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8', 'F7DC6F'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=128`;
};

// --- Mock Data Generation ---
const generateMockUser = (id: string, name: string): MeetingUser => {
  return {
    id,
    username: name.toLowerCase().replace(/\s/g, '_'),
    fullName: name,
    avatar: getRandomAvatar(name),
    isVideoOn: Math.random() > 0.3,
    isAudioOn: Math.random() > 0.2,
    isScreenSharing: false,
    isHandRaised: false,
    isMutedByHost: false,
    role: id === 'host' ? 'host' : 'participant',
    joinedAt: getCurrentTimestamp(),
    lastActive: getCurrentTimestamp(),
    deviceInfo: {
      browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
      os: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'][Math.floor(Math.random() * 5)],
    },
  };
};

const generateMockMeeting = (hostId: string, currentUser: any): Meeting => {
  const participants: MeetingUser[] = [
    generateMockUser(hostId, currentUser?.fullName || 'Host User'),
    generateMockUser('user1', 'Sarah Johnson'),
    generateMockUser('user2', 'Alex Rivera'),
    generateMockUser('user3', 'Emma Thompson'),
    generateMockUser('user4', 'Michael Chen'),
  ];
  
  participants[0].role = 'host';
  participants[0].isVideoOn = true;
  participants[0].isAudioOn = true;
  
  const chatMessages: MeetingMessage[] = [
    {
      id: generateId(),
      userId: 'user1',
      userName: 'Sarah Johnson',
      userAvatar: getRandomAvatar('Sarah Johnson'),
      content: 'Hi everyone! Ready for the meeting?',
      type: 'text',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      isPinned: false,
    },
    {
      id: generateId(),
      userId: hostId,
      userName: currentUser?.fullName || 'Host User',
      userAvatar: getRandomAvatar(currentUser?.fullName || 'Host User'),
      content: 'Welcome everyone! Let\'s get started.',
      type: 'text',
      timestamp: new Date(Date.now() - 240000).toISOString(),
      isPinned: true,
    },
    {
      id: generateId(),
      userId: 'user2',
      userName: 'Alex Rivera',
      userAvatar: getRandomAvatar('Alex Rivera'),
      content: 'I\'ve prepared the Q3 report. Ready to share.',
      type: 'text',
      timestamp: new Date(Date.now() - 180000).toISOString(),
      isPinned: false,
    },
    {
      id: generateId(),
      userId: 'user3',
      userName: 'Emma Thompson',
      userAvatar: getRandomAvatar('Emma Thompson'),
      content: 'Great! Looking forward to the presentation.',
      type: 'text',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      isPinned: false,
    },
  ];
  
  const polls: Poll[] = [
    {
      id: generateId(),
      question: 'What should be our Q4 focus?',
      options: [
        { id: generateId(), text: 'Product Development', votes: 3, voters: ['user1', 'user2', 'user4'] },
        { id: generateId(), text: 'Marketing & Growth', votes: 1, voters: ['user3'] },
        { id: generateId(), text: 'Customer Success', votes: 0, voters: [] },
        { id: generateId(), text: 'All of the above', votes: 2, voters: ['host', 'user5'] },
      ],
      createdBy: 'host',
      createdAt: getCurrentTimestamp(),
      isActive: true,
      isAnonymous: false,
      resultsVisible: true,
    },
  ];
  
  const reactions: MeetingReaction[] = [
    { id: generateId(), userId: 'user1', userName: 'Sarah Johnson', emoji: '👋', timestamp: getCurrentTimestamp() },
    { id: generateId(), userId: 'user2', userName: 'Alex Rivera', emoji: '🚀', timestamp: getCurrentTimestamp() },
  ];
  
  return {
    id: generateId(),
    title: 'Weekly Team Sync',
    description: 'Weekly team meeting to discuss progress, plans, and challenges.',
    hostId: hostId,
    host: participants[0],
    participants: participants,
    settings: {
      allowJoinBeforeHost: true,
      requirePassword: false,
      muteOnJoin: false,
      videoOnJoin: true,
      allowScreenSharing: true,
      allowChat: true,
      allowPolls: true,
      allowReactions: true,
      allowRaiseHand: true,
      recordMeeting: true,
      maxParticipants: 50,
      waitingRoomEnabled: false,
      breakoutRoomsEnabled: true,
      autoRecording: false,
    },
    status: 'active',
    scheduledAt: new Date().toISOString(),
    startedAt: new Date(Date.now() - 600000).toISOString(),
    endedAt: undefined,
    recordingStatus: 'idle',
    chat: chatMessages,
    polls: polls,
    reactions: reactions,
    waitingRoom: [],
    breakouts: [
      {
        id: generateId(),
        name: 'Development Team',
        participants: ['host', 'user1', 'user2'],
        hostId: 'host',
        isActive: false,
        duration: 0,
        createdAt: getCurrentTimestamp(),
      },
      {
        id: generateId(),
        name: 'Design Team',
        participants: ['user3', 'user4'],
        hostId: 'user3',
        isActive: false,
        duration: 0,
        createdAt: getCurrentTimestamp(),
      },
    ],
    analytics: {
      totalParticipants: 5,
      maxConcurrent: 5,
      averageDuration: 0,
      totalMessages: chatMessages.length,
      totalReactions: reactions.length,
      pollResponses: 6,
      screenShareDuration: 0,
      recordingDuration: 0,
    },
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
  };
};

// --- Main Component ---
export default function MeetingPage() {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI States
  const [viewMode, setViewMode] = useState<'join' | 'meeting' | 'settings' | 'recordings' | 'polls' | 'breakouts'>('join');
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showPolls, setShowPolls] = useState(false);
  const [showBreakouts, setShowBreakouts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRecording, setShowRecording] = useState(false);
  
  // Meeting Controls
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isMutedByHost, setIsMutedByHost] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);
  
  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<MeetingMessage[]>([]);
  
  // Poll State
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [selectedPollOption, setSelectedPollOption] = useState<string | null>(null);
  
  // Reaction State
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [reactions, setReactions] = useState<MeetingReaction[]>([]);
  
  // Recording State
  const [recordings, setRecordings] = useState<MeetingRecording[]>([]);
  
  // Meeting Join State
  const [meetingId, setMeetingId] = useState('');
  const [meetingPassword, setMeetingPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- Effects ---
  useEffect(() => {
    setIsClient(true);
    
    // Load user
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const authUser = JSON.parse(storedUser);
        setCurrentUser(authUser);
        setDisplayName(authUser.fullName || authUser.username || 'Guest');
      } catch (error) {
        console.error('Failed to parse user:', error);
        setDisplayName('Guest');
      }
    } else {
      setDisplayName('Guest');
    }
    
    // Generate mock meeting
    const hostId = storedUser ? JSON.parse(storedUser).id || 'host' : 'host';
    const mockMeeting = generateMockMeeting(hostId, storedUser ? JSON.parse(storedUser) : null);
    setMeeting(mockMeeting);
    setChatMessages(mockMeeting.chat);
    setReactions(mockMeeting.reactions);
    setParticipantCount(mockMeeting.participants.length);
    
    // Load recordings from localStorage
    const storedRecordings = localStorage.getItem('meeting_recordings');
    if (storedRecordings) {
      try {
        setRecordings(JSON.parse(storedRecordings));
      } catch (error) {
        console.error('Failed to load recordings:', error);
      }
    }
    
    // Start duration timer
    durationIntervalRef.current = setInterval(() => {
      setMeetingDuration(prev => prev + 1);
    }, 1000);
    
    setIsLoading(false);
    
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // --- Meeting Controls ---
  const toggleVideo = useCallback(() => {
    setIsVideoOn(prev => !prev);
    // In a real app, this would toggle the camera feed
  }, []);

  const toggleAudio = useCallback(() => {
    setIsAudioOn(prev => !prev);
    // In a real app, this would toggle the microphone
  }, []);

  const toggleScreenShare = useCallback(() => {
    setIsScreenSharing(prev => !prev);
    // In a real app, this would start/stop screen sharing
  }, []);

  const toggleHandRaise = useCallback(() => {
    setIsHandRaised(prev => !prev);
    // In a real app, this would raise/lower hand
  }, []);

  const toggleRecording = useCallback(() => {
    setIsRecording(prev => !prev);
    // In a real app, this would start/stop recording
    if (!isRecording) {
      // Start recording
      setMeeting(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          recordingStatus: 'recording',
        };
      });
    } else {
      // Stop recording
      setMeeting(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          recordingStatus: 'stopped',
        };
      });
      // Save recording
      const newRecording: MeetingRecording = {
        id: generateId(),
        meetingId: meeting?.id || 'unknown',
        fileName: `Meeting_${new Date().toISOString().split('T')[0]}.mp4`,
        fileSize: Math.floor(Math.random() * 100000000) + 5000000,
        duration: meetingDuration,
        createdAt: getCurrentTimestamp(),
        status: 'processing',
      };
      setRecordings(prev => [...prev, newRecording]);
      localStorage.setItem('meeting_recordings', JSON.stringify([...recordings, newRecording]));
    }
  }, [isRecording, meetingDuration, meeting, recordings]);

  const leaveMeeting = useCallback(() => {
    if (window.confirm('Are you sure you want to leave the meeting?')) {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      setViewMode('join');
      setIsVideoOn(true);
      setIsAudioOn(true);
      setIsScreenSharing(false);
      setIsHandRaised(false);
      setMeetingDuration(0);
    }
  }, []);

  // --- Chat Operations ---
  const sendChatMessage = useCallback(() => {
    if (!chatMessage.trim() || !currentUser || !meeting) return;
    
    const newMessage: MeetingMessage = {
      id: generateId(),
      userId: currentUser.id || 'guest',
      userName: currentUser.fullName || currentUser.username || 'Guest',
      userAvatar: getRandomAvatar(currentUser.fullName || 'Guest'),
      content: chatMessage.trim(),
      type: 'text',
      timestamp: getCurrentTimestamp(),
      isPinned: false,
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setMeeting(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        chat: [...prev.chat, newMessage],
        analytics: {
          ...prev.analytics,
          totalMessages: prev.analytics.totalMessages + 1,
        },
      };
    });
    setChatMessage('');
  }, [chatMessage, currentUser, meeting]);

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  // --- Poll Operations ---
  const createPoll = useCallback(() => {
    if (!pollQuestion.trim() || pollOptions.some(o => !o.trim()) || !meeting) return;
    
    const newPoll: Poll = {
      id: generateId(),
      question: pollQuestion.trim(),
      options: pollOptions.filter(o => o.trim()).map(o => ({
        id: generateId(),
        text: o.trim(),
        votes: 0,
        voters: [],
      })),
      createdBy: currentUser?.id || 'guest',
      createdAt: getCurrentTimestamp(),
      isActive: true,
      isAnonymous: false,
      resultsVisible: true,
    };
    
    setMeeting(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        polls: [...prev.polls, newPoll],
      };
    });
    
    // Add poll message to chat
    const pollMessage: MeetingMessage = {
      id: generateId(),
      userId: currentUser?.id || 'guest',
      userName: currentUser?.fullName || 'Guest',
      userAvatar: getRandomAvatar(currentUser?.fullName || 'Guest'),
      content: `📊 Poll: ${pollQuestion}`,
      type: 'poll',
      timestamp: getCurrentTimestamp(),
      isPinned: false,
    };
    
    setChatMessages(prev => [...prev, pollMessage]);
    setMeeting(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        chat: [...prev.chat, pollMessage],
      };
    });
    
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowPolls(false);
  }, [pollQuestion, pollOptions, currentUser, meeting]);

  const votePoll = useCallback((pollId: string, optionId: string) => {
    setMeeting(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        polls: prev.polls.map(poll => {
          if (poll.id !== pollId) return poll;
          return {
            ...poll,
            options: poll.options.map(opt => {
              if (opt.id !== optionId) return opt;
              return {
                ...opt,
                votes: opt.votes + 1,
                voters: [...opt.voters, currentUser?.id || 'guest'],
              };
            }),
          };
        }),
        analytics: {
          ...prev.analytics,
          pollResponses: prev.analytics.pollResponses + 1,
        },
      };
    });
    setSelectedPollOption(optionId);
  }, [currentUser]);

  const addPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length <= 2) return;
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  const updatePollOption = (index: number, value: string) => {
    setPollOptions(pollOptions.map((opt, i) => i === index ? value : opt));
  };

  // --- Reaction Operations ---
  const addReaction = useCallback((emoji: string) => {
    if (!currentUser) return;
    
    const newReaction: MeetingReaction = {
      id: generateId(),
      userId: currentUser.id || 'guest',
      userName: currentUser.fullName || currentUser.username || 'Guest',
      emoji,
      timestamp: getCurrentTimestamp(),
    };
    
    setReactions(prev => [...prev, newReaction]);
    setMeeting(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        reactions: [...prev.reactions, newReaction],
        analytics: {
          ...prev.analytics,
          totalReactions: prev.analytics.totalReactions + 1,
        },
      };
    });
    
    // Add reaction message to chat (optional)
    const reactionMessage: MeetingMessage = {
      id: generateId(),
      userId: currentUser.id || 'guest',
      userName: currentUser.fullName || currentUser.username || 'Guest',
      userAvatar: getRandomAvatar(currentUser.fullName || 'Guest'),
      content: ` reacted with ${emoji}`,
      type: 'reaction',
      timestamp: getCurrentTimestamp(),
      isPinned: false,
    };
    
    setChatMessages(prev => [...prev, reactionMessage]);
    setMeeting(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        chat: [...prev.chat, reactionMessage],
      };
    });
    
    setSelectedReaction(null);
  }, [currentUser]);

  // --- Participant Management ---
  const muteParticipant = useCallback((userId: string) => {
    setMeeting(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: prev.participants.map(p => {
          if (p.id === userId) {
            return { ...p, isAudioOn: false, isMutedByHost: true };
          }
          return p;
        }),
      };
    });
  }, []);

  const unmuteParticipant = useCallback((userId: string) => {
    setMeeting(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: prev.participants.map(p => {
          if (p.id === userId) {
            return { ...p, isAudioOn: true, isMutedByHost: false };
          }
          return p;
        }),
      };
    });
  }, []);

  const removeParticipant = useCallback((userId: string) => {
    if (!window.confirm('Remove this participant from the meeting?')) return;
    
    setMeeting(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: prev.participants.filter(p => p.id !== userId),
        analytics: {
          ...prev.analytics,
          totalParticipants: prev.analytics.totalParticipants - 1,
        },
      };
    });
  }, []);

  const makeHost = useCallback((userId: string) => {
    setMeeting(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: prev.participants.map(p => {
          if (p.id === userId) {
            return { ...p, role: 'co-host' };
          }
          if (p.role === 'co-host') {
            return { ...p, role: 'participant' };
          }
          return p;
        }),
      };
    });
  }, []);

  // --- Breakout Rooms ---
  const startBreakout = useCallback((roomId: string) => {
    setMeeting(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        breakouts: prev.breakouts.map(room => {
          if (room.id === roomId) {
            return { ...room, isActive: true };
          }
          return room;
        }),
      };
    });
  }, []);

  const endBreakout = useCallback((roomId: string) => {
    setMeeting(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        breakouts: prev.breakouts.map(room => {
          if (room.id === roomId) {
            return { ...room, isActive: false };
          }
          return room;
        }),
      };
    });
  }, []);

  const joinBreakout = useCallback((roomId: string) => {
    // In a real app, this would move the user to the breakout room
    alert(`Joining breakout room: ${roomId}`);
  }, []);

  // --- Render Functions ---
  const renderJoinScreen = () => (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🎥</div>
        <h1 className="text-3xl font-bold text-gray-800">Join Meeting</h1>
        <p className="text-gray-500">Enter the meeting details to join</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meeting ID</label>
          <input
            type="text"
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            placeholder="Enter meeting ID"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password (optional)</label>
          <input
            type="password"
            value={meetingPassword}
            onChange={(e) => setMeetingPassword(e.target.value)}
            placeholder="Meeting password"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isVideoOn}
              onChange={toggleVideo}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="ml-2 text-sm text-gray-600">Join with video</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isAudioOn}
              onChange={toggleAudio}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <span className="ml-2 text-sm text-gray-600">Join with audio</span>
          </label>
        </div>
        
        <button
          onClick={() => {
            if (!meetingId.trim()) {
              alert('Please enter a meeting ID');
              return;
            }
            if (!displayName.trim()) {
              alert('Please enter your display name');
              return;
            }
            setViewMode('meeting');
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Join Meeting
        </button>
        
        <button
          onClick={() => {
            // Start a new meeting
            const newMeetingId = generateId().slice(0, 8).toUpperCase();
            setMeetingId(newMeetingId);
            setMeeting(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                id: newMeetingId,
                status: 'active',
                startedAt: getCurrentTimestamp(),
              };
            });
            setViewMode('meeting');
          }}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Start New Meeting
        </button>
        
        <div className="text-center">
          <span className="text-xs text-gray-400">or join with ID: {meetingId || 'MEET-1234'}</span>
        </div>
      </div>
    </div>
  );

  const renderMeetingView = () => {
    if (!meeting) return null;
    
    const isHost = currentUser?.id === meeting.hostId;
    const hostUser = meeting.participants.find(p => p.id === meeting.hostId);
    const otherParticipants = meeting.participants.filter(p => p.id !== currentUser?.id);
    
    return (
      <div className="h-full flex flex-col">
        {/* Meeting Header */}
        <div className="flex items-center justify-between p-4 bg-gray-900 text-white">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">{meeting.title}</span>
            <span className="text-sm text-gray-400">• {formatDuration(meetingDuration)}</span>
            <span className="text-xs bg-green-600 px-2 py-1 rounded-full">
              {meeting.participants.length} participants
            </span>
            {isRecording && (
              <span className="text-xs bg-red-600 px-2 py-1 rounded-full animate-pulse">
                ● REC
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              💬
            </button>
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              👥
            </button>
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              😊
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              ⚙️
            </button>
          </div>
        </div>
        
        {/* Main Meeting Area */}
        <div className="flex-1 bg-gray-800 p-4 relative">
          {/* Video Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full">
            {/* Host/Current User Video */}
            <div className="relative bg-gray-700 rounded-lg overflow-hidden">
              {isVideoOn ? (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                      <span className="text-4xl">
                        {currentUser?.fullName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <p className="text-white text-sm">{currentUser?.fullName || 'You'}</p>
                    <span className="text-xs text-gray-400">Host</span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-600">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gray-500 flex items-center justify-center mx-auto mb-2">
                      <span className="text-4xl text-white">
                        {currentUser?.fullName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <p className="text-white text-sm">{currentUser?.fullName || 'You'}</p>
                    <span className="text-xs text-gray-400">Video off</span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 flex items-center gap-1">
                {isAudioOn ? (
                  <span className="text-green-400 text-xs">🎤</span>
                ) : (
                  <span className="text-red-400 text-xs">🔇</span>
                )}
                {isHandRaised && <span className="text-yellow-400 text-xs">✋</span>}
                {isScreenSharing && <span className="text-blue-400 text-xs">🖥️</span>}
              </div>
              <div className="absolute top-2 right-2">
                <span className="text-xs text-white bg-black/50 px-2 py-0.5 rounded-full">
                  {isHost ? 'Host' : 'You'}
                </span>
              </div>
            </div>
            
            {/* Other Participants */}
            {otherParticipants.map(participant => (
              <div key={participant.id} className="relative bg-gray-700 rounded-lg overflow-hidden">
                {participant.isVideoOn ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                        <span className="text-3xl text-white">
                          {participant.fullName.charAt(0)}
                        </span>
                      </div>
                      <p className="text-white text-sm">{participant.fullName}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-600">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-gray-500 flex items-center justify-center mx-auto mb-2">
                        <span className="text-3xl text-white">
                          {participant.fullName.charAt(0)}
                        </span>
                      </div>
                      <p className="text-white text-sm">{participant.fullName}</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  {participant.isAudioOn ? (
                    <span className="text-green-400 text-xs">🎤</span>
                  ) : (
                    <span className="text-red-400 text-xs">🔇</span>
                  )}
                  {participant.isHandRaised && <span className="text-yellow-400 text-xs">✋</span>}
                  {participant.isScreenSharing && <span className="text-blue-400 text-xs">🖥️</span>}
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  {participant.role === 'host' && (
                    <span className="text-xs text-white bg-green-600 px-2 py-0.5 rounded-full">
                      Host
                    </span>
                  )}
                  {participant.role === 'co-host' && (
                    <span className="text-xs text-white bg-blue-600 px-2 py-0.5 rounded-full">
                      Co-host
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Chat Panel */}
          {showChat && (
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-lg flex flex-col">
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="font-semibold">Chat</h3>
                <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {chatMessages.map(msg => (
                  <div key={msg.id} className="flex gap-2">
                    <img 
                      src={msg.userAvatar} 
                      alt={msg.userName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{msg.userName}</span>
                        <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
                      </div>
                      {msg.type === 'poll' && (
                        <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                          {msg.content}
                        </p>
                      )}
                      {msg.type === 'reaction' && (
                        <p className="text-sm text-purple-600 bg-purple-50 p-2 rounded">
                          {msg.content}
                        </p>
                      )}
                      {msg.type === 'text' && (
                        <p className="text-sm text-gray-800">{msg.content}</p>
                      )}
                      {msg.isPinned && (
                        <span className="text-xs text-yellow-600">📌 Pinned</span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={handleChatKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendChatMessage}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Participants Panel */}
          {showParticipants && (
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-lg flex flex-col">
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="font-semibold">Participants ({meeting.participants.length})</h3>
                <button onClick={() => setShowParticipants(false)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {meeting.participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <img 
                        src={p.avatar} 
                        alt={p.fullName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-sm">{p.fullName}</span>
                          {p.id === currentUser?.id && (
                            <span className="text-xs text-gray-400">(You)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          {p.isAudioOn ? '🎤' : '🔇'}
                          {p.isVideoOn ? '📹' : '📷'}
                          {p.isHandRaised && '✋'}
                          {p.role === 'host' && (
                            <span className="text-green-600 font-medium">• Host</span>
                          )}
                          {p.role === 'co-host' && (
                            <span className="text-blue-600 font-medium">• Co-host</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isHost && p.id !== currentUser?.id && (
                      <div className="flex gap-1">
                        {p.isAudioOn ? (
                          <button
                            onClick={() => muteParticipant(p.id)}
                            className="text-sm text-gray-500 hover:text-red-500"
                          >
                            🔇
                          </button>
                        ) : (
                          <button
                            onClick={() => unmuteParticipant(p.id)}
                            className="text-sm text-gray-500 hover:text-green-500"
                          >
                            🔊
                          </button>
                        )}
                        <button
                          onClick={() => removeParticipant(p.id)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                        <button
                          onClick={() => makeHost(p.id)}
                          className="text-sm text-gray-500 hover:text-blue-500"
                        >
                          👑
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Reactions Panel */}
          {showReactions && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4">
              <div className="flex flex-wrap gap-2 max-w-md">
                {['👍', '👎', '❤️', '😂', '😮', '😢', '🙏', '🎉', '🔥', '💯', '👋', '🚀'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      addReaction(emoji);
                      setShowReactions(false);
                    }}
                    className="text-3xl hover:bg-gray-100 p-2 rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Settings Panel */}
          {showSettings && (
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-lg flex flex-col">
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="font-semibold">Settings</h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Meeting Controls</h4>
                  <div className="space-y-2">
                    <button
                      onClick={toggleVideo}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded ${
                        isVideoOn ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>{isVideoOn ? '📹 Video On' : '📷 Video Off'}</span>
                      <span className="text-sm">{isVideoOn ? 'ON' : 'OFF'}</span>
                    </button>
                    <button
                      onClick={toggleAudio}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded ${
                        isAudioOn ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>{isAudioOn ? '🎤 Audio On' : '🔇 Audio Off'}</span>
                      <span className="text-sm">{isAudioOn ? 'ON' : 'OFF'}</span>
                    </button>
                    <button
                      onClick={toggleScreenShare}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded ${
                        isScreenSharing ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>{isScreenSharing ? '🖥️ Sharing' : '📺 Share Screen'}</span>
                      <span className="text-sm">{isScreenSharing ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Meeting Options</h4>
                  <div className="space-y-2">
                    <button
                      onClick={toggleHandRaise}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded ${
                        isHandRaised ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>{isHandRaised ? '✋ Hand Raised' : '🤚 Raise Hand'}</span>
                      <span className="text-sm">{isHandRaised ? 'ON' : 'OFF'}</span>
                    </button>
                    {isHost && (
                      <button
                        onClick={toggleRecording}
                        className={`w-full flex items-center justify-between px-4 py-2 rounded ${
                          isRecording ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span>{isRecording ? '⏺️ Recording' : '⏺️ Record'}</span>
                        <span className="text-sm">{isRecording ? 'ON' : 'OFF'}</span>
                      </button>
                    )}
                    {isHost && (
                      <button
                        onClick={() => {
                          setShowPolls(true);
                          setShowSettings(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        <span>📊 Create Poll</span>
                        <span className="text-sm">NEW</span>
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Meeting Info</h4>
                  <div className="text-sm space-y-1 text-gray-600">
                    <p>ID: {meeting.id}</p>
                    <p>Host: {hostUser?.fullName}</p>
                    <p>Duration: {formatDuration(meetingDuration)}</p>
                    <p>Participants: {meeting.participants.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Meeting Controls */}
        <div className="flex items-center justify-center gap-4 p-4 bg-gray-900">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-colors ${
              isAudioOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isAudioOn ? '🎤' : '🔇'}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isVideoOn ? '📹' : '📷'}
          </button>
          
          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full transition-colors ${
              isScreenSharing ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            🖥️
          </button>
          
          <button
            onClick={toggleHandRaise}
            className={`p-3 rounded-full transition-colors ${
              isHandRaised ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            ✋
          </button>
          
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            😊
          </button>
          
          <button
            onClick={leaveMeeting}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            📞
          </button>
        </div>
      </div>
    );
  };

  // --- Poll Modal ---
  const renderPollModal = () => {
    if (!showPolls) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-lg w-full p-6">
          <h3 className="text-xl font-bold mb-4">Create Poll</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
              {pollOptions.map((option, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                  {index > 1 && (
                    <button
                      onClick={() => removePollOption(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addPollOption}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add option
              </button>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={createPoll}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
              >
                Create Poll
              </button>
              <button
                onClick={() => {
                  setShowPolls(false);
                  setPollQuestion('');
                  setPollOptions(['', '']);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Recordings View ---
  const renderRecordings = () => {
    if (!showRecording) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Recordings</h3>
            <button onClick={() => setShowRecording(false)} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          
          {recordings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-2">🎥</p>
              <p>No recordings yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recordings.map(recording => (
                <div key={recording.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{recording.fileName}</h4>
                      <div className="text-sm text-gray-500 space-x-3">
                        <span>📅 {new Date(recording.createdAt).toLocaleDateString()}</span>
                        <span>⏱️ {formatDuration(recording.duration)}</span>
                        <span>📦 {formatFileSize(recording.fileSize)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {recording.status === 'ready' && (
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Play
                        </button>
                      )}
                      {recording.status === 'processing' && (
                        <span className="text-yellow-600 text-sm">Processing...</span>
                      )}
                      {recording.status === 'failed' && (
                        <span className="text-red-600 text-sm">Failed</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper function
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  // --- Main Render ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading meeting application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)]">
        {viewMode === 'join' ? renderJoinScreen() : renderMeetingView()}
        
        {/* Poll Modal */}
        {renderPollModal()}
        
        {/* Recordings Modal */}
        {renderRecordings()}
        
        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>© 2026 Video Conferencing - Day 9 Complete System</p>
          <p className="mt-1">Real-time meetings • Screen sharing • Chat • Polls • Reactions • Recording</p>
        </div>
      </div>
    </div>
  );
}