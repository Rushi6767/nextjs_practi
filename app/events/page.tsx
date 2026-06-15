// app/events/page.tsx
// Complete Event Booking & Ticketing Platform with Seat Selection, Payments & Attendee Management
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// --- TypeScript Interfaces ---
interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar: string;
  venue: Venue;
  startDate: string;
  endDate: string;
  timezone: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  ticketTypes: TicketType[];
  attendeeCount: number;
  capacity: number;
  rating: number;
  reviewCount: number;
  images: string[];
  tags: string[];
  isFeatured: boolean;
  isVirtual: boolean;
  virtualLink?: string;
  createdAt: string;
  updatedAt: string;
  ageRestriction?: number;
  refundPolicy: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  amenities: string[];
  parkingAvailable: boolean;
  accessibility: boolean;
  contactPhone: string;
  contactEmail: string;
}

interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  quantity: number;
  sold: number;
  maxPerOrder: number;
  isEarlyBird: boolean;
  earlyBirdEndDate?: string;
  includes: string[];
  seatSelection: boolean;
  seats?: Seat[];
  availableFrom: string;
  availableUntil: string;
}

interface Seat {
  id: string;
  row: string;
  number: number;
  section: string;
  status: 'available' | 'reserved' | 'booked';
  holdExpiry?: string;
  price: number;
  coordinates?: {
    x: number;
    y: number;
  };
}

interface Booking {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  ticketTypeId: string;
  ticketTypeName: string;
  quantity: number;
  seats: Seat[];
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  paymentMethod: 'credit_card' | 'paypal' | 'bank_transfer' | 'cash';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  bookingReference: string;
  qrCode: string;
  ticketUrl: string;
  createdAt: string;
  updatedAt: string;
  specialRequests?: string;
  checkInStatus: 'not-checked' | 'checked-in' | 'checked-out';
  checkInTime?: string;
}

interface Review {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  helpful: number;
  createdAt: string;
  updatedAt: string;
  verifiedPurchase: boolean;
}

interface Attendee {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  events: {
    eventId: string;
    bookingId: string;
    checkInStatus: 'not-checked' | 'checked-in' | 'checked-out';
    checkedInAt?: string;
  }[];
  totalEvents: number;
  totalSpent: number;
  joinedAt: string;
  lastActive: string;
}

interface EventAnalytics {
  eventId: string;
  totalViews: number;
  totalBookings: number;
  totalRevenue: number;
  averageTicketPrice: number;
  conversionRate: number;
  popularTicketTypes: {
    ticketTypeId: string;
    name: string;
    sold: number;
    revenue: number;
  }[];
  attendeeDemographics: {
    ageGroups: Record<string, number>;
    locations: Record<string, number>;
  };
  dailyBookings: {
    date: string;
    count: number;
    revenue: number;
  }[];
  peakTime: string;
  averageBookingValue: number;
}

