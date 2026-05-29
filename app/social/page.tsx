// app/social/page.tsx
// Complete Social Feed Platform with Posts, Comments, Likes, Sharing & User Profiles
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- TypeScript Interfaces ---
interface SocialUser {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  bio: string;
  location: string;
  website: string;
  followers: number;
  following: number;
  posts: number;
  isVerified: boolean;
  joinedAt: string;
  lastActive: string;
  interests: string[];
  socialLinks: {
    twitter?: string;
    instagram?: string;
    github?: string;
    linkedin?: string;
  };
  privacySettings: {
    profileVisibility: 'public' | 'followers' | 'private';
    showLastActive: boolean;
    showInterests: boolean;
  };
}

interface Post {
  id: string;
  userId: string;
  user: SocialUser;
  content: string;
  media: Media[];
  type: 'text' | 'image' | 'video' | 'link';
  linkPreview?: LinkPreview;
  likes: Like[];
  comments: Comment[];
  shares: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  visibility: 'public' | 'followers' | 'private';
  tags: string[];
  mentions: string[];
  poll?: Poll;
}

interface Media {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  caption?: string;
  width?: number;
  height?: number;
}

interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
}

interface Like {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  createdAt: string;
}

interface Comment {
  id: string;
  userId: string;
  user: SocialUser;
  content: string;
  likes: Like[];
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isPinned: boolean;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  createdAt: string;
  endsAt: string;
  isActive: boolean;
  userVoted?: boolean;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage?: number;
}

interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'share' | 'mention' | 'reply';
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  postId?: string;
  commentId?: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  read: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: Message;
  unreadCount: number;
  updatedAt: string;
}

// --- Utility Functions ---
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'Just now';
  }
};

const truncateText = (text: string, maxLength: number = 150): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

const parseMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex);
  return matches ? matches.map(m => m.slice(1)) : [];
};

const parseHashtags = (text: string): string[] => {
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex);
  return matches ? matches.map(m => m.slice(1)) : [];
};

// --- Mock Data ---
const getRandomAvatar = (name: string): string => {
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8', 'F7DC6F'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=128`;
};

const getInitialUsers = (): SocialUser[] => {
  const currentUser = JSON.parse(localStorage.getItem('auth_user') || 'null');
  
  return [
    {
      id: currentUser?.id || 'user1',
      username: currentUser?.username || 'rushi_dev',
      fullName: currentUser?.fullName || 'Rushi Sathavara',
      avatar: currentUser?.avatar || getRandomAvatar('Rushi Sathavara'),
      bio: 'Full-stack developer passionate about Next.js and TypeScript 🚀',
      location: 'San Francisco, CA',
      website: 'https://rushi.dev',
      followers: 1250,
      following: 340,
      posts: 45,
      isVerified: true,
      joinedAt: getCurrentTimestamp(),
      lastActive: getCurrentTimestamp(),
      interests: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
      socialLinks: {
        twitter: 'https://twitter.com/rushi_dev',
        github: 'https://github.com/rushi6767',
        linkedin: 'https://linkedin.com/in/rushi',
      },
      privacySettings: {
        profileVisibility: 'public',
        showLastActive: true,
        showInterests: true,
      },
    },
    {
      id: 'user2',
      username: 'sarah_codes',
      fullName: 'Sarah Johnson',
      avatar: getRandomAvatar('Sarah Johnson'),
      bio: 'UI/UX Designer & Frontend Developer ✨ Creating beautiful experiences',
      location: 'New York, NY',
      website: 'https://sarah.design',
      followers: 890,
      following: 210,
      posts: 32,
      isVerified: true,
      joinedAt: getCurrentTimestamp(),
      lastActive: getCurrentTimestamp(),
      interests: ['UI/UX', 'Design Systems', 'React', 'Figma'],
      socialLinks: {
        twitter: 'https://twitter.com/sarah_codes',
        instagram: 'https://instagram.com/sarah_designs',
        linkedin: 'https://linkedin.com/in/sarah',
      },
      privacySettings: {
        profileVisibility: 'public',
        showLastActive: true,
        showInterests: true,
      },
    },
    {
      id: 'user3',
      username: 'alex_tech',
      fullName: 'Alex Rivera',
      avatar: getRandomAvatar('Alex Rivera'),
      bio: 'DevOps Engineer | Cloud Architect | Open Source Contributor ☁️',
      location: 'Austin, TX',
      website: 'https://alex.tech',
      followers: 670,
      following: 180,
      posts: 28,
      isVerified: false,
      joinedAt: getCurrentTimestamp(),
      lastActive: getCurrentTimestamp(),
      interests: ['DevOps', 'Kubernetes', 'AWS', 'Python'],
      socialLinks: {
        github: 'https://github.com/alex_rivera',
        linkedin: 'https://linkedin.com/in/alexrivera',
      },
      privacySettings: {
        profileVisibility: 'followers',
        showLastActive: true,
        showInterests: true,
      },
    },
  ];
};

