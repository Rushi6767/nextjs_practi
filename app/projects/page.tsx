// app/projects/page.tsx
// Complete Project Management Tool with Kanban Board, Sprints, Team Management & Reporting
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// --- TypeScript Interfaces ---
interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  team: TeamMember[];
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  category: string;
  budget?: number;
  progress: number;
  sprints: Sprint[];
  tasks: Task[];
  documents: ProjectDocument[];
  milestones: Milestone[];
  risks: Risk[];
  metrics: ProjectMetrics;
}

interface TeamMember {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userEmail: string;
  role: 'owner' | 'manager' | 'developer' | 'designer' | 'tester' | 'viewer';
  skills: string[];
  assignedTasks: string[];
  joinedAt: string;
  isActive: boolean;
}

interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'review' | 'completed';
  tasks: string[];
  velocity: number;
  completedPoints: number;
  totalPoints: number;
  issues: SprintIssue[];
  retrospective?: string;
}

interface SprintIssue {
  id: string;
  type: 'blocker' | 'critical' | 'major' | 'minor';
  description: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  storyPoints: number;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  reporterId: string;
  reporterName: string;
  sprintId?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  completedAt?: string;
  tags: string[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  subtasks: Subtask[];
  timeEstimate: number;
  timeSpent: number;
  labels: string[];
  dependencies: string[];
  blockedBy: string[];
  isBlocked: boolean;
}

interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  assigneeId?: string;
  assigneeName?: string;
  createdAt: string;
  completedAt?: string;
}

interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  attachments: TaskAttachment[];
  replies: TaskComment[];
}

interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
}

interface ProjectDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  version: number;
  description?: string;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  tasks: string[];
  completedAt?: string;
  progress: number;
}

interface Risk {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  status: 'identified' | 'analyzed' | 'mitigated' | 'occurred';
  mitigation: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  blockedTasks: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  averageVelocity: number;
  sprintCount: number;
  teamSize: number;
  taskCompletionRate: number;
  onTrack: boolean;
  daysRemaining: number;
}

