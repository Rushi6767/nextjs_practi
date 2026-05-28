// app/store/page.tsx
// Complete E-commerce Store with Product Catalog, Cart, Checkout & Order Management
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- TypeScript Interfaces ---
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory: string;
  brand: string;
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  quantity: number;
  sku: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  specifications: Record<string, string>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isFeatured: boolean;
  discountPercentage?: number;
}

interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  discount: number;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  discount: number;
  couponCode?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'credit_card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery';
  shippingAddress: Address;
  billingAddress: Address;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
}

interface Address {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  helpful: number;
  createdAt: string;
  verifiedPurchase: boolean;
}

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiresAt: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

// --- Utility Functions ---
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const calculateTax = (subtotal: number): number => {
  return subtotal * 0.08; // 8% tax rate
};

const calculateShipping = (subtotal: number): number => {
  if (subtotal >= 50) return 0;
  return 5.99;
};

const calculateDiscount = (subtotal: number, coupon?: Coupon): number => {
  if (!coupon || !coupon.isActive) return 0;
  if (subtotal < coupon.minOrderAmount) return 0;
  if (new Date(coupon.expiresAt) < new Date()) return 0;
  if (coupon.usedCount >= coupon.usageLimit) return 0;
  
  if (coupon.discountType === 'percentage') {
    const discount = subtotal * (coupon.discountValue / 100);
    return coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
  } else {
    return Math.min(coupon.discountValue, subtotal);
  }
};