const getInitialPosts = (users: SocialUser[]): Post[] => {
  const currentUser = users[0];
  const user2 = users[1];
  const user3 = users[2];
  
  return [
    {
      id: generateId(),
      userId: currentUser.id,
      user: currentUser,
      content: "Just launched my new Next.js 15 portfolio! The new App Router and Server Components are game-changers. 🚀 #NextJS #WebDev #React\n\nI've completely rebuilt my portfolio using the latest Next.js features. The performance improvements are incredible!",
      media: [
        {
          id: generateId(),
          type: 'image',
          url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&h=400&fit=crop',
          caption: 'My new portfolio website built with Next.js 15',
          width: 600,
          height: 400,
        }
      ],
      type: 'text',
      linkPreview: {
        url: 'https://nextjs.org/blog/next-15',
        title: 'Next.js 15 Released',
        description: 'Next.js 15 brings improved performance, better developer experience, and new features.',
        image: 'https://nextjs.org/static/blog/next-15/og-image.png',
        siteName: 'Next.js Blog',
      },
      likes: [
        {
          id: generateId(),
          userId: user2.id,
          userName: user2.fullName,
          userAvatar: user2.avatar,
          createdAt: getCurrentTimestamp(),
        }
      ],
      comments: [
        {
          id: generateId(),
          userId: user2.id,
          user: user2,
          content: "This looks amazing! Can you share more about the performance improvements?",
          likes: [],
          replies: [
            {
              id: generateId(),
              userId: currentUser.id,
              user: currentUser,
              content: "Thanks Sarah! The server components really helped reduce client-side bundle size.",
              likes: [],
              replies: [],
              createdAt: getCurrentTimestamp(),
              updatedAt: getCurrentTimestamp(),
              isEdited: false,
              isPinned: false,
            }
          ],
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
          isEdited: false,
          isPinned: false,
        }
      ],
      shares: 12,
      views: 340,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isPinned: true,
      visibility: 'public',
      tags: ['NextJS', 'WebDev', 'React'],
      mentions: [],
      poll: undefined,
    },
    {
      id: generateId(),
      userId: user2.id,
      user: user2,
      content: "Just published a new blog post on Advanced TypeScript Patterns! 🎨\n\nI cover conditional types, mapped types, and template literal types with real-world examples.",
      media: [],
      type: 'text',
      linkPreview: {
        url: 'https://typescriptlang.org/docs/handbook/advanced-types.html',
        title: 'Advanced TypeScript Patterns',
        description: 'Deep dive into TypeScript\'s advanced type system',
        image: 'https://typescriptlang.org/images/typescript-og.png',
        siteName: 'TypeScript Handbook',
      },
      likes: [
        {
          id: generateId(),
          userId: currentUser.id,
          userName: currentUser.fullName,
          userAvatar: currentUser.avatar,
          createdAt: getCurrentTimestamp(),
        },
        {
          id: generateId(),
          userId: user3.id,
          userName: user3.fullName,
          userAvatar: user3.avatar,
          createdAt: getCurrentTimestamp(),
        }
      ],
      comments: [
        {
          id: generateId(),
          userId: currentUser.id,
          user: currentUser,
          content: "Great article! The section on template literal types was super helpful.",
          likes: [
            {
              id: generateId(),
              userId: user3.id,
              userName: user3.fullName,
              userAvatar: user3.avatar,
              createdAt: getCurrentTimestamp(),
            }
          ],
          replies: [],
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
          isEdited: false,
          isPinned: false,
        }
      ],
      shares: 8,
      views: 256,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isPinned: false,
      visibility: 'public',
      tags: ['TypeScript', 'Programming', 'WebDev'],
      mentions: [],
      poll: undefined,
    },
    {
      id: generateId(),
      userId: user3.id,
      user: user3,
      content: "What's your preferred cloud provider for hosting Next.js apps? Let's discuss! ☁️",
      media: [],
      type: 'text',
      linkPreview: undefined,
      likes: [],
      comments: [],
      shares: 0,
      views: 45,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isPinned: false,
      visibility: 'public',
      tags: ['Cloud', 'DevOps'],
      mentions: [],
      poll: {
        id: generateId(),
        question: 'Which cloud provider do you prefer?',
        options: [
          { id: generateId(), text: 'Vercel', votes: 15 },
          { id: generateId(), text: 'AWS', votes: 8 },
          { id: generateId(), text: 'Azure', votes: 3 },
          { id: generateId(), text: 'Google Cloud', votes: 5 },
        ],
        totalVotes: 31,
        createdAt: getCurrentTimestamp(),
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        userVoted: false,
      },
    },
  ];
};