interface KanbanColumn {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
  limit?: number;
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getRandomAvatar = (name: string): string => {
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8', 'F7DC6F'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=128`;
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'critical': return 'bg-red-600 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-yellow-500 text-white';
    case 'low': return 'bg-green-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'backlog': return 'bg-gray-200 text-gray-700';
    case 'todo': return 'bg-blue-100 text-blue-700';
    case 'in-progress': return 'bg-purple-100 text-purple-700';
    case 'review': return 'bg-orange-100 text-orange-700';
    case 'done': return 'bg-green-100 text-green-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getRoleIcon = (role: string): string => {
  switch (role) {
    case 'owner': return '👑';
    case 'manager': return '📋';
    case 'developer': return '💻';
    case 'designer': return '🎨';
    case 'tester': return '🔍';
    case 'viewer': return '👀';
    default: return '👤';
  }
};

// --- Mock Data Generation ---
const generateMockProjects = (userId: string, userName: string): Project[] => {
  const now = getCurrentTimestamp();
  const teamMembers: TeamMember[] = [
    {
      id: generateId(),
      userId: userId,
      userName: userName,
      userAvatar: getRandomAvatar(userName),
      userEmail: 'user@example.com',
      role: 'owner',
      skills: ['Project Management', 'Full-stack Development'],
      assignedTasks: [],
      joinedAt: now,
      isActive: true,
    },
    {
      id: generateId(),
      userId: 'user2',
      userName: 'Sarah Johnson',
      userAvatar: getRandomAvatar('Sarah Johnson'),
      userEmail: 'sarah@example.com',
      role: 'developer',
      skills: ['React', 'TypeScript', 'Node.js'],
      assignedTasks: [],
      joinedAt: now,
      isActive: true,
    },
    {
      id: generateId(),
      userId: 'user3',
      userName: 'Alex Rivera',
      userAvatar: getRandomAvatar('Alex Rivera'),
      userEmail: 'alex@example.com',
      role: 'designer',
      skills: ['UI/UX', 'Figma', 'Adobe XD'],
      assignedTasks: [],
      joinedAt: now,
      isActive: true,
    },
    {
      id: generateId(),
      userId: 'user4',
      userName: 'Emma Thompson',
      userAvatar: getRandomAvatar('Emma Thompson'),
      userEmail: 'emma@example.com',
      role: 'tester',
      skills: ['QA', 'Automation', 'Manual Testing'],
      assignedTasks: [],
      joinedAt: now,
      isActive: true,
    },
  ];

  const createTask = (
    title: string, 
    status: Task['status'], 
    priority: Task['priority'], 
    storyPoints: number,
    assigneeId?: string
  ): Task => {
    const assignee = teamMembers.find(m => m.userId === assigneeId);
    return {
      id: generateId(),
      title,
      description: `Description for ${title}`,
      status,
      priority,
      storyPoints,
      assigneeId: assigneeId,
      assigneeName: assignee?.userName,
      assigneeAvatar: assignee?.userAvatar,
      reporterId: userId,
      reporterName: userName,
      createdAt: now,
      updatedAt: now,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['feature', 'development'],
      attachments: [],
      comments: [],
      subtasks: [],
      timeEstimate: 4,
      timeSpent: 0,
      labels: ['frontend'],
      dependencies: [],
      blockedBy: [],
      isBlocked: false,
    };
  };

  const tasks: Task[] = [
    createTask('Setup project structure', 'done', 'high', 3),
    createTask('Design database schema', 'done', 'high', 5),
    createTask('Implement authentication', 'done', 'critical', 8, 'user2'),
    createTask('Create UI components', 'in-progress', 'high', 5, 'user3'),
    createTask('Implement API endpoints', 'in-progress', 'high', 8, 'user2'),
    createTask('Write tests', 'todo', 'medium', 3, 'user4'),
    createTask('Deploy to production', 'todo', 'critical', 3, 'user2'),
    createTask('User documentation', 'backlog', 'low', 2, 'user3'),
    createTask('Performance optimization', 'backlog', 'medium', 5, 'user2'),
    createTask('Mobile responsive design', 'in-progress', 'medium', 3, 'user3'),
  ];

  // Assign tasks to team members
  tasks.forEach((task, index) => {
    if (task.assigneeId) {
      const member = teamMembers.find(m => m.userId === task.assigneeId);
      if (member) {
        member.assignedTasks.push(task.id);
      }
    }
  });

  const sprintTasks = tasks.filter(t => t.status !== 'backlog').map(t => t.id);
  const completedTasks = tasks.filter(t => t.status === 'done');
  
  const sprint: Sprint = {
    id: generateId(),
    name: 'Sprint 1 - Foundation',
    goal: 'Build the core foundation of the application',
    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    tasks: sprintTasks,
    velocity: 15,
    completedPoints: completedTasks.reduce((sum, t) => sum + t.storyPoints, 0),
    totalPoints: tasks.reduce((sum, t) => sum + t.storyPoints, 0),
    issues: [],
  };

  const milestones: Milestone[] = [
    {
      id: generateId(),
      name: 'MVP Launch',
      description: 'Launch the minimum viable product',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'in-progress',
      tasks: tasks.filter(t => t.status !== 'done' && t.status !== 'backlog').map(t => t.id),
      progress: 40,
    },
    {
      id: generateId(),
      name: 'Beta Release',
      description: 'Release beta version to testers',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      tasks: [],
      progress: 0,
    },
  ];

  const risks: Risk[] = [
    {
      id: generateId(),
      title: 'API Rate Limiting',
      description: 'Third-party API might have rate limiting issues',
      severity: 'high',
      probability: 'medium',
      impact: 'high',
      status: 'analyzed',
      mitigation: 'Implement caching and retry logic',
      ownerId: 'user2',
      ownerName: 'Sarah Johnson',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Team Availability',
      description: 'Team members might have overlapping vacations',
      severity: 'medium',
      probability: 'low',
      impact: 'medium',
      status: 'identified',
      mitigation: 'Cross-train team members',
      ownerId: userId,
      ownerName: userName,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const project: Project = {
    id: generateId(),
    name: 'Next.js Enterprise Platform',
    description: 'A comprehensive enterprise platform built with Next.js, TypeScript, and modern technologies.',
    ownerId: userId,
    ownerName: userName,
    team: teamMembers,
    status: 'active',
    priority: 'high',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: now,
    updatedAt: now,
    tags: ['nextjs', 'typescript', 'enterprise'],
    category: 'Web Development',
    budget: 100000,
    progress: 35,
    sprints: [sprint],
    tasks: tasks,
    documents: [
      {
        id: generateId(),
        name: 'Project Plan.pdf',
        url: '/documents/project-plan.pdf',
        type: 'application/pdf',
        size: 2457600,
        uploadedBy: userId,
        uploadedByName: userName,
        uploadedAt: now,
        version: 1,
      },
    ],
    milestones: milestones,
    risks: risks,
    metrics: {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'done').length,
      inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
      todoTasks: tasks.filter(t => t.status === 'todo').length,
      blockedTasks: tasks.filter(t => t.isBlocked).length,
      totalStoryPoints: tasks.reduce((sum, t) => sum + t.storyPoints, 0),
      completedStoryPoints: tasks.filter(t => t.status === 'done').reduce((sum, t) => sum + t.storyPoints, 0),
      averageVelocity: 15,
      sprintCount: 1,
      teamSize: teamMembers.length,
      taskCompletionRate: (tasks.filter(t => t.status === 'done').length / tasks.length) * 100,
      onTrack: true,
      daysRemaining: 60,
    },
  };

  return [project];
};

// --- Main Component ---
export default function ProjectManagementPage() {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI States
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'timeline' | 'dashboard'>('board');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Editing States
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Form States
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('medium');
  const [taskStatus, setTaskStatus] = useState<Task['status']>('todo');
  const [taskStoryPoints, setTaskStoryPoints] = useState(3);
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskTags, setTaskTags] = useState('');
  const [taskLabels, setTaskLabels] = useState('');
  const [subtasks, setSubtasks] = useState<{ title: string }[]>([]);
  
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [sprintStartDate, setSprintStartDate] = useState('');
  const [sprintEndDate, setSprintEndDate] = useState('');
  
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamMember['role']>('developer');
  
  const [riskTitle, setRiskTitle] = useState('');
  const [riskDescription, setRiskDescription] = useState('');
  const [riskSeverity, setRiskSeverity] = useState<Risk['severity']>('medium');
  const [riskProbability, setRiskProbability] = useState<Risk['probability']>('medium');
  
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneDescription, setMilestoneDescription] = useState('');
  const [milestoneDueDate, setMilestoneDueDate] = useState('');
  
