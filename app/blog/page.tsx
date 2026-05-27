// app/blog/page.tsx
// Complete Blog Platform with Rich Text Editing, Categories, Tags, Comments & Publishing
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- TypeScript Interfaces ---
interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  authorId: string;
  status: 'draft' | 'published' | 'archived';
  featuredImage?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  views: number;
  likes: number;
  comments: Comment[];
  readTime: number;
  isFeatured: boolean;
  slug: string;
}

interface Comment {
  id: string;
  postId: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: string;
  likes: number;
  replies: Comment[];
  isEdited: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  postCount: number;
  color: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

interface User {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  bio: string;
}

// --- Utility Functions ---
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

const formatDate = (timestamp: string): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateShort = (timestamp: string): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-');
};

const calculateReadTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

// --- Mock Data ---
const getInitialCategories = (): Category[] => [
  { id: generateId(), name: 'Technology', slug: 'technology', description: 'Latest in tech and innovation', postCount: 0, color: '#3B82F6' },
  { id: generateId(), name: 'Lifestyle', slug: 'lifestyle', description: 'Health, wellness, and living', postCount: 0, color: '#10B981' },
  { id: generateId(), name: 'Travel', slug: 'travel', description: 'Adventures and destinations', postCount: 0, color: '#F59E0B' },
  { id: generateId(), name: 'Food', slug: 'food', description: 'Recipes and culinary experiences', postCount: 0, color: '#EF4444' },
  { id: generateId(), name: 'Business', slug: 'business', description: 'Entrepreneurship and finance', postCount: 0, color: '#8B5CF6' },
];

const getInitialTags = (): Tag[] => [
  { id: generateId(), name: 'JavaScript', slug: 'javascript', postCount: 0 },
  { id: generateId(), name: 'React', slug: 'react', postCount: 0 },
  { id: generateId(), name: 'Next.js', slug: 'nextjs', postCount: 0 },
  { id: generateId(), name: 'TypeScript', slug: 'typescript', postCount: 0 },
  { id: generateId(), name: 'Tailwind CSS', slug: 'tailwind', postCount: 0 },
];

