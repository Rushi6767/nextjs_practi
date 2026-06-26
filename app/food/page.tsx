// app/food/page.tsx
// Complete Food Delivery & Restaurant Management System with Menus, Orders, Delivery & Analytics
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// --- TypeScript Interfaces ---
interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string[];
  address: Address;
  phone: string;
  email: string;
  website?: string;
  rating: number;
  reviewCount: number;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  deliveryTime: number; // in minutes
  minimumOrder: number;
  deliveryFee: number;
  freeDeliveryAbove?: number;
  images: string[];
  menuCategories: MenuCategory[];
  status: 'open' | 'closed' | 'busy' | 'preparing';
  isActive: boolean;
  openingHours: OpeningHours[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
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

interface OpeningHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  open: string;
  close: string;
  isClosed: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  items: MenuItem[];
  order: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  ingredients: string[];
  allergens: string[];
  dietary: ('vegetarian' | 'vegan' | 'gluten-free' | 'dairy-free' | 'keto' | 'halal')[];
  images: string[];
  isAvailable: boolean;
  preparationTime: number; // in minutes
  calories?: number;
  spicyLevel?: 1 | 2 | 3 | 4 | 5;
  popular: boolean;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CartItem {
  menuItemId: string;
  restaurantId: string;
  quantity: number;
  specialInstructions?: string;
  menuItem: MenuItem;
}

interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';
  deliveryAddress: Address;
  deliveryInstructions?: string;
  paymentMethod: 'credit_card' | 'cash' | 'online';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  estimatedDeliveryTime: number;
  actualDeliveryTime?: number;
  orderTime: string;
  deliveredAt?: string;
  rating?: number;
  review?: string;
  specialRequests: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
}

interface DeliveryDriver {
  id: string;
  name: string;
  phone: string;
  vehicle: 'bike' | 'car' | 'scooter';
  status: 'available' | 'busy' | 'offline';
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  assignedOrders: string[];
  rating: number;
  totalDeliveries: number;
  createdAt: string;
  updatedAt: string;
}

interface DeliveryTracking {
  orderId: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'arrived' | 'delivered';
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverLocation?: {
    latitude: number;
    longitude: number;
  };
  estimatedArrival?: number;
  actualArrival?: number;
  updates: DeliveryUpdate[];
  createdAt: string;
  updatedAt: string;
}

interface DeliveryUpdate {
  id: string;
  status: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  notes?: string;
}

