// app/learning/page.tsx
// Complete Learning Management System with Courses, Lessons, Quizzes, Progress Tracking & Certificates
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// --- TypeScript Interfaces ---
interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  instructorAvatar: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  price: number;
  currency: string;
  duration: number; // in hours
  lessons: Lesson[];
  students: string[];
  rating: number;
  reviewCount: number;
  image: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  prerequisites: string[];
  learningObjectives: string[];
  tags: string[];
  language: string;
  lastUpdated: string;
  featured: boolean;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'text' | 'quiz' | 'assignment' | 'resource';
  content: string; // URL for video, markdown for text, etc.
  duration: number; // in minutes
  order: number;
  isFree: boolean;
  status: 'draft' | 'published' | 'archived';
  attachments: LessonAttachment[];
  quiz?: Quiz;
  assignment?: Assignment;
  completedBy: string[];
  createdAt: string;
  updatedAt: string;
}

interface LessonAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit: number; // in minutes
  attemptsAllowed: number;
  shuffleQuestions: boolean;
  showResults: boolean;
  createdAt: string;
  updatedAt: string;
}

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'matching' | 'essay';
  question: string;
  options: string[];
  correctAnswers: string[];
  points: number;
  explanation?: string;
  order: number;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  submissionType: 'file' | 'text' | 'link';
  attachments: LessonAttachment[];
  submissions: AssignmentSubmission[];
  createdAt: string;
  updatedAt: string;
}

interface AssignmentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  content: string;
  attachments: LessonAttachment[];
  submittedAt: string;
  grade?: number;
  feedback?: string;
  status: 'pending' | 'graded' | 'late' | 'resubmitted';
}

interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  enrolledCourses: string[];
  completedLessons: string[];
  progress: {
    courseId: string;
    progress: number;
    completedAt?: string;
  }[];
  certificates: Certificate[];
  joinedAt: string;
  lastActive: string;
  totalLearningTime: number;
  achievements: string[];
}

interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  issueDate: string;
  expiryDate?: string;
  certificateUrl: string;
  verificationCode: string;
  grade?: string;
}

interface CourseProgress {
  courseId: string;
  studentId: string;
  completedLessons: string[];
  currentLesson: string;
  quizScores: {
    quizId: string;
    score: number;
    attempts: number;
    completedAt?: string;
  }[];
  timeSpent: number;
  progress: number;
  startedAt: string;
  lastAccessed: string;
  completedAt?: string;
}