const getInitialPosts = (): BlogPost[] => {
  const currentUser = JSON.parse(localStorage.getItem('auth_user') || 'null');
  const authorId = currentUser?.id || 'system';
  const authorName = currentUser?.fullName || 'System User';
  
  return [
    {
      id: generateId(),
      title: 'Getting Started with Next.js 15: A Comprehensive Guide',
      content: `# Getting Started with Next.js 15

Next.js 15 brings exciting new features and improvements. In this comprehensive guide, we'll explore everything you need to know to build modern web applications with Next.js.

## Key Features

1. **Server Components**: Improved performance with server-side rendering
2. **Client Components**: Interactive elements with client-side hydration
3. **App Router**: File-based routing with nested layouts
4. **Data Fetching**: Server-side data fetching with async components
5. **Image Optimization**: Automatic image optimization with next/image
6. **Font Optimization**: Built-in font optimization with next/font
7. **Middleware**: Powerful middleware for request handling
8. **API Routes**: Full-stack development with API routes

## Getting Started

To create a new Next.js project, run:

\`\`\`bash
npx create-next-app@latest my-app
cd my-app
npm run dev
\`\`\`

## Building Your First Page

Create a new file \`app/page.tsx\`:

\`\`\`tsx
export default function Home() {
  return <h1>Hello, Next.js!</h1>;
}
\`\`\`

This will automatically create a route at the root of your application.

## Conclusion

Next.js 15 makes it easier than ever to build full-stack React applications. With the App Router, Server Components, and improved performance, you can create fast, SEO-friendly web applications with ease.`,
      excerpt: 'Learn everything you need to know about Next.js 15, from setup to advanced features. Perfect for beginners and experienced developers alike.',
      category: 'Technology',
      tags: ['Next.js', 'React', 'JavaScript', 'Web Development'],
      author: authorName,
      authorId: authorId,
      status: 'published',
      featuredImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      publishedAt: getCurrentTimestamp(),
      views: 1247,
      likes: 89,
      comments: [
        {
          id: generateId(),
          postId: '',
          author: 'Jane Developer',
          authorId: 'user1',
          content: 'This is an excellent guide! Really helped me understand the new features.',
          createdAt: getCurrentTimestamp(),
          likes: 12,
          replies: [
            {
              id: generateId(),
              postId: '',
              author: 'John Coder',
              authorId: 'user2',
              content: 'I agree! The Server Components section was particularly helpful.',
              createdAt: getCurrentTimestamp(),
              likes: 5,
              replies: [],
              isEdited: false,
            }
          ],
          isEdited: false,
        }
      ],
      readTime: 8,
      isFeatured: true,
      slug: 'getting-started-with-nextjs-15',
    },
    {
      id: generateId(),
      title: 'Mastering TypeScript: Advanced Types and Patterns',
      content: `# Mastering TypeScript: Advanced Types and Patterns

TypeScript has become an essential tool for modern JavaScript development. In this deep dive, we'll explore advanced types and patterns that will take your TypeScript skills to the next level.

## Advanced Types

### Conditional Types

Conditional types allow you to create types that depend on other types.

\`\`\`typescript
type IsArray<T> = T extends any[] ? true : false;
type Result = IsArray<number[]>; // true
type Result2 = IsArray<string>; // false
\`\`\`

### Mapped Types

Mapped types enable you to transform properties of a type.

\`\`\`typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};
\`\`\`

### Template Literal Types

Template literal types allow you to create string literal types based on patterns.

\`\`\`typescript
type Greeting = \`Hello, \${string}!\`;
type SayHello = Greeting; // \`Hello, \${string}!\`
\`\`\`

## Design Patterns in TypeScript

### Factory Pattern

The factory pattern helps create objects without exposing the creation logic.

\`\`\`typescript
interface Product {
  name: string;
  price: number;
}

class ProductFactory {
  createProduct(type: string): Product {
    switch(type) {
      case 'book': return { name: 'Book', price: 20 };
      case 'pen': return { name: 'Pen', price: 5 };
      default: throw new Error('Invalid product type');
    }
  }
}
\`\`\`

## Best Practices

1. Use explicit return types for functions
2. Avoid using 'any' type
3. Use discriminated unions for complex state management
4. Leverage type guards for runtime type checking
5. Use utility types like Pick, Omit, and Partial

## Conclusion

TypeScript's advanced type system enables you to write safer, more maintainable code. By mastering these patterns and types, you can build robust applications with confidence.`,
      excerpt: 'Take your TypeScript skills to the next level with advanced types, patterns, and best practices.',
      category: 'Technology',
      tags: ['TypeScript', 'JavaScript', 'Programming', 'Design Patterns'],
      author: authorName,
      authorId: authorId,
      status: 'published',
      featuredImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      publishedAt: getCurrentTimestamp(),
      views: 856,
      likes: 67,
      comments: [],
      readTime: 10,
      isFeatured: false,
      slug: 'mastering-typescript-advanced-types',
    },
  ];
};