// --- Mock Data ---
const getInitialProducts = (): Product[] => {
  return [
    {
      id: generateId(),
      name: 'Premium Wireless Headphones Pro',
      description: 'Experience superior sound quality with our latest wireless headphones. Features active noise cancellation, 40-hour battery life, and premium comfort for all-day listening.',
      price: 299.99,
      originalPrice: 399.99,
      category: 'Electronics',
      subcategory: 'Audio',
      brand: 'AudioTech',
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop',
      ],
      rating: 4.8,
      reviewCount: 1250,
      inStock: true,
      quantity: 45,
      sku: 'ATH-PRO-001',
      weight: 0.45,
      dimensions: { length: 20, width: 15, height: 8 },
      specifications: {
        'Battery Life': '40 hours',
        'Noise Cancellation': 'Active ANC',
        'Connectivity': 'Bluetooth 5.2',
        'Driver Size': '40mm',
      },
      tags: ['wireless', 'headphones', 'audio', 'premium'],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isFeatured: true,
      discountPercentage: 25,
    },
    {
      id: generateId(),
      name: 'Smart Fitness Tracker Elite',
      description: 'Track your health and fitness goals with precision. Features heart rate monitoring, sleep tracking, GPS, and 14-day battery life in a sleek, waterproof design.',
      price: 149.99,
      category: 'Electronics',
      subcategory: 'Wearables',
      brand: 'FitTech',
      images: [
        'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1557438159-51eec7a6c9e8?w=400&h=400&fit=crop',
      ],
      rating: 4.6,
      reviewCount: 890,
      inStock: true,
      quantity: 60,
      sku: 'FIT-ELITE-002',
      weight: 0.12,
      dimensions: { length: 4, width: 3, height: 1 },
      specifications: {
        'Battery Life': '14 days',
        'Water Resistance': '5 ATM',
        'Display': 'AMOLED',
        'Sensors': 'Heart rate, SpO2, GPS',
      },
      tags: ['fitness', 'wearable', 'smartwatch', 'health'],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isFeatured: true,
      discountPercentage: 0,
    },
    {
      id: generateId(),
      name: 'Organic Cotton T-Shirt - Premium Collection',
      description: 'Crafted from 100% organic cotton, this premium t-shirt offers unmatched comfort and durability. Perfect for everyday wear with a sustainable edge.',
      price: 34.99,
      originalPrice: 49.99,
      category: 'Clothing',
      subcategory: 'T-Shirts',
      brand: 'EcoWear',
      images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=400&fit=crop',
      ],
      rating: 4.7,
      reviewCount: 560,
      inStock: true,
      quantity: 120,
      sku: 'ECO-TEE-003',
      weight: 0.2,
      dimensions: { length: 30, width: 25, height: 2 },
      specifications: {
        'Material': '100% Organic Cotton',
        'Fit': 'Regular',
        'Sizes': 'S, M, L, XL, XXL',
        'Colors': 'White, Black, Navy',
      },
      tags: ['organic', 'sustainable', 'casual', 'premium'],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isFeatured: false,
      discountPercentage: 30,
    },
    {
      id: generateId(),
      name: 'Professional Chef Knife Set',
      description: 'Complete your kitchen with this premium 7-piece knife set. Includes chef knife, paring knife, bread knife, utility knife, sharpening steel, and storage block.',
      price: 189.99,
      originalPrice: 249.99,
      category: 'Home & Kitchen',
      subcategory: 'Cookware',
      brand: 'ChefMaster',
      images: [
        'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1563770551462-0d98ba26c446?w=400&h=400&fit=crop',
      ],
      rating: 4.9,
      reviewCount: 340,
      inStock: true,
      quantity: 30,
      sku: 'CM-KNIFE-004',
      weight: 2.5,
      dimensions: { length: 45, width: 25, height: 10 },
      specifications: {
        'Material': 'High Carbon Stainless Steel',
        'Handle': 'Pakkawood',
        'Knives': '7 pieces',
        'Dishwasher Safe': 'No',
      },
      tags: ['kitchen', 'cooking', 'chef', 'premium'],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isFeatured: true,
      discountPercentage: 24,
    },
    {
      id: generateId(),
      name: 'Minimalist Leather Backpack',
      description: 'A perfect blend of style and functionality. Made from premium full-grain leather with brass hardware, this backpack features laptop compartment and multiple pockets.',
      price: 159.99,
      category: 'Accessories',
      subcategory: 'Bags',
      brand: 'LeatherCraft',
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop',
      ],
      rating: 4.5,
      reviewCount: 278,
      inStock: true,
      quantity: 25,
      sku: 'LC-BACK-005',
      weight: 1.2,
      dimensions: { length: 42, width: 30, height: 12 },
      specifications: {
        'Material': 'Full-grain Leather',
        'Laptop Compartment': '15 inches',
        'Closure': 'Brass zipper',
        'Pockets': '5 compartments',
      },
      tags: ['leather', 'backpack', 'minimalist', 'work'],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isFeatured: false,
      discountPercentage: 0,
    },
    {
      id: generateId(),
      name: 'Smart Home Security Camera',
      description: 'Keep your home safe with this AI-powered security camera. Features 4K resolution, night vision, motion detection, two-way audio, and cloud storage.',
      price: 79.99,
      originalPrice: 119.99,
      category: 'Electronics',
      subcategory: 'Smart Home',
      brand: 'SecureHome',
      images: [
        'https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop',
      ],
      rating: 4.4,
      reviewCount: 567,
      inStock: true,
      quantity: 80,
      sku: 'SH-CAM-006',
      weight: 0.3,
      dimensions: { length: 10, width: 8, height: 6 },
      specifications: {
        'Resolution': '4K UHD',
        'Night Vision': 'Infrared',
        'Storage': 'Cloud + Local',
        'Connectivity': 'Wi-Fi 6',
      },
      tags: ['security', 'smart home', 'camera', 'AI'],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isFeatured: false,
      discountPercentage: 33,
    },
    {
      id: generateId(),
      name: 'Premium Yoga Mat - Non-Slip',
      description: 'Elevate your yoga practice with this premium mat. Features excellent grip, joint cushioning, and eco-friendly materials. Perfect for all types of yoga.',
      price: 49.99,
      category: 'Sports & Outdoors',
      subcategory: 'Yoga',
      brand: 'ZenFit',
      images: [
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=400&h=400&fit=crop',
      ],
      rating: 4.8,
      reviewCount: 432,
      inStock: true,
      quantity: 95,
      sku: 'ZF-MAT-007',
      weight: 0.8,
      dimensions: { length: 183, width: 61, height: 0.6 },
      specifications: {
        'Material': 'Natural Rubber',
        'Thickness': '6mm',
        'Non-Slip': 'Yes',
        'Eco-Friendly': 'Yes',
      },
      tags: ['yoga', 'fitness', 'wellness', 'eco-friendly'],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isFeatured: false,
      discountPercentage: 0,
    },
    {
      id: generateId(),
      name: 'Wireless Charging Pad - Fast Charge',
      description: 'Charge your devices wirelessly with this sleek and powerful charging pad. Supports fast charging for all Qi-compatible devices.',
      price: 39.99,
      originalPrice: 59.99,
      category: 'Electronics',
      subcategory: 'Accessories',
      brand: 'ChargeTech',
      images: [
        'https://images.unsplash.com/photo-1593941707882-a56ba842b49b?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1600267185393-e158a98703de?w=400&h=400&fit=crop',
      ],
      rating: 4.3,
      reviewCount: 789,
      inStock: true,
      quantity: 150,
      sku: 'CT-CHRG-008',
      weight: 0.15,
      dimensions: { length: 10, width: 10, height: 1.5 },
      specifications: {
        'Output': '15W Fast Charge',
        'Compatibility': 'Qi-enabled devices',
        'LED Indicator': 'Yes',
        'Safety': 'Overcharge protection',
      },
      tags: ['wireless', 'charging', 'fast-charge', 'accessory'],
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      isFeatured: false,
      discountPercentage: 33,
    },
  ];
};

