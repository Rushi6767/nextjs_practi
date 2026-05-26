// app/auth/page.tsx
// Complete Authentication System with Login, Signup, Password Reset & Profile Management
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// --- TypeScript Interfaces ---
interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinDate: string;
  lastLogin: string;
  isVerified: boolean;
  preferences: UserPreferences;
  security: SecuritySettings;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketing: boolean;
  taskUpdates: boolean;
  weeklyDigest: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'contacts';
  showEmail: boolean;
  showLocation: boolean;
  showActivity: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  loginHistory: LoginEntry[];
  activeSessions: Session[];
}

interface LoginEntry {
  id: string;
  timestamp: string;
  ipAddress: string;
  device: string;
  location: string;
  success: boolean;
}

interface Session {
  id: string;
  device: string;
  browser: string;
  ipAddress: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
}

interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
  username?: string;
  fullName?: string;
  rememberMe?: boolean;
}

// --- Utility Functions ---
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

const formatDate = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must contain at least one special character');
  return { valid: errors.length === 0, errors };
};

// --- Mock User Database ---
const createMockUser = (email: string, username: string, fullName: string, password: string): User => {
  return {
    id: generateId(),
    email,
    username,
    fullName,
    bio: 'Hello, I\'m new here!',
    location: 'Earth',
    website: '',
    joinDate: getCurrentTimestamp(),
    lastLogin: getCurrentTimestamp(),
    isVerified: false,
    preferences: {
      theme: 'system',
      language: 'en-US',
      notifications: {
        email: true,
        push: true,
        sms: false,
        marketing: false,
        taskUpdates: true,
        weeklyDigest: true,
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: false,
        showLocation: true,
        showActivity: true,
      },
    },
    security: {
      twoFactorEnabled: false,
      lastPasswordChange: getCurrentTimestamp(),
      loginHistory: [],
      activeSessions: [],
    },
  };
};