// --- Main Component ---
export default function SocialPage() {
  const [isClient, setIsClient] = useState(false);
  const [users, setUsers] = useState<SocialUser[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<SocialUser | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // UI States
  const [viewMode, setViewMode] = useState<'feed' | 'profile' | 'notifications' | 'messages' | 'create' | 'explore'>('feed');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedUser, setSelectedUser] = useState<SocialUser | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
  // Post Creation
  const [postContent, setPostContent] = useState('');
  const [postMedia, setPostMedia] = useState<Media[]>([]);
  const [postVisibility, setPostVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [hasPoll, setHasPoll] = useState(false);
  
  // Comment States
  const [commentContent, setCommentContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  
  // Chat States
  const [messageContent, setMessageContent] = useState('');
  const [activeChatUser, setActiveChatUser] = useState<SocialUser | null>(null);
  
  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'text' | 'image' | 'video'>('all');
  const [activeTab, setActiveTab] = useState<'feed' | 'trending' | 'following'>('feed');

  // --- Effects ---
  useEffect(() => {
    setIsClient(true);
    
    // Load users
    const storedUsers = localStorage.getItem('social_users');
    let userList: SocialUser[];
    if (storedUsers) {
      try {
        userList = JSON.parse(storedUsers);
      } catch {
        userList = getInitialUsers();
      }
    } else {
      userList = getInitialUsers();
    }
    setUsers(userList);
    
    // Set current user
    const authUser = JSON.parse(localStorage.getItem('auth_user') || 'null');
    if (authUser) {
      const current = userList.find(u => u.id === authUser.id) || userList[0];
      setCurrentUser(current);
    } else {
      setCurrentUser(userList[0]);
    }
    
    // Load posts
    const storedPosts = localStorage.getItem('social_posts');
    if (storedPosts) {
      try {
        setPosts(JSON.parse(storedPosts));
      } catch {
        setPosts(getInitialPosts(userList));
      }
    } else {
      setPosts(getInitialPosts(userList));
    }
    
    // Load notifications
    const storedNotifications = localStorage.getItem('social_notifications');
    if (storedNotifications) {
      try {
        setNotifications(JSON.parse(storedNotifications));
      } catch {
        setNotifications([]);
      }
    }
  }, []);

  useEffect(() => {
    if (isClient && users.length > 0) {
      localStorage.setItem('social_users', JSON.stringify(users));
    }
  }, [users, isClient]);

  useEffect(() => {
    if (isClient && posts.length > 0) {
      localStorage.setItem('social_posts', JSON.stringify(posts));
    }
  }, [posts, isClient]);

  useEffect(() => {
    if (isClient && notifications.length > 0) {
      localStorage.setItem('social_notifications', JSON.stringify(notifications));
    }
  }, [notifications, isClient]);

  // --- Post Operations ---
  const createPost = useCallback(() => {
    if (!postContent.trim() && postMedia.length === 0) {
      alert('Please write something or add media');
      return;
    }
    
    if (!currentUser) return;
    
    const newPost: Post = {
      id: generateId(),
      userId: currentUser.id,
      user: currentUser,
      content: postContent.trim(),
      media: postMedia,
      type: postMedia.length > 0 ? 'image' : 'text',
      linkPreview: undefined, // Would parse links in real app
      likes: [],
      comments: [],
      shares: 0,
      views: 0,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isPinned: false,
      visibility: postVisibility,
      tags: parseHashtags(postContent),
      mentions: parseMentions(postContent),
      poll: hasPoll && pollQuestion.trim() && pollOptions.some(o => o.trim()) ? {
        id: generateId(),
        question: pollQuestion.trim(),
        options: pollOptions.filter(o => o.trim()).map(o => ({
          id: generateId(),
          text: o.trim(),
          votes: 0,
        })),
        totalVotes: 0,
        createdAt: getCurrentTimestamp(),
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        userVoted: false,
      } : undefined,
    };
    
    setPosts(prev => [newPost, ...prev]);
    resetPostForm();
    setViewMode('feed');
    
    // Create notifications for mentions
    const mentionedUsers = parseMentions(postContent);
    mentionedUsers.forEach(username => {
      const user = users.find(u => u.username === username);
      if (user && user.id !== currentUser.id) {
        const notification: Notification = {
          id: generateId(),
          userId: user.id,
          type: 'mention',
          fromUserId: currentUser.id,
          fromUserName: currentUser.fullName,
          fromUserAvatar: currentUser.avatar,
          postId: newPost.id,
          content: `${currentUser.fullName} mentioned you in a post`,
          read: false,
          createdAt: getCurrentTimestamp(),
        };
        setNotifications(prev => [notification, ...prev]);
      }
    });
  }, [postContent, postMedia, currentUser, postVisibility, hasPoll, pollQuestion, pollOptions, users]);

  const likePost = useCallback((postId: string) => {
    if (!currentUser) return;
    
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      
      const alreadyLiked = post.likes.some(like => like.userId === currentUser.id);
      
      if (alreadyLiked) {
        // Unlike
        return {
          ...post,
          likes: post.likes.filter(like => like.userId !== currentUser.id),
        };
      } else {
        // Like
        const newLike: Like = {
          id: generateId(),
          userId: currentUser.id,
          userName: currentUser.fullName,
          userAvatar: currentUser.avatar,
          createdAt: getCurrentTimestamp(),
        };
        
        // Create notification if not liking own post
        if (post.userId !== currentUser.id) {
          const notification: Notification = {
            id: generateId(),
            userId: post.userId,
            type: 'like',
            fromUserId: currentUser.id,
            fromUserName: currentUser.fullName,
            fromUserAvatar: currentUser.avatar,
            postId: post.id,
            content: `${currentUser.fullName} liked your post`,
            read: false,
            createdAt: getCurrentTimestamp(),
          };
          setNotifications(prev => [notification, ...prev]);
        }
        
        return {
          ...post,
          likes: [...post.likes, newLike],
        };
      }
    }));
  }, [currentUser]);

  const deletePost = useCallback((postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    setPosts(prev => prev.filter(post => post.id !== postId));
  }, []);

  const sharePost = useCallback((postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, shares: post.shares + 1 } : post
    ));
    
    const post = posts.find(p => p.id === postId);
    if (post && post.userId !== currentUser?.id) {
      const notification: Notification = {
        id: generateId(),
        userId: post.userId,
        type: 'share',
        fromUserId: currentUser?.id || '',
        fromUserName: currentUser?.fullName || '',
        fromUserAvatar: currentUser?.avatar || '',
        postId: post.id,
        content: `${currentUser?.fullName} shared your post`,
        read: false,
        createdAt: getCurrentTimestamp(),
      };
      setNotifications(prev => [notification, ...prev]);
    }
  }, [posts, currentUser]);

  // --- Comment Operations ---
  const addComment = useCallback((postId: string, content: string) => {
    if (!content.trim() || !currentUser) return;
    
    const newComment: Comment = {
      id: generateId(),
      userId: currentUser.id,
      user: currentUser,
      content: content.trim(),
      likes: [],
      replies: [],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isEdited: false,
      isPinned: false,
    };
    
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      
      // Create notification
      if (post.userId !== currentUser.id) {
        const notification: Notification = {
          id: generateId(),
          userId: post.userId,
          type: 'comment',
          fromUserId: currentUser.id,
          fromUserName: currentUser.fullName,
          fromUserAvatar: currentUser.avatar,
          postId: post.id,
          commentId: newComment.id,
          content: `${currentUser.fullName} commented on your post`,
          read: false,
          createdAt: getCurrentTimestamp(),
        };
        setNotifications(prev => [notification, ...prev]);
      }
      
      return {
        ...post,
        comments: [...post.comments, newComment],
      };
    }));
    
    setCommentContent('');
  }, [currentUser]);

  const addReply = useCallback((postId: string, commentId: string, content: string) => {
    if (!content.trim() || !currentUser) return;
    
    const newReply: Comment = {
      id: generateId(),
      userId: currentUser.id,
      user: currentUser,
      content: content.trim(),
      likes: [],
      replies: [],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isEdited: false,
      isPinned: false,
    };
    
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      
      return {
        ...post,
        comments: post.comments.map(comment => {
          if (comment.id !== commentId) return comment;
          
          // Create notification
          if (comment.userId !== currentUser.id) {
            const notification: Notification = {
              id: generateId(),
              userId: comment.userId,
              type: 'reply',
              fromUserId: currentUser.id,
              fromUserName: currentUser.fullName,
              fromUserAvatar: currentUser.avatar,
              postId: post.id,
              commentId: comment.id,
              content: `${currentUser.fullName} replied to your comment`,
              read: false,
              createdAt: getCurrentTimestamp(),
            };
            setNotifications(prev => [notification, ...prev]);
          }
          
          return {
            ...comment,
            replies: [...comment.replies, newReply],
          };
        }),
      };
    }));
    
    setReplyContent('');
    setReplyingTo(null);
  }, [currentUser]);

  const likeComment = useCallback((postId: string, commentId: string) => {
    if (!currentUser) return;
    
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      
      return {
        ...post,
        comments: post.comments.map(comment => {
          if (comment.id === commentId) {
            const alreadyLiked = comment.likes.some(like => like.userId === currentUser.id);
            return {
              ...comment,
              likes: alreadyLiked 
                ? comment.likes.filter(like => like.userId !== currentUser.id)
                : [...comment.likes, {
                    id: generateId(),
                    userId: currentUser.id,
                    userName: currentUser.fullName,
                    userAvatar: currentUser.avatar,
                    createdAt: getCurrentTimestamp(),
                  }],
            };
          }
          return {
            ...comment,
            replies: comment.replies.map(reply => {
              if (reply.id === commentId) {
                const alreadyLiked = reply.likes.some(like => like.userId === currentUser.id);
                return {
                  ...reply,
                  likes: alreadyLiked
                    ? reply.likes.filter(like => like.userId !== currentUser.id)
                    : [...reply.likes, {
                        id: generateId(),
                        userId: currentUser.id,
                        userName: currentUser.fullName,
                        userAvatar: currentUser.avatar,
                        createdAt: getCurrentTimestamp(),
                      }],
                };
              }
              return reply;
            }),
          };
        }),
      };
    }));
  }, [currentUser]);

  // --- Poll Operations ---
  const votePoll = useCallback((postId: string, optionId: string) => {
    if (!currentUser) return;
    
    setPosts(prev => prev.map(post => {
      if (post.id !== postId || !post.poll || post.poll.userVoted) return post;
      
      return {
        ...post,
        poll: {
          ...post.poll,
          options: post.poll.options.map(opt => 
            opt.id === optionId 
              ? { ...opt, votes: opt.votes + 1 }
              : opt
          ),
          totalVotes: post.poll.totalVotes + 1,
          userVoted: true,
        },
      };
    }));
  }, [currentUser]);

  // --- User Operations ---
  const followUser = useCallback((userId: string) => {
    if (!currentUser || userId === currentUser.id) return;
    
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        // Check if current user is following
        const isFollowing = user.followers > 0; // Simplified
        return {
          ...user,
          followers: isFollowing ? user.followers - 1 : user.followers + 1,
        };
      }
      if (user.id === currentUser.id) {
        return {
          ...user,
          following: user.following + 1,
        };
      }
      return user;
    }));
    
    // Create notification
    const targetUser = users.find(u => u.id === userId);
    if (targetUser) {
      const notification: Notification = {
        id: generateId(),
        userId: targetUser.id,
        type: 'follow',
        fromUserId: currentUser.id,
        fromUserName: currentUser.fullName,
        fromUserAvatar: currentUser.avatar,
        content: `${currentUser.fullName} followed you`,
        read: false,
        createdAt: getCurrentTimestamp(),
      };
      setNotifications(prev => [notification, ...prev]);
    }
  }, [currentUser, users]);

  // --- Messaging ---
  const sendMessage = useCallback(() => {
    if (!messageContent.trim() || !activeChatUser || !currentUser) return;
    
    const newMessage: Message = {
      id: generateId(),
      senderId: currentUser.id,
      receiverId: activeChatUser.id,
      content: messageContent.trim(),
      type: 'text',
      read: false,
      createdAt: getCurrentTimestamp(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessageContent('');
    
    // Update conversation
    setConversations(prev => {
      const existing = prev.find(c => 
        c.participants.includes(currentUser.id) && 
        c.participants.includes(activeChatUser.id)
      );
      
      if (existing) {
        return prev.map(c => 
          c.id === existing.id 
            ? { 
                ...c, 
                lastMessage: newMessage, 
                unreadCount: c.unreadCount + 1,
                updatedAt: getCurrentTimestamp(),
              }
            : c
        );
      } else {
        return [
          ...prev,
          {
            id: generateId(),
            participants: [currentUser.id, activeChatUser.id],
            lastMessage: newMessage,
            unreadCount: 1,
            updatedAt: getCurrentTimestamp(),
          },
        ];
      }
    });
  }, [messageContent, activeChatUser, currentUser]);

  // --- Form Handlers ---
  const resetPostForm = () => {
    setPostContent('');
    setPostMedia([]);
    setPostVisibility('public');
    setPollQuestion('');
    setPollOptions(['', '']);
    setHasPoll(false);
  };

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

  // --- Filtering ---
  const filteredPosts = useMemo(() => {
    let filtered = [...posts];
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.type === filterType);
    }
    
    // Filter by tab
    if (activeTab === 'following' && currentUser) {
      const followingIds = users.filter(u => 
        u.id !== currentUser.id && u.followers > 0 // Simplified following check
      ).map(u => u.id);
      filtered = filtered.filter(p => followingIds.includes(p.userId));
    }
    
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.content.toLowerCase().includes(term) ||
        p.tags.some(t => t.toLowerCase().includes(term)) ||
        p.user.fullName.toLowerCase().includes(term)
      );
    }
    
    // Sort by newest
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return filtered;
  }, [posts, filterType, activeTab, searchTerm, currentUser, users]);

  // --- Render Functions ---
  const renderPost = (post: Post) => {
    const isLiked = post.likes.some(like => like.userId === currentUser?.id);
    const isOwnPost = post.userId === currentUser?.id;
    
    return (
      <div key={post.id} className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-lg transition-shadow">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-3">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => {
              setSelectedUser(post.user);
              setViewMode('profile');
            }}
          >
            <img 
              src={post.user.avatar} 
              alt={post.user.fullName}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">{post.user.fullName}</span>
                {post.user.isVerified && (
                  <span className="text-blue-500 text-sm">✓</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>@{post.user.username}</span>
                <span>•</span>
                <span>{formatDate(post.createdAt)}</span>
                {post.visibility !== 'public' && (
                  <>
                    <span>•</span>
                    <span className="text-gray-400">
                      {post.visibility === 'followers' ? '🔒 Followers' : '🔐 Private'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {isOwnPost && (
            <button
              onClick={() => deletePost(post.id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              ⋮
            </button>
          )}
        </div>
        
        {/* Post Content */}
        <div 
          className="cursor-pointer"
          onClick={() => {
            setSelectedPost(post);
            setViewMode('feed'); // Keep in feed view, just show details
          }}
        >
          <p className="text-gray-800 whitespace-pre-wrap mb-3">{post.content}</p>
          
          {post.media.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {post.media.map(media => (
                <div key={media.id} className="rounded-lg overflow-hidden">
                  <img 
                    src={media.url} 
                    alt={media.caption || 'Post media'}
                    className="w-full h-48 object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          
          {post.linkPreview && (
            <div className="border rounded-lg p-3 mb-3 hover:bg-gray-50 transition-colors">
              <div className="flex gap-3">
                {post.linkPreview.image && (
                  <img 
                    src={post.linkPreview.image} 
                    alt={post.linkPreview.title}
                    className="w-24 h-24 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="text-xs text-gray-500">{post.linkPreview.siteName}</p>
                  <p className="font-medium text-sm">{post.linkPreview.title}</p>
                  <p className="text-xs text-gray-600">{truncateText(post.linkPreview.description, 100)}</p>
                </div>
              </div>
            </div>
          )}
          
          {post.poll && (
            <div className="bg-gray-50 rounded-lg p-4 mb-3">
              <h4 className="font-semibold mb-2">{post.poll.question}</h4>
              <div className="space-y-2">
                {post.poll.options.map(option => {
                  const percentage = post.poll.totalVotes > 0 
                    ? (option.votes / post.poll.totalVotes) * 100 
                    : 0;
                  const isVoted = post.poll?.userVoted;
                  
                  return (
                    <div key={option.id} className="relative">
                      <button
                        onClick={() => votePoll(post.id, option.id)}
                        disabled={isVoted}
                        className={`w-full text-left px-3 py-2 rounded border transition-colors ${
                          isVoted 
                            ? 'border-blue-500 bg-blue-50 cursor-default'
                            : 'border-gray-300 hover:border-blue-400 cursor-pointer'
                        }`}
                      >
                        <span className="text-sm">{option.text}</span>
                        <span className="float-right text-sm font-medium">
                          {Math.round(percentage)}%
                        </span>
                      </button>
                      <div 
                        className="absolute top-0 left-0 h-full bg-blue-100 rounded opacity-30 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {post.poll.totalVotes} votes • {formatDate(post.poll.endsAt)}
              </p>
            </div>
          )}
          
          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.map(tag => (
                <span 
                  key={tag} 
                  className="text-blue-600 text-sm hover:underline cursor-pointer"
                  onClick={() => setSearchTerm(`#${tag}`)}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Post Actions */}
        <div className="flex items-center gap-6 pt-3 border-t">
          <button
            onClick={() => likePost(post.id)}
            className={`flex items-center gap-1 transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            ❤️ <span className="text-sm">{post.likes.length}</span>
          </button>
          
          <button
            onClick={() => {
              setSelectedPost(post);
              setCommentContent('');
              document.getElementById('comment-input')?.focus();
            }}
            className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
          >
            💬 <span className="text-sm">{post.comments.length}</span>
          </button>
          
          <button
            onClick={() => sharePost(post.id)}
            className="flex items-center gap-1 text-gray-500 hover:text-green-500 transition-colors"
          >
            🔄 <span className="text-sm">{post.shares}</span>
          </button>
          
          <button className="flex items-center gap-1 text-gray-500 hover:text-purple-500 transition-colors ml-auto">
            📌
          </button>
        </div>
        
        {/* Comments Section */}
        {selectedPost?.id === post.id && (
          <div className="mt-4 pt-4 border-t">
            {/* Comment Input */}
            <div className="flex gap-2 mb-4">
              <img 
                src={currentUser?.avatar || getRandomAvatar('User')} 
                alt="Your avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <input
                id="comment-input"
                type="text"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addComment(post.id, commentContent);
                  }
                }}
              />
              <button
                onClick={() => addComment(post.id, commentContent)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                Post
              </button>
            </div>
            
            {/* Comments List */}
            <div className="space-y-3">
              {post.comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <img 
                    src={comment.user.avatar} 
                    alt={comment.user.fullName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{comment.user.fullName}</span>
                        <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-800">{comment.content}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <button 
                        onClick={() => likeComment(post.id, comment.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        ❤️ {comment.likes.length}
                      </button>
                      <button 
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-gray-500 hover:text-blue-500 transition-colors"
                      >
                        Reply
                      </button>
                    </div>
                    
                    {/* Replies */}
                    {comment.replies.length > 0 && (
                      <div className="ml-8 mt-2 space-y-2">
                        {comment.replies.map(reply => (
                          <div key={reply.id} className="flex gap-3">
                            <img 
                              src={reply.user.avatar} 
                              alt={reply.user.fullName}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <div className="bg-gray-50 rounded-lg p-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">{reply.user.fullName}</span>
                                  <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                                </div>
                                <p className="text-sm text-gray-800">{reply.content}</p>
                              </div>
                              <button 
                                onClick={() => likeComment(post.id, reply.id)}
                                className="text-xs text-gray-500 hover:text-red-500 transition-colors mt-1"
                              >
                                ❤️ {reply.likes.length}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Reply Input */}
                    {replyingTo === comment.id && (
                      <div className="flex gap-2 mt-2 ml-8">
                        <input
                          type="text"
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 border border-gray-300 rounded-full px-4 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addReply(post.id, comment.id, replyContent);
                            }
                          }}
                        />
                        <button
                          onClick={() => addReply(post.id, comment.id, replyContent)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-sm transition-colors"
                        >
                          Reply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProfile = () => {
    const user = selectedUser || currentUser;
    if (!user) return null;
    
    const userPosts = posts.filter(p => p.userId === user.id);
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <button
          onClick={() => {
            setViewMode('feed');
            setSelectedUser(null);
          }}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Feed
        </button>
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <img 
            src={user.avatar} 
            alt={user.fullName}
            className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{user.fullName}</h1>
              {user.isVerified && (
                <span className="text-blue-500 text-xl">✓</span>
              )}
            </div>
            <p className="text-gray-500 text-sm">@{user.username}</p>
            <p className="text-gray-700 mt-2">{user.bio}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              <span>📍 {user.location}</span>
              {user.website && <span>🔗 {user.website}</span>}
              <span>📅 Joined {formatDate(user.joinedAt)}</span>
            </div>
            <div className="flex gap-6 mt-3">
              <span className="font-semibold">{user.posts} <span className="font-normal text-gray-500">posts</span></span>
              <span className="font-semibold">{user.followers} <span className="font-normal text-gray-500">followers</span></span>
              <span className="font-semibold">{user.following} <span className="font-normal text-gray-500">following</span></span>
            </div>
            
            {currentUser && currentUser.id !== user.id && (
              <button
                onClick={() => followUser(user.id)}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-6 rounded-full transition-colors"
              >
                Follow
              </button>
            )}
          </div>
        </div>
        
        {/* Social Links */}
        {Object.keys(user.socialLinks).length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-2">Social Links</h3>
            <div className="flex gap-3">
              {user.socialLinks.twitter && (
                <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600">
                  🐦 Twitter
                </a>
              )}
              {user.socialLinks.instagram && (
                <a href={user.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-600">
                  📸 Instagram
                </a>
              )}
              {user.socialLinks.github && (
                <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-gray-900">
                  💻 GitHub
                </a>
              )}
              {user.socialLinks.linkedin && (
                <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900">
                  💼 LinkedIn
                </a>
              )}
            </div>
          </div>
        )}
        
        {/* User's Posts */}
        <div className="mt-8 pt-8 border-t">
          <h3 className="text-xl font-bold mb-4">Posts</h3>
          {userPosts.length === 0 ? (
            <p className="text-gray-500">No posts yet</p>
          ) : (
            userPosts.map(renderPost)
          )}
        </div>
      </div>
    );
  };

  const renderNotifications = () => (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <button
          onClick={() => setNotifications([])}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear all
        </button>
      </div>
      
      {notifications.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No notifications yet</p>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`flex items-center gap-3 p-3 rounded-lg ${
                notification.read ? 'bg-white' : 'bg-blue-50'
              } hover:bg-gray-50 transition-colors cursor-pointer`}
            >
              <img 
                src={notification.fromUserAvatar} 
                alt={notification.fromUserName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{notification.fromUserName}</span>
                  {' '}{notification.content}
                </p>
                <p className="text-xs text-gray-500">{formatDate(notification.createdAt)}</p>
              </div>
              {!notification.read && (
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreatePost = () => (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <button
        onClick={() => {
          setViewMode('feed');
          resetPostForm();
        }}
        className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2"
      >
        ← Cancel
      </button>
      
      <h2 className="text-2xl font-bold mb-6">Create Post</h2>
      
      <div className="space-y-4">
        {/* User Info */}
        {currentUser && (
          <div className="flex items-center gap-3">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.fullName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <span className="font-semibold">{currentUser.fullName}</span>
              <div className="text-xs text-gray-500">
                <select
                  value={postVisibility}
                  onChange={(e) => setPostVisibility(e.target.value as any)}
                  className="border border-gray-300 rounded px-2 py-0.5 text-xs"
                >
                  <option value="public">🌐 Public</option>
                  <option value="followers">🔒 Followers</option>
                  <option value="private">🔐 Private</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Content Input */}
        <textarea
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={4}
          className="w-full border border-gray-300 rounded-md px-4 py-3 focus:ring-2 focus:ring-blue-500"
        />
        
        {/* Media Upload (Mock) */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
          <p className="text-gray-500">📸 Click to add images or videos</p>
          <p className="text-xs text-gray-400">(Mock upload - add your own integration)</p>
        </div>
        
        {/* Poll Creation */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Add Poll</h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasPoll}
                onChange={(e) => setHasPoll(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {hasPoll && (
            <div className="space-y-3">
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Poll question"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              {pollOptions.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  {index > 1 && (
                    <button
                      onClick={() => removePollOption(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
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
          )}
        </div>
        
        {/* Submit */}
        <button
          onClick={createPost}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-lg transition-colors"
        >
          Post
        </button>
      </div>
    </div>
  );

  const renderFeed = () => (
    <div>
      {/* Feed Tabs */}
      <div className="flex gap-2 mb-6">
        {['feed', 'trending', 'following'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 text-lg">No posts to show</p>
          <p className="text-gray-400 text-sm">Be the first to share something!</p>
        </div>
      ) : (
        filteredPosts.map(renderPost)
      )}
    </div>
  );

  // --- Main Render ---
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading social platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <span>🤝</span> Social Feed
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                Day 5
              </span>
            </h1>
            <p className="text-gray-600 mt-1">Connect, share, and engage with your community</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search posts, users, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 md:w-64 border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {currentUser && (
              <>
                <button
                  onClick={() => setViewMode('create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full transition-colors"
                >
                  ✍️ New Post
                </button>
                
                <button
                  onClick={() => setViewMode('notifications')}
                  className="relative bg-white hover:bg-gray-100 text-gray-700 font-semibold py-2 px-3 rounded-full transition-colors"
                >
                  🔔
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setSelectedUser(currentUser);
                    setViewMode('profile');
                  }}
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500"
                >
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.fullName}
                    className="w-full h-full object-cover"
                  />
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Main Content */}
        {viewMode === 'feed' && renderFeed()}
        {viewMode === 'profile' && renderProfile()}
        {viewMode === 'notifications' && renderNotifications()}
        {viewMode === 'create' && renderCreatePost()}
        
        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-500 border-t pt-6">
          <p>© 2026 Social Feed Platform - Day 5 Complete System</p>
          <p className="mt-1">Built with Next.js, TypeScript, and Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}