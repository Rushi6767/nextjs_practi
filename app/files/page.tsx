// app/files/page.tsx
// Complete File Management & Cloud Storage System with Folder Organization, Sharing & Versioning
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// --- TypeScript Interfaces ---
interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size?: number;
  path: string;
  parentId: string | null;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
  lastAccessed?: string;
  isStarred: boolean;
  isShared: boolean;
  shareLink?: string;
  version: number;
  versions: FileVersion[];
  tags: string[];
  description?: string;
  thumbnail?: string;
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
    author?: string;
    title?: string;
  };
  permissions: FilePermissions;
  comments: FileComment[];
}

interface FileVersion {
  id: string;
  version: number;
  size: number;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  changes: string;
  isCurrent: boolean;
}

interface FilePermissions {
  owner: {
    read: boolean;
    write: boolean;
    share: boolean;
    delete: boolean;
  };
  sharedWith: SharedUser[];
  public: {
    read: boolean;
    write: boolean;
  };
}

interface SharedUser {
  userId: string;
  userName: string;
  userEmail: string;
  permissions: {
    read: boolean;
    write: boolean;
    share: boolean;
  };
  sharedAt: string;
}

interface FileComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  replies: FileComment[];
}

interface StorageStats {
  totalSpace: number;
  usedSpace: number;
  availableSpace: number;
  fileCount: number;
  folderCount: number;
  sharedItems: number;
  starredItems: number;
  recentFiles: FileItem[];
  storageByType: {
    type: string;
    count: number;
    size: number;
  }[];
}

interface UploadProgress {
  id: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  speed: number;
  size: number;
}

interface SearchFilters {
  type: 'all' | 'file' | 'folder';
  sortBy: 'name' | 'size' | 'date' | 'type';
  sortOrder: 'asc' | 'desc';
  dateRange?: {
    start: string;
    end: string;
  };
  minSize?: number;
  maxSize?: number;
  tags: string[];
}

// --- Utility Functions ---
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getFileIcon = (mimeType?: string, fileName?: string): string => {
  if (!mimeType && !fileName) return '📄';
  
  const extension = fileName?.split('.').pop()?.toLowerCase() || '';
  const mime = mimeType?.toLowerCase() || '';
  
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.startsWith('video/')) return '🎬';
  if (mime.startsWith('audio/')) return '🎵';
  if (mime.startsWith('application/pdf')) return '📕';
  if (mime.startsWith('application/zip') || extension === 'zip' || extension === 'rar') return '📦';
  if (mime.startsWith('text/') || extension === 'txt') return '📝';
  if (extension === 'doc' || extension === 'docx') return '📘';
  if (extension === 'xls' || extension === 'xlsx') return '📊';
  if (extension === 'ppt' || extension === 'pptx') return '📙';
  if (extension === 'js' || extension === 'ts' || extension === 'py' || extension === 'java') return '💻';
  if (extension === 'json' || extension === 'xml') return '📋';
  if (extension === 'svg' || extension === 'ai' || extension === 'psd') return '🎨';
  
  return '📄';
};

const getFileColor = (mimeType?: string): string => {
  const mime = mimeType?.toLowerCase() || '';
  
  if (mime.startsWith('image/')) return 'bg-purple-100 text-purple-700';
  if (mime.startsWith('video/')) return 'bg-pink-100 text-pink-700';
  if (mime.startsWith('audio/')) return 'bg-indigo-100 text-indigo-700';
  if (mime.startsWith('application/pdf')) return 'bg-red-100 text-red-700';
  if (mime.startsWith('application/zip')) return 'bg-yellow-100 text-yellow-700';
  if (mime.startsWith('text/')) return 'bg-blue-100 text-blue-700';
  if (mime.startsWith('application/msword') || mime.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml')) {
    return 'bg-sky-100 text-sky-700';
  }
  if (mime.startsWith('application/vnd.ms-excel') || mime.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml')) {
    return 'bg-green-100 text-green-700';
  }
  if (mime.startsWith('application/vnd.ms-powerpoint') || mime.startsWith('application/vnd.openxmlformats-officedocument.presentationml')) {
    return 'bg-orange-100 text-orange-700';
  }
  
  return 'bg-gray-100 text-gray-700';
};

