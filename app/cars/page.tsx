// app/cars/page.tsx
// Complete Car Rental System with Vehicles, Bookings, Fleet Management & Customer Tracking
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// --- TypeScript Interfaces ---
interface Vehicle {
  id: string;
  vin: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  type: 'sedan' | 'suv' | 'truck' | 'van' | 'luxury' | 'sports' | 'electric' | 'hybrid';
  transmission: 'automatic' | 'manual';
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  seats: number;
  doors: number;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  currency: string;
  mileage: number;
  features: string[];
  images: string[];
  status: 'available' | 'booked' | 'maintenance' | 'out-of-service' | 'reserved';
  location: string;
  branch: string;
  insurance: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
  };
  lastMaintenance: string;
  nextMaintenance: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface Booking {
  id: string;
  bookingNumber: string;
  vehicleId: string;
  vehicleName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  pickupDate: string;
  returnDate: string;
  pickupLocation: string;
  returnLocation: string;
  days: number;
  dailyRate: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'picked-up' | 'returned' | 'cancelled' | 'no-show';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  paymentMethod: 'credit_card' | 'cash' | 'online' | 'insurance';
  insuranceType: 'basic' | 'standard' | 'premium' | 'none';
  additionalDrivers: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  pickedUpAt?: string;
  returnedAt?: string;
  actualReturnMileage?: number;
  fuelLevel?: number;
  damageReport?: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  licenseNumber: string;
  licenseExpiry: string;
  address: Address;
  driverHistory: string[];
  pastBookings: string[];
  loyaltyPoints: number;
  membershipLevel: 'basic' | 'silver' | 'gold' | 'platinum';
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

interface Branch {
  id: string;
  name: string;
  address: Address;
  phone: string;
  email: string;
  operatingHours: string;
  vehicles: string[];
  manager: string;
  createdAt: string;
  updatedAt: string;
}

interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: 'oil-change' | 'tire-rotation' | 'brake-repair' | 'engine-tune' | 'body-repair' | 'inspection';
  date: string;
  mileage: number;
  cost: number;
  description: string;
  mechanic: string;
  nextDue: string;
  createdAt: string;
  updatedAt: string;
}