const getInitialCoupons = (): Coupon[] => {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  return [
    {
      id: generateId(),
      code: 'SAVE10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 50,
      maxDiscount: 25,
      expiresAt: nextMonth.toISOString(),
      usageLimit: 100,
      usedCount: 0,
      isActive: true,
    },
    {
      id: generateId(),
      code: 'WELCOME20',
      discountType: 'percentage',
      discountValue: 20,
      minOrderAmount: 100,
      maxDiscount: 50,
      expiresAt: nextMonth.toISOString(),
      usageLimit: 50,
      usedCount: 0,
      isActive: true,
    },
    {
      id: generateId(),
      code: 'FREESHIP',
      discountType: 'fixed',
      discountValue: 5.99,
      minOrderAmount: 0,
      maxDiscount: 5.99,
      expiresAt: nextMonth.toISOString(),
      usageLimit: 200,
      usedCount: 0,
      isActive: true,
    },
  ];
};

// --- Main Component ---
export default function StorePage() {
  const [isClient, setIsClient] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>(getInitialCoupons());
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // UI States
  const [viewMode, setViewMode] = useState<'store' | 'cart' | 'checkout' | 'orders' | 'product'>('store');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'rating' | 'newest'>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Cart States
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  
  // Checkout States
  const [shippingAddress, setShippingAddress] = useState<Address>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });
  const [billingAddress, setBillingAddress] = useState<Address>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery'>('credit_card');
  const [orderNotes, setOrderNotes] = useState('');
  
  // Review States
  const [reviewData, setReviewData] = useState({
    rating: 5,
    title: '',
    comment: '',
  });
  
  // Order tracking
  const [trackingOrderId, setTrackingOrderId] = useState('');

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
    
    // Load products
    const storedProducts = localStorage.getItem('store_products');
    if (storedProducts) {
      try {
        setProducts(JSON.parse(storedProducts));
      } catch (error) {
        setProducts(getInitialProducts());
      }
    } else {
      setProducts(getInitialProducts());
    }
    
    // Load cart
    const storedCart = localStorage.getItem('store_cart');
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (error) {
        // Initialize empty cart
      }
    }
    
    // Load orders
    const storedOrders = localStorage.getItem('store_orders');
    if (storedOrders) {
      try {
        setOrders(JSON.parse(storedOrders));
      } catch (error) {
        setOrders([]);
      }
    }
  }, []);

  useEffect(() => {
    if (isClient && products.length > 0) {
      localStorage.setItem('store_products', JSON.stringify(products));
    }
  }, [products, isClient]);

  useEffect(() => {
    if (isClient && cart) {
      localStorage.setItem('store_cart', JSON.stringify(cart));
    }
  }, [cart, isClient]);

  useEffect(() => {
    if (isClient && orders.length > 0) {
      localStorage.setItem('store_orders', JSON.stringify(orders));
    }
  }, [orders, isClient]);

  // --- Cart Operations ---
  const addToCart = useCallback((productId: string, quantity: number = 1) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.inStock) return;
    
    setCart(prevCart => {
      if (!prevCart) {
        // Create new cart
        const newCart: Cart = {
          id: generateId(),
          userId: currentUser?.id || 'guest',
          items: [{ productId, quantity, product }],
          subtotal: product.price * quantity,
          tax: 0,
          shipping: 0,
          total: 0,
          discount: 0,
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
        };
        newCart.tax = calculateTax(newCart.subtotal);
        newCart.shipping = calculateShipping(newCart.subtotal);
        newCart.total = newCart.subtotal + newCart.tax + newCart.shipping;
        return newCart;
      }
      
      // Check if product exists in cart
      const existingItem = prevCart.items.find(item => item.productId === productId);
      let updatedItems;
      
      if (existingItem) {
        updatedItems = prevCart.items.map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        updatedItems = [...prevCart.items, { productId, quantity, product }];
      }
      
      const subtotal = updatedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const tax = calculateTax(subtotal);
      const shipping = calculateShipping(subtotal);
      const discount = appliedCoupon ? calculateDiscount(subtotal, appliedCoupon) : 0;
      const total = subtotal + tax + shipping - discount;
      
      return {
        ...prevCart,
        items: updatedItems,
        subtotal,
        tax,
        shipping,
        total,
        discount,
        updatedAt: getCurrentTimestamp(),
      };
    });
  }, [products, currentUser, appliedCoupon]);

  const removeFromCart = useCallback((productId: string) => {
    if (!cart) return;
    
    setCart(prevCart => {
      if (!prevCart) return null;
      
      const updatedItems = prevCart.items.filter(item => item.productId !== productId);
      
      if (updatedItems.length === 0) {
        return null;
      }
      
      const subtotal = updatedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const tax = calculateTax(subtotal);
      const shipping = calculateShipping(subtotal);
      const discount = appliedCoupon ? calculateDiscount(subtotal, appliedCoupon) : 0;
      const total = subtotal + tax + shipping - discount;
      
      return {
        ...prevCart,
        items: updatedItems,
        subtotal,
        tax,
        shipping,
        total,
        discount,
        updatedAt: getCurrentTimestamp(),
      };
    });
  }, [cart, appliedCoupon]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (!cart || quantity < 1) return;
    
    setCart(prevCart => {
      if (!prevCart) return null;
      
      const updatedItems = prevCart.items.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      );
      
      const subtotal = updatedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const tax = calculateTax(subtotal);
      const shipping = calculateShipping(subtotal);
      const discount = appliedCoupon ? calculateDiscount(subtotal, appliedCoupon) : 0;
      const total = subtotal + tax + shipping - discount;
      
      return {
        ...prevCart,
        items: updatedItems,
        subtotal,
        tax,
        shipping,
        total,
        discount,
        updatedAt: getCurrentTimestamp(),
      };
    });
  }, [cart, appliedCoupon]);

  const clearCart = useCallback(() => {
    setCart(null);
    setAppliedCoupon(null);
    setCouponCode('');
  }, []);

  // --- Coupon Operations ---
  const applyCoupon = useCallback(() => {
    if (!couponCode.trim()) {
      alert('Please enter a coupon code');
      return;
    }
    
    const coupon = coupons.find(c => 
      c.code.toUpperCase() === couponCode.toUpperCase() && c.isActive
    );
    
    if (!coupon) {
      alert('Invalid coupon code');
      return;
    }
    
    if (!cart) {
      alert('Your cart is empty');
      return;
    }
    
    if (cart.subtotal < coupon.minOrderAmount) {
      alert(`Minimum order amount for this coupon is ${formatCurrency(coupon.minOrderAmount)}`);
      return;
    }
    
    if (new Date(coupon.expiresAt) < new Date()) {
      alert('This coupon has expired');
      return;
    }
    
    if (coupon.usedCount >= coupon.usageLimit) {
      alert('This coupon has reached its usage limit');
      return;
    }
    
    setAppliedCoupon(coupon);
    
    // Update cart with discount
    const discount = calculateDiscount(cart.subtotal, coupon);
    setCart(prevCart => {
      if (!prevCart) return null;
      return {
        ...prevCart,
        discount,
        total: prevCart.subtotal + prevCart.tax + prevCart.shipping - discount,
        couponCode: coupon.code,
      };
    });
    
    alert(`Coupon applied! You saved ${formatCurrency(discount)}`);
  }, [couponCode, coupons, cart]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
    
    if (cart) {
      setCart(prevCart => {
        if (!prevCart) return null;
        return {
          ...prevCart,
          discount: 0,
          total: prevCart.subtotal + prevCart.tax + prevCart.shipping,
          couponCode: undefined,
        };
      });
    }
  }, [cart]);

  // --- Checkout ---
  const placeOrder = useCallback(() => {
    if (!cart || cart.items.length === 0) {
      alert('Your cart is empty');
      return;
    }
    
    // Validate shipping address
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    const missingField = requiredFields.find(field => !shippingAddress[field as keyof Address]);
    if (missingField) {
      alert(`Please fill in your shipping ${missingField}`);
      return;
    }
    
    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    // Create order
    const newOrder: Order = {
      id: generateId(),
      userId: currentUser?.id || 'guest',
      items: cart.items,
      subtotal: cart.subtotal,
      tax: cart.tax,
      shipping: cart.shipping,
      total: cart.total,
      discount: cart.discount,
      couponCode: cart.couponCode,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: paymentMethod,
      shippingAddress: shippingAddress,
      billingAddress: sameAsShipping ? shippingAddress : billingAddress,
      notes: orderNotes,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };
    
    // If coupon was used, increment usage count
    if (appliedCoupon) {
      setCoupons(prev => prev.map(c => 
        c.id === appliedCoupon.id 
          ? { ...c, usedCount: c.usedCount + 1 }
          : c
      ));
    }
    
    // Add order
    setOrders(prev => [newOrder, ...prev]);
    
    // Clear cart
    clearCart();
    
    // Show success
    alert(`Order placed successfully! Order #${newOrder.id.slice(-6).toUpperCase()}`);
    setViewMode('orders');
  }, [cart, shippingAddress, billingAddress, sameAsShipping, paymentMethod, orderNotes, currentUser, appliedCoupon, clearCart]);

  // --- Product Operations ---
  const addReview = useCallback((productId: string) => {
    if (!currentUser) {
      alert('Please login to leave a review');
      return;
    }
    
    if (!reviewData.title.trim() || !reviewData.comment.trim()) {
      alert('Please fill in all review fields');
      return;
    }
    
    const newReview: Review = {
      id: generateId(),
      productId,
      userId: currentUser.id,
      userName: currentUser.fullName || currentUser.username,
      rating: reviewData.rating,
      title: reviewData.title.trim(),
      comment: reviewData.comment.trim(),
      images: [],
      helpful: 0,
      createdAt: getCurrentTimestamp(),
      verifiedPurchase: true,
    };
    
    // Update product with review (in a real app, this would be an API call)
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const currentRating = p.rating;
        const currentCount = p.reviewCount;
        const newRating = (currentRating * currentCount + reviewData.rating) / (currentCount + 1);
        return {
          ...p,
          rating: Math.round(newRating * 10) / 10,
          reviewCount: currentCount + 1,
        };
      }
      return p;
    }));
    
    setReviewData({ rating: 5, title: '', comment: '' });
    alert('Review submitted successfully!');
  }, [currentUser, reviewData]);

  // --- Filtering & Sorting ---
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.tags.some(t => t.toLowerCase().includes(term))
      );
    }
    
    // Price range
    filtered = filtered.filter(p => 
      p.price >= priceRange[0] && p.price <= priceRange[1]
    );
    
    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    
    return filtered;
  }, [products, selectedCategory, searchTerm, priceRange, sortBy]);

  // --- Render Functions ---
  const renderProductCard = (product: Product) => (
    <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-gray-100">
      <div 
        className="h-64 overflow-hidden cursor-pointer relative"
        onClick={() => {
          setSelectedProduct(product);
          setViewMode('product');
        }}
      >
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        {product.discountPercentage && product.discountPercentage > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{product.discountPercentage}%
          </div>
        )}
        {product.isFeatured && (
          <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">
            ★ Featured
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">{product.brand}</span>
          <div className="flex items-center gap-1">
            <span className="text-yellow-400">★</span>
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-xs text-gray-400">({product.reviewCount})</span>
          </div>
        </div>
        <h3 
          className="font-semibold text-gray-800 mb-1 hover:text-blue-600 cursor-pointer line-clamp-1"
          onClick={() => {
            setSelectedProduct(product);
            setViewMode('product');
          }}
        >
          {product.name}
        </h3>
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-blue-600">{formatCurrency(product.price)}</span>
            {product.originalPrice && (
              <span className="ml-2 text-sm text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
          <button
            onClick={() => addToCart(product.id)}
            disabled={!product.inStock}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
              product.inStock 
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {product.tags.slice(0, 2).map(tag => (
            <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProductDetail = () => {
    if (!selectedProduct) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
        <button
          onClick={() => {
            setViewMode('store');
            setSelectedProduct(null);
          }}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Store
        </button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div>
            <div className="h-96 rounded-lg overflow-hidden">
              <img 
                src={selectedProduct.images[0]} 
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            {selectedProduct.images.length > 1 && (
              <div className="flex gap-2 mt-4">
                {selectedProduct.images.slice(1).map((img, idx) => (
                  <div key={idx} className="h-20 w-20 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500">
                    <img src={img} alt={`${selectedProduct.name} view ${idx + 2}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-500">{selectedProduct.brand}</span>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500">{selectedProduct.category}</span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{selectedProduct.name}</h1>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                <span className="text-yellow-400 text-lg">★</span>
                <span className="text-xl font-bold">{selectedProduct.rating}</span>
                <span className="text-gray-400">({selectedProduct.reviewCount} reviews)</span>
              </div>
              {selectedProduct.inStock ? (
                <span className="text-green-600 text-sm font-medium">✓ In Stock</span>
              ) : (
                <span className="text-red-600 text-sm font-medium">✗ Out of Stock</span>
              )}
            </div>
            
            <div className="mb-4">
              <span className="text-3xl font-bold text-blue-600">{formatCurrency(selectedProduct.price)}</span>
              {selectedProduct.originalPrice && (
                <span className="ml-3 text-lg text-gray-400 line-through">
                  {formatCurrency(selectedProduct.originalPrice)}
                </span>
              )}
              {selectedProduct.discountPercentage && selectedProduct.discountPercentage > 0 && (
                <span className="ml-3 bg-red-100 text-red-600 text-sm font-bold px-2 py-1 rounded">
                  Save {selectedProduct.discountPercentage}%
                </span>
              )}
            </div>
            
            <p className="text-gray-600 mb-4 leading-relaxed">{selectedProduct.description}</p>
            
            {/* Specifications */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-2">Specifications</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600">{key}</span>
                    <span className="text-gray-800 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => {
                addToCart(selectedProduct.id);
                alert('Added to cart!');
              }}
              disabled={!selectedProduct.inStock}
              className={`w-full py-3 rounded-lg text-lg font-semibold transition-colors ${
                selectedProduct.inStock
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {selectedProduct.inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>
        
        {/* Reviews Section */}
        <div className="mt-12 border-t pt-8">
          <h3 className="text-2xl font-bold mb-6">Reviews</h3>
          
          {currentUser && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Write a Review</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rating</label>
                  <div className="flex gap-2 mt-1">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setReviewData(prev => ({ ...prev, rating }))}
                        className={`text-2xl transition-colors ${
                          rating <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={reviewData.title}
                    onChange={(e) => setReviewData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Review title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Comment</label>
                  <textarea
                    value={reviewData.comment}
                    onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Your review..."
                  />
                </div>
                <button
                  onClick={() => addReview(selectedProduct.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-colors"
                >
                  Submit Review
                </button>
              </div>
            </div>
          )}
          
          {/* Sample reviews - in a real app, these would be loaded from the product */}
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold">John D.</span>
                  <div className="text-yellow-400">★★★★★</div>
                </div>
                <span className="text-xs text-gray-500">2 days ago</span>
              </div>
              <h5 className="font-medium mb-1">Amazing product!</h5>
              <p className="text-gray-600 text-sm">Exceeded my expectations. The quality is top-notch.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCart = () => {
    if (!cart || cart.items.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-2xl font-bold text-gray-700 mb-2">Your Cart is Empty</h3>
          <p className="text-gray-500 mb-4">Browse our products and add items to your cart</p>
          <button
            onClick={() => setViewMode('store')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <button
          onClick={() => setViewMode('store')}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Continue Shopping
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Your Cart ({cart.items.length} items)</h2>
        
        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {cart.items.map(item => (
            <div key={item.productId} className="flex flex-col md:flex-row gap-4 border-b pb-4">
              <div className="h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden">
                <img 
                  src={item.product.images[0]} 
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{item.product.name}</h4>
                <p className="text-sm text-gray-500">{item.product.brand}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full font-bold"
                    >
                      -
                    </button>
                    <span className="text-lg font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full font-bold"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-blue-600">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="block text-red-500 text-xs hover:text-red-700 mt-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Cart Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatCurrency(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax (8%)</span>
            <span className="font-medium">{formatCurrency(cart.tax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">
              {cart.shipping === 0 ? 'FREE' : formatCurrency(cart.shipping)}
            </span>
          </div>
          {cart.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(cart.discount)}</span>
            </div>
          )}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-blue-600">{formatCurrency(cart.total)}</span>
            </div>
          </div>
        </div>
        
        {/* Coupon Section */}
        <div className="mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter coupon code"
              className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              disabled={!!appliedCoupon}
            />
            {appliedCoupon ? (
              <button
                onClick={removeCoupon}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md transition-colors"
              >
                Remove
              </button>
            ) : (
              <button
                onClick={applyCoupon}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
              >
                Apply
              </button>
            )}
          </div>
          {appliedCoupon && (
            <p className="text-sm text-green-600 mt-1">
              Coupon {appliedCoupon.code} applied! You saved {formatCurrency(cart.discount)}
            </p>
          )}
        </div>
        
        <button
          onClick={() => setViewMode('checkout')}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-lg transition-colors"
        >
          Proceed to Checkout
        </button>
      </div>
    );
  };

  const renderCheckout = () => (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      <button
        onClick={() => setViewMode('cart')}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
      >
        ← Back to Cart
      </button>
      
      <h2 className="text-2xl font-bold mb-6">Checkout</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Shipping Address */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First Name *"
                value={shippingAddress.firstName}
                onChange={(e) => setShippingAddress(prev => ({ ...prev, firstName: e.target.value }))}
                className="border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Last Name *"
                value={shippingAddress.lastName}
                onChange={(e) => setShippingAddress(prev => ({ ...prev, lastName: e.target.value }))}
                className="border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input
              type="email"
              placeholder="Email *"
              value={shippingAddress.email}
              onChange={(e) => setShippingAddress(prev => ({ ...prev, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="tel"
              placeholder="Phone *"
              value={shippingAddress.phone}
              onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Address *"
              value={shippingAddress.address}
              onChange={(e) => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="City *"
              value={shippingAddress.city}
              onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="State *"
                value={shippingAddress.state}
                onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                className="border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Zip Code *"
                value={shippingAddress.zipCode}
                onChange={(e) => setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                className="border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            {cart?.items.map(item => (
              <div key={item.productId} className="flex justify-between py-2 border-b last:border-0">
                <span>{item.product.name} × {item.quantity}</span>
                <span className="font-medium">{formatCurrency(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatCurrency(cart?.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span>{formatCurrency(cart?.tax || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span>{cart?.shipping === 0 ? 'FREE' : formatCurrency(cart?.shipping || 0)}</span>
            </div>
            {cart?.discount && cart.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(cart.discount)}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-blue-600">{formatCurrency(cart?.total || 0)}</span>
              </div>
            </div>
          </div>
          
          {/* Payment Method */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Payment Method</h4>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="credit_card">Credit Card</option>
              <option value="paypal">PayPal</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash_on_delivery">Cash on Delivery</option>
            </select>
          </div>
          
          {/* Order Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Order Notes (Optional)</label>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Special instructions or delivery notes..."
            />
          </div>
          
          <button
            onClick={placeOrder}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-lg transition-colors"
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6">My Orders</h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No orders yet</p>
          <button
            onClick={() => setViewMode('store')}
            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            Start Shopping →
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="border rounded-lg p-4">
              <div className="flex flex-wrap justify-between items-start mb-3">
                <div>
                  <span className="font-semibold">Order #{order.id.slice(-6).toUpperCase()}</span>
                  <div className="text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                    order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                    order.paymentStatus === 'refunded' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.paymentStatus.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.product.name} × {item.quantity}</span>
                    <span className="font-medium">{formatCurrency(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t mt-3 pt-3 flex justify-between">
                <div className="text-sm text-gray-500">
                  {order.trackingNumber && (
                    <div>Tracking: #{order.trackingNumber}</div>
                  )}
                </div>
                <div className="font-bold text-blue-600">
                  Total: {formatCurrency(order.total)}
                </div>
              </div>
              
              {/* Order Actions */}
              <div className="mt-3 flex gap-2">
                {order.status === 'delivered' && (
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Write a Review
                  </button>
                )}
                {order.status === 'pending' && (
                  <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStore = () => (
    <div>
      {/* Category Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Home & Kitchen">Home & Kitchen</option>
            <option value="Accessories">Accessories</option>
            <option value="Sports & Outdoors">Sports & Outdoors</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          {showFilters ? 'Hide Filters ▲' : 'Show Filters ▼'}
        </button>
        
        <button
          onClick={() => setViewMode('cart')}
          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-4 rounded-md transition-colors flex items-center gap-2"
        >
          🛒 Cart {cart && cart.items.length > 0 && `(${cart.items.length})`}
        </button>
        
        <button
          onClick={() => setViewMode('orders')}
          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-1 px-4 rounded-md transition-colors"
        >
          📦 Orders
        </button>
      </div>
      
      {/* Price Range Filter */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-8">
          <h4 className="font-medium mb-2">Price Range</h4>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="flex-1"
            />
            <span className="text-sm font-medium">
              ${priceRange[0]} - ${priceRange[1]}
            </span>
          </div>
        </div>
      )}
      
      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 text-lg">No products found</p>
          <p className="text-gray-400 text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(renderProductCard)}
        </div>
      )}
    </div>
  );

  // --- Main Render ---
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <span>🛍️</span> E-Commerce Store
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                Day 4
              </span>
            </h1>
            <p className="text-gray-600 mt-1">Shop our curated collection of premium products</p>
          </div>
          {currentUser && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Welcome, {currentUser.fullName}</span>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {currentUser.fullName.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
        
        {/* Main Content */}
        {viewMode === 'store' && renderStore()}
        {viewMode === 'product' && renderProductDetail()}
        {viewMode === 'cart' && renderCart()}
        {viewMode === 'checkout' && renderCheckout()}
        {viewMode === 'orders' && renderOrders()}
        
        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-500 border-t pt-6">
          <p>© 2026 E-Commerce Store - Day 4 Complete System</p>
          <p className="mt-1">Built with Next.js, TypeScript, and Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}

// Helper function that was missing
function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}