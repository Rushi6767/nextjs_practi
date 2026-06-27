// app/hotels/page.tsx
// Complete Hotel Booking System with Properties, Rooms, Availability, Reservations & Guest Management
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// --- TypeScript Interfaces ---
interface Hotel {
  id: string;
  name: string;
  description: string;
  type: 'hotel' | 'resort' | 'motel' | 'hostel' | 'villa' | 'apartment';
  rating: number;
  reviewCount: number;
  address: Address;
  phone: string;
  email: string;
  website?: string;
  images: string[];
  amenities: string[];
  policies: string[];
  checkInTime: string;
  checkOutTime: string;
  starRating: number;
  rooms: Room[];
  reviews: Review[];
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
  latitude?: number;
  longitude?: number;
}

interface Room {
  id: string;
  type: 'standard' | 'deluxe' | 'suite' | 'family' | 'presidential' | 'dormitory';
  name: string;
  description: string;
  capacity: number;
  beds: number;
  bedType: string;
  size: number; // in sq ft
  pricePerNight: number;
  currency: string;
  amenities: string[];
  images: string[];
  available: boolean;
  totalRooms: number;
  bookedRooms: number;
  floor: number;
  view: 'city' | 'garden' | 'pool' | 'ocean' | 'mountain' | 'none';
  smokingAllowed: boolean;
  petFriendly: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Reservation {
  id: string;
  reservationNumber: string;
  hotelId: string;
  hotelName: string;
  roomId: string;
  roomType: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled' | 'no-show';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  paymentMethod: 'credit_card' | 'cash' | 'online' | 'bank_transfer';
  specialRequests: string;
  totalPaid: number;
  createdAt: string;
  updatedAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
}

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  idNumber: string;
  address: Address;
  preferences: string[];
  pastStays: string[];
  loyaltyPoints: number;
  membershipLevel: 'basic' | 'silver' | 'gold' | 'platinum' | 'diamond';
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface Review {
  id: string;
  hotelId: string;
  guestId: string;
  guestName: string;
  rating: number;
  title: string;
  comment: string;
  cleanliness: number;
  service: number;
  value: number;
  location: number;
  facilities: number;
  helpful: number;
  createdAt: string;
  updatedAt: string;
  verifiedStay: boolean;
}

interface AvailabilityCalendar {
  roomId: string;
  date: string;
  available: boolean;
  price: number;
  bookedCount: number;
}

interface HotelAnalytics {
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  averageDailyRate: number;
  revenuePerAvailableRoom: number;
  popularRooms: {
    roomId: string;
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
  guestDemographics: {
    nationality: string;
    count: number;
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

const generateReservationNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RES${year}${month}${day}-${random}`;
};

const calculateNights = (checkIn: string, checkOut: string): number => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getRoomTypeEmoji = (type: string): string => {
  const map: Record<string, string> = {
    'standard': '🛏️',
    'deluxe': '🌟',
    'suite': '🛋️',
    'family': '👨‍👩‍👧‍👦',
    'presidential': '👑',
    'dormitory': '🏠',
  };
  return map[type] || '🛏️';
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-700',
    'confirmed': 'bg-blue-100 text-blue-700',
    'checked-in': 'bg-green-100 text-green-700',
    'checked-out': 'bg-gray-100 text-gray-700',
    'cancelled': 'bg-red-100 text-red-700',
    'no-show': 'bg-orange-100 text-orange-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

// Placeholder image URLs
const hotelImages = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1535827841776-24afc1e255ac?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=300&fit=crop',
];

const roomImages = [
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&h=300&fit=crop',
];

// --- Mock Data Generation ---
const generateMockHotels = (): Hotel[] => {
  const hotels: Hotel[] = [];

  const hotelNames = [
    'Grand Plaza Hotel', 'Ocean View Resort', 'City Central Inn', 
    'Mountain Retreat', 'Royal Palace Hotel', 'Sunset Paradise'
  ];

  const hotelTypes: Hotel['type'][] = ['hotel', 'resort', 'hotel', 'resort', 'hotel', 'villa'];
  const cities = ['New York', 'Miami', 'Los Angeles', 'Denver', 'Las Vegas', 'San Diego'];
  const roomTypes: Room['type'][] = ['standard', 'deluxe', 'suite', 'family', 'presidential'];
  const bedTypes = ['Queen', 'King', 'Double', 'Twin'];

  for (let h = 0; h < 6; h++) {
    const rooms: Room[] = [];
    const numRooms = 3 + Math.floor(Math.random() * 3);

    for (let r = 0; r < numRooms; r++) {
      const roomType = roomTypes[r % roomTypes.length];
      const basePrice = 120 + Math.floor(Math.random() * 200);
      
      rooms.push({
        id: generateId(),
        type: roomType,
        name: `${roomType.charAt(0).toUpperCase() + roomType.slice(1)} Room`,
        description: `Beautiful ${roomType} room with great amenities`,
        capacity: 2 + Math.floor(Math.random() * 3),
        beds: 1 + Math.floor(Math.random() * 2),
        bedType: bedTypes[Math.floor(Math.random() * bedTypes.length)],
        size: 200 + Math.floor(Math.random() * 300),
        pricePerNight: basePrice,
        currency: 'USD',
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Safe'].slice(0, 3 + Math.floor(Math.random() * 2)),
        images: [roomImages[Math.floor(Math.random() * roomImages.length)]],
        available: true,
        totalRooms: 10 + Math.floor(Math.random() * 20),
        bookedRooms: Math.floor(Math.random() * 5),
        floor: Math.floor(Math.random() * 8) + 1,
        view: ['city', 'garden', 'pool', 'ocean', 'mountain'][Math.floor(Math.random() * 5)] as any,
        smokingAllowed: Math.random() > 0.7,
        petFriendly: Math.random() > 0.6,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
      });
    }

    const starRating = 3 + Math.floor(Math.random() * 3);
    
    hotels.push({
      id: generateId(),
      name: hotelNames[h],
      description: `Experience luxury and comfort at ${hotelNames[h]}. Perfect for business or leisure travelers.`,
      type: hotelTypes[h],
      rating: Math.round((3 + Math.random() * 2) * 10) / 10,
      reviewCount: Math.floor(Math.random() * 500) + 50,
      address: {
        street: `${h + 100} Hotel Blvd`,
        city: cities[h],
        state: ['NY', 'FL', 'CA', 'CO', 'NV', 'CA'][h],
        country: 'USA',
        zipCode: String(10000 + h * 100),
      },
      phone: `(555) ${String(100 + h).padStart(3, '0')}-${String(1000 + h * 2).padStart(4, '0')}`,
      email: `info@${hotelNames[h].toLowerCase().replace(/\s/g, '')}.com`,
      images: [hotelImages[h % hotelImages.length]],
      amenities: ['Free WiFi', 'Parking', 'Restaurant', 'Pool', 'Gym', 'Spa'].slice(0, 4 + Math.floor(Math.random() * 2)),
      policies: ['Check-in: 3:00 PM', 'Check-out: 11:00 AM', 'No smoking', 'Pet friendly'],
      checkInTime: '15:00',
      checkOutTime: '11:00',
      starRating,
      rooms,
      reviews: [],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isActive: true,
    });
  }

  return hotels;
};

const generateMockGuests = (): Guest[] => {
  const firstNames = ['John', 'Mary', 'James', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const nationalities = ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'Brazil'];
  const membershipLevels: Guest['membershipLevel'][] = ['basic', 'silver', 'gold', 'platinum', 'diamond'];
  const guests: Guest[] = [];

  for (let i = 0; i < 15; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    
    guests.push({
      id: generateId(),
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      phone: `(555) ${String(200 + i).padStart(3, '0')}-${String(2000 + i * 3).padStart(4, '0')}`,
      dateOfBirth: `198${i % 3 + 5}-${String(1 + i % 12).padStart(2, '0')}-${String(1 + i % 28).padStart(2, '0')}`,
      nationality: nationalities[i % nationalities.length],
      idNumber: `ID${String(10000 + i).padStart(5, '0')}`,
      address: {
        street: `${i + 200} Guest St`,
        city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][i % 5],
        state: ['NY', 'CA', 'IL', 'TX', 'AZ'][i % 5],
        country: 'USA',
        zipCode: String(20000 + i * 100),
      },
      preferences: ['Non-smoking', 'High floor', 'Ocean view'].slice(0, Math.floor(Math.random() * 2) + 1),
      pastStays: [],
      loyaltyPoints: Math.floor(Math.random() * 1000),
      membershipLevel: membershipLevels[i % membershipLevels.length],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isActive: true,
    });
  }

  return guests;
};

const generateMockReservations = (hotels: Hotel[], guests: Guest[]): Reservation[] => {
  const reservations: Reservation[] = [];
  const statuses: Reservation['status'][] = ['confirmed', 'checked-in', 'checked-out', 'pending', 'cancelled'];
  const now = new Date();

  for (let i = 0; i < 20; i++) {
    const hotel = hotels[i % hotels.length];
    const room = hotel.rooms[i % hotel.rooms.length];
    const guest = guests[i % guests.length];
    
    const checkIn = new Date(now);
    checkIn.setDate(checkIn.getDate() + Math.floor(Math.random() * 30) - 10);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 5) + 1);
    const nights = calculateNights(checkIn.toISOString().split('T')[0], checkOut.toISOString().split('T')[0]);
    const totalPrice = room.pricePerNight * nights;

    reservations.push({
      id: generateId(),
      reservationNumber: generateReservationNumber(),
      hotelId: hotel.id,
      hotelName: hotel.name,
      roomId: room.id,
      roomType: room.type,
      guestId: guest.id,
      guestName: `${guest.firstName} ${guest.lastName}`,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      checkIn: checkIn.toISOString().split('T')[0],
      checkOut: checkOut.toISOString().split('T')[0],
      nights,
      guests: Math.floor(Math.random() * 2) + 1,
      totalPrice,
      currency: 'USD',
      status: statuses[i % statuses.length],
      paymentStatus: 'paid',
      paymentMethod: ['credit_card', 'online', 'cash'][i % 3] as any,
      specialRequests: 'No special requests',
      totalPaid: totalPrice,
      createdAt: checkIn.toISOString(),
      updatedAt: checkIn.toISOString(),
    });
  }

  return reservations;
};

// --- Main Component ---
export default function HotelBookingPage() {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI States
  const [viewMode, setViewMode] = useState<'hotels' | 'hotel' | 'rooms' | 'reservations' | 'checkin'>('hotels');
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  
  // Modal States
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);

  // Booking States
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    specialRequests: '',
    guestId: '',
  });

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [filterStars, setFilterStars] = useState('all');
  const [filterPrice, setFilterPrice] = useState('all');

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
    const mockHotels = generateMockHotels();
    setHotels(mockHotels);
    setSelectedHotel(mockHotels[0]);

    const mockGuests = generateMockGuests();
    setGuests(mockGuests);

    const mockReservations = generateMockReservations(mockHotels, mockGuests);
    setReservations(mockReservations);

    setIsLoading(false);
  }, []);

  // --- Booking Operations ---
  const createBooking = useCallback(() => {
    if (!bookingData.checkIn || !bookingData.checkOut || !selectedRoom || !selectedHotel) {
      alert('Please fill in all required fields');
      return;
    }

    const guest = guests.find(g => g.id === bookingData.guestId) || guests[0];
    const nights = calculateNights(bookingData.checkIn, bookingData.checkOut);
    const totalPrice = selectedRoom.pricePerNight * nights;

    const newReservation: Reservation = {
      id: generateId(),
      reservationNumber: generateReservationNumber(),
      hotelId: selectedHotel.id,
      hotelName: selectedHotel.name,
      roomId: selectedRoom.id,
      roomType: selectedRoom.type,
      guestId: guest.id,
      guestName: `${guest.firstName} ${guest.lastName}`,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      nights,
      guests: bookingData.guests,
      totalPrice,
      currency: 'USD',
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'credit_card',
      specialRequests: bookingData.specialRequests || '',
      totalPaid: totalPrice,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    setReservations(prev => [...prev, newReservation]);
    
    // Update room availability
    setHotels(prev => prev.map(h => {
      if (h.id !== selectedHotel.id) return h;
      return {
        ...h,
        rooms: h.rooms.map(r => {
          if (r.id !== selectedRoom.id) return r;
          return {
            ...r,
            bookedRooms: r.bookedRooms + 1,
            available: r.bookedRooms + 1 < r.totalRooms,
          };
        }),
      };
    }));

    setShowBookingModal(false);
    setBookingData({ checkIn: '', checkOut: '', guests: 1, specialRequests: '', guestId: '' });
    alert(`Booking confirmed! Reservation #${newReservation.reservationNumber}`);
  }, [bookingData, selectedRoom, selectedHotel, guests]);

