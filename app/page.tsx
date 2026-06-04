// app/page.tsx
// A comprehensive Task Management Dashboard for Day 1
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- TypeScript Interfaces ---
interface Task {
  id: string;
  title: string;
  description: string;
  category: 'work' | 'personal' | 'shopping' | 'health';
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  dueDate: string;
  createdAt: string;
  subtasks: SubTask[];
  tags: string[];
  estimatedHours: number;
  actualHours: number | null;
  isArchived: boolean;
}

interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

// --- Utility Functions ---
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

const getCurrentDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'No date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};
// Add this navigation bar to your main page or create a new navigation component
const Navigation = () => (
  <nav className="bg-white shadow-md mb-8 p-4">
    <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="font-bold text-xl text-gray-800">📚</span>
        <span className="text-gray-600">Week 1 Challenge</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href="/" className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Home</a>
        <a href="/auth" className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">Auth</a>
        <a href="/blog" className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">Blog</a>
        <a href="/store" className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">Store</a>
        <a href="/social" className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">Social</a>
        <a href="/analytics" className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300">Analytics</a>
        <a href="/api-test" className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700">API Test</a>
      </div>
    </div>
  </nav>
);

// --- Initial Mock Data ---
const getInitialTasks = (): Task[] => {
  const today = getCurrentDateString();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekString = nextWeek.toISOString().split('T')[0];

  return [
    {
      id: generateId(),
      title: 'Complete Next.js Dashboard Project',
      description: 'Build a fully functional dashboard with task management, charts, and user settings.',
      category: 'work',
      priority: 'high',
      status: 'in-progress',
      dueDate: tomorrowString,
      createdAt: today,
      subtasks: [
        { id: generateId(), title: 'Setup project structure', isCompleted: true },
        { id: generateId(), title: 'Implement task CRUD operations', isCompleted: false },
        { id: generateId(), title: 'Add charts and analytics', isCompleted: false },
      ],
      tags: ['react', 'nextjs', 'typescript'],
      estimatedHours: 8,
      actualHours: 3,
      isArchived: false,
    },
    {
      id: generateId(),
      title: 'Prepare Presentation for Team Meeting',
      description: 'Create slides for the weekly sync. Focus on Q3 progress and Q4 roadmap.',
      category: 'work',
      priority: 'medium',
      status: 'todo',
      dueDate: nextWeekString,
      createdAt: today,
      subtasks: [
        { id: generateId(), title: 'Draft outline', isCompleted: true },
        { id: generateId(), title: 'Create slides', isCompleted: false },
      ],
      tags: ['presentation', 'team'],
      estimatedHours: 3,
      actualHours: null,
      isArchived: false,
    },
    {
      id: generateId(),
      title: 'Buy Groceries for the Week',
      description: 'Milk, eggs, bread, vegetables, and fruits.',
      category: 'shopping',
      priority: 'medium',
      status: 'todo',
      dueDate: today,
      createdAt: today,
      subtasks: [],
      tags: ['weekly', 'essentials'],
      estimatedHours: 1,
      actualHours: null,
      isArchived: false,
    },
    {
      id: generateId(),
      title: 'Morning Workout Routine',
      description: '30 minutes cardio, 20 minutes strength training.',
      category: 'health',
      priority: 'high',
      status: 'done',
      dueDate: today,
      createdAt: today,
      subtasks: [
        { id: generateId(), title: 'Warm-up', isCompleted: true },
        { id: generateId(), title: 'Cardio', isCompleted: true },
        { id: generateId(), title: 'Strength', isCompleted: true },
        { id: generateId(), title: 'Cool-down', isCompleted: true },
      ],
      tags: ['fitness', 'morning'],
      estimatedHours: 1,
      actualHours: 1,
      isArchived: false,
    },
    {
      id: generateId(),
      title: 'Read "Atomic Habits" Book',
      description: 'Finish chapters 4-6 and take notes.',
      category: 'personal',
      priority: 'low',
      status: 'todo',
      dueDate: nextWeekString,
      createdAt: today,
      subtasks: [
        { id: generateId(), title: 'Chapter 4: The Man Who Didn\'t Look Right', isCompleted: false },
        { id: generateId(), title: 'Chapter 5: The Best Way to Start a New Habit', isCompleted: false },
        { id: generateId(), title: 'Chapter 6: Motivation is Overrated', isCompleted: false },
      ],
      tags: ['self-improvement', 'reading'],
      estimatedHours: 3,
      actualHours: null,
      isArchived: false,
    },
  ];
};