interface WaitlistEntry {
  id: string;
  eventId: string;
  userId: string;
  userEmail: string;
  userName: string;
  ticketTypeId: string;
  quantity: number;
  createdAt: string;
  notified: boolean;
  priority: number;
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

const getRandomAvatar = (name: string): string => {
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8', 'F7DC6F'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=128`;
};

const generateBookingReference = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateQRCode = (): string => {
  return `qr_${generateId()}`;
};

const getEventStatusColor = (status: string): string => {
  switch (status) {
    case 'published': return 'bg-green-100 text-green-800';
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    case 'completed': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getBookingStatusColor = (status: string): string => {
  switch (status) {
    case 'confirmed': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    case 'refunded': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// --- Mock Data Generation ---
const generateMockEvents = (organizerId: string, organizerName: string): Event[] => {
  const now = getCurrentTimestamp();
  const events: Event[] = [];

  // Event 1: Tech Conference 2026
  const venue1: Venue = {
    id: generateId(),
    name: 'Convention Center',
    address: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    zipCode: '94105',
    capacity: 500,
    amenities: ['WiFi', 'Projector', 'Sound System', 'Catering'],
    parkingAvailable: true,
    accessibility: true,
    contactPhone: '(555) 123-4567',
    contactEmail: 'venue@convention.com',
  };

  const ticketTypes1: TicketType[] = [
    {
      id: generateId(),
      name: 'Early Bird',
      description: 'Early bird registration - limited availability',
      price: 99.99,
      currency: 'USD',
      quantity: 100,
      sold: 75,
      maxPerOrder: 2,
      isEarlyBird: true,
      earlyBirdEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      includes: ['Full Access', 'Lunch', 'Swag Bag'],
      seatSelection: false,
      availableFrom: now,
      availableUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: generateId(),
      name: 'Standard',
      description: 'Standard conference pass',
      price: 149.99,
      currency: 'USD',
      quantity: 200,
      sold: 120,
      maxPerOrder: 4,
      isEarlyBird: false,
      includes: ['Full Access', 'Lunch'],
      seatSelection: false,
      availableFrom: now,
      availableUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: generateId(),
      name: 'VIP',
      description: 'VIP access with premium benefits',
      price: 299.99,
      currency: 'USD',
      quantity: 50,
      sold: 30,
      maxPerOrder: 2,
      isEarlyBird: false,
      includes: ['Full Access', 'Lunch', 'VIP Lounge', 'Networking Dinner', 'Swag Bag'],
      seatSelection: true,
      seats: Array.from({ length: 50 }, (_, i) => ({
        id: generateId(),
        row: `A${Math.floor(i / 10) + 1}`,
        number: (i % 10) + 1,
        section: 'VIP',
        status: i < 30 ? 'booked' : 'available',
        price: 299.99,
        coordinates: { x: 100 + (i % 10) * 40, y: 100 + Math.floor(i / 10) * 40 },
      })),
      availableFrom: now,
      availableUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const event1: Event = {
    id: generateId(),
    title: 'Tech Conference 2026',
    description: 'The biggest tech conference of the year featuring industry leaders, workshops, and networking opportunities.',
    category: 'Technology',
    organizerId: organizerId,
    organizerName: organizerName,
    organizerAvatar: getRandomAvatar(organizerName),
    venue: venue1,
    startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
    timezone: 'America/Los_Angeles',
    status: 'published',
    ticketTypes: ticketTypes1,
    attendeeCount: 225,
    capacity: 500,
    rating: 4.8,
    reviewCount: 45,
    images: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=400&fit=crop',
    ],
    tags: ['tech', 'conference', 'networking', 'innovation'],
    isFeatured: true,
    isVirtual: false,
    createdAt: now,
    updatedAt: now,
    refundPolicy: 'Full refund up to 7 days before event',
    socialLinks: {
      twitter: 'https://twitter.com/techconf2026',
      website: 'https://techconf2026.com',
    },
  };
  events.push(event1);

  // Event 2: Music Festival
  const venue2: Venue = {
    id: generateId(),
    name: 'Central Park',
    address: '456 Park Ave',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    zipCode: '10001',
    capacity: 2000,
    amenities: ['Stage', 'Sound System', 'Food Trucks', 'Restrooms'],
    parkingAvailable: false,
    accessibility: true,
    contactPhone: '(555) 987-6543',
    contactEmail: 'venue@centralpark.com',
  };

  const ticketTypes2: TicketType[] = [
    {
      id: generateId(),
      name: 'General Admission',
      description: 'GA access to the festival',
      price: 79.99,
      currency: 'USD',
      quantity: 1000,
      sold: 650,
      maxPerOrder: 6,
      isEarlyBird: false,
      includes: ['Festival Access', 'Food Court'],
      seatSelection: false,
      availableFrom: now,
      availableUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: generateId(),
      name: 'VIP Experience',
      description: 'VIP access with premium viewing areas',
      price: 199.99,
      currency: 'USD',
      quantity: 200,
      sold: 80,
      maxPerOrder: 4,
      isEarlyBird: false,
      includes: ['VIP Access', 'Premium Viewing', 'Lounge Access', 'Drinks'],
      seatSelection: false,
      availableFrom: now,
      availableUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const event2: Event = {
    id: generateId(),
    title: 'Summer Music Festival',
    description: 'A weekend of amazing music, food, and fun in the heart of Central Park.',
    category: 'Music',
    organizerId: organizerId,
    organizerName: organizerName,
    organizerAvatar: getRandomAvatar(organizerName),
    venue: venue2,
    startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 62 * 24 * 60 * 60 * 1000).toISOString(),
    timezone: 'America/New_York',
    status: 'published',
    ticketTypes: ticketTypes2,
    attendeeCount: 730,
    capacity: 2000,
    rating: 4.9,
    reviewCount: 120,
    images: [
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=400&fit=crop',
    ],
    tags: ['music', 'festival', 'summer', 'outdoor'],
    isFeatured: true,
    isVirtual: false,
    createdAt: now,
    updatedAt: now,
    refundPolicy: 'No refunds after purchase',
    socialLinks: {
      instagram: 'https://instagram.com/summerfest2026',
      website: 'https://summerfest2026.com',
    },
  };
  events.push(event2);

  // Event 3: Virtual Workshop
  const venue3: Venue = {
    id: generateId(),
    name: 'Virtual Event',
    address: 'Online',
    city: 'Remote',
    state: 'CA',
    country: 'USA',
    zipCode: '94001',
    capacity: 100,
    amenities: ['Zoom', 'Slack', 'Virtual Networking'],
    parkingAvailable: false,
    accessibility: true,
    contactPhone: '(555) 555-5555',
    contactEmail: 'virtual@workshop.com',
  };

  const ticketTypes3: TicketType[] = [
    {
      id: generateId(),
      name: 'Workshop Pass',
      description: 'Full access to the virtual workshop',
      price: 49.99,
      currency: 'USD',
      quantity: 100,
      sold: 45,
      maxPerOrder: 3,
      isEarlyBird: true,
      earlyBirdEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      includes: ['Live Sessions', 'Materials', 'Recording'],
      seatSelection: false,
      availableFrom: now,
      availableUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const event3: Event = {
    id: generateId(),
    title: 'Virtual Workshop: AI Masterclass',
    description: 'Learn AI and machine learning from industry experts in this interactive virtual workshop.',
    category: 'Education',
    organizerId: organizerId,
    organizerName: organizerName,
    organizerAvatar: getRandomAvatar(organizerName),
    venue: venue3,
    startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
    timezone: 'UTC',
    status: 'published',
    ticketTypes: ticketTypes3,
    attendeeCount: 45,
    capacity: 100,
    rating: 4.7,
    reviewCount: 28,
    images: [
      'https://images.unsplash.com/photo-1591115765373-5207764f72e4?w=800&h=400&fit=crop',
    ],
    tags: ['ai', 'machine learning', 'workshop', 'virtual'],
    isFeatured: false,
    isVirtual: true,
    virtualLink: 'https://zoom.us/j/123456789',
    createdAt: now,
    updatedAt: now,
    refundPolicy: 'Full refund up to 24 hours before event',
    socialLinks: {
      website: 'https://aiworkshop.com',
    },
  };
  events.push(event3);

  return events;
};

const generateMockBookings = (events: Event[], userId: string): Booking[] => {
  const bookings: Booking[] = [];
  const user = {
    id: userId,
    name: 'John Doe',
    email: 'john@example.com',
  };

  events.forEach(event => {
    const ticketType = event.ticketTypes[0];
    if (ticketType && Math.random() > 0.5) {
      const booking: Booking = {
        id: generateId(),
        eventId: event.id,
        userId: userId,
        userName: user.name,
        userEmail: user.email,
        ticketTypeId: ticketType.id,
        ticketTypeName: ticketType.name,
        quantity: Math.floor(Math.random() * 3) + 1,
        seats: [],
        totalAmount: ticketType.price * (Math.floor(Math.random() * 3) + 1),
        currency: ticketType.currency || 'USD',
        status: ['confirmed', 'confirmed', 'pending', 'cancelled'][Math.floor(Math.random() * 4)] as Booking['status'],
        paymentMethod: ['credit_card', 'paypal', 'bank_transfer'][Math.floor(Math.random() * 3)] as any,
        paymentStatus: ['paid', 'paid', 'pending'][Math.floor(Math.random() * 3)] as any,
        bookingReference: generateBookingReference(),
        qrCode: generateQRCode(),
        ticketUrl: `/tickets/${generateId()}`,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: getCurrentTimestamp(),
        checkInStatus: ['not-checked', 'checked-in'][Math.floor(Math.random() * 2)] as any,
      };
      bookings.push(booking);
    }
  });

  return bookings;
};

// --- Main Component ---
export default function EventBookingPage() {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI States
  const [viewMode, setViewMode] = useState<'events' | 'event' | 'booking' | 'tickets' | 'analytics' | 'manage'>('events');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Booking States
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'paypal' | 'bank_transfer'>('credit_card');
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingStep, setBookingStep] = useState<'select' | 'review' | 'payment' | 'confirm'>('select');

  // Review States
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [filterPrice, setFilterPrice] = useState('all');

  // Analytics
  const [analytics, setAnalytics] = useState<Record<string, EventAnalytics>>({});

  // --- Effects ---
  useEffect(() => {
    setIsClient(true);

    // Load user
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const authUser = JSON.parse(storedUser);
        setCurrentUser(authUser);

        // Generate mock events
        const userId = authUser.id || 'organizer1';
        const userName = authUser.fullName || authUser.username || 'Event Organizer';
        const mockEvents = generateMockEvents(userId, userName);
        setEvents(mockEvents);
        setSelectedEvent(mockEvents[0]);

        // Generate mock bookings
        const mockBookings = generateMockBookings(mockEvents, userId);
        setBookings(mockBookings);

        // Generate mock attendees
        const mockAttendees: Attendee[] = [
          {
            id: 'attendee1',
            userId: 'user1',
            userName: 'Sarah Johnson',
            userEmail: 'sarah@example.com',
            userAvatar: getRandomAvatar('Sarah Johnson'),
            events: mockEvents.slice(0, 2).map(e => ({
              eventId: e.id,
              bookingId: mockBookings.find(b => b.eventId === e.id)?.id || '',
              checkInStatus: 'not-checked',
            })),
            totalEvents: 2,
            totalSpent: 179.98,
            joinedAt: getCurrentTimestamp(),
            lastActive: getCurrentTimestamp(),
          },
          {
            id: 'attendee2',
            userId: 'user2',
            userName: 'Alex Rivera',
            userEmail: 'alex@example.com',
            userAvatar: getRandomAvatar('Alex Rivera'),
            events: [{ eventId: mockEvents[1].id, bookingId: mockBookings.find(b => b.eventId === mockEvents[1].id)?.id || '', checkInStatus: 'checked-in' }],
            totalEvents: 1,
            totalSpent: 79.99,
            joinedAt: getCurrentTimestamp(),
            lastActive: getCurrentTimestamp(),
          },
        ];
        setAttendees(mockAttendees);

        // Generate analytics
        const mockAnalytics: Record<string, EventAnalytics> = {};
        mockEvents.forEach(event => {
          const eventBookings = mockBookings.filter(b => b.eventId === event.id);
          const totalBookings = eventBookings.length;
          const totalRevenue = eventBookings.reduce((sum, b) => sum + b.totalAmount, 0);
          mockAnalytics[event.id] = {
            eventId: event.id,
            totalViews: Math.floor(Math.random() * 1000) + 100,
            totalBookings,
            totalRevenue,
            averageTicketPrice: totalBookings > 0 ? totalRevenue / totalBookings : 0,
            conversionRate: (totalBookings / (event.attendeeCount + totalBookings)) * 100,
            popularTicketTypes: event.ticketTypes.map(tt => ({
              ticketTypeId: tt.id,
              name: tt.name,
              sold: tt.sold,
              revenue: tt.sold * tt.price,
            })),
            attendeeDemographics: {
              ageGroups: { '18-25': 30, '26-35': 45, '36-50': 20, '50+': 5 },
              locations: { 'San Francisco': 40, 'New York': 30, 'Los Angeles': 20, 'Other': 10 },
            },
            dailyBookings: Array.from({ length: 7 }, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              count: Math.floor(Math.random() * 10),
              revenue: Math.floor(Math.random() * 500),
            })),
            peakTime: '10:00 AM',
            averageBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
          };
        });
        setAnalytics(mockAnalytics);
      } catch (error) {
        console.error('Failed to parse user:', error);
      }
    } else {
      // Guest user
      const mockEvents = generateMockEvents('organizer1', 'Guest Organizer');
      setEvents(mockEvents);
      setSelectedEvent(mockEvents[0]);
    }

    setIsLoading(false);
  }, []);

  // --- Booking Operations ---
  const selectTicketType = useCallback((ticketType: TicketType) => {
    setSelectedTicketType(ticketType);
    setQuantity(1);
    setSelectedSeats([]);
    setBookingStep('select');
    setShowBookingModal(true);
  }, []);

  const toggleSeat = useCallback((seat: Seat) => {
    setSelectedSeats(prev => {
      if (prev.find(s => s.id === seat.id)) {
        return prev.filter(s => s.id !== seat.id);
      } else {
        if (selectedTicketType && selectedSeats.length >= selectedTicketType.maxPerOrder) {
          alert(`Maximum ${selectedTicketType.maxPerOrder} seats per order`);
          return prev;
        }
        return [...prev, seat];
      }
    });
  }, [selectedTicketType, selectedSeats]);

  const calculateTotal = useCallback(() => {
    if (!selectedTicketType) return 0;
    const price = selectedTicketType.price;
    const seatCost = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
    return (price * quantity) + seatCost;
  }, [selectedTicketType, quantity, selectedSeats]);

  const proceedToPayment = useCallback(() => {
    if (selectedTicketType && selectedTicketType.seatSelection && selectedSeats.length !== quantity) {
      alert(`Please select ${quantity} seats`);
      return;
    }
    setBookingStep('payment');
  }, [selectedTicketType, selectedSeats, quantity]);

  const processPayment = useCallback(() => {
    if (!selectedTicketType || !selectedEvent) return;

    // Simulate payment processing
    setTimeout(() => {
      const newBooking: Booking = {
        id: generateId(),
        eventId: selectedEvent.id,
        userId: currentUser?.id || 'guest',
        userName: currentUser?.fullName || 'Guest',
        userEmail: currentUser?.email || 'guest@example.com',
        ticketTypeId: selectedTicketType.id,
        ticketTypeName: selectedTicketType.name,
        quantity: quantity,
        seats: selectedSeats,
        totalAmount: calculateTotal(),
        currency: selectedTicketType.currency || 'USD',
        status: 'confirmed',
        paymentMethod: paymentMethod,
        paymentStatus: 'paid',
        bookingReference: generateBookingReference(),
        qrCode: generateQRCode(),
        ticketUrl: `/tickets/${generateId()}`,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
        specialRequests: specialRequests || undefined,
        checkInStatus: 'not-checked',
      };

      setBookings(prev => [...prev, newBooking]);

      // Update event ticket counts
      setEvents(prev => prev.map(e => {
        if (e.id !== selectedEvent.id) return e;
        return {
          ...e,
          ticketTypes: e.ticketTypes.map(tt => {
            if (tt.id !== selectedTicketType.id) return tt;
            return {
              ...tt,
              sold: tt.sold + quantity,
            };
          }),
          attendeeCount: e.attendeeCount + quantity,
        };
      }));

      setSelectedEvent(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          ticketTypes: prev.ticketTypes.map(tt => {
            if (tt.id !== selectedTicketType.id) return tt;
            return {
              ...tt,
              sold: tt.sold + quantity,
            };
          }),
          attendeeCount: prev.attendeeCount + quantity,
        };
      });

      setBookingStep('confirm');
      alert(`🎉 Booking confirmed! Reference: ${newBooking.bookingReference}`);
    }, 1500);
  }, [selectedTicketType, selectedEvent, quantity, selectedSeats, paymentMethod, specialRequests, currentUser, calculateTotal]);

  const cancelBooking = useCallback((bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      return {
        ...b,
        status: 'cancelled',
        paymentStatus: 'refunded',
        updatedAt: getCurrentTimestamp(),
      };
    }));

    alert('Booking cancelled and refunded');
  }, []);

  // --- Check-in Operations ---
  const checkInAttendee = useCallback((eventId: string, userId: string) => {
    setAttendees(prev => prev.map(a => {
      if (a.userId !== userId) return a;
      return {
        ...a,
        events: a.events.map(e => {
          if (e.eventId !== eventId) return e;
          return {
            ...e,
            checkInStatus: 'checked-in',
            checkedInAt: getCurrentTimestamp(),
          };
        }),
      };
    }));

    setBookings(prev => prev.map(b => {
      if (b.eventId !== eventId || b.userId !== userId) return b;
      return {
        ...b,
        checkInStatus: 'checked-in',
        checkInTime: getCurrentTimestamp(),
      };
    }));

    alert('✅ Check-in successful!');
  }, []);

  // --- Review Operations ---
  const submitReview = useCallback(() => {
    if (!reviewTitle.trim() || !reviewComment.trim()) {
      alert('Please provide both title and comment');
      return;
    }

    const newReview: Review = {
      id: generateId(),
      eventId: selectedEvent?.id || '',
      userId: currentUser?.id || 'guest',
      userName: currentUser?.fullName || 'Guest',
      userAvatar: getRandomAvatar(currentUser?.fullName || 'Guest'),
      rating: reviewRating,
      title: reviewTitle.trim(),
      comment: reviewComment.trim(),
      images: [],
      helpful: 0,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      verifiedPurchase: true,
    };

    // Update event rating
    setEvents(prev => prev.map(e => {
      if (e.id !== selectedEvent?.id) return e;
      const newRating = (e.rating * e.reviewCount + reviewRating) / (e.reviewCount + 1);
      return {
        ...e,
        rating: Math.round(newRating * 10) / 10,
        reviewCount: e.reviewCount + 1,
      };
    }));

    setSelectedEvent(prev => {
      if (!prev) return prev;
      const newRating = (prev.rating * prev.reviewCount + reviewRating) / (prev.reviewCount + 1);
      return {
        ...prev,
        rating: Math.round(newRating * 10) / 10,
        reviewCount: prev.reviewCount + 1,
      };
    });

    setShowReviewModal(false);
    setReviewRating(5);
    setReviewTitle('');
    setReviewComment('');
    alert('Review submitted! Thanks for your feedback.');
  }, [reviewRating, reviewTitle, reviewComment, selectedEvent, currentUser]);

  // --- Render Functions ---
  const renderEventCard = (event: Event) => {
    const isBooked = bookings.some(b => b.eventId === event.id && b.status === 'confirmed');
    const availableTickets = event.ticketTypes.reduce((sum, tt) => sum + (tt.quantity - tt.sold), 0);

    return (
      <div 
        key={event.id} 
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
        onClick={() => {
          setSelectedEvent(event);
          setViewMode('event');
        }}
      >
        <div className="relative h-48 overflow-hidden">
          <img 
            src={event.images[0]} 
            alt={event.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {event.isFeatured && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
              ⭐ Featured
            </div>
          )}
          {event.isVirtual && (
            <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">
              🎥 Virtual
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs px-2 py-1 rounded ${getEventStatusColor(event.status)}`}>
              {event.status}
            </span>
            <span className="text-xs text-gray-500">{formatDate(event.startDate)}</span>
          </div>
          <h3 className="font-semibold text-gray-800 text-lg mb-1">{event.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{event.description}</p>
          <div className="flex items-center gap-2 mb-2">
            <img 
              src={event.organizerAvatar} 
              alt={event.organizerName}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-sm text-gray-600">{event.organizerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span className="text-sm font-medium">{event.rating}</span>
              <span className="text-xs text-gray-400">({event.reviewCount})</span>
            </div>
            <div className="flex items-center gap-2">
              {availableTickets > 0 ? (
                <span className="text-xs text-green-600">{availableTickets} tickets left</span>
              ) : (
                <span className="text-xs text-red-600">Sold out</span>
              )}
              <span className="font-bold text-blue-600">
                {formatCurrency(Math.min(...event.ticketTypes.map(t => t.price)), 'USD')}+
              </span>
            </div>
          </div>
          {isBooked && (
            <div className="mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded inline-block">
              ✓ Booked
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEventDetail = () => {
    if (!selectedEvent) return null;

    const isBooked = bookings.some(b => b.eventId === selectedEvent.id && b.status === 'confirmed');
    const eventBookings = bookings.filter(b => b.eventId === selectedEvent.id);

    return (
      <div>
        <button
          onClick={() => setViewMode('events')}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Events
        </button>

        {/* Event Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="relative h-64 overflow-hidden">
            <img 
              src={selectedEvent.images[0]} 
              alt={selectedEvent.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-1 rounded ${getEventStatusColor(selectedEvent.status)}`}>
                  {selectedEvent.status}
                </span>
                {selectedEvent.isFeatured && (
                  <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">Featured</span>
                )}
                {selectedEvent.isVirtual && (
                  <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded">Virtual Event</span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white">{selectedEvent.title}</h1>
              <div className="flex items-center gap-4 text-white/90 text-sm mt-2">
                <span>📅 {formatDateTime(selectedEvent.startDate)}</span>
                <span>📍 {selectedEvent.venue.city}, {selectedEvent.venue.state}</span>
                <span>👥 {selectedEvent.attendeeCount} attendees</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-3">About This Event</h3>
              <p className="text-gray-600">{selectedEvent.description}</p>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Organizer</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <img 
                      src={selectedEvent.organizerAvatar} 
                      alt={selectedEvent.organizerName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span>{selectedEvent.organizerName}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Venue</h4>
                  <p className="text-sm">{selectedEvent.venue.name}</p>
                  <p className="text-sm text-gray-500">{selectedEvent.venue.address}</p>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium text-sm text-gray-700">Tags</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedEvent.tags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Ticket Types */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-3">Tickets</h3>
              <div className="space-y-3">
                {selectedEvent.ticketTypes.map(ticketType => {
                  const available = ticketType.quantity - ticketType.sold;
                  return (
                    <div key={ticketType.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{ticketType.name}</h4>
                            {ticketType.isEarlyBird && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                Early Bird
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{ticketType.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span>{available} available</span>
                            {ticketType.maxPerOrder > 0 && (
                              <span>Max {ticketType.maxPerOrder} per order</span>
                            )}
                          </div>
                          {ticketType.includes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {ticketType.includes.map(item => (
                                <span key={item} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                  ✓ {item}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-blue-600">
                            {formatCurrency(ticketType.price, ticketType.currency)}
                          </p>
                          {isBooked ? (
                            <span className="text-xs text-green-600">Already booked</span>
                          ) : available > 0 ? (
                            <button
                              onClick={() => selectTicketType(ticketType)}
                              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-1 px-4 rounded transition-colors"
                            >
                              Book Now
                            </button>
                          ) : (
                            <span className="text-xs text-red-600">Sold out</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Reviews</h3>
                {isBooked && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Write a Review
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="border-b pb-3 last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                          U
                        </div>
                        <div>
                          <p className="font-medium">User {i + 1}</p>
                          <div className="text-yellow-400 text-sm">
                            {'★'.repeat(5 - i)}{'☆'.repeat(i)}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">2 days ago</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Great event! Really enjoyed it.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-3">Event Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span>{formatDate(selectedEvent.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time</span>
                  <span>{formatDateTime(selectedEvent.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span>{Math.round((new Date(selectedEvent.endDate).getTime() - new Date(selectedEvent.startDate).getTime()) / (1000 * 60 * 60))} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Category</span>
                  <span>{selectedEvent.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Capacity</span>
                  <span>{selectedEvent.attendeeCount}/{selectedEvent.capacity}</span>
                </div>
                {selectedEvent.ageRestriction && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Age Restriction</span>
                    <span>18+</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-3">Venue Information</h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{selectedEvent.venue.name}</p>
                <p className="text-gray-500">{selectedEvent.venue.address}</p>
                <p className="text-gray-500">{selectedEvent.venue.city}, {selectedEvent.venue.state} {selectedEvent.venue.zipCode}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedEvent.venue.amenities.map(amenity => (
                    <span key={amenity} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {amenity}
                    </span>
                  ))}
                </div>
                {selectedEvent.venue.parkingAvailable && (
                  <p className="text-xs text-green-600">✓ Parking available</p>
                )}
                {selectedEvent.venue.accessibility && (
                  <p className="text-xs text-blue-600">♿ Wheelchair accessible</p>
                )}
              </div>
            </div>

            {selectedEvent.socialLinks.website && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-lg mb-3">Links</h3>
                <div className="space-y-1">
                  {selectedEvent.socialLinks.website && (
                    <a href={selectedEvent.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm block">
                      🌐 Website
                    </a>
                  )}
                  {selectedEvent.socialLinks.twitter && (
                    <a href={selectedEvent.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 text-sm block">
                      🐦 Twitter
                    </a>
                  )}
                  {selectedEvent.socialLinks.instagram && (
                    <a href={selectedEvent.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-600 text-sm block">
                      📸 Instagram
                    </a>
                  )}
                  {selectedEvent.socialLinks.facebook && (
                    <a href={selectedEvent.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900 text-sm block">
                      📘 Facebook
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBookingModal = () => {
    if (!showBookingModal || !selectedTicketType || !selectedEvent) return null;

    const total = calculateTotal();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Book Tickets</h3>
            <button 
              onClick={() => {
                setShowBookingModal(false);
                setSelectedTicketType(null);
                setSelectedSeats([]);
                setQuantity(1);
                setBookingStep('select');
                setSpecialRequests('');
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {bookingStep === 'select' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">{selectedTicketType.name}</h4>
                <p className="text-sm text-gray-500">{selectedTicketType.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full font-bold"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedTicketType.maxPerOrder || 10, quantity + 1))}
                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full font-bold"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500">
                    ({selectedTicketType.quantity - selectedTicketType.sold} available)
                  </span>
                </div>
              </div>

              {selectedTicketType.seatSelection && selectedTicketType.seats && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Seats ({quantity} seats)</label>
                  <div className="grid grid-cols-5 gap-2 p-4 bg-gray-50 rounded-lg">
                    {selectedTicketType.seats.map(seat => (
                      <button
                        key={seat.id}
                        onClick={() => toggleSeat(seat)}
                        disabled={seat.status !== 'available'}
                        className={`p-2 rounded text-sm font-medium transition-colors ${
                          seat.status === 'available' && selectedSeats.find(s => s.id === seat.id)
                            ? 'bg-blue-600 text-white'
                            : seat.status === 'available'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {seat.row}{seat.number}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special requests or accommodations?"
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(total, selectedTicketType.currency)}</span>
                </div>
              </div>

              <button
                onClick={proceedToPayment}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Proceed to Payment
              </button>
            </div>
          )}

          {bookingStep === 'payment' && (
            <div className="space-y-4">
              <h4 className="font-semibold">Payment Details</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Event</span>
                  <span className="font-medium">{selectedEvent.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ticket</span>
                  <span className="font-medium">{selectedTicketType.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity</span>
                  <span className="font-medium">{quantity}</span>
                </div>
                {selectedSeats.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seats</span>
                    <span className="font-medium">{selectedSeats.map(s => `${s.row}${s.number}`).join(', ')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(total, selectedTicketType.currency)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <div className="flex gap-3">
                  {['credit_card', 'paypal', 'bank_transfer'].map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method as any)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        paymentMethod === method
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {method === 'credit_card' && '💳 Credit Card'}
                      {method === 'paypal' && '🟦 PayPal'}
                      {method === 'bank_transfer' && '🏦 Bank Transfer'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setBookingStep('select')}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={processPayment}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Pay Now
                </button>
              </div>
            </div>
          )}

          {bookingStep === 'confirm' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h4 className="text-2xl font-bold mb-2">Booking Confirmed!</h4>
              <p className="text-gray-600">Your tickets have been booked successfully.</p>
              <p className="text-sm text-gray-500 mt-2">Reference: {bookings[bookings.length - 1]?.bookingReference}</p>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedTicketType(null);
                  setSelectedSeats([]);
                  setQuantity(1);
                  setBookingStep('select');
                  setSpecialRequests('');
                  setViewMode('tickets');
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                View My Tickets
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTicketsView = () => {
    const userBookings = bookings.filter(b => b.userId === (currentUser?.id || 'guest'));

    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">My Tickets</h2>
        {userBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <p className="text-gray-500">You don't have any tickets yet</p>
            <button
              onClick={() => setViewMode('events')}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Browse Events →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userBookings.map(booking => {
              const event = events.find(e => e.id === booking.eventId);
              if (!event) return null;

              return (
                <div key={booking.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{event.title}</span>
                      <span className={`text-xs px-2 py-1 rounded ${getBookingStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm text-gray-500">Ticket Type</p>
                        <p className="font-medium">{booking.ticketTypeName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Quantity</p>
                        <p className="font-medium">{booking.quantity}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="text-sm">{formatDate(event.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="font-bold text-blue-600">{formatCurrency(booking.totalAmount, booking.currency)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Reference</p>
                        <p className="text-xs font-mono">{booking.bookingReference}</p>
                      </div>
                      <div className="flex gap-2">
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => cancelBooking(booking.id)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => {
                            // Show ticket QR code
                            alert(`QR Code: ${booking.qrCode}`);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View QR
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderAnalyticsView = () => {
    if (!selectedEvent) return null;

    const eventAnalytics = analytics[selectedEvent.id];
    if (!eventAnalytics) return null;

    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Event Analytics</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Views</p>
            <p className="text-2xl font-bold text-blue-600">{eventAnalytics.totalViews}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Bookings</p>
            <p className="text-2xl font-bold text-green-600">{eventAnalytics.totalBookings}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Revenue</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(eventAnalytics.totalRevenue)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-xs text-gray-500">Conversion Rate</p>
            <p className="text-2xl font-bold text-orange-600">{eventAnalytics.conversionRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="font-semibold mb-3">Ticket Sales</h4>
            <div className="space-y-2">
              {eventAnalytics.popularTicketTypes.map(tt => (
                <div key={tt.ticketTypeId}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{tt.name}</span>
                    <span>{tt.sold} sold - {formatCurrency(tt.revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 rounded-full h-2 transition-all"
                      style={{ width: `${(tt.sold / Math.max(...eventAnalytics.popularTicketTypes.map(t => t.sold))) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="font-semibold mb-3">Daily Bookings</h4>
            <div className="space-y-2">
              {eventAnalytics.dailyBookings.slice(0, 7).map(day => (
                <div key={day.date}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{formatDate(day.date)}</span>
                    <span>{day.count} bookings - {formatCurrency(day.revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 rounded-full h-2 transition-all"
                      style={{ width: `${(day.count / Math.max(...eventAnalytics.dailyBookings.map(d => d.count))) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="font-semibold mb-3">Attendee Demographics</h4>
            <div className="space-y-2">
              <p className="text-sm font-medium">Age Groups</p>
              {Object.entries(eventAnalytics.attendeeDemographics.ageGroups).map(([group, count]) => (
                <div key={group}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{group}</span>
                    <span>{count}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 rounded-full h-2 transition-all"
                      style={{ width: `${count}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="font-semibold mb-3">Key Metrics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Average Ticket Price</span>
                <span className="font-medium">{formatCurrency(eventAnalytics.averageTicketPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Average Booking Value</span>
                <span className="font-medium">{formatCurrency(eventAnalytics.averageBookingValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Peak Time</span>
                <span className="font-medium">{eventAnalytics.peakTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Attendees</span>
                <span className="font-medium">{selectedEvent.attendeeCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderManageView = () => {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Manage Events</h2>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Your Events</h3>
            <button
              onClick={() => alert('Create new event form')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              + Create Event
            </button>
          </div>

          <div className="space-y-2">
            {events.map(event => (
              <div key={event.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-gray-500">
                    {event.attendeeCount} attendees • {formatDate(event.startDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${getEventStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedEvent(event);
                      setViewMode('analytics');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => {
                      setSelectedEvent(event);
                      setViewMode('event');
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="font-semibold mb-4">Attendees</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Events</th>
                  <th className="px-4 py-2 text-left">Check-in Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendees.map(attendee => (
                  <tr key={attendee.id}>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <img 
                          src={attendee.userAvatar} 
                          alt={attendee.userName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        {attendee.userName}
                      </div>
                    </td>
                    <td className="px-4 py-2">{attendee.userEmail}</td>
                    <td className="px-4 py-2">{attendee.totalEvents}</td>
                    <td className="px-4 py-2">
                      {attendee.events.map(e => (
                        <span key={e.eventId} className={`text-xs px-2 py-1 rounded ${
                          e.checkInStatus === 'checked-in' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {e.checkInStatus}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-2">
                      {attendee.events.some(e => e.checkInStatus === 'not-checked') && (
                        <button
                          onClick={() => {
                            const event = attendee.events.find(e => e.checkInStatus === 'not-checked');
                            if (event) {
                              checkInAttendee(event.eventId, attendee.userId);
                            }
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Check In
                        </button>
                      )}
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
          <p className="mt-4 text-gray-600">Loading event platform...</p>
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
              <span>🎫</span> Event Booking
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                Day 13
              </span>
            </h1>
            <p className="text-gray-600 mt-1">Discover, book, and attend amazing events</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm p-1">
              <button
                onClick={() => setViewMode('events')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'events' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📅 Events
              </button>
              <button
                onClick={() => setViewMode('tickets')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'tickets' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🎫 Tickets
              </button>
              <button
                onClick={() => setViewMode('manage')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'manage' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ⚙️ Manage
              </button>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        {viewMode === 'events' && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search events..."
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
                <option value="Technology">Technology</option>
                <option value="Music">Music</option>
                <option value="Education">Education</option>
                <option value="Business">Business</option>
                <option value="Sports">Sports</option>
              </select>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Any Date</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <select
                value={filterPrice}
                onChange={(e) => setFilterPrice(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Any Price</option>
                <option value="free">Free</option>
                <option value="under50">Under $50</option>
                <option value="under100">Under $100</option>
              </select>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-4 min-h-[500px]">
          {viewMode === 'events' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events
                .filter(e => {
                  if (searchTerm) {
                    return e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           e.description.toLowerCase().includes(searchTerm.toLowerCase());
                  }
                  return true;
                })
                .filter(e => filterCategory === 'all' || e.category === filterCategory)
                .map(renderEventCard)}
            </div>
          )}
          {viewMode === 'event' && renderEventDetail()}
          {viewMode === 'tickets' && renderTicketsView()}
          {viewMode === 'analytics' && renderAnalyticsView()}
          {viewMode === 'manage' && renderManageView()}
        </div>

        {/* Modals */}
        {renderBookingModal()}

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Write a Review</h3>
                <button 
                  onClick={() => {
                    setShowReviewModal(false);
                    setReviewRating(5);
                    setReviewTitle('');
                    setReviewComment('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setReviewRating(rating)}
                        className={`text-3xl transition-colors ${
                          rating <= reviewRating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Review title"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={submitReview}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors"
                >
                  Submit Review
                </button>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setReviewRating(5);
                    setReviewTitle('');
                    setReviewComment('');
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500 border-t pt-6">
          <p>© 2026 Event Booking Platform - Day 13 Complete System</p>
          <p className="mt-1">Events • Tickets • Payments • Check-in • Analytics</p>
          <p className="mt-1 text-gray-400">
            {events.length} events • {bookings.length} bookings • {attendees.length} attendees
          </p>
        </div>
      </div>
    </div>
  );
}