interface Discussion {
  id: string;
  courseId: string;
  lessonId?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  content: string;
  replies: DiscussionReply[];
  upvotes: number;
  downvotes: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DiscussionReply {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  upvotes: number;
  downvotes: number;
  isBestAnswer: boolean;
  createdAt: string;
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

const getRandomAvatar = (name: string): string => {
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8', 'F7DC6F'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=128`;
};

const getLevelColor = (level: string): string => {
  switch (level) {
    case 'beginner': return 'bg-green-100 text-green-800';
    case 'intermediate': return 'bg-blue-100 text-blue-800';
    case 'advanced': return 'bg-orange-100 text-orange-800';
    case 'expert': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getLessonTypeIcon = (type: string): string => {
  switch (type) {
    case 'video': return '🎬';
    case 'text': return '📝';
    case 'quiz': return '📊';
    case 'assignment': return '📋';
    case 'resource': return '📚';
    default: return '📄';
  }
};

// --- Mock Data Generation ---
const generateMockCourses = (instructorId: string, instructorName: string): Course[] => {
  const now = getCurrentTimestamp();
  const courses: Course[] = [];

  // Course 1: Web Development Bootcamp
  const lessons1: Lesson[] = [
    {
      id: generateId(),
      title: 'Introduction to Web Development',
      description: 'Learn the fundamentals of web development',
      type: 'video',
      content: 'https://example.com/videos/intro.mp4',
      duration: 15,
      order: 1,
      isFree: true,
      status: 'published',
      attachments: [],
      completedBy: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'HTML Fundamentals',
      description: 'Master HTML5 and semantic markup',
      type: 'video',
      content: 'https://example.com/videos/html.mp4',
      duration: 45,
      order: 2,
      isFree: true,
      status: 'published',
      attachments: [
        { id: generateId(), name: 'HTML_Cheatsheet.pdf', url: '/attachments/html-cheatsheet.pdf', size: 1024000, type: 'application/pdf' }
      ],
      completedBy: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'CSS Mastery',
      description: 'Learn CSS3, flexbox, grid, and animations',
      type: 'video',
      content: 'https://example.com/videos/css.mp4',
      duration: 60,
      order: 3,
      isFree: false,
      status: 'published',
      attachments: [],
      completedBy: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'JavaScript Fundamentals',
      description: 'ES6+, DOM manipulation, and async programming',
      type: 'video',
      content: 'https://example.com/videos/js.mp4',
      duration: 90,
      order: 4,
      isFree: false,
      status: 'published',
      attachments: [],
      completedBy: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'JavaScript Quiz',
      description: 'Test your JavaScript knowledge',
      type: 'quiz',
      content: '',
      duration: 30,
      order: 5,
      isFree: false,
      status: 'published',
      attachments: [],
      completedBy: [],
      createdAt: now,
      updatedAt: now,
      quiz: {
        id: generateId(),
        title: 'JavaScript Fundamentals Quiz',
        description: 'Test your understanding of JavaScript',
        questions: [
          {
            id: generateId(),
            type: 'multiple-choice',
            question: 'What is the correct way to declare a variable in JavaScript?',
            options: ['var x;', 'let x;', 'const x;', 'All of the above'],
            correctAnswers: ['All of the above'],
            points: 10,
            order: 1,
          },
          {
            id: generateId(),
            type: 'true-false',
            question: 'JavaScript is a statically typed language.',
            options: ['True', 'False'],
            correctAnswers: ['False'],
            points: 5,
            order: 2,
          },
          {
            id: generateId(),
            type: 'multiple-choice',
            question: 'Which method is used to add an element to the end of an array?',
            options: ['push()', 'pop()', 'shift()', 'unshift()'],
            correctAnswers: ['push()'],
            points: 10,
            order: 3,
          },
        ],
        passingScore: 70,
        timeLimit: 20,
        attemptsAllowed: 3,
        shuffleQuestions: true,
        showResults: true,
        createdAt: now,
        updatedAt: now,
      }
    },
    {
      id: generateId(),
      title: 'React Introduction',
      description: 'Learn React fundamentals and component-based architecture',
      type: 'video',
      content: 'https://example.com/videos/react.mp4',
      duration: 75,
      order: 6,
      isFree: false,
      status: 'draft',
      attachments: [],
      completedBy: [],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const course1: Course = {
    id: generateId(),
    title: 'Complete Web Development Bootcamp',
    description: 'Master HTML, CSS, JavaScript, and React in this comprehensive bootcamp.',
    instructorId: instructorId,
    instructorName: instructorName,
    instructorAvatar: getRandomAvatar(instructorName),
    category: 'Web Development',
    level: 'beginner',
    price: 99.99,
    currency: 'USD',
    duration: 45,
    lessons: lessons1,
    students: [],
    rating: 4.8,
    reviewCount: 1250,
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop',
    status: 'published',
    createdAt: now,
    updatedAt: now,
    prerequisites: ['Basic computer skills'],
    learningObjectives: [
      'Build responsive websites',
      'Write clean HTML and CSS',
      'Master JavaScript programming',
      'Understand React fundamentals'
    ],
    tags: ['web development', 'react', 'javascript', 'html', 'css'],
    language: 'English',
    lastUpdated: now,
    featured: true,
  };
  courses.push(course1);

  // Course 2: Data Science & Machine Learning
  const lessons2: Lesson[] = [
    {
      id: generateId(),
      title: 'Introduction to Data Science',
      description: 'Overview of data science concepts and tools',
      type: 'video',
      content: 'https://example.com/videos/ds-intro.mp4',
      duration: 20,
      order: 1,
      isFree: true,
      status: 'published',
      attachments: [],
      completedBy: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Python for Data Science',
      description: 'Python programming with pandas, numpy, and matplotlib',
      type: 'video',
      content: 'https://example.com/videos/python-ds.mp4',
      duration: 120,
      order: 2,
      isFree: false,
      status: 'published',
      attachments: [],
      completedBy: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Machine Learning Fundamentals',
      description: 'Supervised and unsupervised learning algorithms',
      type: 'video',
      content: 'https://example.com/videos/ml.mp4',
      duration: 90,
      order: 3,
      isFree: false,
      status: 'published',
      attachments: [],
      completedBy: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Data Science Project',
      description: 'Build a complete data science project from start to finish',
      type: 'assignment',
      content: 'Build a predictive model using real-world data',
      duration: 120,
      order: 4,
      isFree: false,
      status: 'published',
      attachments: [],
      completedBy: [],
      createdAt: now,
      updatedAt: now,
      assignment: {
        id: generateId(),
        title: 'Predictive Modeling Project',
        description: 'Build and deploy a machine learning model to predict housing prices',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        maxScore: 100,
        submissionType: 'file',
        attachments: [
          { id: generateId(), name: 'Dataset.csv', url: '/attachments/dataset.csv', size: 5242880, type: 'text/csv' }
        ],
        submissions: [],
        createdAt: now,
        updatedAt: now,
      }
    },
  ];

  const course2: Course = {
    id: generateId(),
    title: 'Data Science & Machine Learning',
    description: 'Learn data science, machine learning, and AI from scratch.',
    instructorId: instructorId,
    instructorName: instructorName,
    instructorAvatar: getRandomAvatar(instructorName),
    category: 'Data Science',
    level: 'intermediate',
    price: 149.99,
    currency: 'USD',
    duration: 60,
    lessons: lessons2,
    students: [],
    rating: 4.9,
    reviewCount: 850,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
    status: 'published',
    createdAt: now,
    updatedAt: now,
    prerequisites: ['Basic programming', 'Mathematics fundamentals'],
    learningObjectives: [
      'Understand data science workflow',
      'Master Python data science libraries',
      'Build and evaluate ML models',
      'Complete real-world data projects'
    ],
    tags: ['data science', 'machine learning', 'python', 'ai'],
    language: 'English',
    lastUpdated: now,
    featured: true,
  };
  courses.push(course2);

  // Course 3: UI/UX Design
  const lessons3: Lesson[] = [
    {
      id: generateId(),
      title: 'Design Thinking Fundamentals',
      description: 'Learn the design thinking process',
      type: 'video',
      content: 'https://example.com/videos/design-thinking.mp4',
      duration: 30,
      order: 1,
      isFree: true,
      status: 'published',
      attachments: [],
      completedBy: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'UI Design Principles',
      description: 'Color theory, typography, and layout',
      type: 'text',
      content: 'Comprehensive guide to UI design principles',
      duration: 45,
      order: 2,
      isFree: false,
      status: 'published',
      attachments: [],
      completedBy: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Figma Masterclass',
      description: 'Learn Figma from beginner to advanced',
      type: 'video',
      content: 'https://example.com/videos/figma.mp4',
      duration: 180,
      order: 3,
      isFree: false,
      status: 'published',
      attachments: [],
      completedBy: [],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const course3: Course = {
    id: generateId(),
    title: 'UI/UX Design Masterclass',
    description: 'Become a professional UI/UX designer with this comprehensive course.',
    instructorId: instructorId,
    instructorName: instructorName,
    instructorAvatar: getRandomAvatar(instructorName),
    category: 'Design',
    level: 'beginner',
    price: 79.99,
    currency: 'USD',
    duration: 35,
    lessons: lessons3,
    students: [],
    rating: 4.7,
    reviewCount: 620,
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=400&fit=crop',
    status: 'published',
    createdAt: now,
    updatedAt: now,
    prerequisites: [],
    learningObjectives: [
      'Master design thinking',
      'Create stunning UI designs',
      'Use Figma professionally',
      'Build a design portfolio'
    ],
    tags: ['ui/ux', 'design', 'figma', 'prototyping'],
    language: 'English',
    lastUpdated: now,
    featured: false,
  };
  courses.push(course3);

  return courses;
};

// --- Main Component ---
export default function LearningManagementPage() {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [progress, setProgress] = useState<CourseProgress[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI States
  const [viewMode, setViewMode] = useState<'courses' | 'course' | 'lesson' | 'dashboard' | 'admin'>('courses');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);

  // Quiz States
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Assignment States
  const [assignmentSubmission, setAssignmentSubmission] = useState('');
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);

  // Discussion States
  const [discussionTitle, setDiscussionTitle] = useState('');
  const [discussionContent, setDiscussionContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');

  // --- Effects ---
  useEffect(() => {
    setIsClient(true);

    // Load user
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const authUser = JSON.parse(storedUser);
        setCurrentUser(authUser);

        // Generate mock courses
        const userId = authUser.id || 'instructor1';
        const userName = authUser.fullName || authUser.username || 'Instructor';
        const mockCourses = generateMockCourses(userId, userName);
        setCourses(mockCourses);
        setSelectedCourse(mockCourses[0]);

        // Generate mock students
        const mockStudents: Student[] = [
          {
            id: 'student1',
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            avatar: getRandomAvatar('Sarah Johnson'),
            enrolledCourses: [mockCourses[0].id, mockCourses[1].id],
            completedLessons: [mockCourses[0].lessons[0].id, mockCourses[0].lessons[1].id],
            progress: [
              { courseId: mockCourses[0].id, progress: 35 },
              { courseId: mockCourses[1].id, progress: 10 },
            ],
            certificates: [],
            joinedAt: getCurrentTimestamp(),
            lastActive: getCurrentTimestamp(),
            totalLearningTime: 3600,
            achievements: ['First Lesson', 'Quick Learner'],
          },
          {
            id: 'student2',
            name: 'Alex Rivera',
            email: 'alex@example.com',
            avatar: getRandomAvatar('Alex Rivera'),
            enrolledCourses: [mockCourses[1].id],
            completedLessons: [],
            progress: [{ courseId: mockCourses[1].id, progress: 5 }],
            certificates: [],
            joinedAt: getCurrentTimestamp(),
            lastActive: getCurrentTimestamp(),
            totalLearningTime: 1200,
            achievements: ['Enrolled'],
          },
        ];
        setStudents(mockStudents);

        // Generate mock progress
        const mockProgress: CourseProgress[] = mockStudents.map(student => ({
          courseId: student.enrolledCourses[0],
          studentId: student.id,
          completedLessons: student.completedLessons,
          currentLesson: student.completedLessons[student.completedLessons.length - 1] || '',
          quizScores: [],
          timeSpent: student.totalLearningTime,
          progress: student.progress[0]?.progress || 0,
          startedAt: getCurrentTimestamp(),
          lastAccessed: getCurrentTimestamp(),
        }));
        setProgress(mockProgress);

        // Generate mock discussions
        const mockDiscussions: Discussion[] = [
          {
            id: generateId(),
            courseId: mockCourses[0].id,
            lessonId: mockCourses[0].lessons[0].id,
            authorId: 'student1',
            authorName: 'Sarah Johnson',
            authorAvatar: getRandomAvatar('Sarah Johnson'),
            title: 'Question about HTML structure',
            content: 'Can someone explain the difference between div and section elements?',
            replies: [
              {
                id: generateId(),
                authorId: 'instructor1',
                authorName: userName,
                authorAvatar: getRandomAvatar(userName),
                content: 'Great question! Div is a generic container, while section represents a thematic grouping of content.',
                upvotes: 5,
                downvotes: 0,
                isBestAnswer: true,
                createdAt: getCurrentTimestamp(),
                updatedAt: getCurrentTimestamp(),
              }
            ],
            upvotes: 10,
            downvotes: 0,
            isPinned: true,
            isLocked: false,
            createdAt: getCurrentTimestamp(),
            updatedAt: getCurrentTimestamp(),
          }
        ];
        setDiscussions(mockDiscussions);
      } catch (error) {
        console.error('Failed to parse user:', error);
      }
    } else {
      // Guest user
      const mockCourses = generateMockCourses('instructor1', 'Guest Instructor');
      setCourses(mockCourses);
      setSelectedCourse(mockCourses[0]);
    }

    setIsLoading(false);
  }, []);

  // --- Course Operations ---
  const enrollInCourse = useCallback((courseId: string) => {
    if (!currentUser) {
      alert('Please login to enroll in courses');
      return;
    }

    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        const studentId = currentUser.id || 'guest';
        if (!c.students.includes(studentId)) {
          return {
            ...c,
            students: [...c.students, studentId],
          };
        }
      }
      return c;
    }));

    setSelectedCourse(prev => {
      if (!prev || prev.id !== courseId) return prev;
      const studentId = currentUser.id || 'guest';
      if (!prev.students.includes(studentId)) {
        return {
          ...prev,
          students: [...prev.students, studentId],
        };
      }
      return prev;
    });

    alert('Successfully enrolled in the course!');
  }, [currentUser]);

  // --- Lesson Operations ---
  const completeLesson = useCallback((courseId: string, lessonId: string) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        lessons: c.lessons.map(l => {
          if (l.id === lessonId) {
            const studentId = currentUser?.id || 'guest';
            if (!l.completedBy.includes(studentId)) {
              return {
                ...l,
                completedBy: [...l.completedBy, studentId],
              };
            }
          }
          return l;
        }),
      };
    }));

    setSelectedCourse(prev => {
      if (!prev || prev.id !== courseId) return prev;
      return {
        ...prev,
        lessons: prev.lessons.map(l => {
          if (l.id === lessonId) {
            const studentId = currentUser?.id || 'guest';
            if (!l.completedBy.includes(studentId)) {
              return {
                ...l,
                completedBy: [...l.completedBy, studentId],
              };
            }
          }
          return l;
        }),
      };
    });

    // Update progress
    setProgress(prev => {
      const existing = prev.find(p => p.courseId === courseId && p.studentId === (currentUser?.id || 'guest'));
      if (existing) {
        return prev.map(p => {
          if (p.courseId === courseId && p.studentId === (currentUser?.id || 'guest')) {
            const completedLessons = [...p.completedLessons, lessonId];
            const course = courses.find(c => c.id === courseId);
            const progressPercent = course ? (completedLessons.length / course.lessons.length) * 100 : 0;
            return {
              ...p,
              completedLessons,
              progress: Math.round(progressPercent),
              lastAccessed: getCurrentTimestamp(),
            };
          }
          return p;
        });
      }
      return prev;
    });

    alert('Lesson completed! 🎉');
  }, [currentUser, courses]);

  // --- Quiz Operations ---
  const startQuiz = useCallback((quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setQuizAnswers({});
    setQuizScore(null);
    setQuizSubmitted(false);
    setShowQuizModal(true);
  }, []);

  const submitQuiz = useCallback(() => {
    if (!currentQuiz) return;

    let correct = 0;
    currentQuiz.questions.forEach(q => {
      const answer = quizAnswers[q.id];
      if (answer && q.correctAnswers.includes(answer)) {
        correct += q.points;
      }
    });

    const totalPoints = currentQuiz.questions.reduce((sum, q) => sum + q.points, 0);
    const score = Math.round((correct / totalPoints) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);

    // Save quiz score
    setProgress(prev => prev.map(p => {
      if (p.courseId === selectedCourse?.id && p.studentId === (currentUser?.id || 'guest')) {
        return {
          ...p,
          quizScores: [
            ...p.quizScores,
            {
              quizId: currentQuiz.id,
              score: score,
              attempts: 1,
              completedAt: getCurrentTimestamp(),
            }
          ],
        };
      }
      return p;
    }));

    if (score >= currentQuiz.passingScore) {
      alert(`🎉 Quiz passed! Your score: ${score}%`);
    } else {
      alert(`📚 Quiz not passed. Your score: ${score}%. Passing score: ${currentQuiz.passingScore}%`);
    }
  }, [currentQuiz, quizAnswers, selectedCourse, currentUser]);

  // --- Assignment Operations ---
  const submitAssignment = useCallback(() => {
    if (!assignmentSubmission.trim() && !assignmentFile) {
      alert('Please provide your submission');
      return;
    }

    setShowAssignmentModal(false);
    setAssignmentSubmission('');
    setAssignmentFile(null);
    alert('Assignment submitted successfully! 📋');
  }, [assignmentSubmission, assignmentFile]);

  // --- Discussion Operations ---
  const createDiscussion = useCallback(() => {
    if (!discussionTitle.trim() || !discussionContent.trim()) {
      alert('Please provide both title and content');
      return;
    }

    const newDiscussion: Discussion = {
      id: generateId(),
      courseId: selectedCourse?.id || '',
      lessonId: selectedLesson?.id,
      authorId: currentUser?.id || 'guest',
      authorName: currentUser?.fullName || 'Guest',
      authorAvatar: getRandomAvatar(currentUser?.fullName || 'Guest'),
      title: discussionTitle.trim(),
      content: discussionContent.trim(),
      replies: [],
      upvotes: 0,
      downvotes: 0,
      isPinned: false,
      isLocked: false,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    setDiscussions(prev => [newDiscussion, ...prev]);
    setDiscussionTitle('');
    setDiscussionContent('');
    setShowDiscussionModal(false);
    alert('Discussion created! 💬');
  }, [discussionTitle, discussionContent, selectedCourse, selectedLesson, currentUser]);

  const addReply = useCallback((discussionId: string, content: string) => {
    if (!content.trim()) return;

    const newReply: DiscussionReply = {
      id: generateId(),
      authorId: currentUser?.id || 'guest',
      authorName: currentUser?.fullName || 'Guest',
      authorAvatar: getRandomAvatar(currentUser?.fullName || 'Guest'),
      content: content.trim(),
      upvotes: 0,
      downvotes: 0,
      isBestAnswer: false,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    setDiscussions(prev => prev.map(d => {
      if (d.id === discussionId) {
        return {
          ...d,
          replies: [...d.replies, newReply],
        };
      }
      return d;
    }));

    setReplyContent('');
    setReplyingTo(null);
  }, [currentUser]);

  const voteDiscussion = useCallback((discussionId: string, type: 'up' | 'down') => {
    setDiscussions(prev => prev.map(d => {
      if (d.id === discussionId) {
        return {
          ...d,
          upvotes: type === 'up' ? d.upvotes + 1 : d.upvotes,
          downvotes: type === 'down' ? d.downvotes + 1 : d.downvotes,
        };
      }
      return d;
    }));
  }, []);

  // --- Certificate Operations ---
  const generateCertificate = useCallback((courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    const student = students.find(s => s.id === (currentUser?.id || 'guest'));
    if (!student) return;

    const newCertificate: Certificate = {
      id: generateId(),
      courseId: course.id,
      courseTitle: course.title,
      studentId: student.id,
      studentName: student.name,
      issueDate: getCurrentTimestamp(),
      certificateUrl: `/certificates/${course.id}_${student.id}.pdf`,
      verificationCode: generateId().toUpperCase().slice(0, 8),
    };

    setStudents(prev => prev.map(s => {
      if (s.id === student.id) {
        return {
          ...s,
          certificates: [...s.certificates, newCertificate],
        };
      }
      return s;
    }));

    setShowCertificateModal(true);
  }, [courses, students, currentUser]);

  // --- Render Functions ---
  const renderCourseCard = (course: Course) => {
    const isEnrolled = course.students.includes(currentUser?.id || 'guest');
    const progressData = progress.find(p => p.courseId === course.id && p.studentId === (currentUser?.id || 'guest'));
    const courseProgress = progressData?.progress || 0;

    return (
      <div 
        key={course.id} 
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
        onClick={() => {
          setSelectedCourse(course);
          setViewMode('course');
        }}
      >
        <div className="h-48 overflow-hidden">
          <img 
            src={course.image} 
            alt={course.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {course.featured && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
              ⭐ Featured
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs px-2 py-1 rounded ${getLevelColor(course.level)}`}>
              {course.level}
            </span>
            <span className="text-xs text-gray-500">{course.duration}h</span>
          </div>
          <h3 className="font-semibold text-gray-800 text-lg mb-1">{course.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{course.description}</p>
          <div className="flex items-center gap-2 mb-2">
            <img 
              src={course.instructorAvatar} 
              alt={course.instructorName}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-sm text-gray-600">{course.instructorName}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span className="text-sm font-medium">{course.rating}</span>
              <span className="text-xs text-gray-400">({course.reviewCount})</span>
            </div>
            <div className="flex items-center gap-2">
              {isEnrolled ? (
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 rounded-full h-2 transition-all"
                      style={{ width: `${courseProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{courseProgress}%</span>
                </div>
              ) : (
                <span className="font-bold text-blue-600">${course.price}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCourseView = () => {
    if (!selectedCourse) return null;

    const isEnrolled = selectedCourse.students.includes(currentUser?.id || 'guest');
    const progressData = progress.find(p => 
      p.courseId === selectedCourse.id && 
      p.studentId === (currentUser?.id || 'guest')
    );
    const courseProgress = progressData?.progress || 0;
    const completedLessons = progressData?.completedLessons || [];

    return (
      <div>
        <button
          onClick={() => setViewMode('courses')}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Courses
        </button>

        {/* Course Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{selectedCourse.title}</h2>
              <p className="text-blue-100 mt-1">{selectedCourse.description}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-blue-100">
                <span>{selectedCourse.category}</span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded ${getLevelColor(selectedCourse.level)}`}>
                  {selectedCourse.level}
                </span>
                <span>•</span>
                <span>{selectedCourse.duration}h</span>
                <span>•</span>
                <span>{selectedCourse.lessons.length} lessons</span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              {isEnrolled ? (
                <div className="text-center">
                  <div className="text-sm font-medium">Progress</div>
                  <div className="text-2xl font-bold">{courseProgress}%</div>
                  <div className="w-32 bg-white/20 rounded-full h-2 mt-1">
                    <div 
                      className="bg-white rounded-full h-2 transition-all"
                      style={{ width: `${courseProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => enrollInCourse(selectedCourse.id)}
                  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Enroll Now - ${selectedCourse.price}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lessons */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-4">Course Content</h3>
              <div className="space-y-2">
                {selectedCourse.lessons.map((lesson, index) => {
                  const isCompleted = completedLessons.includes(lesson.id);
                  const isLocked = !lesson.isFree && !isEnrolled;
                  
                  return (
                    <div
                      key={lesson.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        selectedLesson?.id === lesson.id ? 'bg-blue-50 border border-blue-200' :
                        isCompleted ? 'bg-green-50' : 'hover:bg-gray-50'
                      } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={() => {
                        if (!isLocked) {
                          setSelectedLesson(lesson);
                          if (lesson.type === 'quiz' && lesson.quiz) {
                            startQuiz(lesson.quiz);
                          } else {
                            setViewMode('lesson');
                          }
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{getLessonTypeIcon(lesson.type)}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lesson.title}</span>
                            {lesson.isFree && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Free</span>
                            )}
                            {isCompleted && (
                              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">✓</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDuration(lesson.duration)} • {lesson.type}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLocked && <span className="text-sm text-gray-400">🔒</span>}
                        <span className="text-sm text-gray-400">{index + 1}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Discussions */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Discussions</h3>
                {isEnrolled && (
                  <button
                    onClick={() => setShowDiscussionModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-1 px-4 rounded-lg transition-colors"
                  >
                    + New Discussion
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {discussions
                  .filter(d => d.courseId === selectedCourse.id)
                  .slice(0, 3)
                  .map(discussion => (
                    <div key={discussion.id} className="border-b pb-3 last:border-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{discussion.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>💬 {discussion.replies.length}</span>
                          <span>👍 {discussion.upvotes}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-1">{discussion.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <img 
                          src={discussion.authorAvatar} 
                          alt={discussion.authorName}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="text-xs text-gray-500">{discussion.authorName}</span>
                        <span className="text-xs text-gray-400">• {formatDate(discussion.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                {discussions.filter(d => d.courseId === selectedCourse.id).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No discussions yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-4">About This Course</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <span className="text-gray-600 ml-2">{selectedCourse.category}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Language:</span>
                  <span className="text-gray-600 ml-2">{selectedCourse.language}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Students:</span>
                  <span className="text-gray-600 ml-2">{selectedCourse.students.length}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Last Updated:</span>
                  <span className="text-gray-600 ml-2">{formatDate(selectedCourse.lastUpdated)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Rating:</span>
                  <span className="text-gray-600 ml-2">★ {selectedCourse.rating} ({selectedCourse.reviewCount})</span>
                </div>
              </div>

              <div className="border-t mt-4 pt-4">
                <h4 className="font-medium text-sm mb-2">Learning Objectives</h4>
                <ul className="space-y-1">
                  {selectedCourse.learningObjectives.map((obj, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>

              {isEnrolled && courseProgress === 100 && (
                <button
                  onClick={() => generateCertificate(selectedCourse.id)}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  🎓 Get Certificate
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLessonView = () => {
    if (!selectedLesson || !selectedCourse) return null;

    const isCompleted = selectedLesson.completedBy.includes(currentUser?.id || 'guest');

    return (
      <div>
        <button
          onClick={() => {
            setViewMode('course');
            setSelectedLesson(null);
          }}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Course
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{getLessonTypeIcon(selectedLesson.type)}</span>
            <div>
              <h2 className="text-2xl font-bold">{selectedLesson.title}</h2>
              <p className="text-gray-600">{selectedLesson.description}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 min-h-[300px]">
            {selectedLesson.type === 'video' && (
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-6xl mb-2">🎬</div>
                  <p>Video Player</p>
                  <p className="text-sm text-gray-400">{selectedLesson.content}</p>
                  <p className="text-xs text-gray-500">Duration: {formatDuration(selectedLesson.duration)}</p>
                </div>
              </div>
            )}

            {selectedLesson.type === 'text' && (
              <div className="prose max-w-none">
                <h3>Lesson Content</h3>
                <p>{selectedLesson.content}</p>
                <p className="text-sm text-gray-500">Reading time: {formatDuration(selectedLesson.duration)}</p>
              </div>
            )}

            {selectedLesson.type === 'quiz' && selectedLesson.quiz && (
              <div>
                <h3 className="font-semibold text-lg mb-4">{selectedLesson.quiz.title}</h3>
                <p className="text-gray-600 mb-4">{selectedLesson.quiz.description}</p>
                <button
                  onClick={() => startQuiz(selectedLesson.quiz!)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Start Quiz
                </button>
              </div>
            )}

            {selectedLesson.type === 'assignment' && selectedLesson.assignment && (
              <div>
                <h3 className="font-semibold text-lg mb-4">{selectedLesson.assignment.title}</h3>
                <p className="text-gray-600 mb-4">{selectedLesson.assignment.description}</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Due: {formatDate(selectedLesson.assignment.dueDate)}</p>
                  <p className="text-sm text-gray-500">Max Score: {selectedLesson.assignment.maxScore}</p>
                  <button
                    onClick={() => setShowAssignmentModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                  >
                    Submit Assignment
                  </button>
                </div>
              </div>
            )}

            {selectedLesson.type === 'resource' && (
              <div>
                <h3 className="font-semibold text-lg mb-4">Resources</h3>
                <div className="space-y-2">
                  {selectedLesson.attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                      <span className="text-2xl">📎</span>
                      <div>
                        <p className="font-medium">{att.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(att.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Lesson Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              {!isCompleted && selectedLesson.type !== 'quiz' && selectedLesson.type !== 'assignment' && (
                <button
                  onClick={() => completeLesson(selectedCourse.id, selectedLesson.id)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  ✓ Mark as Complete
                </button>
              )}
              {isCompleted && (
                <span className="text-green-600 font-medium">✅ Completed</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>⏱️ {formatDuration(selectedLesson.duration)}</span>
              <span>•</span>
              <span>📊 {selectedLesson.type}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    const enrolledCourses = courses.filter(c => 
      c.students.includes(currentUser?.id || 'guest')
    );
    const totalProgress = enrolledCourses.reduce((sum, c) => {
      const p = progress.find(p => p.courseId === c.id && p.studentId === (currentUser?.id || 'guest'));
      return sum + (p?.progress || 0);
    }, 0);
    const avgProgress = enrolledCourses.length > 0 ? Math.round(totalProgress / enrolledCourses.length) : 0;

    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Learning Dashboard</h2>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Enrolled Courses</p>
            <p className="text-2xl font-bold text-blue-600">{enrolledCourses.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Average Progress</p>
            <p className="text-2xl font-bold text-green-600">{avgProgress}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Certificates</p>
            <p className="text-2xl font-bold text-purple-600">
              {students.find(s => s.id === (currentUser?.id || 'guest'))?.certificates.length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Learning Time</p>
            <p className="text-2xl font-bold text-orange-600">
              {Math.round((students.find(s => s.id === (currentUser?.id || 'guest'))?.totalLearningTime || 0) / 3600)}h
            </p>
          </div>
        </div>

        {/* Course Progress */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-lg mb-4">Your Courses</h3>
          <div className="space-y-4">
            {enrolledCourses.map(course => {
              const progressData = progress.find(p => 
                p.courseId === course.id && 
                p.studentId === (currentUser?.id || 'guest')
              );
              const courseProgress = progressData?.progress || 0;

              return (
                <div key={course.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{course.title}</h4>
                      <p className="text-sm text-gray-500">{course.lessons.length} lessons</p>
                    </div>
                    <span className="font-bold text-blue-600">{courseProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 rounded-full h-2 transition-all"
                      style={{ width: `${courseProgress}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {enrolledCourses.length === 0 && (
              <p className="text-gray-500 text-center py-4">You haven't enrolled in any courses yet</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAdminView = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Total Courses</p>
            <p className="text-2xl font-bold text-blue-600">{courses.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Students</p>
            <p className="text-2xl font-bold text-green-600">{students.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Discussions</p>
            <p className="text-2xl font-bold text-purple-600">{discussions.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Revenue</p>
            <p className="text-2xl font-bold text-orange-600">
              ${courses.reduce((sum, c) => sum + (c.price * c.students.length), 0).toFixed(0)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-lg mb-4">Course Management</h3>
          <div className="space-y-2">
            {courses.map(course => (
              <div key={course.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{course.title}</p>
                  <p className="text-sm text-gray-500">
                    {course.students.length} students • {course.lessons.length} lessons • ${course.price}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    course.status === 'published' ? 'bg-green-100 text-green-700' :
                    course.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {course.status}
                  </span>
                  <span className="text-sm text-gray-500">★ {course.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderQuizModal = () => {
    if (!showQuizModal || !currentQuiz) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">{currentQuiz.title}</h3>
            <button 
              onClick={() => {
                setShowQuizModal(false);
                setCurrentQuiz(null);
                setQuizAnswers({});
                setQuizScore(null);
                setQuizSubmitted(false);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {quizSubmitted ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">{quizScore && quizScore >= currentQuiz.passingScore ? '🎉' : '📚'}</div>
              <h4 className="text-2xl font-bold mb-2">
                {quizScore && quizScore >= currentQuiz.passingScore ? 'Congratulations!' : 'Keep Learning!'}
              </h4>
              <p className="text-lg">Your Score: <span className="font-bold text-blue-600">{quizScore}%</span></p>
              <p className="text-sm text-gray-500">Passing Score: {currentQuiz.passingScore}%</p>
              <button
                onClick={() => {
                  setShowQuizModal(false);
                  setCurrentQuiz(null);
                  setQuizAnswers({});
                  setQuizScore(null);
                  setQuizSubmitted(false);
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-gray-500">
                Time Limit: {currentQuiz.timeLimit} minutes • {currentQuiz.questions.length} questions
              </p>
              {currentQuiz.questions.map((q, index) => (
                <div key={q.id} className="border rounded-lg p-4">
                  <p className="font-medium mb-2">
                    {index + 1}. {q.question}
                    <span className="text-sm text-gray-500 ml-2">({q.points} pts)</span>
                  </p>
                  <div className="space-y-2">
                    {q.options.map(option => (
                      <label key={option} className="flex items-center gap-2">
                        <input
                          type={q.type === 'true-false' ? 'radio' : 'radio'}
                          name={q.id}
                          value={option}
                          checked={quizAnswers[q.id] === option}
                          onChange={() => {
                            setQuizAnswers(prev => ({ ...prev, [q.id]: option }));
                          }}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={submitQuiz}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Submit Quiz
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAssignmentModal = () => {
    if (!showAssignmentModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Submit Assignment</h3>
            <button 
              onClick={() => setShowAssignmentModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Submission</label>
              <textarea
                value={assignmentSubmission}
                onChange={(e) => setAssignmentSubmission(e.target.value)}
                placeholder="Describe your submission..."
                rows={4}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attach File (optional)</label>
              <input
                type="file"
                onChange={(e) => setAssignmentFile(e.target.files?.[0] || null)}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={submitAssignment}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
            >
              Submit
            </button>
            <button
              onClick={() => {
                setShowAssignmentModal(false);
                setAssignmentSubmission('');
                setAssignmentFile(null);
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

  const renderCertificateModal = () => {
    if (!showCertificateModal) return null;

    const student = students.find(s => s.id === (currentUser?.id || 'guest'));
    const certificate = student?.certificates[student.certificates.length - 1];

    if (!certificate) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-lg w-full p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-2xl font-bold text-gray-800">Certificate of Completion</h3>
            <div className="border-t-2 border-b-2 border-gray-200 py-6 my-6">
              <p className="text-sm text-gray-500">This certifies that</p>
              <p className="text-2xl font-bold text-gray-800">{certificate.studentName}</p>
              <p className="text-sm text-gray-500 mt-2">has successfully completed</p>
              <p className="text-xl font-bold text-blue-600">{certificate.courseTitle}</p>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Issued: {formatDate(certificate.issueDate)}</span>
              <span>Verification: {certificate.verificationCode}</span>
            </div>
            <button
              onClick={() => setShowCertificateModal(false)}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Download Certificate
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDiscussionModal = () => {
    if (!showDiscussionModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">New Discussion</h3>
            <button 
              onClick={() => setShowDiscussionModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={discussionTitle}
                onChange={(e) => setDiscussionTitle(e.target.value)}
                placeholder="Discussion title"
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={discussionContent}
                onChange={(e) => setDiscussionContent(e.target.value)}
                placeholder="What would you like to discuss?"
                rows={4}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={createDiscussion}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowDiscussionModal(false);
                setDiscussionTitle('');
                setDiscussionContent('');
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

  // Helper function
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // --- Main Render ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading learning platform...</p>
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
              <span>🎓</span> Learning Management
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                Day 12
              </span>
            </h1>
            <p className="text-gray-600 mt-1">Learn, grow, and achieve your goals</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm p-1">
              <button
                onClick={() => setViewMode('courses')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'courses' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📚 Courses
              </button>
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setViewMode('admin')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'admin' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ⚙️ Admin
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        {viewMode === 'courses' && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="Web Development">Web Development</option>
                <option value="Data Science">Data Science</option>
                <option value="Design">Design</option>
              </select>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-4 min-h-[500px]">
          {viewMode === 'courses' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses
                .filter(c => {
                  if (searchTerm) {
                    return c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           c.description.toLowerCase().includes(searchTerm.toLowerCase());
                  }
                  return true;
                })
                .filter(c => filterCategory === 'all' || c.category === filterCategory)
                .filter(c => filterLevel === 'all' || c.level === filterLevel)
                .map(renderCourseCard)}
            </div>
          )}
          {viewMode === 'course' && renderCourseView()}
          {viewMode === 'lesson' && renderLessonView()}
          {viewMode === 'dashboard' && renderDashboard()}
          {viewMode === 'admin' && renderAdminView()}
        </div>

        {/* Modals */}
        {renderQuizModal()}
        {renderAssignmentModal()}
        {renderCertificateModal()}
        {renderDiscussionModal()}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500 border-t pt-6">
          <p>© 2026 Learning Management System - Day 12 Complete System</p>
          <p className="mt-1">Courses • Lessons • Quizzes • Assignments • Certificates</p>
          <p className="mt-1 text-gray-400">
            {courses.length} courses • {students.length} students • {discussions.length} discussions
          </p>
        </div>
      </div>
    </div>
  );
}