// --- Main Component ---
export default function Home() {
  // State Management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  // Modal states for adding/editing
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form state for new/edit task
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'work' as Task['category'],
    priority: 'medium' as Task['priority'],
    status: 'todo' as Task['status'],
    dueDate: getCurrentDateString(),
    estimatedHours: 1,
    tags: '',
  });

  // --- Effects ---
  useEffect(() => {
    setIsClient(true);
    // Load tasks from localStorage
    const storedTasks = localStorage.getItem('nextjs_dashboard_tasks');
    if (storedTasks) {
      try {
        const parsedTasks = JSON.parse(storedTasks) as Task[];
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Failed to parse tasks from localStorage:', error);
        setTasks(getInitialTasks());
      }
    } else {
      setTasks(getInitialTasks());
    }
  }, []);

  useEffect(() => {
    if (isClient && tasks.length > 0) {
      localStorage.setItem('nextjs_dashboard_tasks', JSON.stringify(tasks));
    }
  }, [tasks, isClient]);

  // --- Task CRUD Operations ---
  const addTask = useCallback((newTaskData: Omit<Task, 'id' | 'createdAt' | 'subtasks' | 'actualHours' | 'isArchived'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: generateId(),
      createdAt: getCurrentDateString(),
      subtasks: [],
      actualHours: null,
      isArchived: false,
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
    setShowAddModal(false);
    resetForm();
  }, []);

  const updateTask = useCallback((taskId: string, updatedFields: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, ...updatedFields } : task
      )
    );
    setEditingTask(null);
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    }
  }, []);

  const archiveTask = useCallback((taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, isArchived: !task.isArchived } : task
      )
    );
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          subtasks: task.subtasks.map(sub => 
            sub.id === subtaskId ? { ...sub, isCompleted: !sub.isCompleted } : sub
          ),
        };
      })
    );
  }, []);

  const addSubtask = useCallback((taskId: string, subtaskTitle: string) => {
    if (!subtaskTitle.trim()) return;
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          subtasks: [
            ...task.subtasks,
            { id: generateId(), title: subtaskTitle.trim(), isCompleted: false },
          ],
        };
      })
    );
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'work',
      priority: 'medium',
      status: 'todo',
      dueDate: getCurrentDateString(),
      estimatedHours: 1,
      tags: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Task title is required!');
      return;
    }

    const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);

    if (editingTask) {
      updateTask(editingTask.id, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate,
        estimatedHours: formData.estimatedHours,
        tags: tagsArray,
      });
    } else {
      addTask({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        status: formData.status,
        dueDate: formData.dueDate,
        estimatedHours: formData.estimatedHours,
        tags: tagsArray,
      });
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      tags: task.tags.join(', '),
    });
    setShowAddModal(true);
  };

  // --- Filtering and Memoization ---
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => !task.isArchived);

    if (filterCategory !== 'all') {
      filtered = filtered.filter(task => task.category === filterCategory);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(term) || 
        task.description.toLowerCase().includes(term) ||
        task.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [tasks, filterCategory, filterStatus, searchTerm]);

  const stats = useMemo(() => {
    const total = tasks.filter(t => !t.isArchived).length;
    const todo = tasks.filter(t => t.status === 'todo' && !t.isArchived).length;
    const inProgress = tasks.filter(t => t.status === 'in-progress' && !t.isArchived).length;
    const done = tasks.filter(t => t.status === 'done' && !t.isArchived).length;
    const highPriority = tasks.filter(t => t.priority === 'high' && !t.isArchived).length;
    return { total, todo, inProgress, done, highPriority };
  }, [tasks]);

  // --- Render Helper Functions ---
  const renderPriorityBadge = (priority: Task['priority']) => {
    const colors = {
      low: 'bg-gray-200 text-gray-800',
      medium: 'bg-yellow-200 text-yellow-800',
      high: 'bg-red-200 text-red-800',
    };
    return <span className={`text-xs font-semibold px-2 py-1 rounded ${colors[priority]}`}>{priority}</span>;
  };

  const renderStatusBadge = (status: Task['status']) => {
    const colors = {
      todo: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-purple-100 text-purple-800',
      done: 'bg-green-100 text-green-800',
    };
    return <span className={`text-xs font-semibold px-2 py-1 rounded ${colors[status]}`}>{status}</span>;
  };

  const renderCategoryBadge = (category: Task['category']) => {
    const colors = {
      work: 'bg-indigo-100 text-indigo-800',
      personal: 'bg-pink-100 text-pink-800',
      shopping: 'bg-orange-100 text-orange-800',
      health: 'bg-emerald-100 text-emerald-800',
    };
    return <span className={`text-xs font-semibold px-2 py-1 rounded ${colors[category]}`}>{category}</span>;
  };

  // --- Loading / Client-side check ---
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
              <span>📊</span> Task Dashboard
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                v1.0 Day 1
              </span>
            </h1>
            <p className="text-gray-600 mt-1">Manage your tasks efficiently with this comprehensive dashboard.</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingTask(null);
              setShowAddModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all flex items-center gap-2"
          >
            <span>+</span> Add New Task
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
            <p className="text-xs text-gray-500 uppercase font-semibold">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-300">
            <p className="text-xs text-gray-500 uppercase font-semibold">To Do</p>
            <p className="text-2xl font-bold text-blue-600">{stats.todo}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-400">
            <p className="text-xs text-gray-500 uppercase font-semibold">In Progress</p>
            <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
            <p className="text-xs text-gray-500 uppercase font-semibold">Done</p>
            <p className="text-2xl font-bold text-green-600">{stats.done}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-400">
            <p className="text-xs text-gray-500 uppercase font-semibold">High Priority</p>
            <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="shopping">Shopping</option>
              <option value="health">Health</option>
            </select>
            
            <label className="text-sm font-medium text-gray-700 ml-2">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="w-full md:w-64">
            <input
              type="text"
              placeholder="Search tasks by title, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-gray-500 text-lg">No tasks found</p>
              <p className="text-gray-400 text-sm">Try adjusting your filters or add a new task.</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
                      {renderPriorityBadge(task.priority)}
                      {renderStatusBadge(task.status)}
                      {renderCategoryBadge(task.category)}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>📅 Due: {formatDate(task.dueDate)}</span>
                      <span>⏱️ Est: {task.estimatedHours}h</span>
                      {task.actualHours !== null && <span>✅ Actual: {task.actualHours}h</span>}
                      <div className="flex gap-1">
                        {task.tags.map(tag => (
                          <span key={tag} className="bg-gray-100 px-2 py-0.5 rounded">#{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(task)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => archiveTask(task.id)}
                      className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                    >
                      {task.isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {/* Subtasks */}
                {task.subtasks.length > 0 && (
                  <div className="mt-3 pl-4 border-l-4 border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1">Subtasks:</p>
                    <ul className="space-y-1">
                      {task.subtasks.map(sub => (
                        <li key={sub.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={sub.isCompleted}
                            onChange={() => toggleSubtask(task.id, sub.id)}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <span className={`text-sm ${sub.isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {sub.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as Task['category'] })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="work">Work</option>
                        <option value="personal">Personal</option>
                        <option value="shopping">Shopping</option>
                        <option value="health">Health</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Due Date</label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estimated Hours</label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={formData.estimatedHours}
                      onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="react, nextjs, design"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-sm flex-1"
                  >
                    {editingTask ? 'Update Task' : 'Add Task'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingTask(null);
                      resetForm();
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg shadow-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}