interface RestaurantAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  popularItems: {
    menuItemId: string;
    name: string;
    orderCount: number;
    revenue: number;
  }[];
  ordersByStatus: {
    status: string;
    count: number;
  }[];
  revenueByDay: {
    date: string;
    revenue: number;
  }[];
  peakHours: {
    hour: number;
    orders: number;
  }[];
  averageDeliveryTime: number;
  customerSatisfaction: number;
  topCuisines: {
    cuisine: string;
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

const generateOrderNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD${year}${month}${day}-${random}`;
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-700',
    'confirmed': 'bg-blue-100 text-blue-700',
    'preparing': 'bg-purple-100 text-purple-700',
    'ready': 'bg-indigo-100 text-indigo-700',
    'delivering': 'bg-orange-100 text-orange-700',
    'delivered': 'bg-green-100 text-green-700',
    'cancelled': 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

const getCuisineEmoji = (cuisine: string): string => {
  const map: Record<string, string> = {
    'italian': '🍝',
    'mexican': '🌮',
    'chinese': '🥡',
    'japanese': '🍣',
    'indian': '🍛',
    'thai': '🍜',
    'american': '🍔',
    'mediterranean': '🥙',
    'french': '🥖',
    'vietnamese': '🍲',
    'korean': '🥢',
    'spanish': '🥘',
  };
  return map[cuisine.toLowerCase()] || '🍽️';
};

// Placeholder image URLs
const restaurantImages = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1559339352-11d8d17a64ed?w=400&h=300&fit=crop',
];

const foodImages = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=200&h=200&fit=crop',
];

// --- Mock Data Generation ---
const generateMockRestaurants = (): Restaurant[] => {
  const restaurants: Restaurant[] = [];

  const cuisineOptions = [
    ['Italian', 'Pizza', 'Pasta'],
    ['Mexican', 'Tacos', 'Burritos'],
    ['Chinese', 'Noodles', 'Dim Sum'],
    ['Japanese', 'Sushi', 'Ramen'],
    ['Indian', 'Curry', 'Tandoori'],
    ['Thai', 'Noodles', 'Curry'],
    ['American', 'Burgers', 'BBQ'],
    ['Mediterranean', 'Greek', 'Lebanese'],
  ];

  const restaurantNames = [
    'Bella Italia', 'El Rancho', 'Golden Dragon', 'Sakura Sushi', 'Taj Mahal', 
    'Thai Orchid', 'Burger House', 'Mediterranean Breeze'
  ];

  for (let i = 0; i < 8; i++) {
    const cuisineList = cuisineOptions[i];
    const priceRange: ('$' | '$$' | '$$$' | '$$$$')[] = ['$', '$$', '$$$', '$$$$'];
    
    // Generate menu items
    const menuItems: MenuItem[] = [];
    const itemNames = [
      ['Margherita Pizza', 'Spaghetti Carbonara', 'Tiramisu'],
      ['Tacos al Pastor', 'Burrito Supreme', 'Churros'],
      ['Kung Pao Chicken', 'Spring Rolls', 'Fried Rice'],
      ['California Roll', 'Ramen', 'Tempura'],
      ['Butter Chicken', 'Biryani', 'Naan'],
      ['Pad Thai', 'Green Curry', 'Mango Sticky Rice'],
      ['Classic Burger', 'BBQ Ribs', 'Onion Rings'],
      ['Greek Salad', 'Hummus', 'Falafel'],
    ];

    const itemPrices = [
      [14.99, 18.99, 8.99],
      [12.99, 16.99, 6.99],
      [15.99, 9.99, 11.99],
      [18.99, 14.99, 12.99],
      [16.99, 19.99, 4.99],
      [14.99, 17.99, 7.99],
      [13.99, 19.99, 5.99],
      [11.99, 8.99, 7.99],
    ];

    const names = itemNames[i % itemNames.length];
    const prices = itemPrices[i % itemPrices.length];
    const dietaryOptions = [
      ['vegetarian', 'vegan'] as const,
      ['vegetarian', 'gluten-free'] as const,
      ['vegetarian'] as const,
      ['vegetarian'] as const,
      ['vegetarian'] as const,
      ['vegetarian', 'vegan'] as const,
      [] as const,
      ['vegetarian', 'vegan', 'gluten-free'] as const,
    ];

    names.forEach((name, idx) => {
      const dietary = dietaryOptions[i % dietaryOptions.length];
      menuItems.push({
        id: generateId(),
        name,
        description: `Delicious ${name} with fresh ingredients`,
        price: prices[idx % prices.length],
        currency: 'USD',
        category: cuisineList[0],
        ingredients: ['Fresh ingredients', 'Chef special'],
        allergens: ['Gluten', 'Dairy'].slice(0, Math.floor(Math.random() * 2)),
        dietary: dietary as any,
        images: [foodImages[(i + idx) % foodImages.length]],
        isAvailable: true,
        preparationTime: 15 + Math.floor(Math.random() * 20),
        spicyLevel: Math.floor(Math.random() * 5) + 1 as any,
        popular: idx === 0,
        orderCount: Math.floor(Math.random() * 100),
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
      });
    });

    // Create menu categories
    const menuCategories: MenuCategory[] = [
      {
        id: generateId(),
        name: 'Main Dishes',
        description: 'Our signature dishes',
        items: menuItems.slice(0, 2),
        order: 1,
      },
      {
        id: generateId(),
        name: 'Appetizers',
        description: 'Start your meal right',
        items: menuItems.slice(2, 3),
        order: 2,
      },
    ];

    restaurants.push({
      id: generateId(),
      name: restaurantNames[i],
      description: `Authentic ${cuisineList[0]} cuisine in the heart of the city.`,
      cuisine: cuisineList,
      address: {
        street: `${i + 100} Food St`,
        city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][i % 5],
        state: ['NY', 'CA', 'IL', 'TX', 'AZ'][i % 5],
        country: 'USA',
        zipCode: String(10000 + i * 100),
      },
      phone: `(555) ${String(100 + i).padStart(3, '0')}-${String(1000 + i * 2).padStart(4, '0')}`,
      email: `info@${restaurantNames[i].toLowerCase().replace(/\s/g, '')}.com`,
      rating: Math.round((3 + Math.random() * 2) * 10) / 10,
      reviewCount: Math.floor(Math.random() * 500) + 50,
      priceRange: priceRange[i % priceRange.length],
      deliveryTime: 20 + Math.floor(Math.random() * 30),
      minimumOrder: 10 + Math.floor(Math.random() * 10),
      deliveryFee: Math.round((Math.random() * 5 + 1) * 100) / 100,
      freeDeliveryAbove: 30 + Math.floor(Math.random() * 20),
      images: [restaurantImages[i % restaurantImages.length]],
      menuCategories,
      status: ['open', 'open', 'open', 'busy', 'preparing'][i % 5] as any,
      isActive: true,
      openingHours: [
        { day: 'monday', open: '10:00', close: '22:00', isClosed: false },
        { day: 'tuesday', open: '10:00', close: '22:00', isClosed: false },
        { day: 'wednesday', open: '10:00', close: '22:00', isClosed: false },
        { day: 'thursday', open: '10:00', close: '22:00', isClosed: false },
        { day: 'friday', open: '10:00', close: '23:00', isClosed: false },
        { day: 'saturday', open: '11:00', close: '23:00', isClosed: false },
        { day: 'sunday', open: '11:00', close: '21:00', isClosed: false },
      ],
      tags: cuisineList,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    });
  }

  return restaurants;
};

const generateMockOrders = (restaurants: Restaurant[], userId: string): Order[] => {
  const orders: Order[] = [];
  const statuses: Order['status'][] = ['delivered', 'delivered', 'delivering', 'ready', 'confirmed', 'pending'];
  const now = new Date();

  for (let i = 0; i < 15; i++) {
    const restaurant = restaurants[i % restaurants.length];
    const items: OrderItem[] = [];
    let subtotal = 0;
    const numItems = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < numItems; j++) {
      const menuItem = restaurant.menuCategories[0]?.items[j % restaurant.menuCategories[0]?.items.length];
      if (menuItem) {
        const quantity = Math.floor(Math.random() * 2) + 1;
        const totalPrice = menuItem.price * quantity;
        subtotal += totalPrice;
        items.push({
          id: generateId(),
          menuItemId: menuItem.id,
          menuItemName: menuItem.name,
          quantity,
          unitPrice: menuItem.price,
          totalPrice,
        });
      }
    }

    const deliveryFee = restaurant.deliveryFee;
    const tax = Math.round((subtotal * 0.08) * 100) / 100;
    const total = subtotal + deliveryFee + tax;

    const orderDate = new Date(now);
    orderDate.setHours(orderDate.getHours() - i * 3);

    orders.push({
      id: generateId(),
      orderNumber: generateOrderNumber(),
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      userId: userId,
      userName: 'John Doe',
      userEmail: 'john@example.com',
      items,
      subtotal,
      deliveryFee,
      tax,
      discount: 0,
      total,
      currency: 'USD',
      status: statuses[i % statuses.length],
      deliveryAddress: {
        street: `${i + 200} Customer Ave`,
        city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][i % 5],
        state: ['NY', 'CA', 'IL', 'TX', 'AZ'][i % 5],
        country: 'USA',
        zipCode: String(20000 + i * 100),
      },
      paymentMethod: ['credit_card', 'online', 'cash'][i % 3] as any,
      paymentStatus: 'paid',
      estimatedDeliveryTime: 30 + Math.floor(Math.random() * 20),
      orderTime: orderDate.toISOString(),
      specialRequests: 'No special requests',
      createdAt: orderDate.toISOString(),
      updatedAt: orderDate.toISOString(),
    });
  }

  return orders;
};

// --- Main Component ---
export default function FoodDeliveryPage() {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI States
  const [viewMode, setViewMode] = useState<'restaurants' | 'menu' | 'cart' | 'orders' | 'checkout'>('restaurants');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Modal States
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showOrderTrackingModal, setShowOrderTrackingModal] = useState(false);
  
  // Checkout States
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'cash' | 'online'>('credit_card');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCuisine, setFilterCuisine] = useState('all');
  const [filterPrice, setFilterPrice] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
    const mockRestaurants = generateMockRestaurants();
    setRestaurants(mockRestaurants);
    setSelectedRestaurant(mockRestaurants[0]);

    const userId = storedUser ? JSON.parse(storedUser).id || 'user1' : 'user1';
    const mockOrders = generateMockOrders(mockRestaurants, userId);
    setOrders(mockOrders);

    setIsLoading(false);
  }, []);

  // --- Cart Operations ---
  const addToCart = useCallback((menuItem: MenuItem, restaurantId: string, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItemId === menuItem.id && item.restaurantId === restaurantId);
      if (existing) {
        return prev.map(item =>
          item.menuItemId === menuItem.id && item.restaurantId === restaurantId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { menuItemId: menuItem.id, restaurantId, quantity, menuItem }];
    });
  }, []);

  const removeFromCart = useCallback((menuItemId: string, restaurantId: string) => {
    setCart(prev => prev.filter(item => item.menuItemId !== menuItemId || item.restaurantId !== restaurantId));
  }, []);

  const updateQuantity = useCallback((menuItemId: string, restaurantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId, restaurantId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.menuItemId === menuItemId && item.restaurantId === restaurantId
        ? { ...item, quantity }
        : item
    ));
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  }, [cart]);

  const getCartRestaurant = useCallback(() => {
    if (cart.length === 0) return null;
    const restaurantId = cart[0].restaurantId;
    return restaurants.find(r => r.id === restaurantId);
  }, [cart, restaurants]);

  // --- Order Operations ---
  const placeOrder = useCallback(() => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    const restaurant = getCartRestaurant();
    if (!restaurant) return;

    const items: OrderItem[] = cart.map(item => ({
      id: generateId(),
      menuItemId: item.menuItemId,
      menuItemName: item.menuItem.name,
      quantity: item.quantity,
      unitPrice: item.menuItem.price,
      totalPrice: item.menuItem.price * item.quantity,
    }));

    const subtotal = getCartTotal();
    const deliveryFee = restaurant.deliveryFee;
    const tax = Math.round((subtotal * 0.08) * 100) / 100;
    const total = subtotal + deliveryFee + tax;

    const newOrder: Order = {
      id: generateId(),
      orderNumber: generateOrderNumber(),
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      userId: currentUser?.id || 'guest',
      userName: currentUser?.fullName || 'Guest',
      userEmail: currentUser?.email || 'guest@example.com',
      items,
      subtotal,
      deliveryFee,
      tax,
      discount: 0,
      total,
      currency: 'USD',
      status: 'pending',
      deliveryAddress: {
        street: deliveryAddress.street || '123 Main St',
        city: deliveryAddress.city || 'New York',
        state: deliveryAddress.state || 'NY',
        country: 'USA',
        zipCode: deliveryAddress.zipCode || '10001',
      },
      deliveryInstructions: deliveryInstructions || '',
      paymentMethod,
      paymentStatus: 'paid',
      estimatedDeliveryTime: restaurant.deliveryTime,
      orderTime: getCurrentTimestamp(),
      specialRequests: deliveryInstructions || '',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    setShowCheckoutModal(false);
    setViewMode('orders');
    alert(`Order placed successfully! Order #${newOrder.orderNumber}`);
  }, [cart, getCartRestaurant, getCartTotal, deliveryAddress, deliveryInstructions, paymentMethod, currentUser, clearCart]);

  const cancelOrder = useCallback((orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'cancelled', updatedAt: getCurrentTimestamp() } : o
    ));
  }, []);

  // --- Render Functions ---
  const renderRestaurants = () => {
    const filtered = restaurants.filter(r => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return r.name.toLowerCase().includes(term) ||
               r.cuisine.some(c => c.toLowerCase().includes(term));
      }
      if (filterCuisine !== 'all' && !r.cuisine.includes(filterCuisine)) return false;
      if (filterPrice !== 'all' && r.priceRange !== filterPrice) return false;
      return true;
    });

    // Get unique cuisines for filter
    const allCuisines = Array.from(new Set(restaurants.flatMap(r => r.cuisine)));

    return (
      <div>
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search restaurants or cuisines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterCuisine}
              onChange={(e) => setFilterCuisine(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Cuisines</option>
              {allCuisines.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={filterPrice}
              onChange={(e) => setFilterPrice(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Prices</option>
              <option value="$">$</option>
              <option value="$$">$$</option>
              <option value="$$$">$$$</option>
              <option value="$$$$">$$$$</option>
            </select>
          </div>
        </div>

        {/* Restaurant Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(restaurant => (
            <div 
              key={restaurant.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedRestaurant(restaurant);
                setSelectedCategory(restaurant.menuCategories[0]?.id || null);
                setViewMode('menu');
              }}
            >
              <div className="h-48 relative">
                <img 
                  src={restaurant.images[0]} 
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className={`text-xs px-2 py-1 rounded ${
                    restaurant.status === 'open' ? 'bg-green-500 text-white' :
                    restaurant.status === 'busy' ? 'bg-yellow-500 text-white' :
                    restaurant.status === 'preparing' ? 'bg-orange-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {restaurant.status}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-lg">{restaurant.name}</h4>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="font-medium">{restaurant.rating}</span>
                    <span className="text-xs text-gray-400">({restaurant.reviewCount})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{restaurant.cuisine.join(' • ')}</span>
                  <span>•</span>
                  <span>{restaurant.priceRange}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{restaurant.description}</p>
                <div className="flex items-center justify-between mt-3 text-sm">
                  <span className="text-gray-500">⏱️ {restaurant.deliveryTime} min</span>
                  <span className="text-gray-500">🚚 {restaurant.deliveryFee === 0 ? 'Free' : `$${restaurant.deliveryFee}`}</span>
                  <span className="text-gray-500">📝 Min ${restaurant.minimumOrder}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {restaurant.cuisine.slice(0, 3).map(c => (
                    <span key={c} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {getCuisineEmoji(c)} {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMenu = () => {
    if (!selectedRestaurant) return null;

    const categories = selectedRestaurant.menuCategories;

    return (
      <div>
        <button
          onClick={() => setViewMode('restaurants')}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Restaurants
        </button>

        {/* Restaurant Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{selectedRestaurant.name}</h2>
              <p className="text-gray-500">{selectedRestaurant.cuisine.join(' • ')}</p>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span>⭐ {selectedRestaurant.rating} ({selectedRestaurant.reviewCount})</span>
                <span>⏱️ {selectedRestaurant.deliveryTime} min</span>
                <span>🚚 ${selectedRestaurant.deliveryFee}</span>
                <span>💰 {selectedRestaurant.priceRange}</span>
              </div>
            </div>
            <button
              onClick={() => setViewMode('cart')}
              className="mt-2 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
            >
              🛒 Cart ({cart.filter(c => c.restaurantId === selectedRestaurant.id).reduce((sum, item) => sum + item.quantity, 0)})
            </button>
          </div>
        </div>

        {/* Menu Categories */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        {categories.map(category => {
          if (selectedCategory && category.id !== selectedCategory) return null;
          return (
            <div key={category.id} className="mb-6">
              <h3 className="font-semibold text-lg mb-3">{category.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{category.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.items.map(item => (
                  <div key={item.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                    <div className="flex gap-4">
                      <img 
                        src={item.images[0]} 
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                          </div>
                          <span className="font-bold text-blue-600">{formatCurrency(item.price)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.dietary.map(d => (
                            <span key={d} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              {d}
                            </span>
                          ))}
                          {item.popular && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                              ⭐ Popular
                            </span>
                          )}
                          {item.spicyLevel && item.spicyLevel > 3 && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                              🌶️ Spicy
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => addToCart(item, selectedRestaurant.id)}
                            disabled={!item.isAvailable}
                            className={`text-sm font-medium px-3 py-1 rounded transition-colors ${
                              item.isAvailable
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {item.isAvailable ? 'Add to Cart' : 'Unavailable'}
                          </button>
                          <span className="text-xs text-gray-400">⏱️ {item.preparationTime} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCart = () => {
    const restaurant = getCartRestaurant();
    const total = getCartTotal();

    if (cart.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-2xl font-bold text-gray-700">Your Cart is Empty</h3>
          <p className="text-gray-500 mt-2">Browse restaurants and add some delicious food!</p>
          <button
            onClick={() => setViewMode('restaurants')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Browse Restaurants
          </button>
        </div>
      );
    }

    return (
      <div>
        <button
          onClick={() => {
            if (selectedRestaurant) {
              setViewMode('menu');
            } else {
              setViewMode('restaurants');
            }
          }}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Continue Shopping
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
          <p className="text-sm text-gray-500 mb-4">
            {restaurant ? `From: ${restaurant.name}` : 'Select a restaurant first'}
          </p>

          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.menuItemId} className="flex items-center justify-between border-b pb-3">
                <div className="flex-1">
                  <h4 className="font-medium">{item.menuItem.name}</h4>
                  <p className="text-sm text-gray-500">{formatCurrency(item.menuItem.price)} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.restaurantId, item.quantity - 1)}
                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full font-bold"
                  >
                    -
                  </button>
                  <span className="font-medium w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.restaurantId, item.quantity + 1)}
                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full font-bold"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.menuItemId, item.restaurantId)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t mt-4 pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-blue-600">{formatCurrency(total)}</span>
            </div>
            {restaurant && (
              <p className="text-sm text-gray-500 mt-1">
                Minimum order: {formatCurrency(restaurant.minimumOrder)}
                {total < restaurant.minimumOrder && ` (Need $${(restaurant.minimumOrder - total).toFixed(2)} more)`}
              </p>
            )}
          </div>

          <button
            onClick={() => {
              if (!restaurant) {
                alert('Please select a restaurant first');
                return;
              }
              if (total < restaurant.minimumOrder) {
                alert(`Minimum order is ${formatCurrency(restaurant.minimumOrder)}`);
                return;
              }
              setShowCheckoutModal(true);
            }}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors text-lg"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    );
  };

  const renderOrders = () => {
    const userOrders = orders.filter(o => o.userId === (currentUser?.id || 'guest'));

    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">My Orders</h2>

        {userOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500">No orders yet</p>
            <button
              onClick={() => setViewMode('restaurants')}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              Start Ordering →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {userOrders.map(order => {
              const restaurant = restaurants.find(r => r.id === order.restaurantId);
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex flex-wrap items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-lg">{order.restaurantName}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">{formatDateTime(order.orderTime)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-gray-500">{order.items.length} items</p>
                    </div>
                  </div>

                  <div className="mt-3 border-t pt-3">
                    <div className="flex flex-wrap gap-2">
                      {order.items.map(item => (
                        <span key={item.id} className="text-sm bg-gray-100 px-3 py-1 rounded">
                          {item.quantity}x {item.menuItemName}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                    {order.status === 'delivering' && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderTrackingModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        📍 Track Order
                      </button>
                    )}
                    {order.status === 'pending' && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Cancel Order
                      </button>
                    )}
                    {order.status === 'delivered' && !order.rating && (
                      <button
                        onClick={() => {
                          // Rate order
                          alert('Rating feature coming soon!');
                        }}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        ⭐ Rate Order
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

  const renderCheckoutModal = () => {
    if (!showCheckoutModal) return null;

    const restaurant = getCartRestaurant();
    const total = getCartTotal();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Checkout</h3>
            <button 
              onClick={() => setShowCheckoutModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
              <input
                type="text"
                value={deliveryAddress.street}
                onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
                placeholder="Street address"
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  type="text"
                  value={deliveryAddress.city}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  className="border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={deliveryAddress.state}
                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="State"
                  className="border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <input
                type="text"
                value={deliveryAddress.zipCode}
                onChange={(e) => setDeliveryAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                placeholder="Zip Code"
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Delivery Instructions</label>
              <textarea
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="Special instructions for delivery..."
                rows={2}
                className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <div className="flex gap-3 mt-2">
                {['credit_card', 'online', 'cash'].map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method as any)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethod === method
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {method === 'credit_card' && '💳 Card'}
                    {method === 'online' && '📱 Online'}
                    {method === 'cash' && '💵 Cash'}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>{formatCurrency(restaurant?.deliveryFee || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (8%)</span>
                <span>{formatCurrency((total + (restaurant?.deliveryFee || 0)) * 0.08)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
                <span>Total</span>
                <span className="text-blue-600">
                  {formatCurrency(total + (restaurant?.deliveryFee || 0) + (total + (restaurant?.deliveryFee || 0)) * 0.08)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={placeOrder}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Place Order
            </button>
            <button
              onClick={() => setShowCheckoutModal(false)}
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
          <p className="mt-4 text-gray-600">Loading food delivery platform...</p>
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
              <span>🍽️</span> Food Delivery
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                Day 18
              </span>
            </h1>
            <p className="text-gray-600 mt-1">Discover restaurants and order food delivery</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm p-1">
              <button
                onClick={() => {
                  setViewMode('restaurants');
                  setSelectedRestaurant(null);
                }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'restaurants' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🏠 Restaurants
              </button>
              <button
                onClick={() => setViewMode('orders')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'orders' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📋 Orders
              </button>
              <button
                onClick={() => setViewMode('cart')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'cart' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                } relative`}
              >
                🛒 Cart
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-4 min-h-[500px]">
          {viewMode === 'restaurants' && renderRestaurants()}
          {viewMode === 'menu' && renderMenu()}
          {viewMode === 'cart' && renderCart()}
          {viewMode === 'orders' && renderOrders()}
        </div>

        {/* Modals */}
        {renderCheckoutModal()}

        {/* Order Tracking Modal - Simplified */}
        {showOrderTrackingModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Order Tracking</h3>
                <button 
                  onClick={() => {
                    setShowOrderTrackingModal(false);
                    setSelectedOrder(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🚚</div>
                <p className="font-medium">Your order is on the way!</p>
                <p className="text-sm text-gray-500">Estimated delivery: 15-20 minutes</p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm">📍 Driver is approaching</p>
                  <p className="text-xs text-gray-500">Order #{selectedOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowOrderTrackingModal(false);
                  setSelectedOrder(null);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500 border-t pt-6">
          <p>© 2026 Food Delivery - Day 18 Complete System</p>
          <p className="mt-1">Restaurants • Menus • Orders • Cart • Delivery</p>
          <p className="mt-1 text-gray-400">
            {restaurants.length} restaurants • {orders.length} orders • {cart.length} items in cart
          </p>
        </div>
      </div>
    </div>
  );
}