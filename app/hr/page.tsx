// app/hr/page.tsx
// Complete Human Resources Management System with Employees, Attendance, Leave, Payroll & Performance
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// --- TypeScript Interfaces ---
interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  address: Address;
  department: string;
  position: string;
  jobTitle: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'intern';
  joiningDate: string;
  leavingDate?: string;
  status: 'active' | 'inactive' | 'terminated' | 'on-leave';
  supervisorId?: string;
  supervisorName?: string;
  skills: string[];
  education: Education[];
  workHistory: WorkHistory[];
  bankDetails: BankDetails;
  emergencyContact: EmergencyContact;
  documents: Document[];
  createdAt: string;
  updatedAt: string;
}

interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  grade: string;
  certificate?: string;
}

interface WorkHistory {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  reason: string;
}

interface BankDetails {
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'holiday';
  overtimeHours: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'bereavement' | 'other';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface LeaveBalance {
  employeeId: string;
  annual: number;
  sick: number;
  personal: number;
  maternity: number;
  paternity: number;
  bereavement: number;
  total: number;
  used: number;
  remaining: number;
}

interface Payroll {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string; // YYYY-MM
  basicSalary: number;
  allowances: PayrollAllowance[];
  deductions: PayrollDeduction[];
  netSalary: number;
  currency: string;
  paymentDate: string;
  paymentMethod: 'bank_transfer' | 'cash' | 'check';
  status: 'draft' | 'approved' | 'paid' | 'cancelled';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface PayrollAllowance {
  id: string;
  name: string;
  amount: number;
  isTaxable: boolean;
}

interface PayrollDeduction {
  id: string;
  name: string;
  amount: number;
  isMandatory: boolean;
}

interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  reviewerId: string;
  reviewerName: string;
  reviewDate: string;
  period: {
    start: string;
    end: string;
  };
  ratings: PerformanceRating[];
  comments: string;
  strengths: string[];
  weaknesses: string[];
  goals: PerformanceGoal[];
  overallRating: number;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

interface PerformanceRating {
  id: string;
  category: string;
  rating: number; // 1-5
  comment: string;
}

interface PerformanceGoal {
  id: string;
  description: string;
  targetDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  progress: number;
}

interface RecruitmentJob {
  id: string;
  title: string;
  department: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  employmentType: Employee['employmentType'];
  location: string;
  salaryRange: {
    min: number;
    max: number;
  };
  status: 'draft' | 'published' | 'closed' | 'cancelled';
  applicants: JobApplication[];
  createdAt: string;
  updatedAt: string;
  postedAt?: string;
  closingDate?: string;
}

interface JobApplication {
  id: string;
  jobId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  resumeUrl: string;
  coverLetter: string;
  status: 'submitted' | 'reviewed' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  interviewDate?: string;
  interviewNotes?: string;
  rating?: number;
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
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
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

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const generateEmployeeId = (): string => {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EMP${year}-${random}`;
};

const calculateDaysBetween = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// --- Mock Data Generation ---
const generateMockEmployees = (): Employee[] => {
  const now = getCurrentTimestamp();
  const employees: Employee[] = [];

  const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'James', 'Lisa', 'David', 'Maria', 'Robert', 'Jennifer'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Design', 'Legal'];
  const positions = ['Manager', 'Senior', 'Junior', 'Lead', 'Director', 'Analyst', 'Specialist', 'Coordinator'];
  const jobTitles = ['Software Engineer', 'Sales Representative', 'Marketing Manager', 'HR Specialist', 'Financial Analyst', 'UX Designer', 'Product Manager', 'Operations Manager'];

  // Add supervisor
  employees.push({
    id: generateId(),
    employeeId: generateEmployeeId(),
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@company.com',
    phone: '(555) 123-4567',
    dateOfBirth: '1985-05-15',
    gender: 'female',
    maritalStatus: 'married',
    address: {
      line1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      zipCode: '94105',
    },
    department: 'Engineering',
    position: 'Director',
    jobTitle: 'Engineering Director',
    employmentType: 'full-time',
    joiningDate: '2018-01-15',
    status: 'active',
    skills: ['Leadership', 'Strategic Planning', 'Full-stack Development', 'Agile'],
    education: [],
    workHistory: [],
    bankDetails: {
      bankName: 'Chase Bank',
      accountNumber: '123456789',
      routingNumber: '021000021',
      accountType: 'checking',
    },
    emergencyContact: {
      name: 'John Doe',
      relationship: 'Spouse',
      phone: '(555) 987-6543',
      email: 'john.doe@email.com',
    },
    documents: [],
    createdAt: now,
    updatedAt: now,
  });

  // Generate regular employees
  for (let i = 0; i < 20; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const department = departments[i % departments.length];
    const position = positions[i % positions.length];
    const jobTitle = jobTitles[i % jobTitles.length];
    
    const employee: Employee = {
      id: generateId(),
      employeeId: generateEmployeeId(),
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
      phone: `(555) ${String(100 + i).padStart(3, '0')}-${String(1000 + i * 2).padStart(4, '0')}`,
      dateOfBirth: `198${i % 3 + 5}-${String(1 + i % 12).padStart(2, '0')}-${String(1 + i % 28).padStart(2, '0')}`,
      gender: i % 2 === 0 ? 'male' : 'female',
      maritalStatus: ['single', 'married', 'divorced'][i % 3] as any,
      address: {
        line1: `${i + 100} Park Ave`,
        city: ['San Francisco', 'New York', 'Austin', 'Seattle'][i % 4],
        state: ['CA', 'NY', 'TX', 'WA'][i % 4],
        country: 'USA',
        zipCode: String(10000 + i * 100),
      },
      department,
      position,
      jobTitle,
      employmentType: ['full-time', 'full-time', 'part-time', 'contract'][i % 4] as any,
      joiningDate: new Date(Date.now() - (i * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      supervisorId: employees[0]?.id,
      supervisorName: employees[0] ? `${employees[0].firstName} ${employees[0].lastName}` : undefined,
      status: i < 3 ? 'on-leave' : 'active',
      skills: [department.toLowerCase(), 'Teamwork', 'Communication'],
      education: [],
      workHistory: [],
      bankDetails: {
        bankName: ['Chase Bank', 'Bank of America', 'Wells Fargo'][i % 3],
        accountNumber: String(100000000 + i * 10000),
        routingNumber: String(100000000 + i * 10000).slice(0, 9),
        accountType: i % 2 === 0 ? 'checking' : 'savings',
      },
      emergencyContact: {
        name: `${lastName} Family`,
        relationship: 'Family',
        phone: `(555) ${String(200 + i).padStart(3, '0')}-${String(2000 + i * 3).padStart(4, '0')}`,
        email: `emergency.${lastName.toLowerCase()}@email.com`,
      },
      documents: [],
      createdAt: now,
      updatedAt: now,
    };
    employees.push(employee);
  }

  return employees;
};

const generateMockAttendance = (employees: Employee[]): Attendance[] => {
  const attendance: Attendance[] = [];
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  employees.forEach(employee => {
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const isPresent = Math.random() > 0.15;
      const isLate = isPresent && Math.random() > 0.8;
      const checkIn = isPresent ? `09:${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}` : undefined;
      const checkOut = isPresent ? `17:${String(Math.floor(Math.random() * 30) + 1).padStart(2, '0')}` : undefined;
      
      attendance.push({
        id: generateId(),
        employeeId: employee.id,
        date: dateStr,
        checkIn: checkIn || '',
        checkOut: checkOut || '',
        status: isPresent ? (isLate ? 'late' : 'present') : 'absent',
        overtimeHours: isPresent ? Math.round((Math.random() * 2) * 10) / 10 : 0,
        notes: '',
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
      });
    }
  });

  return attendance;
};

const generateMockLeaveRequests = (employees: Employee[]): LeaveRequest[] => {
  const leaves: LeaveRequest[] = [];
  const types: LeaveRequest['type'][] = ['annual', 'sick', 'personal', 'maternity', 'paternity'];
  const statuses: LeaveRequest['status'][] = ['pending', 'approved', 'rejected', 'cancelled'];

  employees.slice(0, 10).forEach(employee => {
    for (let i = 0; i < 3; i++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1);

      leaves.push({
        id: generateId(),
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        type: types[i % types.length],
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: calculateDaysBetween(startDate.toISOString(), endDate.toISOString()),
        reason: `Leave request ${i + 1}`,
        status: statuses[i % statuses.length],
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
      });
    }
  });

  return leaves;
};

const generateMockPayroll = (employees: Employee[]): Payroll[] => {
  const payroll: Payroll[] = [];
  const months = ['2026-01', '2026-02', '2026-03'];

  employees.forEach(employee => {
    months.forEach(month => {
      const basicSalary = Math.round((Math.random() * 5000 + 3000) * 100) / 100;
      const allowances: PayrollAllowance[] = [
        { id: generateId(), name: 'Housing Allowance', amount: Math.round(basicSalary * 0.2 * 100) / 100, isTaxable: true },
        { id: generateId(), name: 'Transport Allowance', amount: Math.round(basicSalary * 0.1 * 100) / 100, isTaxable: false },
        { id: generateId(), name: 'Communication Allowance', amount: Math.round(basicSalary * 0.05 * 100) / 100, isTaxable: false },
      ];
      
      const deductions: PayrollDeduction[] = [
        { id: generateId(), name: 'Tax', amount: Math.round(basicSalary * 0.15 * 100) / 100, isMandatory: true },
        { id: generateId(), name: 'Health Insurance', amount: 150, isMandatory: true },
        { id: generateId(), name: 'Retirement Fund', amount: Math.round(basicSalary * 0.05 * 100) / 100, isMandatory: true },
      ];
      
      const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);
      const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
      const netSalary = basicSalary + totalAllowances - totalDeductions;

      payroll.push({
        id: generateId(),
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        period: month,
        basicSalary,
        allowances,
        deductions,
        netSalary,
        currency: 'USD',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'bank_transfer',
        status: ['paid', 'paid', 'draft'][Math.floor(Math.random() * 3)] as any,
        notes: `Payroll for ${month}`,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
      });
    });
  });

  return payroll;
};

// --- Main Component ---
export default function HRManagementPage() {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI States
  const [viewMode, setViewMode] = useState<'dashboard' | 'employees' | 'attendance' | 'leaves' | 'payroll' | 'reports'>('dashboard');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Modal States
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  // Form States
  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({});
  const [leaveForm, setLeaveForm] = useState<Partial<LeaveRequest>>({});
  const [payrollForm, setPayrollForm] = useState<Partial<Payroll>>({});
  const [attendanceForm, setAttendanceForm] = useState<Partial<Attendance>>({});

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

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

    // Generate mock data
    const mockEmployees = generateMockEmployees();
    setEmployees(mockEmployees);

    const mockAttendance = generateMockAttendance(mockEmployees);
    setAttendance(mockAttendance);

    const mockLeaves = generateMockLeaveRequests(mockEmployees);
    setLeaveRequests(mockLeaves);

    const mockPayroll = generateMockPayroll(mockEmployees);
    setPayroll(mockPayroll);

    setIsLoading(false);
  }, []);

  // --- Employee Operations ---
  const createEmployee = useCallback(() => {
    if (!employeeForm.firstName || !employeeForm.lastName || !employeeForm.email) {
      alert('Please fill in required fields');
      return;
    }

    const newEmployee: Employee = {
      id: generateId(),
      employeeId: generateEmployeeId(),
      firstName: employeeForm.firstName,
      lastName: employeeForm.lastName,
      email: employeeForm.email,
      phone: employeeForm.phone || '',
      dateOfBirth: employeeForm.dateOfBirth || '',
      gender: employeeForm.gender || 'male',
      maritalStatus: employeeForm.maritalStatus || 'single',
      address: employeeForm.address || { line1: '', city: '', state: '', country: '', zipCode: '' },
      department: employeeForm.department || '',
      position: employeeForm.position || '',
      jobTitle: employeeForm.jobTitle || '',
      employmentType: employeeForm.employmentType || 'full-time',
      joiningDate: employeeForm.joiningDate || getCurrentTimestamp().split('T')[0],
      status: 'active',
      supervisorId: employeeForm.supervisorId,
      supervisorName: employeeForm.supervisorName,
      skills: employeeForm.skills || [],
      education: [],
      workHistory: [],
      bankDetails: employeeForm.bankDetails || {
        bankName: '',
        accountNumber: '',
        routingNumber: '',
        accountType: 'checking',
      },
      emergencyContact: employeeForm.emergencyContact || {
        name: '',
        relationship: '',
        phone: '',
        email: '',
      },
      documents: [],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    setEmployees(prev => [...prev, newEmployee]);
    setShowEmployeeModal(false);
    setEmployeeForm({});
    alert('Employee added successfully!');
  }, [employeeForm]);

  const updateEmployee = useCallback((employeeId: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => 
      e.id === employeeId ? { ...e, ...updates, updatedAt: getCurrentTimestamp() } : e
    ));
  }, []);

  const deleteEmployee = useCallback((employeeId: string) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    setEmployees(prev => prev.filter(e => e.id !== employeeId));
  }, []);

  // --- Leave Operations ---
  const createLeaveRequest = useCallback(() => {
    if (!leaveForm.employeeId || !leaveForm.startDate || !leaveForm.endDate) {
      alert('Please fill in required fields');
      return;
    }

    const employee = employees.find(e => e.id === leaveForm.employeeId);
    if (!employee) return;

    const days = calculateDaysBetween(leaveForm.startDate, leaveForm.endDate);

    const newLeave: LeaveRequest = {
      id: generateId(),
      employeeId: leaveForm.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      type: leaveForm.type || 'annual',
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      days,
      reason: leaveForm.reason || '',
      status: 'pending',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    setLeaveRequests(prev => [...prev, newLeave]);
    setShowLeaveModal(false);
    setLeaveForm({});
    alert('Leave request submitted successfully!');
  }, [leaveForm, employees]);

  const approveLeave = useCallback((leaveId: string) => {
    setLeaveRequests(prev => prev.map(l => 
      l.id === leaveId 
        ? { ...l, status: 'approved', updatedAt: getCurrentTimestamp() }
        : l
    ));
  }, []);

  const rejectLeave = useCallback((leaveId: string) => {
    setLeaveRequests(prev => prev.map(l => 
      l.id === leaveId 
        ? { ...l, status: 'rejected', updatedAt: getCurrentTimestamp() }
        : l
    ));
  }, []);

  // --- Attendance Operations ---
  const markAttendance = useCallback(() => {
    if (!attendanceForm.employeeId || !attendanceForm.date) {
      alert('Please select an employee and date');
      return;
    }

    const newAttendance: Attendance = {
      id: generateId(),
      employeeId: attendanceForm.employeeId,
      date: attendanceForm.date,
      checkIn: attendanceForm.checkIn || new Date().toTimeString().slice(0, 5),
      checkOut: attendanceForm.checkOut || '',
      status: attendanceForm.status || 'present',
      overtimeHours: attendanceForm.overtimeHours || 0,
      notes: attendanceForm.notes || '',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    setAttendance(prev => [...prev, newAttendance]);
    setShowAttendanceModal(false);
    setAttendanceForm({});
    alert('Attendance marked successfully!');
  }, [attendanceForm]);

  // --- Payroll Operations ---
  const createPayroll = useCallback(() => {
    if (!payrollForm.employeeId || !payrollForm.basicSalary) {
      alert('Please fill in required fields');
      return;
    }

    const employee = employees.find(e => e.id === payrollForm.employeeId);
    if (!employee) return;

    const basicSalary = payrollForm.basicSalary || 0;
    const allowances: PayrollAllowance[] = [
      { id: generateId(), name: 'Housing Allowance', amount: basicSalary * 0.2, isTaxable: true },
      { id: generateId(), name: 'Transport Allowance', amount: basicSalary * 0.1, isTaxable: false },
      { id: generateId(), name: 'Communication Allowance', amount: basicSalary * 0.05, isTaxable: false },
    ];
    
    const deductions: PayrollDeduction[] = [
      { id: generateId(), name: 'Tax', amount: basicSalary * 0.15, isMandatory: true },
      { id: generateId(), name: 'Health Insurance', amount: 150, isMandatory: true },
      { id: generateId(), name: 'Retirement Fund', amount: basicSalary * 0.05, isMandatory: true },
    ];
    
    const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const netSalary = basicSalary + totalAllowances - totalDeductions;

    const newPayroll: Payroll = {
      id: generateId(),
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      period: payrollForm.period || new Date().toISOString().slice(0, 7),
      basicSalary,
      allowances,
      deductions,
      netSalary,
      currency: 'USD',
      paymentDate: payrollForm.paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: payrollForm.paymentMethod || 'bank_transfer',
      status: 'draft',
      notes: payrollForm.notes || '',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    setPayroll(prev => [...prev, newPayroll]);
    setShowPayrollModal(false);
    setPayrollForm({});
    alert('Payroll created successfully!');
  }, [payrollForm, employees]);

  const approvePayroll = useCallback((payrollId: string) => {
    setPayroll(prev => prev.map(p => 
      p.id === payrollId ? { ...p, status: 'approved', updatedAt: getCurrentTimestamp() } : p
    ));
  }, []);

  // --- Render Functions ---
  const renderDashboard = () => {
    const activeEmployees = employees.filter(e => e.status === 'active');
    const pendingLeaves = leaveRequests.filter(l => l.status === 'pending');
    const totalPayroll = payroll.reduce((sum, p) => sum + p.netSalary, 0);
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === today);

    return (
      <div>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Total Employees</p>
            <p className="text-2xl font-bold text-blue-600">{employees.length}</p>
            <p className="text-xs text-green-600">{activeEmployees.length} active</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Pending Leaves</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingLeaves.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Today's Attendance</p>
            <p className="text-2xl font-bold text-green-600">{todayAttendance.length}</p>
            <p className="text-xs text-gray-500">Present</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Total Payroll</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalPayroll)}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => {
              setEmployeeForm({});
              setShowEmployeeModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            ➕ Add Employee
          </button>
          <button
            onClick={() => {
              setLeaveForm({});
              setShowLeaveModal(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            📋 Request Leave
          </button>
          <button
            onClick={() => {
              setAttendanceForm({});
              setShowAttendanceModal(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            📅 Mark Attendance
          </button>
          <button
            onClick={() => {
              setPayrollForm({});
              setShowPayrollModal(true);
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            💰 Process Payroll
          </button>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="font-semibold mb-3">Recent Leave Requests</h4>
            <div className="space-y-2">
              {leaveRequests.slice(0, 5).map(leave => {
                const employee = employees.find(e => e.id === leave.employeeId);
                return (
                  <div key={leave.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{employee?.firstName} {employee?.lastName}</p>
                      <p className="text-sm text-gray-500">{leave.type} - {leave.days} days</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                      leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="font-semibold mb-3">Recent Attendance</h4>
            <div className="space-y-2">
              {attendance.slice(0, 5).map(record => {
                const employee = employees.find(e => e.id === record.employeeId);
                return (
                  <div key={record.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{employee?.firstName} {employee?.lastName}</p>
                      <p className="text-sm text-gray-500">{formatDate(record.date)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      record.status === 'present' ? 'bg-green-100 text-green-700' :
                      record.status === 'absent' ? 'bg-red-100 text-red-700' :
                      record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEmployees = () => {
    const filteredEmployees = employees.filter(e => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return e.firstName.toLowerCase().includes(term) ||
               e.lastName.toLowerCase().includes(term) ||
               e.email.toLowerCase().includes(term) ||
               e.department.toLowerCase().includes(term);
      }
      if (filterDepartment !== 'all' && e.department !== filterDepartment) return false;
      if (filterStatus !== 'all' && e.status !== filterStatus) return false;
      return true;
    });

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Employees</h2>
          <button
            onClick={() => {
              setEmployeeForm({});
              setShowEmployeeModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + Add Employee
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {Array.from(new Set(employees.map(e => e.department))).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
              <option value="on-leave">On Leave</option>
            </select>
          </div>
        </div>

        {/* Employee Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map(employee => (
            <div key={employee.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                    {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold">{employee.firstName} {employee.lastName}</h4>
                    <p className="text-sm text-gray-500">{employee.jobTitle}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  employee.status === 'active' ? 'bg-green-100 text-green-700' :
                  employee.status === 'on-leave' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {employee.status}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">📧 {employee.email}</p>
                <p className="text-gray-600">📱 {employee.phone}</p>
                <p className="text-gray-600">🏢 {employee.department}</p>
                <p className="text-gray-600">📅 Joined: {formatDate(employee.joiningDate)}</p>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setSelectedEmployee(employee);
                    setEmployeeForm(employee);
                    setShowEmployeeModal(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => deleteEmployee(employee.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLeaves = () => {
    const filteredLeaves = leaveRequests.filter(l => {
      if (filterStatus !== 'all' && l.status !== filterStatus) return false;
      if (filterType !== 'all' && l.type !== filterType) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return l.employeeName.toLowerCase().includes(term);
      }
      return true;
    });

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Leave Requests</h2>
          <button
            onClick={() => {
              setLeaveForm({});
              setShowLeaveModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + New Request
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search by employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="annual">Annual</option>
              <option value="sick">Sick</option>
              <option value="personal">Personal</option>
              <option value="maternity">Maternity</option>
              <option value="paternity">Paternity</option>
              <option value="bereavement">Bereavement</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Leave Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Days</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeaves.map(leave => (
                  <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{leave.employeeName}</td>
                    <td className="px-4 py-3 capitalize">{leave.type}</td>
                    <td className="px-4 py-3">{formatDate(leave.startDate)}</td>
                    <td className="px-4 py-3">{formatDate(leave.endDate)}</td>
                    <td className="px-4 py-3 text-right">{leave.days}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                        leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {leave.status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveLeave(leave.id)}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => rejectLeave(leave.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderPayroll = () => {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Payroll</h2>
          <button
            onClick={() => {
              setPayrollForm({});
              setShowPayrollModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + Process Payroll
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Basic Salary</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payroll.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{record.employeeName}</td>
                    <td className="px-4 py-3">{record.period}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(record.basicSalary)}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(record.netSalary)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        record.status === 'paid' ? 'bg-green-100 text-green-700' :
                        record.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                        record.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {record.status === 'draft' && (
                          <button
                            onClick={() => approvePayroll(record.id)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setPayrollForm(record);
                            setShowPayrollModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // --- Modals ---
  const renderEmployeeModal = () => {
    if (!showEmployeeModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">{selectedEmployee ? 'Edit Employee' : 'Add Employee'}</h3>
            <button 
              onClick={() => {
                setShowEmployeeModal(false);
                setSelectedEmployee(null);
                setEmployeeForm({});
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input
                  type="text"
                  value={employeeForm.firstName || ''}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <input
                  type="text"
                  value={employeeForm.lastName || ''}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  value={employeeForm.email || ''}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  value={employeeForm.phone || ''}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                value={employeeForm.department || ''}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, department: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Job Title</label>
              <input
                type="text"
                value={employeeForm.jobTitle || ''}
                onChange={(e) => setEmployeeForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                <select
                  value={employeeForm.employmentType || 'full-time'}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, employmentType: e.target.value as Employee['employmentType'] }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Intern</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                <input
                  type="date"
                  value={employeeForm.joiningDate || ''}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={selectedEmployee ? () => updateEmployee(selectedEmployee.id, employeeForm) : createEmployee}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
            >
              {selectedEmployee ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => {
                setShowEmployeeModal(false);
                setSelectedEmployee(null);
                setEmployeeForm({});
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

  const renderLeaveModal = () => {
    if (!showLeaveModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Request Leave</h3>
            <button 
              onClick={() => {
                setShowLeaveModal(false);
                setLeaveForm({});
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee</label>
              <select
                value={leaveForm.employeeId || ''}
                onChange={(e) => setLeaveForm(prev => ({ ...prev, employeeId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Employee</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Leave Type</label>
              <select
                value={leaveForm.type || 'annual'}
                onChange={(e) => setLeaveForm(prev => ({ ...prev, type: e.target.value as LeaveRequest['type'] }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="annual">Annual</option>
                <option value="sick">Sick</option>
                <option value="personal">Personal</option>
                <option value="maternity">Maternity</option>
                <option value="paternity">Paternity</option>
                <option value="bereavement">Bereavement</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={leaveForm.startDate || ''}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={leaveForm.endDate || ''}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Reason</label>
              <textarea
                value={leaveForm.reason || ''}
                onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={createLeaveRequest}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
            >
              Submit Request
            </button>
            <button
              onClick={() => {
                setShowLeaveModal(false);
                setLeaveForm({});
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

  const renderAttendanceModal = () => {
    if (!showAttendanceModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Mark Attendance</h3>
            <button 
              onClick={() => {
                setShowAttendanceModal(false);
                setAttendanceForm({});
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee</label>
              <select
                value={attendanceForm.employeeId || ''}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, employeeId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Employee</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={attendanceForm.date || new Date().toISOString().split('T')[0]}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Check In</label>
                <input
                  type="time"
                  value={attendanceForm.checkIn || ''}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, checkIn: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Check Out</label>
                <input
                  type="time"
                  value={attendanceForm.checkOut || ''}
                  onChange={(e) => setAttendanceForm(prev => ({ ...prev, checkOut: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={attendanceForm.status || 'present'}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, status: e.target.value as Attendance['status'] }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half-day">Half Day</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Overtime Hours</label>
              <input
                type="number"
                step="0.5"
                value={attendanceForm.overtimeHours || 0}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, overtimeHours: parseFloat(e.target.value) }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <input
                type="text"
                value={attendanceForm.notes || ''}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={markAttendance}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
            >
              Mark Attendance
            </button>
            <button
              onClick={() => {
                setShowAttendanceModal(false);
                setAttendanceForm({});
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

  const renderPayrollModal = () => {
    if (!showPayrollModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Process Payroll</h3>
            <button 
              onClick={() => {
                setShowPayrollModal(false);
                setPayrollForm({});
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee</label>
              <select
                value={payrollForm.employeeId || ''}
                onChange={(e) => setPayrollForm(prev => ({ ...prev, employeeId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Employee</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Period</label>
              <input
                type="month"
                value={payrollForm.period || ''}
                onChange={(e) => setPayrollForm(prev => ({ ...prev, period: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Basic Salary</label>
              <input
                type="number"
                step="0.01"
                value={payrollForm.basicSalary || ''}
                onChange={(e) => setPayrollForm(prev => ({ ...prev, basicSalary: parseFloat(e.target.value) }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Date</label>
              <input
                type="date"
                value={payrollForm.paymentDate || ''}
                onChange={(e) => setPayrollForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <select
                value={payrollForm.paymentMethod || 'bank_transfer'}
                onChange={(e) => setPayrollForm(prev => ({ ...prev, paymentMethod: e.target.value as Payroll['paymentMethod'] }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <input
                type="text"
                value={payrollForm.notes || ''}
                onChange={(e) => setPayrollForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={createPayroll}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
            >
              Process Payroll
            </button>
            <button
              onClick={() => {
                setShowPayrollModal(false);
                setPayrollForm({});
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

  // --- Main Render ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading HR system...</p>
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
              <span>👔</span> HR Management
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                Day 15
              </span>
            </h1>
            <p className="text-gray-600 mt-1">Manage employees, attendance, leaves, and payroll</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm p-1">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setViewMode('employees')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'employees' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                👥 Employees
              </button>
              <button
                onClick={() => setViewMode('leaves')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'leaves' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📋 Leaves
              </button>
              <button
                onClick={() => setViewMode('payroll')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'payroll' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                💰 Payroll
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-4 min-h-[500px]">
          {viewMode === 'dashboard' && renderDashboard()}
          {viewMode === 'employees' && renderEmployees()}
          {viewMode === 'leaves' && renderLeaves()}
          {viewMode === 'payroll' && renderPayroll()}
        </div>

        {/* Modals */}
        {renderEmployeeModal()}
        {renderLeaveModal()}
        {renderAttendanceModal()}
        {renderPayrollModal()}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500 border-t pt-6">
          <p>© 2026 HR Management - Day 15 Complete System</p>
          <p className="mt-1">Employees • Attendance • Leave • Payroll • Performance</p>
          <p className="mt-1 text-gray-400">
            {employees.length} employees • {leaveRequests.length} leave requests • {payroll.length} payroll records
          </p>
        </div>
      </div>
    </div>
  );
}