// --- Mock Data Generation ---
const generateMockFiles = (userId: string, userName: string): FileItem[] => {
  const now = getCurrentTimestamp();
  const files: FileItem[] = [];
  
  // Create root folder
  const rootFolder: FileItem = {
    id: 'root',
    name: 'My Files',
    type: 'folder',
    path: '/',
    parentId: null,
    ownerId: userId,
    ownerName: userName,
    createdAt: now,
    updatedAt: now,
    isStarred: true,
    isShared: false,
    version: 1,
    versions: [],
    tags: ['root'],
    metadata: {},
    permissions: {
      owner: { read: true, write: true, share: true, delete: true },
      sharedWith: [],
      public: { read: false, write: false },
    },
    comments: [],
  };
  files.push(rootFolder);
  
  // Create subfolders
  const subfolders = [
    { name: 'Documents', icon: '📁' },
    { name: 'Images', icon: '🖼️' },
    { name: 'Videos', icon: '🎬' },
    { name: 'Music', icon: '🎵' },
    { name: 'Projects', icon: '💼' },
    { name: 'Archive', icon: '📦' },
  ];
  
  subfolders.forEach((folder, index) => {
    const folderId = generateId();
    files.push({
      id: folderId,
      name: folder.name,
      type: 'folder',
      path: `/${folder.name}`,
      parentId: 'root',
      ownerId: userId,
      ownerName: userName,
      createdAt: new Date(Date.now() - index * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - index * 86400000).toISOString(),
      isStarred: index < 2,
      isShared: index === 1,
      version: 1,
      versions: [],
      tags: [folder.name.toLowerCase()],
      metadata: {},
      permissions: {
        owner: { read: true, write: true, share: true, delete: true },
        sharedWith: [],
        public: { read: false, write: false },
      },
      comments: [],
    });
  });
  
  // Create files
  const fileTypes = [
    { name: 'Project_Report_2026.pdf', mime: 'application/pdf', size: 2457600, folder: 'Documents' },
    { name: 'Budget_Overview.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 589824, folder: 'Documents' },
    { name: 'Meeting_Notes.txt', mime: 'text/plain', size: 4096, folder: 'Documents' },
    { name: 'Profile_Picture.jpg', mime: 'image/jpeg', size: 1048576, folder: 'Images' },
    { name: 'Logo_Design.svg', mime: 'image/svg+xml', size: 24576, folder: 'Images' },
    { name: 'Screenshot_2026.png', mime: 'image/png', size: 3145728, folder: 'Images' },
    { name: 'Presentation.mp4', mime: 'video/mp4', size: 52428800, folder: 'Videos' },
    { name: 'Product_Demo.mp4', mime: 'video/mp4', size: 98765432, folder: 'Videos' },
    { name: 'Playlist.m3u', mime: 'audio/x-mpegurl', size: 1024, folder: 'Music' },
    { name: 'Album_Cover.jpg', mime: 'image/jpeg', size: 524288, folder: 'Music' },
    { name: 'Code_Base.zip', mime: 'application/zip', size: 15728640, folder: 'Projects' },
    { name: 'README.md', mime: 'text/markdown', size: 2048, folder: 'Projects' },
    { name: 'package.json', mime: 'application/json', size: 1024, folder: 'Projects' },
    { name: 'Old_Photos_2025.zip', mime: 'application/zip', size: 104857600, folder: 'Archive' },
    { name: 'Backup.sql', mime: 'text/plain', size: 10485760, folder: 'Archive' },
  ];
  
  fileTypes.forEach((file, index) => {
    const parentFolder = files.find(f => f.name === file.folder && f.type === 'folder');
    if (parentFolder) {
      const fileId = generateId();
      files.push({
        id: fileId,
        name: file.name,
        type: 'file',
        mimeType: file.mime,
        size: file.size,
        path: `/${file.folder}/${file.name}`,
        parentId: parentFolder.id,
        ownerId: userId,
        ownerName: userName,
        createdAt: new Date(Date.now() - (index + 10) * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - (index + 10) * 3600000).toISOString(),
        lastAccessed: new Date(Date.now() - (index + 5) * 3600000).toISOString(),
        isStarred: index % 3 === 0,
        isShared: index === 0 || index === 3,
        shareLink: index === 0 ? 'https://share.example.com/abc123' : undefined,
        version: 1,
        versions: [
          {
            id: generateId(),
            version: 1,
            size: file.size,
            createdAt: new Date(Date.now() - (index + 10) * 3600000).toISOString(),
            createdBy: userId,
            createdByName: userName,
            changes: 'Initial upload',
            isCurrent: true,
          }
        ],
        tags: [file.folder.toLowerCase(), file.name.split('.')[0].toLowerCase()],
        metadata: {
          author: userName,
          title: file.name.split('.')[0],
          ...(file.mime.startsWith('image/') ? { width: 1920, height: 1080 } : {}),
          ...(file.mime.startsWith('video/') ? { duration: 120 } : {}),
          ...(file.mime === 'application/pdf' ? { pages: 45 } : {}),
        },
        permissions: {
          owner: { read: true, write: true, share: true, delete: true },
          sharedWith: [],
          public: { read: false, write: false },
        },
        comments: [
          {
            id: generateId(),
            userId: 'user2',
            userName: 'Sarah Johnson',
            userAvatar: getRandomAvatar('Sarah Johnson'),
            content: 'Great work on this!',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            replies: [],
          }
        ],
      });
    }
  });
  
  return files;
};

const getRandomAvatar = (name: string): string => {
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8', 'F7DC6F'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=128`;
};

// --- Main Component ---
export default function FileManagerPage() {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('root');
  const [breadcrumbs, setBreadcrumbs] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showVersion, setShowVersion] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    tags: [],
  });
  
  // Upload State
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermissions, setSharePermissions] = useState({ read: true, write: false, share: false });
  
  // Comments
  const [commentInput, setCommentInput] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState<StorageStats | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    setIsClient(true);
    
    // Load user
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const authUser = JSON.parse(storedUser);
        setCurrentUser(authUser);
        
        // Generate mock files
        const userId = authUser.id || 'user1';
        const userName = authUser.fullName || authUser.username || 'User';
        const mockFiles = generateMockFiles(userId, userName);
        setFiles(mockFiles);
        
        // Calculate stats
        calculateStats(mockFiles, userId);
      } catch (error) {
        console.error('Failed to parse user:', error);
      }
    } else {
      // Guest user
      const mockFiles = generateMockFiles('guest', 'Guest User');
      setFiles(mockFiles);
      calculateStats(mockFiles, 'guest');
    }
    
    setIsLoading(false);
  }, []);

  const calculateStats = useCallback((fileList: FileItem[], userId: string) => {
    const totalSpace = 5 * 1024 * 1024 * 1024; // 5GB
    let usedSpace = 0;
    let fileCount = 0;
    let folderCount = 0;
    let sharedItems = 0;
    let starredItems = 0;
    const storageByType: { type: string; count: number; size: number }[] = [];
    const recentFiles: FileItem[] = [];
    
    fileList.forEach(file => {
      if (file.type === 'file') {
        fileCount++;
        usedSpace += file.size || 0;
        if (file.isShared) sharedItems++;
        if (file.isStarred) starredItems++;
        
        // Group by type
        const ext = file.name.split('.').pop()?.toLowerCase() || 'other';
        const existing = storageByType.find(s => s.type === ext);
        if (existing) {
          existing.count++;
          existing.size += file.size || 0;
        } else {
          storageByType.push({ type: ext, count: 1, size: file.size || 0 });
        }
        
        // Recent files (last 7 days)
        const fileDate = new Date(file.createdAt);
        const now = new Date();
        const diff = now.getTime() - fileDate.getTime();
        if (diff < 7 * 24 * 60 * 60 * 1000) {
          recentFiles.push(file);
        }
      } else {
        folderCount++;
      }
    });
    
    setStats({
      totalSpace,
      usedSpace,
      availableSpace: totalSpace - usedSpace,
      fileCount,
      folderCount,
      sharedItems,
      starredItems,
      recentFiles: recentFiles.slice(0, 10),
      storageByType: storageByType.slice(0, 10),
    });
  }, []);

  // --- Navigation ---
  const navigateToFolder = useCallback((folderId: string) => {
    setCurrentFolder(folderId);
    
    // Build breadcrumbs
    const newBreadcrumbs: FileItem[] = [];
    let currentId = folderId;
    while (currentId !== 'root') {
      const folder = files.find(f => f.id === currentId && f.type === 'folder');
      if (folder) {
        newBreadcrumbs.unshift(folder);
        currentId = folder.parentId || 'root';
      } else {
        break;
      }
    }
    // Add root
    const root = files.find(f => f.id === 'root' && f.type === 'folder');
    if (root) {
      newBreadcrumbs.unshift(root);
    }
    setBreadcrumbs(newBreadcrumbs);
    
    // Clear selection
    setSelectedFiles([]);
  }, [files]);

  // --- File Operations ---
  const createFolder = useCallback(() => {
    if (!newFolderName.trim() || !currentUser) return;
    
    const parent = files.find(f => f.id === currentFolder);
    const newFolder: FileItem = {
      id: generateId(),
      name: newFolderName.trim(),
      type: 'folder',
      path: parent ? `${parent.path}/${newFolderName.trim()}` : `/${newFolderName.trim()}`,
      parentId: currentFolder,
      ownerId: currentUser.id || 'user1',
      ownerName: currentUser.fullName || currentUser.username || 'User',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isStarred: false,
      isShared: false,
      version: 1,
      versions: [],
      tags: [newFolderName.trim().toLowerCase()],
      metadata: {},
      permissions: {
        owner: { read: true, write: true, share: true, delete: true },
        sharedWith: [],
        public: { read: false, write: false },
      },
      comments: [],
    };
    
    setFiles(prev => [...prev, newFolder]);
    setNewFolderName('');
    setShowNewFolder(false);
  }, [newFolderName, currentFolder, currentUser, files]);

  const deleteItem = useCallback((itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    setFiles(prev => prev.filter(f => f.id !== itemId));
    if (selectedFile?.id === itemId) {
      setSelectedFile(null);
      setShowPreview(false);
    }
    if (selectedFiles.includes(itemId)) {
      setSelectedFiles(prev => prev.filter(id => id !== itemId));
    }
  }, [selectedFile, selectedFiles]);

  const toggleStar = useCallback((itemId: string) => {
    setFiles(prev => prev.map(f => 
      f.id === itemId ? { ...f, isStarred: !f.isStarred } : f
    ));
  }, []);

  const toggleSelect = useCallback((itemId: string) => {
    setSelectedFiles(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const selectAll = useCallback(() => {
    const currentItems = getCurrentItems();
    if (selectedFiles.length === currentItems.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(currentItems.map(f => f.id));
    }
  }, [selectedFiles, currentFolder, files]);

  const renameItem = useCallback((itemId: string, newName: string) => {
    if (!newName.trim()) return;
    
    setFiles(prev => prev.map(f => 
      f.id === itemId ? { ...f, name: newName.trim(), updatedAt: getCurrentTimestamp() } : f
    ));
  }, []);

  // --- Upload ---
  const handleUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || !currentUser) return;
    
    const newUploads: UploadProgress[] = [];
    Array.from(fileList).forEach((file) => {
      const uploadId = generateId();
      newUploads.push({
        id: uploadId,
        fileName: file.name,
        progress: 0,
        status: 'uploading',
        speed: 0,
        size: file.size,
      });
      
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Create file item
          const newFile: FileItem = {
            id: generateId(),
            name: file.name,
            type: 'file',
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            path: `/${file.name}`,
            parentId: currentFolder,
            ownerId: currentUser.id || 'user1',
            ownerName: currentUser.fullName || currentUser.username || 'User',
            createdAt: getCurrentTimestamp(),
            updatedAt: getCurrentTimestamp(),
            isStarred: false,
            isShared: false,
            version: 1,
            versions: [{
              id: generateId(),
              version: 1,
              size: file.size,
              createdAt: getCurrentTimestamp(),
              createdBy: currentUser.id || 'user1',
              createdByName: currentUser.fullName || currentUser.username || 'User',
              changes: 'Uploaded file',
              isCurrent: true,
            }],
            tags: [file.name.split('.').pop()?.toLowerCase() || 'file'],
            metadata: {
              author: currentUser.fullName || 'User',
              title: file.name.split('.')[0],
            },
            permissions: {
              owner: { read: true, write: true, share: true, delete: true },
              sharedWith: [],
              public: { read: false, write: false },
            },
            comments: [],
          };
          
          setFiles(prev => [...prev, newFile]);
          setUploads(prev => prev.map(u => 
            u.id === uploadId ? { ...u, progress: 100, status: 'completed' } : u
          ));
        } else {
          setUploads(prev => prev.map(u => 
            u.id === uploadId ? { ...u, progress: Math.min(100, progress) } : u
          ));
        }
      }, 200);
    });
    
    setUploads(prev => [...prev, ...newUploads]);
    setShowUpload(true);
  }, [currentFolder, currentUser]);

  // --- Sharing ---
  const shareFile = useCallback((fileId: string, email: string) => {
    if (!email.trim()) return;
    
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;
      
      const newSharedUser: SharedUser = {
        userId: generateId(),
        userName: email.split('@')[0],
        userEmail: email.trim(),
        permissions: sharePermissions,
        sharedAt: getCurrentTimestamp(),
      };
      
      return {
        ...f,
        isShared: true,
        shareLink: `https://share.example.com/${generateId()}`,
        permissions: {
          ...f.permissions,
          sharedWith: [...f.permissions.sharedWith, newSharedUser],
        },
      };
    }));
    
    setShareEmail('');
    setShowShare(false);
    alert(`File shared with ${email}`);
  }, [sharePermissions]);

  // --- Comments ---
  const addComment = useCallback((fileId: string, content: string) => {
    if (!content.trim() || !currentUser) return;
    
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;
      
      const newComment: FileComment = {
        id: generateId(),
        userId: currentUser.id || 'guest',
        userName: currentUser.fullName || currentUser.username || 'Guest',
        userAvatar: getRandomAvatar(currentUser.fullName || 'Guest'),
        content: content.trim(),
        timestamp: getCurrentTimestamp(),
        replies: [],
      };
      
      return {
        ...f,
        comments: [...f.comments, newComment],
      };
    }));
    
    setCommentInput('');
  }, [currentUser]);

  const addReply = useCallback((fileId: string, commentId: string, content: string) => {
    if (!content.trim() || !currentUser) return;
    
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;
      
      return {
        ...f,
        comments: f.comments.map(c => {
          if (c.id !== commentId) return c;
          
          const newReply: FileComment = {
            id: generateId(),
            userId: currentUser.id || 'guest',
            userName: currentUser.fullName || currentUser.username || 'Guest',
            userAvatar: getRandomAvatar(currentUser.fullName || 'Guest'),
            content: content.trim(),
            timestamp: getCurrentTimestamp(),
            replies: [],
          };
          
          return {
            ...c,
            replies: [...c.replies, newReply],
          };
        }),
      };
    }));
    
    setReplyInput('');
    setReplyingTo(null);
  }, [currentUser]);

  // --- Versioning ---
  const createVersion = useCallback((fileId: string, changes: string) => {
    if (!currentUser) return;
    
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    const newVersion: FileVersion = {
      id: generateId(),
      version: (file.version || 1) + 1,
      size: file.size || 0,
      createdAt: getCurrentTimestamp(),
      createdBy: currentUser.id || 'guest',
      createdByName: currentUser.fullName || 'Guest',
      changes: changes || 'Updated file',
      isCurrent: true,
    };
    
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;
      
      // Mark previous versions as not current
      const updatedVersions = f.versions.map(v => ({ ...v, isCurrent: false }));
      
      return {
        ...f,
        version: newVersion.version,
        versions: [...updatedVersions, newVersion],
        updatedAt: getCurrentTimestamp(),
      };
    }));
    
    setShowVersion(false);
  }, [files, currentUser]);

  // --- Get Current Items ---
  const getCurrentItems = useCallback(() => {
    return files.filter(f => f.parentId === currentFolder || (currentFolder === 'root' && f.parentId === null));
  }, [files, currentFolder]);

  // --- Search & Filter ---
  const getFilteredItems = useCallback(() => {
    let items = getCurrentItems();
    
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(f => 
        f.name.toLowerCase().includes(term) ||
        f.tags.some(t => t.toLowerCase().includes(term)) ||
        f.ownerName.toLowerCase().includes(term)
      );
    }
    
    // Type filter
    if (filters.type !== 'all') {
      items = items.filter(f => f.type === filters.type);
    }
    
    // Tag filter
    if (filters.tags.length > 0) {
      items = items.filter(f => 
        f.tags.some(t => filters.tags.includes(t))
      );
    }
    
    // Sort
    items.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'type':
          comparison = (a.type || '').localeCompare(b.type || '');
          break;
        default:
          comparison = 0;
      }
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return items;
  }, [getCurrentItems, searchTerm, filters]);

  // --- Render Functions ---
  const renderFileGrid = () => {
    const items = getFilteredItems();
    
    if (items.length === 0) {
      return (
        <div className="text-center py-16 text-gray-500">
          <div className="text-6xl mb-4">📂</div>
          <p className="text-lg font-medium">This folder is empty</p>
          <p className="text-sm">Upload files or create a new folder</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map(item => (
          <div
            key={item.id}
            className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 ${
              selectedFiles.includes(item.id) ? 'border-blue-500' : 'border-transparent'
            }`}
            onClick={() => {
              if (item.type === 'folder') {
                navigateToFolder(item.id);
              } else {
                setSelectedFile(item);
                setShowPreview(true);
              }
            }}
          >
            <div className="relative p-4">
              <div className="flex items-center justify-center h-24 text-5xl">
                {item.type === 'folder' ? '📁' : getFileIcon(item.mimeType, item.name)}
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                {item.type === 'file' && (
                  <p className="text-xs text-gray-500">{formatFileSize(item.size || 0)}</p>
                )}
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                {item.isStarred && <span className="text-yellow-500 text-xs">⭐</span>}
                {item.isShared && <span className="text-blue-500 text-xs">🔗</span>}
              </div>
              <div 
                className="absolute top-2 left-2"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelect(item.id);
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(item.id)}
                  onChange={() => {}}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFileList = () => {
    const items = getFilteredItems();
    
    if (items.length === 0) {
      return (
        <div className="text-center py-16 text-gray-500">
          <div className="text-6xl mb-4">📂</div>
          <p className="text-lg font-medium">This folder is empty</p>
          <p className="text-sm">Upload files or create a new folder</p>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedFiles.length === items.length && items.length > 0}
                  onChange={selectAll}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modified</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </td>
                <td 
                  className="px-4 py-3 cursor-pointer"
                  onClick={() => {
                    if (item.type === 'folder') {
                      navigateToFolder(item.id);
                    } else {
                      setSelectedFile(item);
                      setShowPreview(true);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {item.type === 'folder' ? '📁' : getFileIcon(item.mimeType, item.name)}
                    </span>
                    <span className="font-medium text-gray-800">{item.name}</span>
                    {item.isStarred && <span className="text-yellow-500">⭐</span>}
                    {item.isShared && <span className="text-blue-500 text-xs">🔗</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {item.type === 'folder' ? 'Folder' : (item.mimeType?.split('/')[1]?.toUpperCase() || 'File')}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {item.type === 'file' ? formatFileSize(item.size || 0) : '--'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(item.updatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {item.type === 'file' && (
                      <button
                        onClick={() => {
                          setSelectedFile(item);
                          setShowPreview(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Preview
                      </button>
                    )}
                    <button
                      onClick={() => toggleStar(item.id)}
                      className="text-yellow-500 hover:text-yellow-700 text-sm"
                    >
                      {item.isStarred ? 'Unstar' : 'Star'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFile(item);
                        setShowShare(true);
                      }}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      Share
                    </button>
                    {item.type === 'file' && (
                      <button
                        onClick={() => {
                          setSelectedFile(item);
                          setShowVersion(true);
                        }}
                        className="text-purple-500 hover:text-purple-700 text-sm"
                      >
                        Versions
                      </button>
                    )}
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPreview = () => {
    if (!selectedFile) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getFileIcon(selectedFile.mimeType, selectedFile.name)}</span>
              <div>
                <h3 className="font-semibold">{selectedFile.name}</h3>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size || 0)} • {formatDate(selectedFile.createdAt)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowPreview(false);
                setSelectedFile(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-auto p-6 bg-gray-50">
            {selectedFile.mimeType?.startsWith('image/') ? (
              <div className="flex items-center justify-center h-full">
                <img 
                  src={`data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%23e5e7eb"/><text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="20" fill="%236b7280">Image Preview</text><text x="200" y="180" text-anchor="middle" font-family="Arial" font-size="14" fill="%239ca3af">${selectedFile.name}</text></svg>`}
                  alt={selectedFile.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : selectedFile.mimeType?.startsWith('video/') ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">🎬</div>
                  <p>Video Preview</p>
                  <p className="text-sm">{selectedFile.name}</p>
                </div>
              </div>
            ) : selectedFile.mimeType === 'application/pdf' ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">📕</div>
                  <p>PDF Preview</p>
                  <p className="text-sm">{selectedFile.name}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">{getFileIcon(selectedFile.mimeType, selectedFile.name)}</div>
                  <p>File Preview</p>
                  <p className="text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size || 0)}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* File Info */}
          <div className="p-4 border-t bg-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{selectedFile.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Size</p>
                <p className="font-medium">{formatFileSize(selectedFile.size || 0)}</p>
              </div>
              <div>
                <p className="text-gray-500">Modified</p>
                <p className="font-medium">{formatDate(selectedFile.updatedAt)}</p>
              </div>
              <div>
                <p className="text-gray-500">Owner</p>
                <p className="font-medium">{selectedFile.ownerName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUploadModal = () => {
    if (!showUpload) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Upload Files</h3>
            <button onClick={() => setShowUpload(false)} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <div className="text-4xl mb-2">📤</div>
            <p className="text-gray-600">Drag & drop files here or click to browse</p>
            <input
              type="file"
              multiple
              onChange={handleUpload}
              className="hidden"
              ref={fileInputRef}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Choose Files
            </button>
          </div>
          
          {uploads.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Upload Progress</h4>
              {uploads.map(upload => (
                <div key={upload.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{upload.fileName}</span>
                    <span>{upload.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <button
            onClick={() => setShowUpload(false)}
            className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const renderNewFolderModal = () => {
    if (!showNewFolder) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h3 className="text-xl font-bold mb-4">Create New Folder</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Folder Name</label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name..."
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    createFolder();
                  }
                }}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={createFolder}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewFolder(false);
                  setNewFolderName('');
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

  const renderShareModal = () => {
    if (!showShare || !selectedFile) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Share {selectedFile.type === 'folder' ? 'Folder' : 'File'}</h3>
            <button onClick={() => {
              setShowShare(false);
              setSelectedFile(null);
            }} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="Enter email..."
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sharePermissions.read}
                    onChange={(e) => setSharePermissions(prev => ({ ...prev, read: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Can view</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sharePermissions.write}
                    onChange={(e) => setSharePermissions(prev => ({ ...prev, write: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Can edit</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sharePermissions.share}
                    onChange={(e) => setSharePermissions(prev => ({ ...prev, share: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Can share</span>
                </label>
              </div>
            </div>
            
            {selectedFile.shareLink && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium">Share Link</p>
                <p className="text-xs text-gray-500 break-all">{selectedFile.shareLink}</p>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(selectedFile.shareLink || '');
                    alert('Link copied to clipboard!');
                  }}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Copy Link
                </button>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => shareFile(selectedFile.id, shareEmail)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
              >
                Share
              </button>
              <button
                onClick={() => {
                  setShowShare(false);
                  setSelectedFile(null);
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

  const renderVersionModal = () => {
    if (!showVersion || !selectedFile) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Version History</h3>
            <button onClick={() => {
              setShowVersion(false);
              setSelectedFile(null);
            }} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            {selectedFile.versions.map((version, index) => (
              <div key={version.id} className={`border rounded-lg p-4 ${
                version.isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Version {version.version}</span>
                      {version.isCurrent && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">Current</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{version.changes}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span>{formatFileSize(version.size)}</span>
                      <span>•</span>
                      <span>{formatDate(version.createdAt)}</span>
                      <span>•</span>
                      <span>By {version.createdByName}</span>
                    </div>
                  </div>
                  {!version.isCurrent && (
                    <button
                      onClick={() => {
                        // Restore version
                        setFiles(prev => prev.map(f => {
                          if (f.id !== selectedFile.id) return f;
                          return {
                            ...f,
                            versions: f.versions.map(v => ({
                              ...v,
                              isCurrent: v.id === version.id,
                            })),
                            version: version.version,
                            size: version.size,
                            updatedAt: getCurrentTimestamp(),
                          };
                        }));
                        setShowVersion(false);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2">Create New Version</h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Describe changes..."
                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    createVersion(selectedFile.id, e.currentTarget.value);
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Describe changes..."]') as HTMLInputElement;
                  if (input) {
                    createVersion(selectedFile.id, input.value);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Save Version
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Main Render ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading file manager...</p>
        </div>
      </div>
    );
  }

  const currentItems = getCurrentItems();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <span>📁</span> File Manager
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                Day 10
              </span>
            </h1>
            <p className="text-gray-600 mt-1">Organize, share, and manage your files</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="bg-white hover:bg-gray-100 text-gray-700 p-2 rounded-lg shadow-sm transition-colors"
            >
              {viewMode === 'grid' ? '📋' : '📐'}
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
            >
              📤 Upload
            </button>
            <button
              onClick={() => setShowNewFolder(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
            >
              📁 New Folder
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-xs text-gray-500">Storage Used</p>
              <p className="text-lg font-bold text-blue-600">
                {formatFileSize(stats.usedSpace)} / {formatFileSize(stats.totalSpace)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-xs text-gray-500">Files</p>
              <p className="text-lg font-bold text-gray-800">{stats.fileCount}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-xs text-gray-500">Folders</p>
              <p className="text-lg font-bold text-gray-800">{stats.folderCount}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-xs text-gray-500">Shared</p>
              <p className="text-lg font-bold text-purple-600">{stats.sharedItems}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-xs text-gray-500">Starred</p>
              <p className="text-lg font-bold text-yellow-600">{stats.starredItems}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-xs text-gray-500">Available</p>
              <p className="text-lg font-bold text-green-600">{formatFileSize(stats.availableSpace)}</p>
            </div>
          </div>
        )}

        {/* Breadcrumbs & Search */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.id}>
                  {index > 0 && <span className="text-gray-400">›</span>}
                  <button
                    onClick={() => navigateToFolder(crumb.id)}
                    className="text-sm hover:text-blue-600 transition-colors"
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
              <option value="date">Sort by Date</option>
              <option value="type">Sort by Type</option>
            </select>
            <button
              onClick={() => setFilters(prev => ({ 
                ...prev, 
                sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
              }))}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {filters.sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* File Display */}
        <div className="bg-white rounded-lg shadow-md p-4">
          {viewMode === 'grid' ? renderFileGrid() : renderFileList()}
        </div>

        {/* Modals */}
        {renderUploadModal()}
        {renderNewFolderModal()}
        {renderShareModal()}
        {renderVersionModal()}
        {renderPreview()}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500 border-t pt-6">
          <p>© 2026 File Management System - Day 10 Complete System</p>
          <p className="mt-1">Organize • Share • Collaborate • Version Control</p>
          <p className="mt-1 text-gray-400">
            {currentItems.length} items in {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1]?.name || 'root' : 'root'}
          </p>
        </div>
      </div>
    </div>
  );
}