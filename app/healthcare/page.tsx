// app/healthcare/page.tsx
// Complete Healthcare Management System with Patients, Appointments, Prescriptions & Billing
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// --- TypeScript Interfaces ---
interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  address: Address;
  emergencyContact: EmergencyContact;
  insurance: Insurance;
  medicalHistory: MedicalRecord[];
  allergies: string[];
  chronicConditions: string[];
  medications: string[];
  primaryPhysicianId?: string;
  primaryPhysicianName?: string;
  status: 'active' | 'inactive' | 'deceased';
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

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

interface Insurance {
  provider: string;
  policyNumber: string;
  groupNumber: string;
  coverage: string;
  expiryDate: string;
}

interface MedicalRecord {
  id: string;
  date: string;
  type: 'consultation' | 'diagnosis' | 'lab' | 'imaging' | 'surgery' | 'vaccination' | 'prescription';
  title: string;
  description: string;
  doctorId: string;
  doctorName: string;
  attachments: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  duration: number;
  type: 'general' | 'specialist' | 'follow-up' | 'emergency' | 'surgery';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  reason: string;
  notes: string;
  symptoms: string[];
  diagnosis?: string;
  prescription?: Prescription;
  createdAt: string;
  updatedAt: string;
}

interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  medications: PrescribedMedication[];
  instructions: string;
  refills: number;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  pharmacy?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface PrescribedMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
  refills: number;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  qualifications: string[];
  licenseNumber: string;
  yearsExperience: number;
  department: string;
  availability: Availability[];
  rating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Availability {
  id: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  slots: TimeSlot[];
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  appointmentId?: string;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'receptionist' | 'nurse' | 'lab_technician' | 'pharmacist';
  department: string;
  shift: 'morning' | 'evening' | 'night' | 'rotating';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Billing {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  date: string;
  services: BillingService[];
  total: number;
  insuranceClaim: {
    submitted: boolean;
    approved: boolean;
    amount: number;
    reference?: string;
  };
  amountPaid: number;
  balance: number;
  status: 'pending' | 'partial' | 'paid' | 'insurance-pending' | 'write-off';
  paymentMethod?: 'cash' | 'credit_card' | 'insurance' | 'bank_transfer';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface BillingService {
  id: string;
  code: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isCoveredByInsurance: boolean;
}

interface LabTest {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  testName: string;
  testType: 'blood' | 'urine' | 'imaging' | 'genetic' | 'allergy' | 'other';
  orderedDate: string;
  resultDate?: string;
  status: 'ordered' | 'in-progress' | 'completed' | 'cancelled';
  results: LabResult[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface LabResult {
  id: string;
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  notes: string;
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

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const generatePatientId = (): string => {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PT${year}-${random}`;
};

const generateStaffId = (): string => {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `STF-${random}`;
};

const generateDoctorId = (): string => {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DR-${random}`;
};

const calculateAge = (dateOfBirth: string): number => {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const getBloodTypeColor = (bloodType?: string): string => {
  if (!bloodType) return 'bg-gray-100 text-gray-600';
  const colors: Record<string, string> = {
    'A+': 'bg-red-100 text-red-700',
    'A-': 'bg-red-50 text-red-600',
    'B+': 'bg-blue-100 text-blue-700',
    'B-': 'bg-blue-50 text-blue-600',
    'AB+': 'bg-purple-100 text-purple-700',
    'AB-': 'bg-purple-50 text-purple-600',
    'O+': 'bg-green-100 text-green-700',
    'O-': 'bg-green-50 text-green-600',
  };
  return colors[bloodType] || 'bg-gray-100 text-gray-600';
};

// --- Mock Data Generation ---
const generateMockDoctors = (): Doctor[] => {
  const specializations = ['Cardiology', 'Dermatology', 'Pediatrics', 'Neurology', 'Orthopedics', 'Ophthalmology', 'Gynecology', 'Urology'];
  const departments = ['Cardiology', 'Dermatology', 'Pediatrics', 'Neurology', 'Orthopedics', 'Ophthalmology', 'Gynecology', 'Urology'];
  const qualifications = ['MD', 'MBBS', 'DO', 'PhD', 'FACS', 'FRCS'];
  const firstNames = ['James', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'Robert', 'Jennifer', 'William', 'Maria'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

  const doctors: Doctor[] = [];

  for (let i = 0; i < 8; i++) {
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const specialization = specializations[i];
    const department = departments[i];
    const qualCount = Math.floor(Math.random() * 3) + 1;
    const qualificationsList = [];
    for (let q = 0; q < qualCount; q++) {
      qualificationsList.push(qualifications[Math.floor(Math.random() * qualifications.length)]);
    }

    // Generate availability
    const availability: Availability[] = [];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    days.forEach(day => {
      const slots: TimeSlot[] = [];
      for (let hour = 9; hour < 17; hour++) {
        const startTime = `${String(hour).padStart(2, '0')}:00`;
        const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
        slots.push({
          id: generateId(),
          startTime,
          endTime,
          isAvailable: Math.random() > 0.3,
        });
      }
      availability.push({
        id: generateId(),
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        slots,
      });
    });

    doctors.push({
      id: generateDoctorId(),
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@hospital.com`,
      phone: `(555) ${String(100 + i).padStart(3, '0')}-${String(1000 + i * 2).padStart(4, '0')}`,
      specialization,
      qualifications: qualificationsList,
      licenseNumber: `LIC-${String(10000 + i).padStart(5, '0')}`,
      yearsExperience: Math.floor(Math.random() * 20) + 5,
      department,
      availability,
      rating: Math.round((3 + Math.random() * 2) * 10) / 10,
      isActive: true,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    });
  }

  return doctors;
};

const generateMockPatients = (doctors: Doctor[]): Patient[] => {
  const firstNames = ['John', 'Mary', 'James', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const bloodTypes: ('A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-')[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const patients: Patient[] = [];

  for (let i = 0; i < 20; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const doctor = doctors[i % doctors.length];
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - (20 + Math.floor(Math.random() * 50)));

    const patient: Patient = {
      id: generateId(),
      patientId: generatePatientId(),
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      phone: `(555) ${String(200 + i).padStart(3, '0')}-${String(2000 + i * 3).padStart(4, '0')}`,
      dateOfBirth: birthDate.toISOString().split('T')[0],
      gender: i % 2 === 0 ? 'male' : 'female',
      bloodType: bloodTypes[i % bloodTypes.length],
      address: {
        line1: `${i + 1} Health Ave`,
        city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][i % 5],
        state: ['NY', 'CA', 'IL', 'TX', 'AZ'][i % 5],
        country: 'USA',
        zipCode: String(10000 + i * 100),
      },
      emergencyContact: {
        name: `${lastName} Family`,
        relationship: 'Family',
        phone: `(555) ${String(300 + i).padStart(3, '0')}-${String(3000 + i * 4).padStart(4, '0')}`,
        email: `emergency.${lastName.toLowerCase()}@email.com`,
      },
      insurance: {
        provider: ['Blue Cross', 'Aetna', 'UnitedHealth', 'Cigna', 'Humana'][i % 5],
        policyNumber: `POL-${String(10000 + i).padStart(5, '0')}`,
        groupNumber: `GRP-${String(1000 + i).padStart(4, '0')}`,
        coverage: 'Full Coverage',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * (1 + i % 3)).toISOString().split('T')[0],
      },
      medicalHistory: [],
      allergies: ['Penicillin', 'Pollen', 'Dust'].slice(0, Math.floor(Math.random() * 3)),
      chronicConditions: ['Hypertension', 'Diabetes', 'Asthma'].slice(0, Math.floor(Math.random() * 2)),
      medications: ['Lisinopril', 'Metformin', 'Albuterol'].slice(0, Math.floor(Math.random() * 2)),
      primaryPhysicianId: doctor.id,
      primaryPhysicianName: `${doctor.firstName} ${doctor.lastName}`,
      status: 'active',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    // Generate medical history
    for (let h = 0; h < Math.floor(Math.random() * 3) + 1; h++) {
      const historyDate = new Date();
      historyDate.setMonth(historyDate.getMonth() - h * 3);
      patient.medicalHistory.push({
        id: generateId(),
        date: historyDate.toISOString(),
        type: ['consultation', 'diagnosis', 'lab', 'vaccination'][h % 4] as any,
        title: ['Annual Checkup', 'Flu Vaccination', 'Blood Test', 'Consultation'][h % 4],
        description: `Medical record ${h + 1}`,
        doctorId: doctor.id,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        attachments: [],
        notes: 'Notes about this visit',
        createdAt: historyDate.toISOString(),
        updatedAt: historyDate.toISOString(),
      });
    }

    patients.push(patient);
  }

  return patients;
};

const generateMockAppointments = (patients: Patient[], doctors: Doctor[]): Appointment[] => {
  const appointments: Appointment[] = [];
  const types: Appointment['type'][] = ['general', 'specialist', 'follow-up', 'emergency'];
  const statuses: Appointment['status'][] = ['scheduled', 'confirmed', 'completed', 'cancelled'];

  for (let i = 0; i < 30; i++) {
    const patient = patients[i % patients.length];
    const doctor = doctors[i % doctors.length];
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + Math.floor(Math.random() * 30) + 1);
    const appointmentTime = `${String(9 + Math.floor(Math.random() * 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 4) * 15).padStart(2, '0')}`;

    appointments.push({
      id: generateId(),
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctorId: doctor.id,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      date: appointmentDate.toISOString().split('T')[0],
      time: appointmentTime,
      duration: 30,
      type: types[i % types.length],
      status: statuses[i % statuses.length],
      reason: `Consultation for ${patient.chronicConditions[0] || 'general checkup'}`,
      notes: 'Patient notes',
      symptoms: ['Headache', 'Fever', 'Cough'].slice(0, Math.floor(Math.random() * 3) + 1),
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    });
  }

  return appointments;
};

const generateMockPrescriptions = (patients: Patient[], doctors: Doctor[]): Prescription[] => {
  const prescriptions: Prescription[] = [];
  const medications = ['Amoxicillin', 'Lisinopril', 'Metformin', 'Atorvastatin', 'Levothyroxine', 'Omeprazole', 'Albuterol'];

  for (let i = 0; i < 15; i++) {
    const patient = patients[i % patients.length];
    const doctor = doctors[i % doctors.length];
    const numMeds = Math.floor(Math.random() * 2) + 1;
    const prescribedMeds: PrescribedMedication[] = [];

    for (let m = 0; m < numMeds; m++) {
      prescribedMeds.push({
        id: generateId(),
        name: medications[(i + m) % medications.length],
        dosage: `${(Math.floor(Math.random() * 5) + 1) * 5}mg`,
        frequency: ['Once daily', 'Twice daily', 'Three times daily'][m % 3],
        duration: `${Math.floor(Math.random() * 4) + 1} weeks`,
        instructions: 'Take with food',
        quantity: Math.floor(Math.random() * 30) + 10,
        refills: Math.floor(Math.random() * 3),
      });
    }

    prescriptions.push({
      id: generateId(),
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctorId: doctor.id,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      date: getCurrentTimestamp(),
      medications: prescribedMeds,
      instructions: 'Take as prescribed',
      refills: Math.floor(Math.random() * 3),
      status: ['active', 'active', 'completed'][i % 3] as any,
      pharmacy: ['CVS', 'Walgreens', 'Rite Aid'][i % 3],
      notes: 'Prescription notes',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    });
  }

  return prescriptions;
};

// --- Main Component ---
export default function HealthcareManagementPage() {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [billing, setBilling] = useState<Billing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI States
  const [viewMode, setViewMode] = useState<'dashboard' | 'patients' | 'doctors' | 'appointments' | 'prescriptions' | 'billing'>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Modal States
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showMedicalHistoryModal, setShowMedicalHistoryModal] = useState(false);

  // Form States
  const [patientForm, setPatientForm] = useState<Partial<Patient>>({});
  const [appointmentForm, setAppointmentForm] = useState<Partial<Appointment>>({});
  const [prescriptionForm, setPrescriptionForm] = useState<Partial<Prescription>>({});
  const [billingForm, setBillingForm] = useState<Partial<Billing>>({});
  const [medicalHistoryForm, setMedicalHistoryForm] = useState<Partial<MedicalRecord>>({});

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
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
    const mockDoctors = generateMockDoctors();
    setDoctors(mockDoctors);

    const mockPatients = generateMockPatients(mockDoctors);
    setPatients(mockPatients);

    const mockAppointments = generateMockAppointments(mockPatients, mockDoctors);
    setAppointments(mockAppointments);

    const mockPrescriptions = generateMockPrescriptions(mockPatients, mockDoctors);
    setPrescriptions(mockPrescriptions);

    // Generate mock staff
    const mockStaff: Staff[] = [
      { id: generateId(), firstName: 'Admin', lastName: 'User', email: 'admin@hospital.com', phone: '(555) 000-0000', role: 'admin', department: 'Administration', shift: 'morning', isActive: true, createdAt: getCurrentTimestamp(), updatedAt: getCurrentTimestamp() },
      { id: generateId(), firstName: 'Reception', lastName: 'User', email: 'reception@hospital.com', phone: '(555) 000-0001', role: 'receptionist', department: 'Reception', shift: 'morning', isActive: true, createdAt: getCurrentTimestamp(), updatedAt: getCurrentTimestamp() },
      { id: generateId(), firstName: 'Nurse', lastName: 'User', email: 'nurse@hospital.com', phone: '(555) 000-0002', role: 'nurse', department: 'Nursing', shift: 'rotating', isActive: true, createdAt: getCurrentTimestamp(), updatedAt: getCurrentTimestamp() },
    ];
    setStaff(mockStaff);

    // Generate mock billing
    const mockBilling: Billing[] = [];
    mockAppointments.forEach((apt, i) => {
      if (i % 2 === 0) {
        const services: BillingService[] = [
          { id: generateId(), code: '99213', name: 'Office Visit', description: 'Established patient visit', quantity: 1, unitPrice: 150, total: 150, isCoveredByInsurance: true },
          { id: generateId(), code: '80053', name: 'Comprehensive Metabolic Panel', description: 'Blood test panel', quantity: 1, unitPrice: 75, total: 75, isCoveredByInsurance: true },
        ];
        const total = services.reduce((sum, s) => sum + s.total, 0);
        mockBilling.push({
          id: generateId(),
          patientId: apt.patientId,
          patientName: apt.patientName,
          appointmentId: apt.id,
          date: apt.date,
          services,
          total,
          insuranceClaim: {
            submitted: true,
            approved: Math.random() > 0.3,
            amount: total * 0.8,
            reference: `CLM-${String(10000 + i).padStart(5, '0')}`,
          },
          amountPaid: total * 0.2,
          balance: total * 0.8,
          status: ['pending', 'partial', 'paid', 'insurance-pending'][i % 4] as any,
          notes: 'Billing notes',
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
        });
      }
    });
    setBilling(mockBilling);

    setIsLoading(false);
  }, []);

  // --- Patient Operations ---
  const createPatient = useCallback(() => {
    if (!patientForm.firstName || !patientForm.lastName || !patientForm.email) {
      alert('Please fill in required fields');
      return;
    }

    const newPatient: Patient = {
      id: generateId(),
      patientId: generatePatientId(),
      firstName: patientForm.firstName,
      lastName: patientForm.lastName,
      email: patientForm.email,
      phone: patientForm.phone || '',
      dateOfBirth: patientForm.dateOfBirth || '',
      gender: patientForm.gender || 'male',
      address: patientForm.address || { line1: '', city: '', state: '', country: '', zipCode: '' },
      emergencyContact: patientForm.emergencyContact || { name: '', relationship: '', phone: '', email: '' },
      insurance: patientForm.insurance || { provider: '', policyNumber: '', groupNumber: '', coverage: '', expiryDate: '' },
      medicalHistory: [],
      allergies: patientForm.allergies || [],
      chronicConditions: patientForm.chronicConditions || [],
      medications: patientForm.medications || [],
      primaryPhysicianId: patientForm.primaryPhysicianId,
      primaryPhysicianName: patientForm.primaryPhysicianName,
      status: 'active',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    setPatients(prev => [...prev, newPatient]);
    setShowPatientModal(false);
    setPatientForm({});
    alert('Patient added successfully!');
  }, [patientForm]);

  const updatePatient = useCallback((patientId: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(p => 
      p.id === patientId ? { ...p, ...updates, updatedAt: getCurrentTimestamp() } : p
    ));
  }, []);

  const deletePatient = useCallback((patientId: string) => {
    if (!window.confirm('Are you sure you want to delete this patient record?')) return;
    setPatients(prev => prev.filter(p => p.id !== patientId));
  }, []);

  // --- Appointment Operations ---
  const createAppointment = useCallback(() => {
    if (!appointmentForm.patientId || !appointmentForm.doctorId || !appointmentForm.date) {
      alert('Please fill in required fields');
      return;
    }

    const patient = patients.find(p => p.id === appointmentForm.patientId);
    const doctor = doctors.find(d => d.id === appointmentForm.doctorId);
    if (!patient || !doctor) return;

    const newAppointment: Appointment = {
      id: generateId(),
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctorId: doctor.id,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      date: appointmentForm.date,
      time: appointmentForm.time || '09:00',
      duration: appointmentForm.duration || 30,
      type: appointmentForm.type || 'general',
      status: 'scheduled',
      reason: appointmentForm.reason || '',
      notes: appointmentForm.notes || '',
      symptoms: appointmentForm.symptoms || [],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    setAppointments(prev => [...prev, newAppointment]);
    setShowAppointmentModal(false);
    setAppointmentForm({});
    alert('Appointment scheduled successfully!');
  }, [appointmentForm, patients, doctors]);

  const updateAppointmentStatus = useCallback((appointmentId: string, status: Appointment['status']) => {
    setAppointments(prev => prev.map(a => 
      a.id === appointmentId ? { ...a, status, updatedAt: getCurrentTimestamp() } : a
    ));
  }, []);

  const cancelAppointment = useCallback((appointmentId: string) => {
    if (!window.confirm('Cancel this appointment?')) return;
    updateAppointmentStatus(appointmentId, 'cancelled');
  }, [updateAppointmentStatus]);

  // --- Prescription Operations ---
  const createPrescription = useCallback(() => {
    if (!prescriptionForm.patientId || !prescriptionForm.doctorId || !prescriptionForm.medications) {
      alert('Please fill in required fields');
      return;
    }

    const patient = patients.find(p => p.id === prescriptionForm.patientId);
    const doctor = doctors.find(d => d.id === prescriptionForm.doctorId);
    if (!patient || !doctor) return;

    const newPrescription: Prescription = {
      id: generateId(),
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      doctorId: doctor.id,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      date: getCurrentTimestamp(),
      medications: prescriptionForm.medications as PrescribedMedication[] || [],
      instructions: prescriptionForm.instructions || '',
      refills: prescriptionForm.refills || 0,
      status: 'active',
      pharmacy: prescriptionForm.pharmacy || '',
      notes: prescriptionForm.notes || '',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    setPrescriptions(prev => [...prev, newPrescription]);
    setShowPrescriptionModal(false);
    setPrescriptionForm({});
    alert('Prescription created successfully!');
  }, [prescriptionForm, patients, doctors]);

  // --- Billing Operations ---
  const createBilling = useCallback(() => {
    if (!billingForm.patientId || !billingForm.services) {
      alert('Please fill in required fields');
      return;
    }

    const patient = patients.find(p => p.id === billingForm.patientId);
    if (!patient) return;

    const services = billingForm.services as BillingService[] || [];
    const total = services.reduce((sum, s) => sum + s.total, 0);

    const newBilling: Billing = {
      id: generateId(),
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      date: billingForm.date || getCurrentTimestamp().split('T')[0],
      services,
      total,
      insuranceClaim: {
        submitted: false,
        approved: false,
        amount: 0,
      },
      amountPaid: 0,
      balance: total,
      status: 'pending',
      notes: billingForm.notes || '',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    setBilling(prev => [...prev, newBilling]);
    setShowBillingModal(false);
    setBillingForm({});
    alert('Billing record created successfully!');
  }, [billingForm, patients]);

  // --- Render Functions ---
  const renderDashboard = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(a => a.date === today);
    const activePatients = patients.filter(p => p.status === 'active');
    const pendingBills = billing.filter(b => b.status === 'pending' || b.status === 'partial');
    const activePrescriptions = prescriptions.filter(p => p.status === 'active');

    return (
      <div>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Total Patients</p>
            <p className="text-2xl font-bold text-blue-600">{patients.length}</p>
            <p className="text-xs text-green-600">{activePatients.length} active</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Today's Appointments</p>
            <p className="text-2xl font-bold text-purple-600">{todayAppointments.length}</p>
            <p className="text-xs text-gray-500">{todayAppointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length} confirmed</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Active Prescriptions</p>
            <p className="text-2xl font-bold text-green-600">{activePrescriptions.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Pending Bills</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingBills.length}</p>
            <p className="text-xs text-gray-500">Total: {formatCurrency(pendingBills.reduce((sum, b) => sum + b.balance, 0))}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => {
              setPatientForm({});
              setShowPatientModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            ➕ Add Patient
          </button>
          <button
            onClick={() => {
              setAppointmentForm({});
              setShowAppointmentModal(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            📅 Schedule Appointment
          </button>
          <button
            onClick={() => {
              setPrescriptionForm({});
              setShowPrescriptionModal(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            💊 New Prescription
          </button>
          <button
            onClick={() => {
              setBillingForm({});
              setShowBillingModal(true);
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            💰 Create Bill
          </button>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="font-semibold mb-3">Recent Appointments</h4>
            <div className="space-y-2">
              {appointments.slice(0, 5).map(apt => (
                <div key={apt.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{apt.patientName}</p>
                    <p className="text-sm text-gray-500">{apt.doctorName} - {formatDate(apt.date)} {apt.time}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    apt.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                    apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="font-semibold mb-3">Recent Prescriptions</h4>
            <div className="space-y-2">
              {prescriptions.slice(0, 5).map(pres => (
                <div key={pres.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{pres.patientName}</p>
                    <p className="text-sm text-gray-500">{pres.medications.length} medications - {formatDate(pres.date)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    pres.status === 'active' ? 'bg-green-100 text-green-700' :
                    pres.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                    pres.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {pres.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPatients = () => {
    const filteredPatients = patients.filter(p => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return p.firstName.toLowerCase().includes(term) ||
               p.lastName.toLowerCase().includes(term) ||
               p.email.toLowerCase().includes(term) ||
               p.patientId.toLowerCase().includes(term);
      }
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      return true;
    });

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Patients</h2>
          <button
            onClick={() => {
              setPatientForm({});
              setShowPatientModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + Add Patient
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search patients..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="deceased">Deceased</option>
            </select>
          </div>
        </div>

        {/* Patient Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map(patient => {
            const age = calculateAge(patient.dateOfBirth);
            const doctor = doctors.find(d => d.id === patient.primaryPhysicianId);
            
            return (
              <div key={patient.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                      {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold">{patient.firstName} {patient.lastName}</h4>
                      <p className="text-sm text-gray-500">{patient.patientId}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    patient.status === 'active' ? 'bg-green-100 text-green-700' :
                    patient.status === 'inactive' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {patient.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">📧 {patient.email}</p>
                  <p className="text-gray-600">📱 {patient.phone}</p>
                  <p className="text-gray-600">🎂 {age} years old</p>
                  <p className="text-gray-600">🩸 {patient.bloodType || 'Unknown'}</p>
                  <p className="text-gray-600">👨‍⚕️ {doctor ? `${doctor.firstName} ${doctor.lastName}` : 'None assigned'}</p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setSelectedPatient(patient);
                      setPatientForm(patient);
                      setShowPatientModal(true);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPatient(patient);
                      setMedicalHistoryForm({});
                      setShowMedicalHistoryModal(true);
                    }}
                    className="text-sm text-green-600 hover:text-green-800"
                  >
                    📋 History
                  </button>
                  <button
                    onClick={() => deletePatient(patient.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAppointments = () => {
    const filteredAppointments = appointments.filter(a => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return a.patientName.toLowerCase().includes(term) ||
               a.doctorName.toLowerCase().includes(term);
      }
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      if (filterType !== 'all' && a.type !== filterType) return false;
      return true;
    });

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Appointments</h2>
          <button
            onClick={() => {
              setAppointmentForm({});
              setShowAppointmentModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + Schedule Appointment
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search appointments..."
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
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="general">General</option>
              <option value="specialist">Specialist</option>
              <option value="follow-up">Follow-up</option>
              <option value="emergency">Emergency</option>
              <option value="surgery">Surgery</option>
            </select>
          </div>
        </div>

        {/* Appointment Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAppointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{apt.patientName}</td>
                    <td className="px-4 py-3">{apt.doctorName}</td>
                    <td className="px-4 py-3">{formatDate(apt.date)} {apt.time}</td>
                    <td className="px-4 py-3 capitalize">{apt.type}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        apt.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                        apt.status === 'in-progress' ? 'bg-purple-100 text-purple-700' :
                        apt.status === 'cancelled' || apt.status === 'no-show' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {apt.status === 'scheduled' && (
                          <button
                            onClick={() => updateAppointmentStatus(apt.id, 'confirmed')}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Confirm
                          </button>
                        )}
                        {apt.status === 'scheduled' && (
                          <button
                            onClick={() => cancelAppointment(apt.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Cancel
                          </button>
                        )}
                        {apt.status === 'confirmed' && (
                          <button
                            onClick={() => updateAppointmentStatus(apt.id, 'in-progress')}
                            className="text-purple-600 hover:text-purple-800 text-sm"
                          >
                            Start
                          </button>
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

  const renderPrescriptions = () => {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Prescriptions</h2>
          <button
            onClick={() => {
              setPrescriptionForm({});
              setShowPrescriptionModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + New Prescription
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medications</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {prescriptions.map(pres => (
                  <tr key={pres.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{pres.patientName}</td>
                    <td className="px-4 py-3">{pres.doctorName}</td>
                    <td className="px-4 py-3">
                      {pres.medications.map((m, i) => (
                        <span key={m.id} className="inline-block text-xs bg-gray-100 px-2 py-1 rounded mr-1">
                          {m.name} {m.dosage}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3">{formatDate(pres.date)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        pres.status === 'active' ? 'bg-green-100 text-green-700' :
                        pres.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                        pres.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {pres.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedPatient(patients.find(p => p.id === pres.patientId) || null);
                          setPrescriptionForm(pres);
                          setShowPrescriptionModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View
                      </button>
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

  const renderBilling = () => {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Billing</h2>
          <button
            onClick={() => {
              setBillingForm({});
              setShowBillingModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + Create Bill
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {billing.map(bill => (
                  <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{bill.patientName}</td>
                    <td className="px-4 py-3">{formatDate(bill.date)}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(bill.total)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(bill.amountPaid)}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(bill.balance)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        bill.status === 'paid' ? 'bg-green-100 text-green-700' :
                        bill.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        bill.status === 'partial' ? 'bg-blue-100 text-blue-700' :
                        bill.status === 'insurance-pending' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setBillingForm(bill);
                          setShowBillingModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View
                      </button>
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
  const renderPatientModal = () => {
    if (!showPatientModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">{selectedPatient ? 'Edit Patient' : 'Add Patient'}</h3>
            <button 
              onClick={() => {
                setShowPatientModal(false);
                setSelectedPatient(null);
                setPatientForm({});
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
                  value={patientForm.firstName || ''}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <input
                  type="text"
                  value={patientForm.lastName || ''}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  value={patientForm.email || ''}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  value={patientForm.phone || ''}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  value={patientForm.dateOfBirth || ''}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  value={patientForm.gender || 'male'}
                  onChange={(e) => setPatientForm(prev => ({ ...prev, gender: e.target.value as Patient['gender'] }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Blood Type</label>
              <select
                value={patientForm.bloodType || ''}
                onChange={(e) => setPatientForm(prev => ({ ...prev, bloodType: e.target.value as Patient['bloodType'] }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Blood Type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Primary Physician</label>
              <select
                value={patientForm.primaryPhysicianId || ''}
                onChange={(e) => {
                  const doctor = doctors.find(d => d.id === e.target.value);
                  setPatientForm(prev => ({ 
                    ...prev, 
                    primaryPhysicianId: e.target.value,
                    primaryPhysicianName: doctor ? `${doctor.firstName} ${doctor.lastName}` : undefined
                  }));
                }}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Physician</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} - {d.specialization}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Allergies (comma-separated)</label>
              <input
                type="text"
                value={patientForm.allergies?.join(', ') || ''}
                onChange={(e) => setPatientForm(prev => ({ 
                  ...prev, 
                  allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Chronic Conditions (comma-separated)</label>
              <input
                type="text"
                value={patientForm.chronicConditions?.join(', ') || ''}
                onChange={(e) => setPatientForm(prev => ({ 
                  ...prev, 
                  chronicConditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={selectedPatient ? () => updatePatient(selectedPatient.id, patientForm) : createPatient}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
            >
              {selectedPatient ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => {
                setShowPatientModal(false);
                setSelectedPatient(null);
                setPatientForm({});
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

  const renderAppointmentModal = () => {
    if (!showAppointmentModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Schedule Appointment</h3>
            <button 
              onClick={() => {
                setShowAppointmentModal(false);
                setAppointmentForm({});
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Patient *</label>
              <select
                value={appointmentForm.patientId || ''}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, patientId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Doctor *</label>
              <select
                value={appointmentForm.doctorId || ''}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, doctorId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Doctor</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} - {d.specialization}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date *</label>
              <input
                type="date"
                value={appointmentForm.date || ''}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Time</label>
              <input
                type="time"
                value={appointmentForm.time || '09:00'}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, time: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={appointmentForm.type || 'general'}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, type: e.target.value as Appointment['type'] }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="specialist">Specialist</option>
                <option value="follow-up">Follow-up</option>
                <option value="emergency">Emergency</option>
                <option value="surgery">Surgery</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Reason</label>
              <textarea
                value={appointmentForm.reason || ''}
                onChange={(e) => setAppointmentForm(prev => ({ ...prev, reason: e.target.value }))}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Symptoms (comma-separated)</label>
              <input
                type="text"
                value={appointmentForm.symptoms?.join(', ') || ''}
                onChange={(e) => setAppointmentForm(prev => ({ 
                  ...prev, 
                  symptoms: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={createAppointment}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
            >
              Schedule
            </button>
            <button
              onClick={() => {
                setShowAppointmentModal(false);
                setAppointmentForm({});
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
          <p className="mt-4 text-gray-600">Loading healthcare system...</p>
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
              <span>🏥</span> Healthcare Management
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                Day 16
              </span>
            </h1>
            <p className="text-gray-600 mt-1">Manage patients, appointments, prescriptions & billing</p>
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
                onClick={() => setViewMode('patients')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'patients' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                👤 Patients
              </button>
              <button
                onClick={() => setViewMode('appointments')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'appointments' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📅 Appointments
              </button>
              <button
                onClick={() => setViewMode('prescriptions')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'prescriptions' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                💊 Prescriptions
              </button>
              <button
                onClick={() => setViewMode('billing')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'billing' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                💰 Billing
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-4 min-h-[500px]">
          {viewMode === 'dashboard' && renderDashboard()}
          {viewMode === 'patients' && renderPatients()}
          {viewMode === 'appointments' && renderAppointments()}
          {viewMode === 'prescriptions' && renderPrescriptions()}
          {viewMode === 'billing' && renderBilling()}
        </div>

        {/* Modals */}
        {renderPatientModal()}
        {renderAppointmentModal()}

        {/* Prescription Modal - Simplified */}
        {showPrescriptionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">New Prescription</h3>
                <button 
                  onClick={() => {
                    setShowPrescriptionModal(false);
                    setPrescriptionForm({});
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-500 text-center py-4">Prescription form would be here with medication details</p>
              <button
                onClick={() => {
                  setShowPrescriptionModal(false);
                  setPrescriptionForm({});
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Billing Modal - Simplified */}
        {showBillingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Billing</h3>
                <button 
                  onClick={() => {
                    setShowBillingModal(false);
                    setBillingForm({});
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-500 text-center py-4">Billing form would be here with service details</p>
              <button
                onClick={() => {
                  setShowBillingModal(false);
                  setBillingForm({});
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500 border-t pt-6">
          <p>© 2026 Healthcare Management - Day 16 Complete System</p>
          <p className="mt-1">Patients • Appointments • Prescriptions • Billing • Staff</p>
          <p className="mt-1 text-gray-400">
            {patients.length} patients • {doctors.length} doctors • {appointments.length} appointments • {prescriptions.length} prescriptions
          </p>
        </div>
      </div>
    </div>
  );
}