interface RentalAnalytics {
  totalBookings: number;
  totalRevenue: number;
  fleetSize: number;
  availableVehicles: number;
  bookedVehicles: number;
  maintenanceVehicles: number;
  utilizationRate: number;
  popularVehicles: {
    vehicleId: string;
    name: string;
    bookings: number;
    revenue: number;
  }[];
  bookingsByStatus: {
    status: string;
    count: number;
  }[];
  revenueByMonth: {
    month: string;
    revenue: number;
    bookings: number;
  }[];
  averageRentalDuration: number;
  topCustomers: {
    customerId: string;
    name: string;
    bookings: number;
    revenue: number;
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

const generateBookingNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RENT${year}${month}${day}-${random}`;
};

const calculateDays = (pickup: string, returnDate: string): number => {
  const start = new Date(pickup);
  const end = new Date(returnDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

const getVehicleTypeEmoji = (type: string): string => {
  const map: Record<string, string> = {
    'sedan': '🚗',
    'suv': '🚙',
    'truck': '🚛',
    'van': '🚐',
    'luxury': '🏎️',
    'sports': '🏎️',
    'electric': '⚡',
    'hybrid': '🔋',
  };
  return map[type] || '🚗';
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'available': 'bg-green-100 text-green-700',
    'booked': 'bg-blue-100 text-blue-700',
    'maintenance': 'bg-yellow-100 text-yellow-700',
    'out-of-service': 'bg-red-100 text-red-700',
    'reserved': 'bg-purple-100 text-purple-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

const getBookingStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-700',
    'confirmed': 'bg-blue-100 text-blue-700',
    'picked-up': 'bg-purple-100 text-purple-700',
    'returned': 'bg-green-100 text-green-700',
    'cancelled': 'bg-red-100 text-red-700',
    'no-show': 'bg-orange-100 text-orange-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

// Placeholder image URLs
const vehicleImages = [
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop',
];

// --- Mock Data Generation ---
const generateMockVehicles = (): Vehicle[] => {
  const vehicles: Vehicle[] = [];
  
  const makes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes', 'Audi', 'Tesla', 'Hyundai', 'Kia'];
  const models = ['Camry', 'Accord', 'F-150', 'Silverado', '3 Series', 'C-Class', 'A4', 'Model 3', 'Elantra', 'Sorento'];
  const colors = ['Black', 'White', 'Silver', 'Blue', 'Red', 'Gray', 'Green', 'Brown'];
  const types: Vehicle['type'][] = ['sedan', 'suv', 'truck', 'van', 'luxury', 'sports', 'electric', 'hybrid'];
  const statuses: Vehicle['status'][] = ['available', 'available', 'available', 'booked', 'maintenance'];
  const branches = ['Downtown', 'Airport', 'City Center', 'North Side', 'South Side'];
  const features = ['GPS', 'Bluetooth', 'Backup Camera', 'Apple CarPlay', 'Android Auto', 'Sunroof', 'Heated Seats', 'Cruise Control'];

  for (let i = 0; i < 20; i++) {
    const make = makes[i % makes.length];
    const model = models[i % models.length];
    const year = 2018 + Math.floor(Math.random() * 6);
    const dailyRate = Math.round((50 + Math.random() * 150) * 100) / 100;
    
    vehicles.push({
      id: generateId(),
      vin: `1HGCM82633A${String(100000 + i).padStart(6, '0')}`,
      licensePlate: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${String(1000 + i * 2)}`,
      make,
      model,
      year,
      color: colors[i % colors.length],
      type: types[i % types.length],
      transmission: i % 2 === 0 ? 'automatic' : 'manual',
      fuelType: ['gasoline', 'diesel', 'electric', 'hybrid'][i % 4] as any,
      seats: 4 + Math.floor(Math.random() * 4),
      doors: 4,
      dailyRate,
      weeklyRate: dailyRate * 6,
      monthlyRate: dailyRate * 22,
      currency: 'USD',
      mileage: Math.floor(Math.random() * 50000),
      features: features.slice(0, 3 + Math.floor(Math.random() * 3)),
      images: [vehicleImages[i % vehicleImages.length]],
      status: statuses[i % statuses.length],
      location: branches[i % branches.length],
      branch: branches[i % branches.length],
      insurance: {
        provider: ['Allstate', 'State Farm', 'Geico', 'Progressive'][i % 4],
        policyNumber: `POL-${String(10000 + i).padStart(5, '0')}`,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * (1 + i % 3)).toISOString().split('T')[0],
      },
      lastMaintenance: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextMaintenance: new Date(Date.now() + (30 + Math.random() * 60) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      condition: ['excellent', 'good', 'good', 'fair'][i % 4] as any,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isActive: true,
    });
  }

  return vehicles;
};

const generateMockCustomers = (): Customer[] => {
  const firstNames = ['John', 'Mary', 'James', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const membershipLevels: Customer['membershipLevel'][] = ['basic', 'silver', 'gold', 'platinum'];
  const customers: Customer[] = [];

  for (let i = 0; i < 15; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    
    customers.push({
      id: generateId(),
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      phone: `(555) ${String(200 + i).padStart(3, '0')}-${String(2000 + i * 3).padStart(4, '0')}`,
      dateOfBirth: `198${i % 3 + 5}-${String(1 + i % 12).padStart(2, '0')}-${String(1 + i % 28).padStart(2, '0')}`,
      licenseNumber: `DL-${String(10000 + i).padStart(5, '0')}`,
      licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * (2 + i % 3)).toISOString().split('T')[0],
      address: {
        street: `${i + 200} Main St`,
        city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][i % 5],
        state: ['NY', 'CA', 'IL', 'TX', 'AZ'][i % 5],
        country: 'USA',
        zipCode: String(20000 + i * 100),
      },
      driverHistory: [],
      pastBookings: [],
      loyaltyPoints: Math.floor(Math.random() * 500),
      membershipLevel: membershipLevels[i % membershipLevels.length],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isActive: true,
    });
  }

  return customers;
};