  // Comment States
  const [commentInput, setCommentInput] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  
  // Drag and Drop
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // --- Effects ---
  useEffect(() => {
    setIsClient(true);
    
    // Load user
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const authUser = JSON.parse(storedUser);
        setCurrentUser(authUser);
        
        // Generate mock projects
        const userId = authUser.id || 'user1';
        const userName = authUser.fullName || authUser.username || 'User';
        const mockProjects = generateMockProjects(userId, userName);
        setProjects(mockProjects);
        setSelectedProject(mockProjects[0]);
      } catch (error) {
        console.error('Failed to parse user:', error);
      }
    } else {
      // Guest user
      const mockProjects = generateMockProjects('guest', 'Guest User');
      setProjects(mockProjects);
      setSelectedProject(mockProjects[0]);
    }
    
    setIsLoading(false);
  }, []);

  // --- Task Operations ---
  const createTask = useCallback(() => {
    if (!taskTitle.trim() || !selectedProject) return;
    
    const newTask: Task = {
      id: generateId(),
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      status: taskStatus,
      priority: taskPriority,
      storyPoints: taskStoryPoints,
      assigneeId: taskAssignee || undefined,
      assigneeName: taskAssignee ? selectedProject.team.find(m => m.userId === taskAssignee)?.userName : undefined,
      assigneeAvatar: taskAssignee ? selectedProject.team.find(m => m.userId === taskAssignee)?.userAvatar : undefined,
      reporterId: currentUser?.id || 'guest',
      reporterName: currentUser?.fullName || 'Guest',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      dueDate: taskDueDate || undefined,
      tags: taskTags.split(',').map(t => t.trim()).filter(t => t),
      attachments: [],
      comments: [],
      subtasks: subtasks.map(s => ({
        id: generateId(),
        title: s.title,
        isCompleted: false,
        createdAt: getCurrentTimestamp(),
      })),
      timeEstimate: 4,
      timeSpent: 0,
      labels: taskLabels.split(',').map(l => l.trim()).filter(l => l),
      dependencies: [],
      blockedBy: [],
      isBlocked: false,
    };
    
    // Update project
    setProjects(prev => prev.map(p => {
      if (p.id !== selectedProject.id) return p;
      
      const updatedProject = {
        ...p,
        tasks: [...p.tasks, newTask],
        metrics: {
          ...p.metrics,
          totalTasks: p.metrics.totalTasks + 1,
        },
      };
      
      // Update sprint if applicable
      if (taskStatus !== 'backlog') {
        const sprintIndex = p.sprints.findIndex(s => s.status === 'active');
        if (sprintIndex !== -1) {
          updatedProject.sprints[sprintIndex].tasks.push(newTask.id);
          updatedProject.sprints[sprintIndex].totalPoints += newTask.storyPoints;
        }
      }
      
      return updatedProject;
    }));
    
    setSelectedProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: [...prev.tasks, newTask],
        metrics: {
          ...prev.metrics,
          totalTasks: prev.metrics.totalTasks + 1,
        },
      };
    });
    
    resetTaskForm();
    setShowTaskModal(false);
  }, [taskTitle, taskDescription, taskStatus, taskPriority, taskStoryPoints, taskAssignee, taskDueDate, taskTags, taskLabels, subtasks, selectedProject, currentUser]);

  const updateTaskStatus = useCallback((taskId: string, newStatus: Task['status']) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== selectedProject?.id) return p;
      
      const updatedTasks = p.tasks.map(t => 
        t.id === taskId 
          ? { 
              ...t, 
              status: newStatus, 
              updatedAt: getCurrentTimestamp(),
              completedAt: newStatus === 'done' ? getCurrentTimestamp() : t.completedAt,
            }
          : t
      );
      
      const completedTasks = updatedTasks.filter(t => t.status === 'done');
      
      return {
        ...p,
        tasks: updatedTasks,
        progress: Math.round((completedTasks.length / p.tasks.length) * 100),
        metrics: {
          ...p.metrics,
          completedTasks: completedTasks.length,
          completedStoryPoints: completedTasks.reduce((sum, t) => sum + t.storyPoints, 0),
        },
      };
    }));
    
    setSelectedProject(prev => {
      if (!prev) return prev;
      const updatedTasks = prev.tasks.map(t => 
        t.id === taskId 
          ? { 
              ...t, 
              status: newStatus, 
              updatedAt: getCurrentTimestamp(),
              completedAt: newStatus === 'done' ? getCurrentTimestamp() : t.completedAt,
            }
          : t
      );
      const completedTasks = updatedTasks.filter(t => t.status === 'done');
      return {
        ...prev,
        tasks: updatedTasks,
        progress: Math.round((completedTasks.length / prev.tasks.length) * 100),
        metrics: {
          ...prev.metrics,
          completedTasks: completedTasks.length,
          completedStoryPoints: completedTasks.reduce((sum, t) => sum + t.storyPoints, 0),
        },
      };
    });
  }, [selectedProject]);

  const deleteTask = useCallback((taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    setProjects(prev => prev.map(p => {
      if (p.id !== selectedProject?.id) return p;
      return {
        ...p,
        tasks: p.tasks.filter(t => t.id !== taskId),
        metrics: {
          ...p.metrics,
          totalTasks: p.metrics.totalTasks - 1,
        },
      };
    }));
    
    setSelectedProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== taskId),
        metrics: {
          ...prev.metrics,
          totalTasks: prev.metrics.totalTasks - 1,
        },
      };
    });
  }, [selectedProject]);

  const addComment = useCallback((taskId: string, content: string) => {
    if (!content.trim() || !currentUser) return;
    
    const newComment: TaskComment = {
      id: generateId(),
      userId: currentUser.id || 'guest',
      userName: currentUser.fullName || 'Guest',
      userAvatar: getRandomAvatar(currentUser.fullName || 'Guest'),
      content: content.trim(),
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      attachments: [],
      replies: [],
    };
    
    setProjects(prev => prev.map(p => {
      if (p.id !== selectedProject?.id) return p;
      return {
        ...p,
        tasks: p.tasks.map(t => 
          t.id === taskId 
            ? { ...t, comments: [...t.comments, newComment] }
            : t
        ),
      };
    }));
    
    setSelectedProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map(t => 
          t.id === taskId 
            ? { ...t, comments: [...t.comments, newComment] }
            : t
        ),
      };
    });
    
    setCommentInput('');
  }, [currentUser, selectedProject]);

  const addReply = useCallback((taskId: string, commentId: string, content: string) => {
    if (!content.trim() || !currentUser) return;
    
    const newReply: TaskComment = {
      id: generateId(),
      userId: currentUser.id || 'guest',
      userName: currentUser.fullName || 'Guest',
      userAvatar: getRandomAvatar(currentUser.fullName || 'Guest'),
      content: content.trim(),
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      attachments: [],
      replies: [],
    };
    
    setProjects(prev => prev.map(p => {
      if (p.id !== selectedProject?.id) return p;
      return {
        ...p,
        tasks: p.tasks.map(t => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            comments: t.comments.map(c => 
              c.id === commentId 
                ? { ...c, replies: [...c.replies, newReply] }
                : c
            ),
          };
        }),
      };
    }));
    
    setSelectedProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map(t => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            comments: t.comments.map(c => 
              c.id === commentId 
                ? { ...c, replies: [...c.replies, newReply] }
                : c
            ),
          };
        }),
      };
    });
    
    setReplyInput('');
    setReplyingTo(null);
  }, [currentUser, selectedProject]);

  // --- Sprint Operations ---
  const createSprint = useCallback(() => {
    if (!sprintName.trim() || !selectedProject) return;
    
    const newSprint: Sprint = {
      id: generateId(),
      name: sprintName.trim(),
      goal: sprintGoal.trim(),
      startDate: sprintStartDate || getCurrentTimestamp(),
      endDate: sprintEndDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'planning',
      tasks: [],
      velocity: 0,
      completedPoints: 0,
      totalPoints: 0,
      issues: [],
    };
    
    setProjects(prev => prev.map(p => {
      if (p.id !== selectedProject.id) return p;
      return {
        ...p,
        sprints: [...p.sprints, newSprint],
        metrics: {
          ...p.metrics,
          sprintCount: p.metrics.sprintCount + 1,
        },
      };
    }));
    
    setSelectedProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sprints: [...prev.sprints, newSprint],
        metrics: {
          ...prev.metrics,
          sprintCount: prev.metrics.sprintCount + 1,
        },
      };
    });
    
    setSprintName('');
    setSprintGoal('');
    setSprintStartDate('');
    setSprintEndDate('');
    setShowSprintModal(false);
  }, [sprintName, sprintGoal, sprintStartDate, sprintEndDate, selectedProject]);

  // --- Team Operations ---
  const addTeamMember = useCallback(() => {
    if (!newMemberEmail.trim() || !selectedProject) return;
    
    const newMember: TeamMember = {
      id: generateId(),
      userId: generateId(),
      userName: newMemberEmail.split('@')[0],
      userAvatar: getRandomAvatar(newMemberEmail.split('@')[0]),
      userEmail: newMemberEmail.trim(),
      role: newMemberRole,
      skills: [],
      assignedTasks: [],
      joinedAt: getCurrentTimestamp(),
      isActive: true,
    };
    
    setProjects(prev => prev.map(p => {
      if (p.id !== selectedProject.id) return p;
      return {
        ...p,
        team: [...p.team, newMember],
        metrics: {
          ...p.metrics,
          teamSize: p.metrics.teamSize + 1,
        },
      };
    }));
    
    setSelectedProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        team: [...prev.team, newMember],
        metrics: {
          ...prev.metrics,
          teamSize: prev.metrics.teamSize + 1,
        },
      };
    });
    
    setNewMemberEmail('');
    setShowMemberModal(false);
  }, [newMemberEmail, newMemberRole, selectedProject]);

  const removeTeamMember = useCallback((memberId: string) => {
    if (!window.confirm('Remove this team member?')) return;
    
    setProjects(prev => prev.map(p => {
      if (p.id !== selectedProject?.id) return p;
      return {
        ...p,
        team: p.team.filter(m => m.id !== memberId),
        metrics: {
          ...p.metrics,
          teamSize: p.metrics.teamSize - 1,
        },
      };
    }));
    
    setSelectedProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        team: prev.team.filter(m => m.id !== memberId),
        metrics: {
          ...prev.metrics,
          teamSize: prev.metrics.teamSize - 1,
        },
      };
    });
  }, [selectedProject]);

  // --- Risk Operations ---
  const createRisk = useCallback(() => {
    if (!riskTitle.trim() || !selectedProject || !currentUser) return;
    
    const newRisk: Risk = {
      id: generateId(),
      title: riskTitle.trim(),
      description: riskDescription.trim(),
      severity: riskSeverity,
      probability: riskProbability,
      impact: riskSeverity === 'critical' ? 'critical' : riskSeverity === 'high' ? 'high' : 'medium',
      status: 'identified',
      mitigation: '',
      ownerId: currentUser.id || 'guest',
      ownerName: currentUser.fullName || 'Guest',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    
    setProjects(prev => prev.map(p => {
      if (p.id !== selectedProject.id) return p;
      return {
        ...p,
        risks: [...p.risks, newRisk],
      };
    }));
    
    setSelectedProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        risks: [...prev.risks, newRisk],
      };
    });
    
    setRiskTitle('');
    setRiskDescription('');
    setShowRiskModal(false);
  }, [riskTitle, riskDescription, riskSeverity, riskProbability, selectedProject, currentUser]);

  // --- Milestone Operations ---
  const createMilestone = useCallback(() => {
    if (!milestoneName.trim() || !selectedProject) return;
    
    const newMilestone: Milestone = {
      id: generateId(),
      name: milestoneName.trim(),
      description: milestoneDescription.trim(),
      dueDate: milestoneDueDate || getCurrentTimestamp(),
      status: 'pending',
      tasks: [],
      progress: 0,
    };
    
    setProjects(prev => prev.map(p => {
      if (p.id !== selectedProject.id) return p;
      return {
        ...p,
        milestones: [...p.milestones, newMilestone],
      };
    }));
    
    setSelectedProject(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        milestones: [...prev.milestones, newMilestone],
      };
    });
    
    setMilestoneName('');
    setMilestoneDescription('');
    setMilestoneDueDate('');
    setShowMilestoneModal(false);
  }, [milestoneName, milestoneDescription, milestoneDueDate, selectedProject]);

  // --- Drag and Drop ---
  const handleDragStart = useCallback((task: Task) => {
    setDraggedTask(task);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDropTarget(status);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      updateTaskStatus(draggedTask.id, status as Task['status']);
    }
    setDraggedTask(null);
    setDropTarget(null);
  }, [draggedTask, updateTaskStatus]);

  // --- Reset Form ---
  const resetTaskForm = () => {
    setTaskTitle('');
    setTaskDescription('');
    setTaskPriority('medium');
    setTaskStatus('todo');
    setTaskStoryPoints(3);
    setTaskAssignee('');
    setTaskDueDate('');
    setTaskTags('');
    setTaskLabels('');
    setSubtasks([]);
    setEditingTask(null);
  };

  // --- Filter Tasks ---
  const getFilteredTasks = useCallback((tasks: Task[]) => {
    let filtered = [...tasks];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    
    if (filterAssignee !== 'all') {
      filtered = filtered.filter(t => t.assigneeId === filterAssignee);
    }
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === filterPriority);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }
    
    return filtered;
  }, [searchTerm, filterAssignee, filterPriority, filterStatus]);

  // --- Kanban Columns ---
  const getKanbanColumns = useCallback((tasks: Task[]): KanbanColumn[] => {
    const columns: KanbanColumn[] = [
      { id: 'backlog', title: 'Backlog', tasks: [], color: 'bg-gray-100' },
      { id: 'todo', title: 'To Do', tasks: [], color: 'bg-blue-50' },
      { id: 'in-progress', title: 'In Progress', tasks: [], color: 'bg-purple-50' },
      { id: 'review', title: 'Review', tasks: [], color: 'bg-orange-50' },
      { id: 'done', title: 'Done', tasks: [], color: 'bg-green-50' },
    ];
    
    tasks.forEach(task => {
      const column = columns.find(c => c.id === task.status);
      if (column) {
        column.tasks.push(task);
      }
    });
    
    return columns;
  }, []);

  // --- Render Functions ---
  const renderTaskCard = (task: Task) => {
    const assignee = selectedProject?.team.find(m => m.userId === task.assigneeId);
    
    return (
      <div
        key={task.id}
        draggable
        onDragStart={() => handleDragStart(task)}
        className="bg-white rounded-lg shadow-sm p-3 mb-2 cursor-move hover:shadow-md transition-shadow border border-gray-200"
        onClick={() => {
          setSelectedTask(task);
          setShowTaskModal(true);
          setEditingTask(task);
        }}
      >
        <div className="flex items-start justify-between mb-1">
          <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          <span className="text-xs text-gray-500">{task.storyPoints} pts</span>
        </div>
        <h4 className="font-medium text-gray-800 text-sm mb-1">{task.title}</h4>
        {task.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{task.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {assignee && (
              <img 
                src={assignee.userAvatar} 
                alt={assignee.userName}
                className="w-5 h-5 rounded-full object-cover"
                title={assignee.userName}
              />
            )}
            {task.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            {task.subtasks.length > 0 && (
              <span>
                {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}
              </span>
            )}
            {task.comments.length > 0 && (
              <span>💬 {task.comments.length}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderKanbanBoard = () => {
    if (!selectedProject) return null;
    
    const filteredTasks = getFilteredTasks(selectedProject.tasks);
    const columns = getKanbanColumns(filteredTasks);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {columns.map(column => (
          <div
            key={column.id}
            className={`rounded-lg p-3 min-h-[400px] ${column.color}`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">{column.title}</h3>
              <span className="text-xs bg-white px-2 py-0.5 rounded-full shadow">
                {column.tasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {column.tasks.map(task => renderTaskCard(task))}
              {column.id === 'todo' && (
                <button
                  onClick={() => {
                    resetTaskForm();
                    setTaskStatus('todo');
                    setShowTaskModal(true);
                  }}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-2 text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors text-sm"
                >
                  + Add Task
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderProjectList = () => {
    if (!selectedProject) return null;
    
    const filteredTasks = getFilteredTasks(selectedProject.tasks);
    
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTasks.map(task => {
              const assignee = selectedProject.team.find(m => m.userId === task.assigneeId);
              return (
                <tr key={task.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-gray-500 line-clamp-1">{task.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(task.status)}`}>
                      {task.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {assignee ? (
                      <div className="flex items-center gap-2">
                        <img 
                          src={assignee.userAvatar} 
                          alt={assignee.userName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-sm">{assignee.userName}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{task.storyPoints}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {task.dueDate ? formatDate(task.dueDate) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTimeline = () => {
    if (!selectedProject) return null;
    
    const { sprints, milestones } = selectedProject;
    const allItems = [
      ...sprints.map(s => ({ ...s, type: 'sprint' as const, title: s.name })),
      ...milestones.map(m => ({ ...m, type: 'milestone' as const, title: m.name })),
    ].sort((a, b) => new Date(a.startDate || a.dueDate).getTime() - new Date(b.startDate || b.dueDate).getTime());
    
    return (
      <div className="space-y-6">
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-blue-200"></div>
          {allItems.map((item, index) => (
            <div key={item.id} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className="w-1/2 p-4">
                <div className={`bg-white rounded-lg shadow-md p-4 ${index % 2 === 0 ? 'mr-8' : 'ml-8'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{item.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.type === 'sprint' 
                        ? item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        : item.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.status || 'pending'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{item.type === 'sprint' ? item.goal : item.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>📅 {formatDate(item.startDate || item.dueDate)}</span>
                    {item.type === 'sprint' && item.endDate && (
                      <span>→ {formatDate(item.endDate)}</span>
                    )}
                    {item.type === 'sprint' && (
                      <span>📊 {item.completedPoints}/{item.totalPoints} pts</span>
                    )}
                    {item.type === 'milestone' && (
                      <span>📈 {item.progress}%</span>
                    )}
                  </div>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-4 border-blue-500 bg-white z-10 ${
                index % 2 === 0 ? 'mr-3' : 'ml-3'
              }`}></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    if (!selectedProject) return null;
    
    const { metrics, team, tasks, risks, milestones } = selectedProject;
    const filteredTasks = getFilteredTasks(tasks);
    
    return (
      <div className="space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-800">{metrics.totalTasks}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-green-600">✓ {metrics.completedTasks} done</span>
              <span className="text-xs text-purple-600">⏳ {metrics.inProgressTasks} in progress</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500">Completion Rate</p>
            <p className="text-2xl font-bold text-blue-600">{metrics.taskCompletionRate.toFixed(1)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 rounded-full h-2 transition-all"
                style={{ width: `${metrics.taskCompletionRate}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500">Team Members</p>
            <p className="text-2xl font-bold text-purple-600">{metrics.teamSize}</p>
            <div className="flex items-center gap-1 mt-1">
              {team.slice(0, 5).map(member => (
                <img 
                  key={member.id}
                  src={member.userAvatar} 
                  alt={member.userName}
                  className="w-6 h-6 rounded-full object-cover border-2 border-white"
                  title={member.userName}
                />
              ))}
              {team.length > 5 && (
                <span className="text-xs text-gray-400">+{team.length - 5}</span>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500">Risks</p>
            <p className="text-2xl font-bold text-red-600">{risks.length}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-red-600">⚠️ {risks.filter(r => r.severity === 'critical').length} critical</span>
              <span className="text-xs text-orange-600">⚠️ {risks.filter(r => r.severity === 'high').length} high</span>
            </div>
          </div>
        </div>

        {/* Sprint Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Sprint Progress</h3>
          <div className="space-y-3">
            {selectedProject.sprints.map(sprint => {
              const progress = sprint.totalPoints > 0 
                ? (sprint.completedPoints / sprint.totalPoints) * 100 
                : 0;
              return (
                <div key={sprint.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{sprint.name}</span>
                    <span className="text-gray-500">
                      {sprint.completedPoints}/{sprint.totalPoints} pts ({progress.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className={`rounded-full h-2 transition-all ${
                        progress >= 80 ? 'bg-green-500' : 
                        progress >= 50 ? 'bg-yellow-500' : 
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {filteredTasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center gap-3 text-sm border-b pb-2">
                <span className="text-xs text-gray-400">{formatDateTime(task.updatedAt)}</span>
                <span className="font-medium">{task.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(task.status)}`}>
                  {task.status.replace('-', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTaskModal = () => {
    if (!showTaskModal) return null;
    
    const isEditing = !!editingTask;
    const task = editingTask || {
      title: taskTitle,
      description: taskDescription,
      priority: taskPriority,
      status: taskStatus,
      storyPoints: taskStoryPoints,
      assigneeId: taskAssignee,
      dueDate: taskDueDate,
      tags: taskTags.split(',').map(t => t.trim()).filter(t => t),
      labels: taskLabels.split(',').map(l => l.trim()).filter(l => l),
      subtasks: subtasks,
      comments: [],
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">{isEditing ? 'Edit Task' : 'Create Task'}</h3>
            <button 
              onClick={() => {
                setShowTaskModal(false);
                setEditingTask(null);
                resetTaskForm();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Task title"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Task description"
                rows={3}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as Task['priority'])}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value as Task['status'])}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Story Points</label>
                <input
                  type="number"
                  value={taskStoryPoints}
                  onChange={(e) => setTaskStoryPoints(parseInt(e.target.value) || 0)}
                  min="0"
                  max="21"
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                <select
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {selectedProject?.team.map(member => (
                    <option key={member.id} value={member.userId}>{member.userName}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={taskTags}
                onChange={(e) => setTaskTags(e.target.value)}
                placeholder="feature, bug, enhancement"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Labels (comma-separated)</label>
              <input
                type="text"
                value={taskLabels}
                onChange={(e) => setTaskLabels(e.target.value)}
                placeholder="frontend, backend, design"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subtasks</label>
              {subtasks.map((subtask, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={subtask.title}
                    onChange={(e) => {
                      const newSubtasks = [...subtasks];
                      newSubtasks[index].title = e.target.value;
                      setSubtasks(newSubtasks);
                    }}
                    placeholder="Subtask title"
                    className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      setSubtasks(subtasks.filter((_, i) => i !== index));
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => setSubtasks([...subtasks, { title: '' }])}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add subtask
              </button>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={createTask}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
            >
              {isEditing ? 'Update Task' : 'Create Task'}
            </button>
            <button
              onClick={() => {
                setShowTaskModal(false);
                setEditingTask(null);
                resetTaskForm();
              }}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSprintModal = () => {
    if (!showSprintModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Create Sprint</h3>
            <button 
              onClick={() => setShowSprintModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sprint Name *</label>
              <input
                type="text"
                value={sprintName}
                onChange={(e) => setSprintName(e.target.value)}
                placeholder="Sprint 2 - Feature Development"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Goal</label>
              <textarea
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
                placeholder="What we want to achieve this sprint"
                rows={2}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={sprintStartDate}
                  onChange={(e) => setSprintStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={sprintEndDate}
                  onChange={(e) => setSprintEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={createSprint}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
            >
              Create Sprint
            </button>
            <button
              onClick={() => setShowSprintModal(false)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMemberModal = () => {
    if (!showMemberModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Add Team Member</h3>
            <button 
              onClick={() => setShowMemberModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="team@example.com"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as TeamMember['role'])}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="developer">Developer</option>
                <option value="designer">Designer</option>
                <option value="tester">Tester</option>
                <option value="manager">Manager</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={addTeamMember}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
            >
              Add Member
            </button>
            <button
              onClick={() => setShowMemberModal(false)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRiskModal = () => {
    if (!showRiskModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Add Risk</h3>
            <button 
              onClick={() => setShowRiskModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Risk Title *</label>
              <input
                type="text"
                value={riskTitle}
                onChange={(e) => setRiskTitle(e.target.value)}
                placeholder="Risk title"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={riskDescription}
                onChange={(e) => setRiskDescription(e.target.value)}
                placeholder="Describe the risk"
                rows={2}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={riskSeverity}
                  onChange={(e) => setRiskSeverity(e.target.value as Risk['severity'])}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Probability</label>
                <select
                  value={riskProbability}
                  onChange={(e) => setRiskProbability(e.target.value as Risk['probability'])}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={createRisk}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
            >
              Add Risk
            </button>
            <button
              onClick={() => setShowRiskModal(false)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMilestoneModal = () => {
    if (!showMilestoneModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Create Milestone</h3>
            <button 
              onClick={() => setShowMilestoneModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Name *</label>
              <input
                type="text"
                value={milestoneName}
                onChange={(e) => setMilestoneName(e.target.value)}
                placeholder="Milestone name"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={milestoneDescription}
                onChange={(e) => setMilestoneDescription(e.target.value)}
                placeholder="Milestone description"
                rows={2}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={milestoneDueDate}
                onChange={(e) => setMilestoneDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={createMilestone}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
            >
              Create Milestone            </button>
            <button
              onClick={() => setShowMilestoneModal(false)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-md transition-colors"
            >
              Cancel
            </button>
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
          <p className="mt-4 text-gray-600">Loading project management...</p>
        </div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-600">No project selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <span>📋</span> Project Management
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                Day 11
              </span>
            </h1>
            <p className="text-gray-600 mt-1">{selectedProject.name}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm p-1">
              {['dashboard', 'board', 'list', 'timeline'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as any)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {mode === 'dashboard' && '📊'}
                  {mode === 'board' && '📌'}
                  {mode === 'list' && '📋'}
                  {mode === 'timeline' && '⏳'}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => {
                resetTaskForm();
                setTaskStatus('todo');
                setShowTaskModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
            >
              + Add Task
            </button>
            <button
              onClick={() => setShowSprintModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
            >
              📅 Sprint
            </button>
            <button
              onClick={() => setShowMemberModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
            >
              👥 Add Member
            </button>
          </div>
        </div>

        {/* Project Progress Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-blue-600">{selectedProject.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 rounded-full h-3 transition-all duration-500"
              style={{ width: `${selectedProject.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Started: {formatDate(selectedProject.startDate)}</span>
            <span>{selectedProject.metrics.completedTasks}/{selectedProject.metrics.totalTasks} tasks done</span>
            {selectedProject.endDate && (
              <span>Target: {formatDate(selectedProject.endDate)}</span>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Assignees</option>
              {selectedProject.team.map(member => (
                <option key={member.id} value={member.userId}>{member.userName}</option>
              ))}
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="backlog">Backlog</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-4 min-h-[500px]">
          {viewMode === 'dashboard' && renderDashboard()}
          {viewMode === 'board' && renderKanbanBoard()}
          {viewMode === 'list' && renderProjectList()}
          {viewMode === 'timeline' && renderTimeline()}
        </div>

        {/* Modals */}
        {renderTaskModal()}
        {renderSprintModal()}
        {renderMemberModal()}
        {renderRiskModal()}
        {renderMilestoneModal()}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500 border-t pt-6">
          <p>© 2026 Project Management - Day 11 Complete System</p>
          <p className="mt-1">Kanban • Sprints • Teams • Reports • Timeline</p>
          <p className="mt-1 text-gray-400">
            {selectedProject.tasks.length} tasks • {selectedProject.team.length} team members • {selectedProject.sprints.length} sprints
          </p>
        </div>
      </div>
    </div>
  );
}