// app/realestate/page.tsx
// Complete Real Estate Management System with Properties, Tenants, Leases, Maintenance & Rent Collection
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// --- TypeScript Interfaces ---
interface Property {
  id: string;
  propertyId: string;
  name: string;
  description: string;
  type: 'residential' | 'commercial' | 'industrial' | 'land';
  category: 'apartment' | 'house' | 'condo' | 'office' | 'retail' | 'warehouse' | 'vacant';
  address: Address;
  features: string[];
  amenities: string[];
  size: number; // in sq ft
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  status: 'available' | 'occupied' | 'under-maintenance' | 'sold' | 'pending';
  price: number;
  rentAmount: number;
  currency: string;
  images: string[];
  documents: PropertyDocument[];
  ownerId: string;
  ownerName: string;
  tenants: string[];
  maintenanceRequests: MaintenanceRequest[];
  createdAt: string;
  updatedAt: string;
  lastInspection?: string;
  taxAssessment: number;
  insurance: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
  };
  energyRating?: string;
  parkingSpaces: number;
  petFriendly: boolean;
  furnished: boolean;
}

interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

interface PropertyDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface Tenant {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  occupation: string;
  employer: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  currentAddress: Address;
  previousAddress?: Address;
  creditScore?: number;
  references: string[];
  status: 'active' | 'inactive' | 'pending' | 'evicted';
  leases: string[];
  paymentHistory: Payment[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Lease {
  id: string;
  leaseId: string;
  propertyId: string;
  propertyName: string;
  tenantId: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit: number;
  currency: string;
  status: 'active' | 'expired' | 'terminated' | 'pending' | 'renewed';
  type: 'fixed-term' | 'month-to-month';
  terms: string[];
  documents: string[];
  paymentSchedule: 'monthly' | 'bi-weekly' | 'weekly';
  lateFee: number;
  gracePeriod: number; // days
  renewalOptions: {
    available: boolean;
    noticePeriod: number;
    rentIncrease?: number;
  };
  petPolicy: string;
  utilitiesIncluded: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  signedAt?: string;
}

interface Payment {
  id: string;
  tenantId: string;
  tenantName: string;
  leaseId: string;
  propertyId: string;
  propertyName: string;
  amount: number;
  currency: string;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'overdue' | 'pending' | 'partial';
  method: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'online';
  reference: string;
  lateFee: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface MaintenanceRequest {
  id: string;
  propertyId: string;
  propertyName: string;
  unitNumber?: string;
  tenantId: string;
  tenantName: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'pest' | 'other';
  status: 'submitted' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  assignedToName?: string;
  scheduledDate?: string;
  completedDate?: string;
  cost: number;
  notes: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface PropertyAnalytics {
  totalProperties: number;
  occupiedProperties: number;
  vacantProperties: number;
  occupancyRate: number;
  totalRentCollected: number;
  averageRent: number;
  totalMaintenanceRequests: number;
  outstandingRequests: number;
  revenueByMonth: {
    month: string;
    revenue: number;
    expenses: number;
  }[];
  propertyDistribution: {
    type: string;
    count: number;
    percentage: number;
  }[];
  topPerformingProperties: {
    propertyId: string;
    name: string;
    revenue: number;
    occupancy: number;
  }[];
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

const generatePropertyId = (): string => {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PRP-${random}`;
};

const generateLeaseId = (): string => {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LSE-${random}`;
};

const generateTenantId = (): string => {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TNT-${random}`;
};

// --- Mock Data Generation ---
const generateMockProperties = (): Property[] => {
  const propertyTypes = ['residential', 'commercial', 'residential', 'residential', 'commercial', 'industrial'] as const;
  const categories = ['apartment', 'house', 'condo', 'office', 'retail', 'warehouse'] as const;
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];
  const statuses: Property['status'][] = ['available', 'occupied', 'occupied', 'occupied', 'available', 'under-maintenance'];

  const properties: Property[] = [];

  for (let i = 0; i < 12; i++) {
    const bedrooms = Math.floor(Math.random() * 3) + 1;
    const bathrooms = Math.floor(Math.random() * 2) + 1;
    const size = Math.floor(Math.random() * 1500) + 500;
    const rentAmount = Math.round((Math.random() * 2000 + 800) * 100) / 100;
    
    properties.push({
      id: generateId(),
      propertyId: generatePropertyId(),
      name: `${['Sunset', 'Oakwood', 'Riverside', 'Mountain View', 'Lakefront', 'Downtown', 'Suburban', 'Parkview'][i % 8]} ${['Apartments', 'Estates', 'Condos', 'Towers', 'Gardens', 'Plaza'][i % 6]}`,
      description: `Beautiful ${categories[i % categories.length]} located in ${cities[i % cities.length]}`,
      type: propertyTypes[i % propertyTypes.length],
      category: categories[i % categories.length],
      address: {
        street: `${i + 100} Main St`,
        city: cities[i % cities.length],
        state: ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA'][i % 8],
        country: 'USA',
        zipCode: String(10000 + i * 100),
      },
      features: ['Central AC', 'Hardwood Floors', 'Stainless Steel Appliances', 'Washer/Dryer'].slice(0, Math.floor(Math.random() * 3) + 2),
      amenities: ['Pool', 'Gym', 'Parking', 'Security', 'Pet Friendly'].slice(0, Math.floor(Math.random() * 3) + 1),
      size,
      bedrooms,
      bathrooms,
      yearBuilt: 1980 + Math.floor(Math.random() * 40),
      status: statuses[i % statuses.length],
      price: Math.round(rentAmount * 120),
      rentAmount,
      currency: 'USD',
      images: [`https://images.unsplash.com/photo-${1568605114967-8130f3a36994 + i}?w=400&h=300&fit=crop`],
      documents: [],
      ownerId: 'owner1',
      ownerName: 'Jane Doe',
      tenants: [],
      maintenanceRequests: [],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      taxAssessment: Math.round(rentAmount * 100),
      insurance: {
        provider: ['Allstate', 'State Farm', 'Liberty Mutual'][i % 3],
        policyNumber: `POL-${String(10000 + i).padStart(5, '0')}`,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * (1 + i % 3)).toISOString().split('T')[0],
      },
      parkingSpaces: Math.floor(Math.random() * 2) + 1,
      petFriendly: Math.random() > 0.5,
      furnished: Math.random() > 0.6,
    });
  }

  return properties;
};

const generateMockTenants = (properties: Property[]): Tenant[] => {
  const firstNames = ['John', 'Mary', 'James', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const tenants: Tenant[] = [];

  for (let i = 0; i < 15; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    
    tenants.push({
      id: generateId(),
      tenantId: generateTenantId(),
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      phone: `(555) ${String(200 + i).padStart(3, '0')}-${String(2000 + i * 3).padStart(4, '0')}`,
      dateOfBirth: `198${i % 3 + 5}-${String(1 + i % 12).padStart(2, '0')}-${String(1 + i % 28).padStart(2, '0')}`,
      occupation: ['Engineer', 'Teacher', 'Doctor', 'Designer', 'Manager', 'Developer', 'Analyst', 'Consultant'][i % 8],
      employer: `${['Tech', 'Health', 'Finance', 'Education', 'Design', 'Consulting'][i % 6]} Inc.`,
      emergencyContact: {
        name: `${lastName} Family`,
        relationship: 'Family',
        phone: `(555) ${String(300 + i).padStart(3, '0')}-${String(3000 + i * 4).padStart(4, '0')}`,
      },
      currentAddress: {
        street: `${i + 200} Oak St`,
        city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][i % 5],
        state: ['NY', 'CA', 'IL', 'TX', 'AZ'][i % 5],
        country: 'USA',
        zipCode: String(20000 + i * 100),
      },
      creditScore: Math.floor(Math.random() * 200) + 600,
      references: ['Reference 1', 'Reference 2'],
      status: i < 10 ? 'active' : 'pending',
      leases: [],
      paymentHistory: [],
      notes: `Tenant note ${i + 1}`,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    });
  }

  return tenants;
};

const generateMockLeases = (properties: Property[], tenants: Tenant[]): Lease[] => {
  const leases: Lease[] = [];
  const activeTenants = tenants.filter(t => t.status === 'active');

  activeTenants.forEach((tenant, index) => {
    const property = properties[index % properties.length];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12));
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    leases.push({
      id: generateId(),
      leaseId: generateLeaseId(),
      propertyId: property.id,
      propertyName: property.name,
      tenantId: tenant.id,
      tenantName: `${tenant.firstName} ${tenant.lastName}`,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      rentAmount: property.rentAmount,
      securityDeposit: Math.round(property.rentAmount * 1.5 * 100) / 100,
      currency: 'USD',
      status: 'active',
      type: 'fixed-term',
      terms: ['No smoking', 'Pet deposit required', 'Maintenance request must be submitted in writing'],
      documents: [],
      paymentSchedule: 'monthly',
      lateFee: 50,
      gracePeriod: 5,
      renewalOptions: {
        available: true,
        noticePeriod: 60,
        rentIncrease: Math.round((Math.random() * 5 + 2) * 100) / 100,
      },
      petPolicy: 'Pets allowed with deposit',
      utilitiesIncluded: ['Water', 'Trash'],
      notes: `Lease for ${tenant.firstName} ${tenant.lastName}`,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    });
  });

  return leases;
};