// --- Main Component ---
export default function BlogPage() {
  const [isClient, setIsClient] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>(getInitialCategories());
  const [tags, setTags] = useState<Tag[]>(getInitialTags());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // UI States
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  
  // Form States
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published' | 'archived',
    featuredImage: '',
    isFeatured: false,
  });
  
  const [newTag, setNewTag] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
  });

  // --- Effects ---
  useEffect(() => {
    setIsClient(true);
    
    // Load user
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user:', error);
      }
    }
    
    // Load posts
    const storedPosts = localStorage.getItem('blog_posts');
    if (storedPosts) {
      try {
        const parsedPosts = JSON.parse(storedPosts) as BlogPost[];
        setPosts(parsedPosts);
      } catch (error) {
        console.error('Failed to parse posts:', error);
        setPosts(getInitialPosts());
      }
    } else {
      setPosts(getInitialPosts());
    }
    
    // Load categories
    const storedCategories = localStorage.getItem('blog_categories');
    if (storedCategories) {
      try {
        setCategories(JSON.parse(storedCategories));
      } catch (error) {
        setCategories(getInitialCategories());
      }
    }
    
    // Load tags
    const storedTags = localStorage.getItem('blog_tags');
    if (storedTags) {
      try {
        setTags(JSON.parse(storedTags));
      } catch (error) {
        setTags(getInitialTags());
      }
    }
  }, []);

  useEffect(() => {
    if (isClient && posts.length > 0) {
      localStorage.setItem('blog_posts', JSON.stringify(posts));
      updateStats();
    }
  }, [posts, isClient]);

  useEffect(() => {
    if (isClient && categories.length > 0) {
      localStorage.setItem('blog_categories', JSON.stringify(categories));
    }
  }, [categories, isClient]);

  useEffect(() => {
    if (isClient && tags.length > 0) {
      localStorage.setItem('blog_tags', JSON.stringify(tags));
    }
  }, [tags, isClient]);

  // --- Stats Update ---
  const updateStats = useCallback(() => {
    const published = posts.filter(p => p.status === 'published');
    const drafts = posts.filter(p => p.status === 'draft');
    const totalComments = posts.reduce((acc, p) => acc + p.comments.length, 0);
    
    setStats({
      totalPosts: posts.length,
      publishedPosts: published.length,
      draftPosts: drafts.length,
      totalViews: posts.reduce((acc, p) => acc + p.views, 0),
      totalLikes: posts.reduce((acc, p) => acc + p.likes, 0),
      totalComments: totalComments,
    });
  }, [posts]);

  // --- Post CRUD ---
  const createPost = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Title and content are required!');
      return;
    }
    
    const newPost: BlogPost = {
      id: generateId(),
      title: formData.title.trim(),
      content: formData.content.trim(),
      excerpt: formData.excerpt.trim() || formData.content.slice(0, 150) + '...',
      category: formData.category || 'Uncategorized',
      tags: formData.tags,
      author: currentUser?.fullName || 'Anonymous',
      authorId: currentUser?.id || 'system',
      status: formData.status,
      featuredImage: formData.featuredImage || '',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      publishedAt: formData.status === 'published' ? getCurrentTimestamp() : undefined,
      views: 0,
      likes: 0,
      comments: [],
      readTime: calculateReadTime(formData.content),
      isFeatured: formData.isFeatured,
      slug: slugify(formData.title),
    };
    
    setPosts(prev => [newPost, ...prev]);
    resetForm();
    setViewMode('list');
    alert('Post created successfully!');
  }, [formData, currentUser]);

  const updatePost = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPost) return;
    
    const updatedPost: BlogPost = {
      ...selectedPost,
      title: formData.title.trim(),
      content: formData.content.trim(),
      excerpt: formData.excerpt.trim() || formData.content.slice(0, 150) + '...',
      category: formData.category || 'Uncategorized',
      tags: formData.tags,
      status: formData.status,
      featuredImage: formData.featuredImage,
      updatedAt: getCurrentTimestamp(),
      publishedAt: formData.status === 'published' && selectedPost.status !== 'published' 
        ? getCurrentTimestamp() 
        : selectedPost.publishedAt,
      isFeatured: formData.isFeatured,
      readTime: calculateReadTime(formData.content),
    };
    
    setPosts(prev => prev.map(p => p.id === selectedPost.id ? updatedPost : p));
    resetForm();
    setSelectedPost(null);
    setViewMode('list');
    alert('Post updated successfully!');
  }, [formData, selectedPost]);

  const deletePost = useCallback((postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
        setViewMode('list');
      }
    }
  }, [selectedPost]);

  const handleLike = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, likes: p.likes + 1 } : p
    ));
  }, []);

  const handleView = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, views: p.views + 1 } : p
    ));
  }, []);

  // --- Comments ---
  const addComment = useCallback((postId: string, content: string) => {
    if (!content.trim()) return;
    
    const newComment: Comment = {
      id: generateId(),
      postId,
      author: currentUser?.fullName || 'Anonymous',
      authorId: currentUser?.id || 'system',
      content: content.trim(),
      createdAt: getCurrentTimestamp(),
      likes: 0,
      replies: [],
      isEdited: false,
    };
    
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, comments: [...p.comments, newComment] }
        : p
    ));
    
    setCommentContent('');
  }, [currentUser]);

  const addReply = useCallback((postId: string, commentId: string, content: string) => {
    if (!content.trim()) return;
    
    const newReply: Comment = {
      id: generateId(),
      postId,
      author: currentUser?.fullName || 'Anonymous',
      authorId: currentUser?.id || 'system',
      content: content.trim(),
      createdAt: getCurrentTimestamp(),
      likes: 0,
      replies: [],
      isEdited: false,
    };
    
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: p.comments.map(c => 
          c.id === commentId 
            ? { ...c, replies: [...c.replies, newReply] }
            : c
        ),
      };
    }));
    
    setReplyContent('');
    setReplyingTo(null);
  }, [currentUser]);

  const likeComment = useCallback((postId: string, commentId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: p.comments.map(c => 
          c.id === commentId 
            ? { ...c, likes: c.likes + 1 }
            : { ...c, replies: c.replies.map(r => 
                r.id === commentId ? { ...r, likes: r.likes + 1 } : r
              )}
        ),
      };
    }));
  }, []);

  // --- Form Handlers ---
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: '',
      tags: [],
      status: 'draft',
      featuredImage: '',
      isFeatured: false,
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addTag = useCallback(() => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  }, [newTag, formData.tags]);

  const removeTag = useCallback((tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  }, []);

  const openEditPost = useCallback((post: BlogPost) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      category: post.category,
      tags: post.tags,
      status: post.status,
      featuredImage: post.featuredImage || '',
      isFeatured: post.isFeatured,
    });
    setViewMode('edit');
  }, []);

  const openPostDetail = useCallback((post: BlogPost) => {
    setSelectedPost(post);
    handleView(post.id);
    setViewMode('detail');
  }, [handleView]);

  // --- Filtering & Sorting ---
  const filteredPosts = useMemo(() => {
    let filtered = [...posts];
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    // Filter by tag
    if (selectedTag !== 'all') {
      filtered = filtered.filter(p => p.tags.includes(selectedTag));
    }
    
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(term) ||
        p.content.toLowerCase().includes(term) ||
        p.tags.some(t => t.toLowerCase().includes(term))
      );
    }
    
    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => b.views - a.views);
        break;
    }
    
    return filtered;
  }, [posts, filterStatus, selectedCategory, selectedTag, searchTerm, sortBy]);

  // --- Render Functions ---
  const renderPostCard = (post: BlogPost) => (
    <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-gray-100">
      {post.featuredImage && (
        <div className="h-48 overflow-hidden">
          <img 
            src={post.featuredImage} 
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span 
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: categories.find(c => c.name === post.category)?.color || '#6B7280' }}
            />
            <span className="text-xs font-medium text-gray-600">{post.category}</span>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${
            post.status === 'published' ? 'bg-green-100 text-green-800' :
            post.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {post.status}
          </span>
        </div>
        
        <h3 
          className="text-xl font-bold text-gray-800 mb-2 hover:text-blue-600 cursor-pointer"
          onClick={() => openPostDetail(post)}
        >
          {post.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {post.tags.slice(0, 3).map(tag => (
            <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
              #{tag}
            </span>
          ))}
          {post.tags.length > 3 && (
            <span className="text-gray-400 text-xs">+{post.tags.length - 3}</span>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span>{post.author}</span>
            <span>•</span>
            <span>{formatDateShort(post.createdAt)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>👁️ {post.views}</span>
            <span>❤️ {post.likes}</span>
            <span>💬 {post.comments.length}</span>
            <span>📖 {post.readTime} min</span>
          </div>
        </div>
        
        {currentUser && currentUser.id === post.authorId && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => openEditPost(post)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => deletePost(post.id)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderPostDetail = () => {
    if (!selectedPost) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
        <button
          onClick={() => {
            setViewMode('list');
            setSelectedPost(null);
          }}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Posts
        </button>
        
        {selectedPost.featuredImage && (
          <div className="mb-6 rounded-lg overflow-hidden">
            <img 
              src={selectedPost.featuredImage} 
              alt={selectedPost.title}
              className="w-full h-96 object-cover"
            />
          </div>
        )}
        
        <div className="flex items-center gap-3 mb-4">
          <span 
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: categories.find(c => c.name === selectedPost.category)?.color || '#6B7280' }}
          />
          <span className="text-sm font-medium text-gray-600">{selectedPost.category}</span>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${
            selectedPost.status === 'published' ? 'bg-green-100 text-green-800' :
            selectedPost.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {selectedPost.status}
          </span>
          {selectedPost.isFeatured && (
            <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded">
              ⭐ Featured
            </span>
          )}
        </div>
        
        <h1 className="text-4xl font-bold text-gray-800 mb-4">{selectedPost.title}</h1>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-700">{selectedPost.author}</span>
            <span>•</span>
            <span>{formatDate(selectedPost.createdAt)}</span>
            {selectedPost.updatedAt !== selectedPost.createdAt && (
              <>
                <span>•</span>
                <span className="text-xs">(Updated)</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>👁️ {selectedPost.views}</span>
            <button
              onClick={() => handleLike(selectedPost.id)}
              className="flex items-center gap-1 hover:text-red-600 transition-colors"
            >
              ❤️ {selectedPost.likes}
            </button>
            <span>📖 {selectedPost.readTime} min read</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedPost.tags.map(tag => (
            <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
              #{tag}
            </span>
          ))}
        </div>
        
        <div className="prose prose-lg max-w-none mb-8">
          {selectedPost.content.split('\n').map((paragraph, index) => {
            if (paragraph.startsWith('# ')) {
              return <h1 key={index} className="text-3xl font-bold mt-8 mb-4">{paragraph.slice(2)}</h1>;
            } else if (paragraph.startsWith('## ')) {
              return <h2 key={index} className="text-2xl font-bold mt-6 mb-3">{paragraph.slice(3)}</h2>;
            } else if (paragraph.startsWith('### ')) {
              return <h3 key={index} className="text-xl font-bold mt-4 mb-2">{paragraph.slice(4)}</h3>;
            } else if (paragraph.startsWith('```')) {
              return <pre key={index} className="bg-gray-100 p-4 rounded-lg overflow-x-auto">{paragraph}</pre>;
            } else if (paragraph.startsWith('- ') || paragraph.startsWith('1. ')) {
              return <li key={index} className="ml-6 mb-1">{paragraph}</li>;
            } else if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
              return <strong key={index} className="font-bold">{paragraph.slice(2, -2)}</strong>;
            } else if (paragraph.trim()) {
              return <p key={index} className="mb-4 leading-relaxed">{paragraph}</p>;
            }
            return null;
          })}
        </div>
        
        {/* Comments Section */}
        <div className="border-t pt-8">
          <h3 className="text-2xl font-bold mb-6">
            Comments ({selectedPost.comments.length})
          </h3>
          
          {currentUser && (
            <div className="mb-6">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Write a comment..."
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <button
                onClick={() => addComment(selectedPost.id, commentContent)}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-colors"
              >
                Post Comment
              </button>
            </div>
          )}
          
          <div className="space-y-4">
            {selectedPost.comments.map(comment => (
              <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold text-gray-800">{comment.author}</span>
                    <span className="text-xs text-gray-500 ml-2">{formatDateShort(comment.createdAt)}</span>
                  </div>
                  <button
                    onClick={() => likeComment(selectedPost.id, comment.id)}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    ❤️ {comment.likes}
                  </button>
                </div>
                <p className="text-gray-700 mb-2">{comment.content}</p>
                
                {currentUser && (
                  <button
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Reply
                  </button>
                )}
                
                {replyingTo === comment.id && (
                  <div className="mt-2 ml-4">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => addReply(selectedPost.id, comment.id, replyContent)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-4 rounded-md text-sm transition-colors"
                      >
                        Post Reply
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent('');
                        }}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Replies */}
                {comment.replies.length > 0 && (
                  <div className="ml-6 mt-3 space-y-3 border-l-2 pl-4">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="bg-white rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span className="font-semibold text-gray-800">{reply.author}</span>
                            <span className="text-xs text-gray-500 ml-2">{formatDateShort(reply.createdAt)}</span>
                          </div>
                          <button
                            onClick={() => likeComment(selectedPost.id, reply.id)}
                            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                          >
                            ❤️ {reply.likes}
                          </button>
                        </div>
                        <p className="text-gray-700 text-sm">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPostForm = () => {
    const isEditing = viewMode === 'edit';
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
        <button
          onClick={() => {
            setViewMode('list');
            setSelectedPost(null);
            resetForm();
          }}
          className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          ← Cancel
        </button>
        
        <h2 className="text-2xl font-bold mb-6">
          {isEditing ? 'Edit Post' : 'Create New Post'}
        </h2>
        
        <form onSubmit={isEditing ? updatePost : createPost} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleFormChange}
              className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Content *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleFormChange}
              rows={12}
              className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 font-mono"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Use Markdown: # Heading, ## Subheading, **bold**, *italic*, `code`, ```code block```
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Excerpt</label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleFormChange}
              rows={2}
              className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Brief summary of your post..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Featured Image URL</label>
            <input
              type="url"
              name="featuredImage"
              value={formData.featuredImage}
              onChange={handleFormChange}
              className="mt-1 w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleFormChange}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label className="ml-2 text-sm font-medium text-gray-700">Feature this post</label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Tags</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={addTag}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-md transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map(tag => (
                <span key={tag} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8 rounded-md transition-colors"
          >
            {isEditing ? 'Update Post' : 'Create Post'}
          </button>
        </form>
      </div>
    );
  };

  const renderBlogList = () => (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Posts</p>
          <p className="text-2xl font-bold text-gray-800">{stats.totalPosts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Published</p>
          <p className="text-2xl font-bold text-green-600">{stats.publishedPosts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Drafts</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.draftPosts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Views</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalViews}</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          onClick={() => {
            resetForm();
            setViewMode('create');
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-4 rounded-md transition-colors"
        >
          + New Post
        </button>
      </div>
      
      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 text-lg">No posts found</p>
          <p className="text-gray-400 text-sm">Create your first blog post today!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPosts.map(renderPostCard)}
        </div>
      )}
    </div>
  );

  // --- Main Render ---
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blog platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <span>✍️</span> Blog Platform
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                Day 3
              </span>
            </h1>
            <p className="text-gray-600 mt-1">Write, publish, and manage your blog posts</p>
          </div>
          {currentUser && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Welcome, {currentUser.fullName}</span>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {currentUser.fullName.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
        
        {/* Main Content */}
        {viewMode === 'list' && renderBlogList()}
        {(viewMode === 'create' || viewMode === 'edit') && renderPostForm()}
        {viewMode === 'detail' && renderPostDetail()}
        
        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-500 border-t pt-6">
          <p>© 2026 Blog Platform - Complete System</p>
          <p className="mt-1">Built with Next.js, TypeScript, and Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}