const generateMockBookings = (vehicles: Vehicle[], customers: Customer[]): Booking[] => {
  const bookings: Booking[] = [];
  const statuses: Booking['status'][] = ['confirmed', 'picked-up', 'returned', 'pending', 'cancelled'];
  const now = new Date();

  for (let i = 0; i < 25; i++) {
    const vehicle = vehicles[i % vehicles.length];
    const customer = customers[i % customers.length];
    
    const pickupDate = new Date(now);
    pickupDate.setDate(pickupDate.getDate() + Math.floor(Math.random() * 30) - 10);
    const returnDate = new Date(pickupDate);
    returnDate.setDate(returnDate.getDate() + Math.floor(Math.random() * 7) + 1);
    const days = calculateDays(pickupDate.toISOString().split('T')[0], returnDate.toISOString().split('T')[0]);

    bookings.push({
      id: generateId(),
      bookingNumber: generateBookingNumber(),
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.make} ${vehicle.model}`,
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      pickupDate: pickupDate.toISOString().split('T')[0],
      returnDate: returnDate.toISOString().split('T')[0],
      pickupLocation: vehicle.location,
      returnLocation: vehicle.location,
      days,
      dailyRate: vehicle.dailyRate,
      totalAmount: vehicle.dailyRate * days,
      currency: 'USD',
      status: statuses[i % statuses.length],
      paymentStatus: 'paid',
      paymentMethod: ['credit_card', 'online', 'cash'][i % 3] as any,
      insuranceType: ['basic', 'standard', 'premium'][i % 3] as any,
      additionalDrivers: [],
      notes: 'No special requests',
      createdAt: pickupDate.toISOString(),
      updatedAt: pickupDate.toISOString(),
    });
  }

  return bookings;
};

// --- Main Component ---
export default function CarRentalPage() {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI States
  const [viewMode, setViewMode] = useState<'vehicles' | 'vehicle' | 'bookings' | 'customers' | 'dashboard'>('vehicles');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  
  // Modal States
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Booking States
  const [bookingData, setBookingData] = useState({
    pickupDate: '',
    returnDate: '',
    customerId: '',
    insuranceType: 'basic' as Booking['insuranceType'],
    notes: '',
  });

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');

  // Analytics
  const [analytics, setAnalytics] = useState<RentalAnalytics | null>(null);

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
    const mockVehicles = generateMockVehicles();
    setVehicles(mockVehicles);
    setSelectedVehicle(mockVehicles[0]);

    const mockCustomers = generateMockCustomers();
    setCustomers(mockCustomers);

    const mockBookings = generateMockBookings(mockVehicles, mockCustomers);
    setBookings(mockBookings);

    // Calculate analytics
    calculateAnalytics(mockVehicles, mockBookings);

    setIsLoading(false);
  }, []);

  const calculateAnalytics = useCallback((veh: Vehicle[], book: Booking[]) => {
    const totalBookings = book.length;
    const totalRevenue = book.reduce((sum, b) => sum + (b.status !== 'cancelled' ? b.totalAmount : 0), 0);
    const fleetSize = veh.length;
    const availableVehicles = veh.filter(v => v.status === 'available').length;
    const bookedVehicles = veh.filter(v => v.status === 'booked').length;
    const maintenanceVehicles = veh.filter(v => v.status === 'maintenance').length;
    const utilizationRate = fleetSize > 0 ? ((bookedVehicles / fleetSize) * 100) : 0;

    // Popular vehicles
    const vehicleStats: Record<string, { bookings: number; revenue: number }> = {};
    book.forEach(b => {
      if (!vehicleStats[b.vehicleId]) {
        vehicleStats[b.vehicleId] = { bookings: 0, revenue: 0 };
      }
      vehicleStats[b.vehicleId].bookings += 1;
      vehicleStats[b.vehicleId].revenue += b.totalAmount;
    });

    const popularVehicles = Object.entries(vehicleStats)
      .map(([vehicleId, data]) => {
        const vehicle = veh.find(v => v.id === vehicleId);
        return {
          vehicleId,
          name: vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown',
          bookings: data.bookings,
          revenue: data.revenue,
        };
      })
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);

    // Bookings by status
    const statusCount: Record<string, number> = {};
    book.forEach(b => {
      statusCount[b.status] = (statusCount[b.status] || 0) + 1;
    });
    const bookingsByStatus = Object.entries(statusCount).map(([status, count]) => ({ status, count }));

    // Revenue by month
    const monthData: Record<string, { revenue: number; bookings: number }> = {};
    book.forEach(b => {
      if (b.status === 'cancelled') return;
      const month = new Date(b.createdAt).toLocaleString('default', { month: 'short' });
      if (!monthData[month]) {
        monthData[month] = { revenue: 0, bookings: 0 };
      }
      monthData[month].revenue += b.totalAmount;
      monthData[month].bookings += 1;
    });
    const revenueByMonth = Object.entries(monthData)
      .map(([month, data]) => ({ month, revenue: data.revenue, bookings: data.bookings }))
      .slice(-6);

    // Average rental duration
    const totalDays = book.reduce((sum, b) => sum + b.days, 0);
    const averageRentalDuration = book.length > 0 ? totalDays / book.length : 0;

    // Top customers
    const customerStats: Record<string, { bookings: number; revenue: number }> = {};
    book.forEach(b => {
      if (!customerStats[b.customerId]) {
        customerStats[b.customerId] = { bookings: 0, revenue: 0 };
      }
      customerStats[b.customerId].bookings += 1;
      customerStats[b.customerId].revenue += b.totalAmount;
    });
    const topCustomers = Object.entries(customerStats)
      .map(([customerId, data]) => {
        const customer = customers.find(c => c.id === customerId);
        return {
          customerId,
          name: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown',
          bookings: data.bookings,
          revenue: data.revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setAnalytics({
      totalBookings,
      totalRevenue,
      fleetSize,
      availableVehicles,
      bookedVehicles,
      maintenanceVehicles,
      utilizationRate,
      popularVehicles,
      bookingsByStatus,
      revenueByMonth,
      averageRentalDuration,
      topCustomers,
    });
  }, [customers]);

  // --- Booking Operations ---
  const createBooking = useCallback(() => {
    if (!bookingData.pickupDate || !bookingData.returnDate || !bookingData.customerId || !selectedVehicle) {
      alert('Please fill in all required fields');
      return;
    }

    const customer = customers.find(c => c.id === bookingData.customerId);
    if (!customer) return;

    const days = calculateDays(bookingData.pickupDate, bookingData.returnDate);

    const newBooking: Booking = {
      id: generateId(),
      bookingNumber: generateBookingNumber(),
      vehicleId: selectedVehicle.id,
      vehicleName: `${selectedVehicle.make} ${selectedVehicle.model}`,
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      pickupDate: bookingData.pickupDate,
      returnDate: bookingData.returnDate,
      pickupLocation: selectedVehicle.location,
      returnLocation: selectedVehicle.location,
      days,
      dailyRate: selectedVehicle.dailyRate,
      totalAmount: selectedVehicle.dailyRate * days,
      currency: 'USD',
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'credit_card',
      insuranceType: bookingData.insuranceType,
      additionalDrivers: [],
      notes: bookingData.notes || '',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    setBookings(prev => [...prev, newBooking]);
    
    // Update vehicle status
    setVehicles(prev => prev.map(v =>
      v.id === selectedVehicle.id
        ? { ...v, status: 'booked', updatedAt: getCurrentTimestamp() }
        : v
    ));

    setShowBookingModal(false);
    setBookingData({ pickupDate: '', returnDate: '', customerId: '', insuranceType: 'basic', notes: '' });
    alert(`Booking confirmed! #${newBooking.bookingNumber}`);
    
    // Recalculate analytics
    calculateAnalytics(vehicles, [...bookings, newBooking]);
  }, [bookingData, selectedVehicle, customers, vehicles, bookings, calculateAnalytics]);

  const pickupVehicle = useCallback((bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    setBookings(prev => prev.map(b =>
      b.id === bookingId
        ? { ...b, status: 'picked-up', pickedUpAt: getCurrentTimestamp(), updatedAt: getCurrentTimestamp() }
        : b
    ));

    setVehicles(prev => prev.map(v =>
      v.id === booking.vehicleId
        ? { ...v, status: 'booked', updatedAt: getCurrentTimestamp() }
        : v
    ));

    alert('Vehicle picked up successfully!');
  }, [bookings]);

  const returnVehicle = useCallback((bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    setBookings(prev => prev.map(b =>
      b.id === bookingId
        ? { ...b, status: 'returned', returnedAt: getCurrentTimestamp(), updatedAt: getCurrentTimestamp() }
        : b
    ));

    setVehicles(prev => prev.map(v =>
      v.id === booking.vehicleId
        ? { ...v, status: 'available', updatedAt: getCurrentTimestamp() }
        : v
    ));

    setShowReturnModal(false);
    alert('Vehicle returned successfully!');
    
    // Recalculate analytics
    calculateAnalytics(vehicles, bookings);
  }, [bookings, vehicles, calculateAnalytics]);

  const cancelBooking = useCallback((bookingId: string) => {
    if (!window.confirm('Cancel this booking?')) return;
    
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    setBookings(prev => prev.map(b =>
      b.id === bookingId
        ? { ...b, status: 'cancelled', updatedAt: getCurrentTimestamp() }
        : b
    ));

    setVehicles(prev => prev.map(v =>
      v.id === booking.vehicleId
        ? { ...v, status: 'available', updatedAt: getCurrentTimestamp() }
        : v
    ));

    alert('Booking cancelled');
  }, [bookings]);

  // --- Render Functions ---
  const renderDashboard = () => {
    if (!analytics) return null;

    return (
      <div>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Total Fleet</p>
            <p className="text-2xl font-bold text-blue-600">{analytics.fleetSize}</p>
            <p className="text-xs text-green-600">{analytics.availableVehicles} available</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Bookings</p>
            <p className="text-2xl font-bold text-purple-600">{analytics.totalBookings}</p>
            <p className="text-xs text-gray-500">Avg. {analytics.averageRentalDuration.toFixed(1)} days</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Revenue</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(analytics.totalRevenue)}</p>
            <p className="text-xs text-gray-500">Utilization: {analytics.utilizationRate.toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Maintenance</p>
            <p className="text-2xl font-bold text-yellow-600">{analytics.maintenanceVehicles}</p>
            <p className="text-xs text-gray-500">vehicles in service</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Popular Vehicles */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="font-semibold mb-3">Popular Vehicles</h4>
            <div className="space-y-2">
              {analytics.popularVehicles.map(v => (
                <div key={v.vehicleId} className="flex items-center justify-between border-b pb-2">
                  <span>{v.name}</span>
                  <div className="text-sm">
                    <span className="text-gray-500">{v.bookings} bookings</span>
                    <span className="ml-3 font-bold text-green-600">{formatCurrency(v.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Customers */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="font-semibold mb-3">Top Customers</h4>
            <div className="space-y-2">
              {analytics.topCustomers.map(c => (
                <div key={c.customerId} className="flex items-center justify-between border-b pb-2">
                  <span>{c.name}</span>
                  <div className="text-sm">
                    <span className="text-gray-500">{c.bookings} rentals</span>
                    <span className="ml-3 font-bold text-green-600">{formatCurrency(c.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue by Month */}
          <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
            <h4 className="font-semibold mb-3">Revenue by Month</h4>
            <div className="space-y-2">
              {analytics.revenueByMonth.map(item => (
                <div key={item.month}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.month}</span>
                    <span className="text-gray-500">{item.bookings} bookings - {formatCurrency(item.revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 rounded-full h-2 transition-all"
                      style={{ width: `${(item.revenue / Math.max(...analytics.revenueByMonth.map(m => m.revenue))) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bookings by Status */}
          <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
            <h4 className="font-semibold mb-3">Bookings by Status</h4>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {analytics.bookingsByStatus.map(item => (
                <div key={item.status} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-xs text-gray-500 capitalize">{item.status.replace('-', ' ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderVehicles = () => {
    const filteredVehicles = vehicles.filter(v => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return v.make.toLowerCase().includes(term) ||
               v.model.toLowerCase().includes(term) ||
               v.licensePlate.toLowerCase().includes(term);
      }
      if (filterType !== 'all' && v.type !== filterType) return false;
      if (filterStatus !== 'all' && v.status !== filterStatus) return false;
      if (filterBranch !== 'all' && v.branch !== filterBranch) return false;
      return true;
    });

    const branches = Array.from(new Set(vehicles.map(v => v.branch)));
    const types = Array.from(new Set(vehicles.map(v => v.type)));

    return (
      <div>
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {types.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="maintenance">Maintenance</option>
              <option value="reserved">Reserved</option>
            </select>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Branches</option>
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Vehicle Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map(vehicle => (
            <div key={vehicle.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 relative">
                <img 
                  src={vehicle.images[0]} 
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">
                    {getVehicleTypeEmoji(vehicle.type)} {vehicle.make} {vehicle.model}
                  </h4>
                  <span className="text-sm text-gray-500">{vehicle.year}</span>
                </div>
                <p className="text-sm text-gray-500">{vehicle.color} • {vehicle.licensePlate}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{vehicle.type}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{vehicle.transmission}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{vehicle.fuelType}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{vehicle.seats} seats</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold text-blue-600">{formatCurrency(vehicle.dailyRate)}/day</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setViewMode('vehicle');
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Details
                    </button>
                    {vehicle.status === 'available' && (
                      <button
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setBookingData({ pickupDate: '', returnDate: '', customerId: '', insuranceType: 'basic', notes: '' });
                          setShowBookingModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded transition-colors"
                      >
                        Book
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderVehicleDetail = () => {
    if (!selectedVehicle) return null;

    const vehicleBookings = bookings.filter(b => b.vehicleId === selectedVehicle.id);

    return (
      <div>
        <button
          onClick={() => setViewMode('vehicles')}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Vehicles
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img 
                src={selectedVehicle.images[0]} 
                alt={`${selectedVehicle.make} ${selectedVehicle.model}`}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{selectedVehicle.make} {selectedVehicle.model}</h2>
              <p className="text-gray-500">{selectedVehicle.year} • {selectedVehicle.color} • {selectedVehicle.licensePlate}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(selectedVehicle.status)}`}>
                  {selectedVehicle.status}
                </span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{selectedVehicle.type}</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{selectedVehicle.transmission}</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{selectedVehicle.fuelType}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-500">Daily Rate</p>
                  <p className="font-bold text-blue-600">{formatCurrency(selectedVehicle.dailyRate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Weekly Rate</p>
                  <p className="font-bold">{formatCurrency(selectedVehicle.weeklyRate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Seats</p>
                  <p>{selectedVehicle.seats}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mileage</p>
                  <p>{selectedVehicle.mileage.toLocaleString()} mi</p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium">Features</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedVehicle.features.map(f => (
                    <span key={f} className="text-xs bg-gray-100 px-2 py-0.5 rounded">✓ {f}</span>
                  ))}
                </div>
              </div>

              {selectedVehicle.status === 'available' && (
                <button
                  onClick={() => {
                    setBookingData({ pickupDate: '', returnDate: '', customerId: '', insuranceType: 'basic', notes: '' });
                    setShowBookingModal(true);
                  }}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Book This Vehicle
                </button>
              )}
            </div>
          </div>

          {/* Booking History */}
          <div className="mt-6 border-t pt-6">
            <h4 className="font-semibold mb-3">Booking History</h4>
            {vehicleBookings.length === 0 ? (
              <p className="text-gray-500">No bookings for this vehicle</p>
            ) : (
              <div className="space-y-2">
                {vehicleBookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between border-b pb-2 text-sm">
                    <div>
                      <span className="font-medium">{b.customerName}</span>
                      <span className="text-gray-500 ml-2">{formatDate(b.pickupDate)} - {formatDate(b.returnDate)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{formatCurrency(b.totalAmount)}</span>
                      <span className={`text-xs px-2 py-1 rounded ${getBookingStatusColor(b.status)}`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBookings = () => {
    const userBookings = bookings.filter(b => 
      b.customerEmail === (currentUser?.email || 'guest@example.com')
    );

    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">My Bookings</h2>

        {userBookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500">No bookings yet</p>
            <button
              onClick={() => setViewMode('vehicles')}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Browse Vehicles →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {userBookings.map(booking => (
              <div key={booking.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-wrap items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-lg">{booking.vehicleName}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${getBookingStatusColor(booking.status)}`}>
                        {booking.status.replace('-', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Booking #{booking.bookingNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{formatCurrency(booking.totalAmount)}</p>
                    <p className="text-xs text-gray-500">{booking.days} days</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-sm border-t pt-3">
                  <div>
                    <p className="text-gray-500">Pickup</p>
                    <p className="font-medium">{formatDate(booking.pickupDate)}</p>
                    <p className="text-xs text-gray-500">{booking.pickupLocation}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Return</p>
                    <p className="font-medium">{formatDate(booking.returnDate)}</p>
                    <p className="text-xs text-gray-500">{booking.returnLocation}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => pickupVehicle(booking.id)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Pick Up
                    </button>
                  )}
                  {booking.status === 'picked-up' && (
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowReturnModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Return
                    </button>
                  )}
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => cancelBooking(booking.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderBookingModal = () => {
    if (!showBookingModal || !selectedVehicle) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Book Vehicle</h3>
            <button 
              onClick={() => {
                setShowBookingModal(false);
                setSelectedVehicle(null);
                setBookingData({ pickupDate: '', returnDate: '', customerId: '', insuranceType: 'basic', notes: '' });
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold">{selectedVehicle.make} {selectedVehicle.model}</h4>
            <p className="text-sm text-gray-500">{formatCurrency(selectedVehicle.dailyRate)}/day</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer</label>
              <select
                value={bookingData.customerId}
                onChange={(e) => setBookingData(prev => ({ ...prev, customerId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Pickup Date</label>
                <input
                  type="date"
                  value={bookingData.pickupDate}
                  onChange={(e) => setBookingData(prev => ({ ...prev, pickupDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Return Date</label>
                <input
                  type="date"
                  value={bookingData.returnDate}
                  onChange={(e) => setBookingData(prev => ({ ...prev, returnDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  min={bookingData.pickupDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Insurance Type</label>
              <select
                value={bookingData.insuranceType}
                onChange={(e) => setBookingData(prev => ({ ...prev, insuranceType: e.target.value as Booking['insuranceType'] }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">None</option>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={bookingData.notes}
                onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                placeholder="Special requests?"
              />
            </div>

            {bookingData.pickupDate && bookingData.returnDate && (
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Days</span>
                  <span>{calculateDays(bookingData.pickupDate, bookingData.returnDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Daily Rate</span>
                  <span>{formatCurrency(selectedVehicle.dailyRate)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
                  <span>Total</span>
                  <span className="text-blue-600">
                    {formatCurrency(selectedVehicle.dailyRate * calculateDays(bookingData.pickupDate, bookingData.returnDate))}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={createBooking}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Confirm Booking
            </button>
            <button
              onClick={() => {
                setShowBookingModal(false);
                setSelectedVehicle(null);
                setBookingData({ pickupDate: '', returnDate: '', customerId: '', insuranceType: 'basic', notes: '' });
              }}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderReturnModal = () => {
    if (!showReturnModal || !selectedBooking) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Return Vehicle</h3>
            <button 
              onClick={() => {
                setShowReturnModal(false);
                setSelectedBooking(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{selectedBooking.vehicleName}</p>
              <p className="text-sm text-gray-500">Booking #{selectedBooking.bookingNumber}</p>
              <p className="text-sm text-gray-500">Customer: {selectedBooking.customerName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Return Mileage</label>
              <input
                type="number"
                placeholder="Current mileage"
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fuel Level</label>
              <select className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500">
                <option value="full">Full</option>
                <option value="three-quarters">3/4</option>
                <option value="half">1/2</option>
                <option value="quarter">1/4</option>
                <option value="empty">Empty</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Damage Report</label>
              <textarea
                rows={3}
                placeholder="Any damage or issues?"
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => returnVehicle(selectedBooking.id)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Confirm Return
            </button>
            <button
              onClick={() => {
                setShowReturnModal(false);
                setSelectedBooking(null);
              }}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
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
          <p className="mt-4 text-gray-600">Loading car rental platform...</p>
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
              <span>🚗</span> Car Rental
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                Day 20
              </span>
            </h1>
            <p className="text-gray-600 mt-1">Rent vehicles, manage fleet, and track bookings</p>
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
                onClick={() => setViewMode('vehicles')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'vehicles' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🚗 Vehicles
              </button>
              <button
                onClick={() => setViewMode('bookings')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'bookings' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📋 Bookings
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-4 min-h-[500px]">
          {viewMode === 'dashboard' && renderDashboard()}
          {viewMode === 'vehicles' && renderVehicles()}
          {viewMode === 'vehicle' && renderVehicleDetail()}
          {viewMode === 'bookings' && renderBookings()}
        </div>

        {/* Modals */}
        {renderBookingModal()}
        {renderReturnModal()}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500 border-t pt-6">
          <p>© 2026 Car Rental - Day 20 Complete System</p>
          <p className="mt-1">Vehicles • Bookings • Fleet Management • Customers</p>
          <p className="mt-1 text-gray-400">
            {vehicles.length} vehicles • {bookings.length} bookings • {customers.length} customers
          </p>
        </div>
      </div>
    </div>
  );
}