const generateMockPayments = (leases: Lease[]): Payment[] => {
  const payments: Payment[] = [];
  const methods: Payment['method'][] = ['bank_transfer', 'check', 'credit_card', 'online'];

  leases.forEach(lease => {
    for (let i = 0; i < 6; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() - i);
      const paidDate = new Date(dueDate);
      paidDate.setDate(paidDate.getDate() + (Math.random() > 0.2 ? Math.floor(Math.random() * 3) : 10));
      
      payments.push({
        id: generateId(),
        tenantId: lease.tenantId,
        tenantName: lease.tenantName,
        leaseId: lease.id,
        propertyId: lease.propertyId,
        propertyName: lease.propertyName,
        amount: lease.rentAmount,
        currency: lease.currency,
        dueDate: dueDate.toISOString().split('T')[0],
        paidDate: paidDate.toISOString().split('T')[0],
        status: paidDate.getDate() > dueDate.getDate() + 5 ? 'overdue' : 'paid',
        method: methods[i % methods.length],
        reference: `PAY-${String(10000 + i).padStart(5, '0')}`,
        lateFee: 0,
        notes: `Payment ${i + 1}`,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
      });
    }
  });

  return payments;
};

// --- Main Component ---
export default function RealEstatePage() {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [analytics, setAnalytics] = useState<PropertyAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // UI States
  const [viewMode, setViewMode] = useState<'dashboard' | 'properties' | 'tenants' | 'leases' | 'payments' | 'maintenance'>('dashboard');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  
  // Modal States
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showLeaseModal, setShowLeaseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  // Form States
  const [propertyForm, setPropertyForm] = useState<Partial<Property>>({});
  const [tenantForm, setTenantForm] = useState<Partial<Tenant>>({});
  const [leaseForm, setLeaseForm] = useState<Partial<Lease>>({});
  const [paymentForm, setPaymentForm] = useState<Partial<Payment>>({});
  const [maintenanceForm, setMaintenanceForm] = useState<Partial<MaintenanceRequest>>({});

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
    const mockProperties = generateMockProperties();
    setProperties(mockProperties);

    const mockTenants = generateMockTenants(mockProperties);
    setTenants(mockTenants);

    const mockLeases = generateMockLeases(mockProperties, mockTenants);
    setLeases(mockLeases);

    const mockPayments = generateMockPayments(mockLeases);
    setPayments(mockPayments);

    // Generate mock maintenance requests
    const mockMaintenance: MaintenanceRequest[] = [];
    mockProperties.slice(0, 5).forEach(prop => {
      const tenant = mockTenants.find(t => t.id === prop.tenants[0]);
      if (tenant) {
        mockMaintenance.push({
          id: generateId(),
          propertyId: prop.id,
          propertyName: prop.name,
          tenantId: tenant.id,
          tenantName: `${tenant.firstName} ${tenant.lastName}`,
          title: ['Plumbing Issue', 'Electrical Problem', 'HVAC Maintenance', 'Appliance Repair'][mockMaintenance.length % 4],
          description: 'Description of the maintenance issue',
          priority: ['low', 'medium', 'high', 'emergency'][mockMaintenance.length % 4] as any,
          category: ['plumbing', 'electrical', 'hvac', 'appliance'][mockMaintenance.length % 4] as any,
          status: ['submitted', 'in-progress', 'completed'][mockMaintenance.length % 3] as any,
          cost: Math.round((Math.random() * 500 + 50) * 100) / 100,
          notes: 'Maintenance notes',
          images: [],
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
        });
      }
    });
    setMaintenanceRequests(mockMaintenance);

    // Calculate analytics
    calculateAnalytics(mockProperties, mockPayments, mockMaintenance);

    setIsLoading(false);
  }, []);

  const calculateAnalytics = useCallback((props: Property[], pays: Payment[], maint: MaintenanceRequest[]) => {
    const totalProperties = props.length;
    const occupiedProperties = props.filter(p => p.status === 'occupied').length;
    const vacantProperties = props.filter(p => p.status === 'available').length;
    const occupancyRate = totalProperties > 0 ? (occupiedProperties / totalProperties) * 100 : 0;
    
    const totalRentCollected = pays.reduce((sum, p) => sum + (p.status === 'paid' ? p.amount : 0), 0);
    const averageRent = props.reduce((sum, p) => sum + p.rentAmount, 0) / totalProperties || 0;
    
    const outstandingRequests = maint.filter(m => m.status !== 'completed' && m.status !== 'cancelled').length;

    // Revenue by month (last 6 months)
    const revenueByMonth: { month: string; revenue: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short' });
      
      const monthRevenue = pays.filter(p => {
        const paidDate = new Date(p.paidDate || '');
        return paidDate.getMonth() === date.getMonth() && paidDate.getFullYear() === date.getFullYear();
      }).reduce((sum, p) => sum + p.amount, 0);
      
      revenueByMonth.push({
        month,
        revenue: monthRevenue,
        expenses: Math.round((monthRevenue * 0.3) * 100) / 100,
      });
    }

    // Property distribution
    const typeCount: Record<string, number> = {};
    props.forEach(p => {
      typeCount[p.type] = (typeCount[p.type] || 0) + 1;
    });
    const propertyDistribution = Object.entries(typeCount).map(([type, count]) => ({
      type,
      count,
      percentage: (count / totalProperties) * 100,
    }));

    // Top performing properties
    const topPerformingProperties = props
      .filter(p => p.status === 'occupied')
      .map(p => ({
        propertyId: p.id,
        name: p.name,
        revenue: p.rentAmount,
        occupancy: 100,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setAnalytics({
      totalProperties,
      occupiedProperties,
      vacantProperties,
      occupancyRate,
      totalRentCollected,
      averageRent,
      totalMaintenanceRequests: maint.length,
      outstandingRequests,
      revenueByMonth,
      propertyDistribution,
      topPerformingProperties,
    });
  }, []);

  // --- Property Operations ---
  const createProperty = useCallback(() => {
    if (!propertyForm.name || !propertyForm.address) {
      alert('Please fill in required fields');
      return;
    }

    const newProperty: Property = {
      id: generateId(),
      propertyId: generatePropertyId(),
      name: propertyForm.name,
      description: propertyForm.description || '',
      type: propertyForm.type || 'residential',
      category: propertyForm.category || 'apartment',
      address: propertyForm.address as Address,
      features: propertyForm.features || [],
      amenities: propertyForm.amenities || [],
      size: propertyForm.size || 0,
      bedrooms: propertyForm.bedrooms || 0,
      bathrooms: propertyForm.bathrooms || 0,
      yearBuilt: propertyForm.yearBuilt || new Date().getFullYear(),
      status: 'available',
      price: propertyForm.price || 0,
      rentAmount: propertyForm.rentAmount || 0,
      currency: 'USD',
      images: [],
      documents: [],
      ownerId: currentUser?.id || 'owner1',
      ownerName: currentUser?.fullName || 'Jane Doe',
      tenants: [],
      maintenanceRequests: [],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      taxAssessment: propertyForm.taxAssessment || 0,
      insurance: propertyForm.insurance || { provider: '', policyNumber: '', expiryDate: '' },
      parkingSpaces: propertyForm.parkingSpaces || 0,
      petFriendly: propertyForm.petFriendly || false,
      furnished: propertyForm.furnished || false,
    };

    setProperties(prev => [...prev, newProperty]);
    setShowPropertyModal(false);
    setPropertyForm({});
    alert('Property added successfully!');
  }, [propertyForm, currentUser]);

  const updateProperty = useCallback((propertyId: string, updates: Partial<Property>) => {
    setProperties(prev => prev.map(p => 
      p.id === propertyId ? { ...p, ...updates, updatedAt: getCurrentTimestamp() } : p
    ));
  }, []);

  const deleteProperty = useCallback((propertyId: string) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    setProperties(prev => prev.filter(p => p.id !== propertyId));
  }, []);

  // --- Tenant Operations ---
  const createTenant = useCallback(() => {
    if (!tenantForm.firstName || !tenantForm.lastName || !tenantForm.email) {
      alert('Please fill in required fields');
      return;
    }

    const newTenant: Tenant = {
      id: generateId(),
      tenantId: generateTenantId(),
      firstName: tenantForm.firstName,
      lastName: tenantForm.lastName,
      email: tenantForm.email,
      phone: tenantForm.phone || '',
      dateOfBirth: tenantForm.dateOfBirth || '',
      occupation: tenantForm.occupation || '',
      employer: tenantForm.employer || '',
      emergencyContact: tenantForm.emergencyContact || { name: '', relationship: '', phone: '' },
      currentAddress: tenantForm.currentAddress as Address || { street: '', city: '', state: '', country: '', zipCode: '' },
      references: [],
      status: 'pending',
      leases: [],
      paymentHistory: [],
      notes: '',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    setTenants(prev => [...prev, newTenant]);
    setShowTenantModal(false);
    setTenantForm({});
    alert('Tenant added successfully!');
  }, [tenantForm]);

  // --- Lease Operations ---
  const createLease = useCallback(() => {
    if (!leaseForm.propertyId || !leaseForm.tenantId || !leaseForm.startDate) {
      alert('Please fill in required fields');
      return;
    }

    const property = properties.find(p => p.id === leaseForm.propertyId);
    const tenant = tenants.find(t => t.id === leaseForm.tenantId);
    if (!property || !tenant) return;

    const newLease: Lease = {
      id: generateId(),
      leaseId: generateLeaseId(),
      propertyId: property.id,
      propertyName: property.name,
      tenantId: tenant.id,
      tenantName: `${tenant.firstName} ${tenant.lastName}`,
      startDate: leaseForm.startDate,
      endDate: leaseForm.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      rentAmount: leaseForm.rentAmount || property.rentAmount,
      securityDeposit: leaseForm.securityDeposit || Math.round(property.rentAmount * 1.5),
      currency: 'USD',
      status: 'pending',
      type: leaseForm.type || 'fixed-term',
      terms: leaseForm.terms || [],
      documents: [],
      paymentSchedule: leaseForm.paymentSchedule || 'monthly',
      lateFee: leaseForm.lateFee || 50,
      gracePeriod: leaseForm.gracePeriod || 5,
      renewalOptions: leaseForm.renewalOptions || { available: true, noticePeriod: 60 },
      petPolicy: leaseForm.petPolicy || 'No pets',
      utilitiesIncluded: leaseForm.utilitiesIncluded || [],
      notes: leaseForm.notes || '',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    setLeases(prev => [...prev, newLease]);
    
    // Update property status
    updateProperty(property.id, { status: 'occupied', tenants: [...property.tenants, tenant.id] });
    
    // Update tenant status
    setTenants(prev => prev.map(t => 
      t.id === tenant.id 
        ? { ...t, status: 'active', leases: [...t.leases, newLease.id] }
        : t
    ));

    setShowLeaseModal(false);
    setLeaseForm({});
    alert('Lease created successfully!');
  }, [leaseForm, properties, tenants, updateProperty]);

  // --- Payment Operations ---
  const recordPayment = useCallback(() => {
    if (!paymentForm.tenantId || !paymentForm.amount || !paymentForm.dueDate) {
      alert('Please fill in required fields');
      return;
    }

    const tenant = tenants.find(t => t.id === paymentForm.tenantId);
    if (!tenant) return;

    const lease = leases.find(l => l.tenantId === tenant.id && l.status === 'active');
    if (!lease) return;

    const newPayment: Payment = {
      id: generateId(),
      tenantId: tenant.id,
      tenantName: `${tenant.firstName} ${tenant.lastName}`,
      leaseId: lease.id,
      propertyId: lease.propertyId,
      propertyName: lease.propertyName,
      amount: paymentForm.amount,
      currency: paymentForm.currency || 'USD',
      dueDate: paymentForm.dueDate,
      paidDate: paymentForm.paidDate || getCurrentTimestamp().split('T')[0],
      status: 'paid',
      method: paymentForm.method || 'bank_transfer',
      reference: `PAY-${String(Date.now()).slice(-6)}`,
      lateFee: paymentForm.lateFee || 0,
      notes: paymentForm.notes || '',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    setPayments(prev => [...prev, newPayment]);
    setShowPaymentModal(false);
    setPaymentForm({});
    alert('Payment recorded successfully!');
  }, [paymentForm, tenants, leases]);

  // --- Maintenance Operations ---
  const createMaintenanceRequest = useCallback(() => {
    if (!maintenanceForm.propertyId || !maintenanceForm.tenantId || !maintenanceForm.title) {
      alert('Please fill in required fields');
      return;
    }

    const property = properties.find(p => p.id === maintenanceForm.propertyId);
    const tenant = tenants.find(t => t.id === maintenanceForm.tenantId);
    if (!property || !tenant) return;

    const newRequest: MaintenanceRequest = {
      id: generateId(),
      propertyId: property.id,
      propertyName: property.name,
      tenantId: tenant.id,
      tenantName: `${tenant.firstName} ${tenant.lastName}`,
      title: maintenanceForm.title,
      description: maintenanceForm.description || '',
      priority: maintenanceForm.priority || 'medium',
      category: maintenanceForm.category || 'other',
      status: 'submitted',
      cost: 0,
      notes: '',
      images: [],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    setMaintenanceRequests(prev => [...prev, newRequest]);
    setShowMaintenanceModal(false);
    setMaintenanceForm({});
    alert('Maintenance request submitted!');
  }, [maintenanceForm, properties, tenants]);

  const updateMaintenanceStatus = useCallback((requestId: string, status: MaintenanceRequest['status']) => {
    setMaintenanceRequests(prev => prev.map(r => 
      r.id === requestId ? { ...r, status, updatedAt: getCurrentTimestamp() } : r
    ));
  }, []);

  // --- Render Functions ---
  const renderDashboard = () => {
    if (!analytics) return null;

    return (
      <div>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Total Properties</p>
            <p className="text-2xl font-bold text-blue-600">{analytics.totalProperties}</p>
            <p className="text-xs text-green-600">{analytics.occupiedProperties} occupied</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Occupancy Rate</p>
            <p className="text-2xl font-bold text-green-600">{analytics.occupancyRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">{analytics.vacantProperties} vacant</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Total Rent Collected</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(analytics.totalRentCollected)}</p>
            <p className="text-xs text-gray-500">Average rent: {formatCurrency(analytics.averageRent)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Maintenance</p>
            <p className="text-2xl font-bold text-yellow-600">{analytics.outstandingRequests}</p>
            <p className="text-xs text-gray-500">{analytics.totalMaintenanceRequests} total requests</p>
          </div>
        </div>

        {/* Charts - Simplified */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="font-semibold mb-3">Property Distribution</h4>
            <div className="space-y-2">
              {analytics.propertyDistribution.map(item => (
                <div key={item.type}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{item.type}</span>
                    <span>{item.count} ({item.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 rounded-full h-2 transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="font-semibold mb-3">Revenue by Month</h4>
            <div className="space-y-2">
              {analytics.revenueByMonth.map(item => (
                <div key={item.month}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.month}</span>
                    <span className="text-green-600">{formatCurrency(item.revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 rounded-full h-2 transition-all"
                      style={{ width: `${(item.revenue / Math.max(...analytics.revenueByMonth.map(m => m.revenue))) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performing Properties */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h4 className="font-semibold mb-3">Top Performing Properties</h4>
          <div className="space-y-2">
            {analytics.topPerformingProperties.map(prop => (
              <div key={prop.propertyId} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{prop.name}</p>
                  <p className="text-sm text-gray-500">Occupancy: {prop.occupancy}%</p>
                </div>
                <span className="font-bold text-green-600">{formatCurrency(prop.revenue)}/mo</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderProperties = () => {
    const filteredProperties = properties.filter(p => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return p.name.toLowerCase().includes(term) ||
               p.propertyId.toLowerCase().includes(term) ||
               p.address.city.toLowerCase().includes(term);
      }
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (filterType !== 'all' && p.type !== filterType) return false;
      return true;
    });

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Properties</h2>
          <button
            onClick={() => {
              setPropertyForm({});
              setShowPropertyModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + Add Property
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search properties..."
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
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="under-maintenance">Under Maintenance</option>
              <option value="sold">Sold</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
              <option value="land">Land</option>
            </select>
          </div>
        </div>

        {/* Property Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProperties.map(property => (
            <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gray-200 relative">
                <img 
                  src={property.images[0] || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop'} 
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {property.status}
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-lg">{property.name}</h4>
                <p className="text-sm text-gray-500">{property.address.city}, {property.address.state}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <span>{property.bedrooms} beds</span>
                  <span>•</span>
                  <span>{property.bathrooms} baths</span>
                  <span>•</span>
                  <span>{property.size} sq ft</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold text-blue-600">{formatCurrency(property.rentAmount)}/mo</span>
                  <button
                    onClick={() => {
                      setSelectedProperty(property);
                      setPropertyForm(property);
                      setShowPropertyModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTenants = () => {
    const filteredTenants = tenants.filter(t => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return t.firstName.toLowerCase().includes(term) ||
               t.lastName.toLowerCase().includes(term) ||
               t.email.toLowerCase().includes(term) ||
               t.tenantId.toLowerCase().includes(term);
      }
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      return true;
    });

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Tenants</h2>
          <button
            onClick={() => {
              setTenantForm({});
              setShowTenantModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + Add Tenant
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTenants.map(tenant => (
                  <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{tenant.firstName} {tenant.lastName}</td>
                    <td className="px-4 py-3">{tenant.email}</td>
                    <td className="px-4 py-3">{tenant.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        tenant.status === 'active' ? 'bg-green-100 text-green-700' :
                        tenant.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        tenant.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setTenantForm(tenant);
                          setShowTenantModal(true);
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

  const renderLeases = () => {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Leases</h2>
          <button
            onClick={() => {
              setLeaseForm({});
              setShowLeaseModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + New Lease
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leases.map(lease => (
                  <tr key={lease.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">{lease.propertyName}</td>
                    <td className="px-4 py-3">{lease.tenantName}</td>
                    <td className="px-4 py-3">{formatDate(lease.startDate)}</td>
                    <td className="px-4 py-3">{formatDate(lease.endDate)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(lease.rentAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        lease.status === 'active' ? 'bg-green-100 text-green-700' :
                        lease.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        lease.status === 'expired' ? 'bg-gray-100 text-gray-700' :
                        lease.status === 'terminated' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {lease.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedLease(lease);
                          setLeaseForm(lease);
                          setShowLeaseModal(true);
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

  const renderPayments = () => {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Payments</h2>
          <button
            onClick={() => {
              setPaymentForm({});
              setShowPaymentModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + Record Payment
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.slice(0, 10).map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">{payment.tenantName}</td>
                    <td className="px-4 py-3">{payment.propertyName}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-3">{formatDate(payment.dueDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                        payment.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setPaymentForm(payment);
                          setShowPaymentModal(true);
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

  const renderMaintenance = () => {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Maintenance Requests</h2>
          <button
            onClick={() => {
              setMaintenanceForm({});
              setShowMaintenanceModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            + New Request
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {maintenanceRequests.map(request => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">{request.propertyName}</td>
                    <td className="px-4 py-3">{request.tenantName}</td>
                    <td className="px-4 py-3">{request.title}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        request.priority === 'emergency' ? 'bg-red-100 text-red-700' :
                        request.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        request.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        request.status === 'completed' ? 'bg-green-100 text-green-700' :
                        request.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        request.status === 'assigned' ? 'bg-purple-100 text-purple-700' :
                        request.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setMaintenanceForm(request);
                          setShowMaintenanceModal(true);
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

  // --- Main Render ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading real estate system...</p>
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
              <span>🏘️</span> Real Estate Management
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                Day 17
              </span>
            </h1>
            <p className="text-gray-600 mt-1">Manage properties, tenants, leases & maintenance</p>
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
                onClick={() => setViewMode('properties')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'properties' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🏠 Properties
              </button>
              <button
                onClick={() => setViewMode('tenants')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'tenants' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                👤 Tenants
              </button>
              <button
                onClick={() => setViewMode('leases')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'leases' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📋 Leases
              </button>
              <button
                onClick={() => setViewMode('payments')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'payments' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                💰 Payments
              </button>
              <button
                onClick={() => setViewMode('maintenance')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'maintenance' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🔧 Maintenance
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-4 min-h-[500px]">
          {viewMode === 'dashboard' && renderDashboard()}
          {viewMode === 'properties' && renderProperties()}
          {viewMode === 'tenants' && renderTenants()}
          {viewMode === 'leases' && renderLeases()}
          {viewMode === 'payments' && renderPayments()}
          {viewMode === 'maintenance' && renderMaintenance()}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500 border-t pt-6">
          <p>© 2026 Real Estate Management - Complete System</p>
          <p className="mt-1">Properties • Tenants • Leases • Payments • Maintenance</p>
          <p className="mt-1 text-gray-400">
            {properties.length} properties • {tenants.length} tenants • {leases.length} leases • {payments.length} payments
          </p>
        </div>
      </div>
    </div>
  );
}