// --- Main Component ---
export default function AuthPage() {
  const router = useRouter();
  
  // State Management
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // UI Mode: 'login' | 'signup' | 'reset' | 'profile' | 'settings'
  const [mode, setMode] = useState<'login' | 'signup' | 'reset' | 'profile' | 'settings'>('login');
  
  // Form Data
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    fullName: '',
    rememberMe: false,
  });
  
  // Password reset email
  const [resetEmail, setResetEmail] = useState('');
  
  // Profile editing
  const [profileData, setProfileData] = useState({
    fullName: '',
    bio: '',
    location: '',
    website: '',
    username: '',
  });
  
  // Settings editing
  const [settingsData, setSettingsData] = useState({
    theme: 'system' as 'light' | 'dark' | 'system',
    language: 'en-US',
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false,
      taskUpdates: true,
      weeklyDigest: true,
    },
    privacy: {
      profileVisibility: 'public' as 'public' | 'private' | 'contacts',
      showEmail: false,
      showLocation: true,
      showActivity: true,
    },
  });

  // --- Effects ---
  useEffect(() => {
    setIsClient(true);
    // Check for existing session
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        setCurrentUser(user);
        // Update last login
        const updatedUser = {
          ...user,
          lastLogin: getCurrentTimestamp(),
        };
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        setMode('profile');
      } catch (error) {
        console.error('Failed to parse user session:', error);
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser && isClient) {
      localStorage.setItem('auth_user', JSON.stringify(currentUser));
    }
  }, [currentUser, isClient]);

  // --- Authentication Handlers ---
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { email, password, rememberMe } = formData;
      
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      // Mock validation - in real app, this would be an API call
      const storedUsers = JSON.parse(localStorage.getItem('auth_users') || '[]');
      const user = storedUsers.find((u: any) => u.email === email);
      
      if (!user) {
        throw new Error('No account found with this email');
      }
      
      // In a real app, you'd verify the password hash
      // This is a mock - we'll accept any password for demo
      
      // Create login history entry
      const loginEntry: LoginEntry = {
        id: generateId(),
        timestamp: getCurrentTimestamp(),
        ipAddress: '192.168.1.1', // Mock IP
        device: 'Chrome on Windows',
        location: 'Unknown Location',
        success: true,
      };
      
      const updatedUser = {
        ...user,
        lastLogin: getCurrentTimestamp(),
        security: {
          ...user.security,
          loginHistory: [loginEntry, ...(user.security.loginHistory || [])],
          activeSessions: [
            ...(user.security.activeSessions || []),
            {
              id: generateId(),
              device: 'Chrome on Windows',
              browser: 'Chrome 120',
              ipAddress: '192.168.1.1',
              lastActive: getCurrentTimestamp(),
              createdAt: getCurrentTimestamp(),
              isCurrent: true,
            },
          ],
        },
      };
      
      // Update stored user
      const updatedUsers = storedUsers.map((u: any) => 
        u.id === user.id ? updatedUser : u
      );
      localStorage.setItem('auth_users', JSON.stringify(updatedUsers));
      
      setCurrentUser(updatedUser);
      setSuccessMessage('Welcome back! Login successful.');
      
      // Redirect or show profile
      setTimeout(() => {
        setMode('profile');
        setIsLoading(false);
      }, 1000);
      
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  }, [formData]);

  const handleSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { email, password, confirmPassword, username, fullName } = formData;
      
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      if (!username || username.length < 3) {
        throw new Error('Username must be at least 3 characters');
      }
      
      if (!fullName || fullName.length < 2) {
        throw new Error('Please enter your full name');
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors.join('. '));
      }
      
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Check if user already exists
      const storedUsers = JSON.parse(localStorage.getItem('auth_users') || '[]');
      if (storedUsers.some((u: any) => u.email === email)) {
        throw new Error('An account with this email already exists');
      }
      if (storedUsers.some((u: any) => u.username === username)) {
        throw new Error('This username is already taken');
      }
      
      // Create new user
      const newUser = createMockUser(email, username, fullName, password);
      
      // Save to mock database
      storedUsers.push(newUser);
      localStorage.setItem('auth_users', JSON.stringify(storedUsers));
      
      // Auto-login
      setCurrentUser(newUser);
      setSuccessMessage('Account created successfully! Welcome to the platform.');
      
      setTimeout(() => {
        setMode('profile');
        setIsLoading(false);
      }, 1000);
      
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
      setIsLoading(false);
    }
  }, [formData]);

  const handlePasswordReset = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (!validateEmail(resetEmail)) {
        throw new Error('Please enter a valid email address');
      }
      
      // Check if user exists
      const storedUsers = JSON.parse(localStorage.getItem('auth_users') || '[]');
      const user = storedUsers.find((u: any) => u.email === resetEmail);
      
      if (!user) {
        throw new Error('No account found with this email');
      }
      
      setSuccessMessage('Password reset link has been sent to your email!');
      setTimeout(() => {
        setMode('login');
        setIsLoading(false);
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Password reset failed. Please try again.');
      setIsLoading(false);
    }
  }, [resetEmail]);

  const handleLogout = useCallback(() => {
    if (window.confirm('Are you sure you want to log out?')) {
      // Remove active session
      if (currentUser) {
        const storedUsers = JSON.parse(localStorage.getItem('auth_users') || '[]');
        const updatedUsers = storedUsers.map((u: any) => {
          if (u.id === currentUser.id) {
            return {
              ...u,
              security: {
                ...u.security,
                activeSessions: u.security.activeSessions.filter((s: Session) => !s.isCurrent),
              },
            };
          }
          return u;
        });
        localStorage.setItem('auth_users', JSON.stringify(updatedUsers));
      }
      
      localStorage.removeItem('auth_user');
      setCurrentUser(null);
      setMode('login');
      setSuccessMessage('You have been logged out successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  }, [currentUser]);

  const handleUpdateProfile = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!currentUser) throw new Error('No user logged in');
      
      const updatedUser = {
        ...currentUser,
        fullName: profileData.fullName || currentUser.fullName,
        bio: profileData.bio || currentUser.bio,
        location: profileData.location || currentUser.location,
        website: profileData.website || currentUser.website,
        username: profileData.username || currentUser.username,
      };
      
      // Update in storage
      const storedUsers = JSON.parse(localStorage.getItem('auth_users') || '[]');
      const updatedUsers = storedUsers.map((u: any) => 
        u.id === currentUser.id ? updatedUser : u
      );
      localStorage.setItem('auth_users', JSON.stringify(updatedUsers));
      
      setCurrentUser(updatedUser);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      setIsLoading(false);
      
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      setIsLoading(false);
    }
  }, [currentUser, profileData]);

  const handleUpdateSettings = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!currentUser) throw new Error('No user logged in');
      
      const updatedUser = {
        ...currentUser,
        preferences: {
          theme: settingsData.theme,
          language: settingsData.language,
          notifications: settingsData.notifications,
          privacy: settingsData.privacy,
        },
      };
      
      // Update in storage
      const storedUsers = JSON.parse(localStorage.getItem('auth_users') || '[]');
      const updatedUsers = storedUsers.map((u: any) => 
        u.id === currentUser.id ? updatedUser : u
      );
      localStorage.setItem('auth_users', JSON.stringify(updatedUsers));
      
      setCurrentUser(updatedUser);
      setSuccessMessage('Settings updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      setIsLoading(false);
      
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
      setIsLoading(false);
    }
  }, [currentUser, settingsData]);

  // --- Form Handlers ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // --- Render Functions ---
  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleFormChange}
          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="you@example.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleFormChange}
          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••••"
          required
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleFormChange}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <span className="ml-2 text-sm text-gray-600">Remember me</span>
        </label>
        <button
          type="button"
          onClick={() => setMode('reset')}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Forgot password?
        </button>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Logging in...' : 'Sign In'}
      </button>
      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={() => setMode('signup')}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Sign up
        </button>
      </p>
    </form>
  );

  const renderSignupForm = () => (
    <form onSubmit={handleSignup} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Full Name</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleFormChange}
          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
          placeholder="John Doe"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Username</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleFormChange}
          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
          placeholder="johndoe"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleFormChange}
          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
          placeholder="you@example.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleFormChange}
          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
          required
        />
        <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters with uppercase, lowercase, number, and special character</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleFormChange}
          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
          required
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </button>
      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => setMode('login')}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Sign in
        </button>
      </p>
    </form>
  );

  const renderResetForm = () => (
    <form onSubmit={handlePasswordReset} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Email Address</label>
        <input
          type="email"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
          placeholder="you@example.com"
          required
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Sending...' : 'Send Reset Link'}
      </button>
      <button
        type="button"
        onClick={() => setMode('login')}
        className="w-full text-center text-sm text-gray-600 hover:text-gray-800"
      >
        ← Back to Sign In
      </button>
    </form>
  );

  const renderProfile = () => {
    if (!currentUser) return null;
    
    // Initialize profile data for editing
    if (!profileData.fullName) {
      setProfileData({
        fullName: currentUser.fullName,
        bio: currentUser.bio || '',
        location: currentUser.location || '',
        website: currentUser.website || '',
        username: currentUser.username,
      });
    }
    
    return (
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl">
              {currentUser.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{currentUser.fullName}</h2>
              <p className="text-blue-100">@{currentUser.username}</p>
              <p className="text-sm text-blue-100 mt-1">Joined {formatDate(currentUser.joinDate)}</p>
              {currentUser.isVerified && (
                <span className="inline-block mt-1 bg-green-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                value={profileData.fullName}
                onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={profileData.username}
                onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
                className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us about yourself..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={profileData.location}
                onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="City, Country"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input
                type="url"
                value={profileData.website}
                onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => setMode('settings')}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-md transition-colors"
          >
            ⚙️ Settings
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-md transition-colors"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    if (!currentUser) return null;
    
    if (!settingsData.theme) {
      setSettingsData({
        theme: currentUser.preferences.theme,
        language: currentUser.preferences.language,
        notifications: currentUser.preferences.notifications,
        privacy: currentUser.preferences.privacy,
      });
    }
    
    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          <form onSubmit={handleUpdateSettings} className="space-y-6">
            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Theme</label>
              <select
                value={settingsData.theme}
                onChange={(e) => setSettingsData(prev => ({ 
                  ...prev, 
                  theme: e.target.value as 'light' | 'dark' | 'system' 
                }))}
                className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Language</label>
              <select
                value={settingsData.language}
                onChange={(e) => setSettingsData(prev => ({ ...prev, language: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
                <option value="ja">Japanese</option>
              </select>
            </div>

            {/* Notifications */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Notification Preferences</h4>
              <div className="space-y-2">
                {Object.entries(settingsData.notifications).map(([key, value]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setSettingsData(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, [key]: e.target.checked }
                      }))}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Privacy */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Privacy Settings</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600">Profile Visibility</label>
                  <select
                    value={settingsData.privacy.profileVisibility}
                    onChange={(e) => setSettingsData(prev => ({
                      ...prev,
                      privacy: { 
                        ...prev.privacy, 
                        profileVisibility: e.target.value as 'public' | 'private' | 'contacts' 
                      }
                    }))}
                    className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="contacts">Contacts Only</option>
                  </select>
                </div>
                {Object.entries(settingsData.privacy).map(([key, value]) => {
                  if (key === 'profileVisibility') return null;
                  return (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setSettingsData(prev => ({
                          ...prev,
                          privacy: { ...prev.privacy, [key]: e.target.checked }
                        }))}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-600 capitalize">
                        Show {key.replace('show', '').toLowerCase() || key}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>

        <button
          onClick={() => setMode('profile')}
          className="text-gray-600 hover:text-gray-800 text-sm"
        >
          ← Back to Profile
        </button>
      </div>
    );
  };

  // --- Main Render ---
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🔐</div>
          <h1 className="text-3xl font-bold text-gray-800">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'reset' && 'Reset Password'}
            {mode === 'profile' && 'My Profile'}
            {mode === 'settings' && 'Settings'}
          </h1>
          <p className="text-gray-600 mt-1">
            {mode === 'login' && 'Sign in to your account'}
            {mode === 'signup' && 'Join our community today'}
            {mode === 'reset' && 'We\'ll send you a reset link'}
            {mode === 'profile' && 'Manage your profile information'}
            {mode === 'settings' && 'Customize your experience'}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            {successMessage}
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white p-8 rounded-lg shadow-lg">
          {mode === 'login' && renderLoginForm()}
          {mode === 'signup' && renderSignupForm()}
          {mode === 'reset' && renderResetForm()}
          {mode === 'profile' && renderProfile()}
          {mode === 'settings' && renderSettings()}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>© 2026 Task Dashboard - Secure Authentication System</p>
          <p className="mt-1">Day 2 - Complete Auth System</p>
        </div>
      </div>
    </div>
  );
}