  const checkInGuest = useCallback((reservationId: string) => {
    setReservations(prev => prev.map(r =>
      r.id === reservationId 
        ? { ...r, status: 'checked-in', checkedInAt: getCurrentTimestamp(), updatedAt: getCurrentTimestamp() }
        : r
    ));
    alert('Guest checked in successfully!');
  }, []);

  const checkOutGuest = useCallback((reservationId: string) => {
    setReservations(prev => prev.map(r =>
      r.id === reservationId 
        ? { ...r, status: 'checked-out', checkedOutAt: getCurrentTimestamp(), updatedAt: getCurrentTimestamp() }
        : r
    ));
    alert('Guest checked out successfully!');
  }, []);

  const cancelReservation = useCallback((reservationId: string) => {
    if (!window.confirm('Cancel this reservation?')) return;
    setReservations(prev => prev.map(r =>
      r.id === reservationId 
        ? { ...r, status: 'cancelled', updatedAt: getCurrentTimestamp() }
        : r
    ));
  }, []);

  // --- Render Functions ---
  const renderHotels = () => {
    const filteredHotels = hotels.filter(h => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return h.name.toLowerCase().includes(term) ||
               h.address.city.toLowerCase().includes(term);
      }
      if (filterCity !== 'all' && h.address.city !== filterCity) return false;
      if (filterStars !== 'all' && h.starRating !== parseInt(filterStars)) return false;
      if (filterPrice !== 'all') {
        const avgPrice = h.rooms.reduce((sum, r) => sum + r.pricePerNight, 0) / h.rooms.length;
        if (filterPrice === '$' && avgPrice > 150) return false;
        if (filterPrice === '$$' && (avgPrice <= 150 || avgPrice > 300)) return false;
        if (filterPrice === '$$$' && avgPrice <= 300) return false;
      }
      return true;
    });

    const cities = Array.from(new Set(hotels.map(h => h.address.city)));

    return (
      <div>
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search hotels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Cities</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={filterStars}
              onChange={(e) => setFilterStars(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Stars</option>
              {[3, 4, 5].map(s => (
                <option key={s} value={s}>{s}★</option>
              ))}
            </select>
            <select
              value={filterPrice}
              onChange={(e) => setFilterPrice(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Prices</option>
              <option value="$">$ (Under $150)</option>
              <option value="$$">$$ ($150-$300)</option>
              <option value="$$$">$$$ ($300+)</option>
            </select>
          </div>
        </div>

        {/* Hotel Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHotels.map(hotel => (
            <div 
              key={hotel.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedHotel(hotel);
                setViewMode('hotel');
              }}
            >
              <div className="h-48 relative">
                <img 
                  src={hotel.images[0]} 
                  alt={hotel.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {hotel.starRating}★
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-lg">{hotel.name}</h4>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="font-medium">{hotel.rating}</span>
                    <span className="text-xs text-gray-400">({hotel.reviewCount})</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{hotel.address.city}, {hotel.address.state}</p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{hotel.description}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <span>{hotel.type}</span>
                  <span>•</span>
                  <span>{hotel.rooms.length} rooms</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {hotel.amenities.slice(0, 3).map(a => (
                    <span key={a} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{a}</span>
                  ))}
                  {hotel.amenities.length > 3 && (
                    <span className="text-xs text-gray-400">+{hotel.amenities.length - 3}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold text-blue-600">
                    {formatCurrency(Math.min(...hotel.rooms.map(r => r.pricePerNight)))}/night
                  </span>
                  <span className="text-sm text-gray-500">⬆️ {hotel.rooms.length} rooms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHotelDetail = () => {
    if (!selectedHotel) return null;

    return (
      <div>
        <button
          onClick={() => setViewMode('hotels')}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Hotels
        </button>

        {/* Hotel Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="h-64 relative">
            <img 
              src={selectedHotel.images[0]} 
              alt={selectedHotel.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedHotel.name}</h2>
                  <p className="text-white/90">{selectedHotel.address.city}, {selectedHotel.address.state}</p>
                </div>
                <div className="text-white text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span>{selectedHotel.rating}</span>
                    <span className="text-white/70">({selectedHotel.reviewCount})</span>
                  </div>
                  <div className="text-sm text-white/70">{selectedHotel.starRating}★ Hotel</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="font-semibold text-lg mb-3">About</h3>
              <p className="text-gray-600">{selectedHotel.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Check-in</h4>
                  <p className="text-sm">{selectedHotel.checkInTime}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700">Check-out</h4>
                  <p className="text-sm">{selectedHotel.checkOutTime}</p>
                </div>
              </div>
            </div>

            {/* Rooms */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-3">Rooms</h3>
              <div className="space-y-4">
                {selectedHotel.rooms.map(room => (
                  <div key={room.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row gap-4">
                      <img 
                        src={room.images[0]} 
                        alt={room.name}
                        className="w-full md:w-40 h-32 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{getRoomTypeEmoji(room.type)} {room.name}</h4>
                            <p className="text-sm text-gray-500">{room.description}</p>
                          </div>
                          <span className="font-bold text-blue-600">{formatCurrency(room.pricePerNight)}/night</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-500">
                          <span>👤 {room.capacity} guests</span>
                          <span>•</span>
                          <span>🛏️ {room.beds} {room.bedType}</span>
                          <span>•</span>
                          <span>📐 {room.size} sq ft</span>
                          <span>•</span>
                          <span>📶 {room.amenities.slice(0, 3).join(', ')}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            room.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {room.available ? `${room.totalRooms - room.bookedRooms} available` : 'Sold out'}
                          </span>
                          {room.view !== 'none' && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {room.view} view
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedRoom(room);
                            setShowBookingModal(true);
                          }}
                          disabled={!room.available}
                          className={`mt-2 px-4 py-1 rounded text-sm font-medium transition-colors ${
                            room.available
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {room.available ? 'Book Now' : 'Unavailable'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {selectedHotel.amenities.map(amenity => (
                  <span key={amenity} className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-3">Hotel Policies</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {selectedHotel.policies.map((policy, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    {policy}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReservations = () => {
    const userReservations = reservations.filter(r => 
      r.guestEmail === (currentUser?.email || 'guest@example.com')
    );

    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">My Reservations</h2>

        {userReservations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500">No reservations yet</p>
            <button
              onClick={() => setViewMode('hotels')}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Browse Hotels →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {userReservations.map(reservation => {
              const hotel = hotels.find(h => h.id === reservation.hotelId);
              return (
                <div key={reservation.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-wrap items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-lg">{reservation.hotelName}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(reservation.status)}`}>
                          {reservation.status.replace('-', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Reservation #{reservation.reservationNumber}</p>
                      <p className="text-sm text-gray-500">{reservation.roomType} room</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{formatCurrency(reservation.totalPrice)}</p>
                      <p className="text-xs text-gray-500">{reservation.nights} nights</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm border-t pt-3">
                    <div>
                      <p className="text-gray-500">Check-in</p>
                      <p className="font-medium">{formatDate(reservation.checkIn)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Check-out</p>
                      <p className="font-medium">{formatDate(reservation.checkOut)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                    {reservation.status === 'confirmed' && (
                      <button
                        onClick={() => checkInGuest(reservation.id)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Check In
                      </button>
                    )}
                    {reservation.status === 'checked-in' && (
                      <button
                        onClick={() => checkOutGuest(reservation.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Check Out
                      </button>
                    )}
                    {reservation.status === 'pending' && (
                      <button
                        onClick={() => cancelReservation(reservation.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderBookingModal = () => {
    if (!showBookingModal || !selectedRoom || !selectedHotel) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Book Room</h3>
            <button 
              onClick={() => {
                setShowBookingModal(false);
                setSelectedRoom(null);
                setBookingData({ checkIn: '', checkOut: '', guests: 1, specialRequests: '', guestId: '' });
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold">{selectedHotel.name}</h4>
            <p className="text-sm text-gray-500">{getRoomTypeEmoji(selectedRoom.type)} {selectedRoom.name}</p>
            <p className="text-sm font-bold text-blue-600">{formatCurrency(selectedRoom.pricePerNight)}/night</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Guest</label>
              <select
                value={bookingData.guestId}
                onChange={(e) => setBookingData(prev => ({ ...prev, guestId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Guest</option>
                {guests.map(g => (
                  <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Check-in</label>
                <input
                  type="date"
                  value={bookingData.checkIn}
                  onChange={(e) => setBookingData(prev => ({ ...prev, checkIn: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Check-out</label>
                <input
                  type="date"
                  value={bookingData.checkOut}
                  onChange={(e) => setBookingData(prev => ({ ...prev, checkOut: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
              <input
                type="number"
                min="1"
                max={selectedRoom.capacity}
                value={bookingData.guests}
                onChange={(e) => setBookingData(prev => ({ ...prev, guests: parseInt(e.target.value) || 1 }))}
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Special Requests</label>
              <textarea
                value={bookingData.specialRequests}
                onChange={(e) => setBookingData(prev => ({ ...prev, specialRequests: e.target.value }))}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                placeholder="Any special requests?"
              />
            </div>

            {bookingData.checkIn && bookingData.checkOut && (
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Nights</span>
                  <span>{calculateNights(bookingData.checkIn, bookingData.checkOut)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Price per night</span>
                  <span>{formatCurrency(selectedRoom.pricePerNight)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
                  <span>Total</span>
                  <span className="text-blue-600">
                    {formatCurrency(selectedRoom.pricePerNight * calculateNights(bookingData.checkIn, bookingData.checkOut))}
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
                setSelectedRoom(null);
                setBookingData({ checkIn: '', checkOut: '', guests: 1, specialRequests: '', guestId: '' });
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
          <p className="mt-4 text-gray-600">Loading hotel booking platform...</p>
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
              <span>🏨</span> Hotel Booking
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                Day 19
              </span>
            </h1>
            <p className="text-gray-600 mt-1">Find and book the perfect stay</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm p-1">
              <button
                onClick={() => {
                  setViewMode('hotels');
                  setSelectedHotel(null);
                }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'hotels' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🏠 Hotels
              </button>
              <button
                onClick={() => setViewMode('reservations')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'reservations' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📋 Reservations
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-4 min-h-[500px]">
          {viewMode === 'hotels' && renderHotels()}
          {viewMode === 'hotel' && renderHotelDetail()}
          {viewMode === 'reservations' && renderReservations()}
        </div>

        {/* Modals */}
        {renderBookingModal()}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500 border-t pt-6">
          <p>© 2026 Hotel Booking - Complete System</p>
          <p className="mt-1">Hotels • Rooms • Bookings • Reservations • Check-in/out</p>
          <p className="mt-1 text-gray-400">
            {hotels.length} hotels • {reservations.length} reservations • {guests.length} guests
          </p>
        </div>
      </div>
    </div>
  );
}