// app/analytics/page.tsx
// Complete Analytics Dashboard with Charts, Data Visualization, KPIs & Real-time Metrics
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- TypeScript Interfaces ---
interface Metric {
  id: string;
  name: string;
  value: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
  category: 'revenue' | 'users' | 'engagement' | 'performance';
  icon: string;
  description: string;
  historicalData: HistoricalDataPoint[];
  target: number;
  progress: number;
}

interface HistoricalDataPoint {
  date: string;
  value: number;
  label: string;
}

interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'radar' | 'scatter';
  data: ChartDataset[];
  labels: string[];
  description: string;
  unit: string;
}

interface ChartDataset {
  label: string;
  data: number[];
  color: string;
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
}

interface KPI {
  id: string;
  name: string;
  value: number;
  formattedValue: string;
  change: number;
  changePercentage: number;
  isPositive: boolean;
  icon: string;
  description: string;
  category: 'financial' | 'operational' | 'customer' | 'growth';
}

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  createdAt: string;
  updatedAt: string;
  data: any;
  isShared: boolean;
  viewCount: number;
}

interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  duration: number;
  page: string;
  device: string;
  location: string;
  ipAddress: string;
}

interface SalesData {
  id: string;
  product: string;
  revenue: number;
  units: number;
  date: string;
  region: string;
  category: string;
  channel: 'online' | 'retail' | 'wholesale';
}

// --- Utility Functions ---
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number): string => {
  if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
  return value.toString();
};

const formatPercent = (value: number): string => {
  return value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
};

const getTrendColor = (trend: 'up' | 'down' | 'stable'): string => {
  return trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-yellow-600';
};

const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
  return trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
};

const getRandomColor = (): string => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
    '#8B5CF6', '#D946EF', '#0EA5E9', '#22C55E', '#EAB308',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// --- Mock Data Generation ---
const generateHistoricalData = (days: number = 30, base: number = 100, volatility: number = 0.2): HistoricalDataPoint[] => {
  const data: HistoricalDataPoint[] = [];
  let value = base;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.5) * volatility * value;
    value = Math.max(0, value + change);
    data.push({
      date: date.toISOString(),
      value: Math.round(value * 100) / 100,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }
  
  return data;
};

const generateRandomKPI = (base: number, variance: number, isPositive: boolean): number => {
  const change = (Math.random() - 0.3) * variance;
  return Math.round((base + change) * 10) / 10;
};

const generateSalesData = (): SalesData[] => {
  const products = ['Laptop', 'Phone', 'Tablet', 'Headphones', 'Smartwatch'];
  const regions = ['North America', 'Europe', 'Asia Pacific', 'South America', 'Africa'];
  const channels: ('online' | 'retail' | 'wholesale')[] = ['online', 'retail', 'wholesale'];
  const categories = ['Electronics', 'Accessories', 'Wearables', 'Audio'];
  
  const data: SalesData[] = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);
  
  for (let i = 0; i < 100; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + Math.floor(Math.random() * 90));
    data.push({
      id: generateId(),
      product: products[Math.floor(Math.random() * products.length)],
      revenue: Math.round((Math.random() * 1000 + 100) * 100) / 100,
      units: Math.floor(Math.random() * 50) + 1,
      date: date.toISOString(),
      region: regions[Math.floor(Math.random() * regions.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      channel: channels[Math.floor(Math.random() * channels.length)],
    });
  }
  
  return data;
};

const generateUserActivity = (count: number = 50): UserActivity[] => {
  const actions = ['Login', 'Logout', 'View Dashboard', 'Click Button', 'Submit Form', 'Download Report', 'Upload File'];
  const pages = ['/dashboard', '/analytics', '/settings', '/profile', '/blog', '/store', '/social'];
  const devices = ['Desktop', 'Mobile', 'Tablet'];
  const locations = ['New York', 'London', 'Tokyo', 'Sydney', 'Paris', 'Berlin', 'Singapore'];
  
  const activities: UserActivity[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setMinutes(date.getMinutes() - Math.floor(Math.random() * 60 * 24));
    activities.push({
      id: generateId(),
      userId: generateId(),
      userName: `User ${Math.floor(Math.random() * 100)}`,
      action: actions[Math.floor(Math.random() * actions.length)],
      timestamp: date.toISOString(),
      duration: Math.floor(Math.random() * 300) + 10,
      page: pages[Math.floor(Math.random() * pages.length)],
      device: devices[Math.floor(Math.random() * devices.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    });
  }
  
  return activities;
};

// --- Main Component ---
export default function AnalyticsPage() {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  
  // Metrics Data
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  // UI States
  const [viewMode, setViewMode] = useState<'dashboard' | 'reports' | 'detail' | 'settings'>('dashboard');
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter States
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  });

  // --- Effects ---
  useEffect(() => {
    setIsClient(true);
    setIsLoading(true);
    
    // Load user
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user:', error);
      }
    }
    
    // Load or generate data
    const storedData = localStorage.getItem('analytics_data');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setMetrics(parsed.metrics || generateMetrics());
        setKpis(parsed.kpis || generateKPIs());
        setChartData(parsed.chartData || generateChartData());
        setSalesData(parsed.salesData || generateSalesData());
        setUserActivity(parsed.userActivity || generateUserActivity());
        setReports(parsed.reports || generateReports());
      } catch (error) {
        initializeData();
      }
    } else {
      initializeData();
    }
    
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const initializeData = () => {
    const newMetrics = generateMetrics();
    const newKpis = generateKPIs();
    const newChartData = generateChartData();
    
    setMetrics(newMetrics);
    setKpis(newKpis);
    setChartData(newChartData);
    setSalesData(generateSalesData());
    setUserActivity(generateUserActivity());
    setReports(generateReports());
    
    // Save to localStorage
    localStorage.setItem('analytics_data', JSON.stringify({
      metrics: newMetrics,
      kpis: newKpis,
      chartData: newChartData,
      salesData: generateSalesData(),
      userActivity: generateUserActivity(),
      reports: generateReports(),
    }));
  };

  const generateMetrics = (): Metric[] => {
    const now = getCurrentTimestamp();
    const revenueHistory = generateHistoricalData(30, 10000, 0.15);
    const usersHistory = generateHistoricalData(30, 5000, 0.1);
    const engagementHistory = generateHistoricalData(30, 75, 0.08);
    
    return [
      {
        id: generateId(),
        name: 'Total Revenue',
        value: 1258437.50,
        change: 12.5,
        changePercentage: 12.5,
        trend: 'up',
        category: 'revenue',
        icon: '💰',
        description: 'Total revenue generated this period',
        historicalData: revenueHistory,
        target: 1500000,
        progress: 83.9,
      },
      {
        id: generateId(),
        name: 'Active Users',
        value: 8432,
        change: 8.3,
        changePercentage: 8.3,
        trend: 'up',
        category: 'users',
        icon: '👥',
        description: 'Number of active users',
        historicalData: usersHistory,
        target: 10000,
        progress: 84.3,
      },
      {
        id: generateId(),
        name: 'Engagement Rate',
        value: 67.8,
        change: -2.1,
        changePercentage: -2.1,
        trend: 'down',
        category: 'engagement',
        icon: '📊',
        description: 'User engagement rate',
        historicalData: engagementHistory,
        target: 75,
        progress: 90.4,
      },
      {
        id: generateId(),
        name: 'Conversion Rate',
        value: 3.45,
        change: 0.8,
        changePercentage: 0.8,
        trend: 'up',
        category: 'performance',
        icon: '🎯',
        description: 'Conversion rate from visitors to customers',
        historicalData: generateHistoricalData(30, 3.5, 0.05),
        target: 5,
        progress: 69,
      },
      {
        id: generateId(),
        name: 'Average Order Value',
        value: 149.99,
        change: 5.2,
        changePercentage: 5.2,
        trend: 'up',
        category: 'revenue',
        icon: '🛒',
        description: 'Average value per order',
        historicalData: generateHistoricalData(30, 145, 0.06),
        target: 180,
        progress: 83.3,
      },
      {
        id: generateId(),
        name: 'Customer Lifetime Value',
        value: 1240.00,
        change: 15.7,
        changePercentage: 15.7,
        trend: 'up',
        category: 'customer',
        icon: '💎',
        description: 'Average lifetime value of a customer',
        historicalData: generateHistoricalData(30, 1100, 0.12),
        target: 1500,
        progress: 82.7,
      },
    ];
  };

  const generateKPIs = (): KPI[] => {
    return [
      {
        id: generateId(),
        name: 'Total Revenue',
        value: 1258437.50,
        formattedValue: '$1.26M',
        change: 12.5,
        changePercentage: 12.5,
        isPositive: true,
        icon: '💰',
        description: 'Total revenue this period',
        category: 'financial',
      },
      {
        id: generateId(),
        name: 'Total Orders',
        value: 8427,
        formattedValue: '8,427',
        change: 8.9,
        changePercentage: 8.9,
        isPositive: true,
        icon: '📦',
        description: 'Total orders placed',
        category: 'operational',
      },
      {
        id: generateId(),
        name: 'Total Customers',
        value: 12543,
        formattedValue: '12,543',
        change: 15.3,
        changePercentage: 15.3,
        isPositive: true,
        icon: '👤',
        description: 'Total customer accounts',
        category: 'customer',
      },
      {
        id: generateId(),
        name: 'Growth Rate',
        value: 23.7,
        formattedValue: '23.7%',
        change: 3.2,
        changePercentage: 3.2,
        isPositive: true,
        icon: '📈',
        description: 'Overall growth rate',
        category: 'growth',
      },
      {
        id: generateId(),
        name: 'Bounce Rate',
        value: 32.4,
        formattedValue: '32.4%',
        change: -4.1,
        changePercentage: -4.1,
        isPositive: true,
        icon: '📉',
        description: 'Website bounce rate',
        category: 'performance',
      },
      {
        id: generateId(),
        name: 'Average Session Duration',
        value: 284,
        formattedValue: '4:44 min',
        change: 12.6,
        changePercentage: 12.6,
        isPositive: true,
        icon: '⏱️',
        description: 'Average session duration',
        category: 'engagement',
      },
    ];
  };

  const generateChartData = (): ChartData[] => {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonth - i + 12) % 12;
      last6Months.push(months[idx]);
    }
    
    return [
      {
        id: generateId(),
        title: 'Revenue Over Time',
        type: 'area',
        data: [
          {
            label: 'Revenue',
            data: [84000, 92000, 103000, 115000, 125000, 138000],
            color: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: '#3B82F6',
            fill: true,
          },
          {
            label: 'Target',
            data: [90000, 95000, 105000, 120000, 130000, 140000],
            color: '#EF4444',
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0)',
            fill: false,
          },
        ],
        labels: last6Months,
        description: 'Monthly revenue vs target',
        unit: '$',
      },
      {
        id: generateId(),
        title: 'User Acquisition Channels',
        type: 'pie',
        data: [
          {
            label: 'Organic Search',
            data: [45],
            color: '#3B82F6',
          },
          {
            label: 'Social Media',
            data: [25],
            color: '#EC4899',
          },
          {
            label: 'Direct',
            data: [15],
            color: '#10B981',
          },
          {
            label: 'Referrals',
            data: [10],
            color: '#F59E0B',
          },
          {
            label: 'Email',
            data: [5],
            color: '#8B5CF6',
          },
        ],
        labels: ['Organic Search', 'Social Media', 'Direct', 'Referrals', 'Email'],
        description: 'User acquisition channel distribution',
        unit: '%',
      },
      {
        id: generateId(),
        title: 'Monthly Sales Performance',
        type: 'bar',
        data: [
          {
            label: 'Online',
            data: [65000, 72000, 81000, 92000, 105000, 118000],
            color: '#3B82F6',
          },
          {
            label: 'Retail',
            data: [42000, 45000, 49000, 52000, 58000, 62000],
            color: '#10B981',
          },
          {
            label: 'Wholesale',
            data: [23000, 25000, 28000, 31000, 34000, 38000],
            color: '#F59E0B',
          },
        ],
        labels: last6Months,
        description: 'Sales by channel',
        unit: '$',
      },
      {
        id: generateId(),
        title: 'User Engagement Metrics',
        type: 'radar',
        data: [
          {
            label: 'Current',
            data: [85, 70, 90, 65, 80, 75],
            color: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
          },
          {
            label: 'Previous',
            data: [75, 65, 85, 70, 75, 80],
            color: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
          },
        ],
        labels: ['Retention', 'Engagement', 'Satisfaction', 'Loyalty', 'Referral', 'Growth'],
        description: 'User engagement comparison',
        unit: '%',
      },
      {
        id: generateId(),
        title: 'Product Category Performance',
        type: 'bar',
        data: [
          {
            label: 'Revenue',
            data: [450000, 350000, 280000, 220000, 180000],
            color: '#3B82F6',
          },
          {
            label: 'Units',
            data: [3200, 2800, 2100, 1800, 1200],
            color: '#10B981',
          },
        ],
        labels: ['Electronics', 'Accessories', 'Wearables', 'Audio', 'Books'],
        description: 'Revenue and units by category',
        unit: '$',
      },
    ];
  };

  const generateReports = (): Report[] => {
    return [
      {
        id: generateId(),
        name: 'Monthly Performance Report',
        description: 'Comprehensive analysis of monthly performance including revenue, users, and engagement metrics.',
        type: 'monthly',
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
        data: {},
        isShared: true,
        viewCount: 45,
      },
      {
        id: generateId(),
        name: 'Q4 Sales Analysis',
        description: 'Detailed breakdown of Q4 sales performance by region, product category, and channel.',
        type: 'custom',
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
        data: {},
        isShared: true,
        viewCount: 28,
      },
      {
        id: generateId(),
        name: 'User Engagement Dashboard',
        description: 'Weekly overview of user engagement metrics including session duration, bounce rate, and conversion.',
        type: 'weekly',
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
        data: {},
        isShared: false,
        viewCount: 12,
      },
      {
        id: generateId(),
        name: 'Growth Strategy Report',
        description: 'Analysis of growth drivers and recommendations for future growth initiatives.',
        type: 'custom',
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
        data: {},
        isShared: true,
        viewCount: 67,
      },
    ];
  };

  // --- Data Operations ---
  const updateMetrics = useCallback(() => {
    const newMetrics = generateMetrics();
    setMetrics(newMetrics);
    // Update localStorage
    const storedData = localStorage.getItem('analytics_data');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        parsed.metrics = newMetrics;
        localStorage.setItem('analytics_data', JSON.stringify(parsed));
      } catch (error) {
        console.error('Failed to update metrics:', error);
      }
    }
  }, []);

  const exportData = useCallback((format: 'csv' | 'json' | 'pdf') => {
    // In a real app, this would generate and download the file
    alert(`Exporting data in ${format.toUpperCase()} format...\n(This is a mock export)`);
    setShowExportModal(false);
  }, []);

  // --- Filtering ---
  const filteredSalesData = useMemo(() => {
    let filtered = [...salesData];
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(s => s.category === filterCategory);
    }
    
    if (filterRegion !== 'all') {
      filtered = filtered.filter(s => s.region === filterRegion);
    }
    
    if (filterChannel !== 'all') {
      filtered = filtered.filter(s => s.channel === filterChannel);
    }
    
    // Date range filter
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    filtered = filtered.filter(s => {
      const date = new Date(s.date);
      return date >= start && date <= end;
    });
    
    return filtered;
  }, [salesData, filterCategory, filterRegion, filterChannel, dateRange]);

  // --- Render Functions ---
  const renderMetricCard = (metric: Metric) => (
    <div key={metric.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{metric.icon}</span>
        <span className={`text-sm font-semibold ${getTrendColor(metric.trend)}`}>
          {getTrendIcon(metric.trend)} {formatPercent(metric.changePercentage)}
        </span>
      </div>
      <h3 className="text-gray-500 text-sm font-medium">{metric.name}</h3>
      <p className="text-2xl font-bold text-gray-800">{formatNumber(metric.value)}</p>
      <div className="mt-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress to target</span>
          <span>{metric.progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 rounded-full h-2 transition-all duration-500"
            style={{ width: `${Math.min(100, metric.progress)}%` }}
          />
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">{metric.description}</p>
    </div>
  );

  const renderKPI = (kpi: KPI) => (
    <div key={kpi.id} className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-md p-4 border border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{kpi.icon}</span>
        <span className={`text-sm font-semibold ${kpi.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {kpi.isPositive ? '↑' : '↓'} {formatPercent(Math.abs(kpi.changePercentage))}
        </span>
      </div>
      <h4 className="text-gray-600 text-xs font-medium mt-1">{kpi.name}</h4>
      <p className="text-xl font-bold text-gray-800">{kpi.formattedValue}</p>
      <p className="text-xs text-gray-400 mt-1">{kpi.description}</p>
    </div>
  );

  const renderChart = (chart: ChartData) => {
    // This is a visual representation - in a real app, you'd use Chart.js or Recharts
    const maxValue = Math.max(...chart.data.flatMap(d => d.data));
    
    return (
      <div key={chart.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <h3 className="font-semibold text-gray-800 mb-2">{chart.title}</h3>
        <p className="text-xs text-gray-500 mb-4">{chart.description}</p>
        
        {/* Chart Visualization */}
        <div className="h-64 relative">
          <div className="flex items-end h-full gap-2">
            {chart.labels.map((label, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex flex-col items-end w-full">
                  {chart.data.map((dataset, datasetIndex) => {
                    const value = dataset.data[index] || 0;
                    const height = Math.max(5, (value / maxValue) * 100);
                    
                    if (chart.type === 'pie') {
                      return null; // Pie chart rendered differently
                    }
                    
                    if (chart.type === 'radar') {
                      return null; // Radar chart rendered differently
                    }
                    
                    return (
                      <div
                        key={datasetIndex}
                        className="w-full rounded-t"
                        style={{
                          height: `${height}%`,
                          backgroundColor: dataset.color,
                          opacity: 0.8,
                          minHeight: '4px',
                          marginTop: datasetIndex > 0 ? '-2px' : '0',
                        }}
                      >
                        <div className="text-xs text-white text-center opacity-0 hover:opacity-100 transition-opacity">
                          {chart.unit}{value.toFixed(0)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <span className="text-xs text-gray-500 mt-1">{label}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
          {chart.data.map((dataset, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: dataset.color }}
              />
              <span className="text-xs text-gray-600">{dataset.label}</span>
            </div>
          ))}
        </div>
        
        <button 
          onClick={() => {
            setSelectedChart(chart);
            setViewMode('detail');
          }}
          className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Details →
        </button>
      </div>
    );
  };

  const renderChartDetail = () => {
    if (!selectedChart) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <button
          onClick={() => {
            setViewMode('dashboard');
            setSelectedChart(null);
          }}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>
        
        <h2 className="text-2xl font-bold mb-2">{selectedChart.title}</h2>
        <p className="text-gray-500 mb-6">{selectedChart.description}</p>
        
        {/* Detailed Chart View */}
        <div className="h-96 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-6xl mb-4">📊</div>
            <p>Detailed chart visualization would appear here</p>
            <p className="text-sm">This is a placeholder for the full chart implementation</p>
            <p className="text-xs mt-2">
              Data: {selectedChart.data.map(d => d.label).join(', ')}
            </p>
          </div>
        </div>
        
        {/* Data Table */}
        <div className="mt-8">
          <h3 className="font-semibold mb-3">Data Table</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Label</th>
                  {selectedChart.data.map((dataset, idx) => (
                    <th key={idx} className="text-right py-2 px-3">{dataset.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedChart.labels.map((label, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{label}</td>
                    {selectedChart.data.map((dataset, dataIdx) => (
                      <td key={dataIdx} className="text-right py-2 px-3">
                        {selectedChart.unit}{dataset.data[idx]?.toFixed(1) || '0'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderReports = () => (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Reports</h2>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          + Generate Report
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map(report => (
          <div key={report.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-gray-800">{report.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{report.type.toUpperCase()}</span>
                  <span>•</span>
                  <span>Views: {report.viewCount}</span>
                  <span>•</span>
                  <span>{report.isShared ? '🌐 Shared' : '🔒 Private'}</span>
                </div>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUserActivity = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Recent User Activity</h3>
        <span className="text-xs text-gray-400">{userActivity.length} activities</span>
      </div>
      
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {userActivity.slice(0, 10).map(activity => (
          <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded transition-colors">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold">
              {activity.userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{activity.userName}</span>
                <span className="text-xs text-gray-500">{activity.action}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{activity.page}</span>
                <span>•</span>
                <span>{activity.device}</span>
                <span>•</span>
                <span>{activity.location}</span>
                <span>•</span>
                <span>{formatDate(activity.timestamp)}</span>
              </div>
            </div>
            <span className="text-xs text-gray-400">{activity.duration}s</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSalesData = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Sales Data</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={updateMetrics}
            className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Accessories">Accessories</option>
          <option value="Wearables">Wearables</option>
          <option value="Audio">Audio</option>
        </select>
        
        <select
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
          className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Regions</option>
          <option value="North America">North America</option>
          <option value="Europe">Europe</option>
          <option value="Asia Pacific">Asia Pacific</option>
        </select>
        
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Channels</option>
          <option value="online">Online</option>
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
        </select>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-3">Product</th>
              <th className="text-right py-2 px-3">Revenue</th>
              <th className="text-right py-2 px-3">Units</th>
              <th className="text-left py-2 px-3">Region</th>
              <th className="text-left py-2 px-3">Channel</th>
            </tr>
          </thead>
          <tbody>
            {filteredSalesData.slice(0, 10).map(sale => (
              <tr key={sale.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3 font-medium">{sale.product}</td>
                <td className="text-right py-2 px-3 text-green-600">{formatCurrency(sale.revenue)}</td>
                <td className="text-right py-2 px-3">{sale.units}</td>
                <td className="py-2 px-3">{sale.region}</td>
                <td className="py-2 px-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    sale.channel === 'online' ? 'bg-blue-100 text-blue-800' :
                    sale.channel === 'retail' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sale.channel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSalesData.length > 10 && (
          <p className="text-xs text-gray-400 mt-2">Showing 10 of {filteredSalesData.length} entries</p>
        )}
      </div>
    </div>
  );

  // Helper function
  function formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 7) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  }

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <span>📈</span> Analytics Dashboard
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                Day 6
              </span>
            </h1>
            <p className="text-gray-600 mt-1">Monitor performance metrics and data insights</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm p-1">
              {['7d', '30d', '90d', '1y'].map(range => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range as any)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    selectedTimeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => {
                setViewMode(viewMode === 'dashboard' ? 'reports' : 'dashboard');
              }}
              className="bg-white hover:bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
            >
              {viewMode === 'dashboard' ? '📄 Reports' : '📊 Dashboard'}
            </button>
            
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors"
            >
              📥 Export
            </button>
          </div>
        </div>

        {/* Main Content */}
        {viewMode === 'dashboard' ? (
          <div>
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {kpis.map(renderKPI)}
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {metrics.map(renderMetricCard)}
            </div>
            
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {chartData.map(renderChart)}
            </div>
            
            {/* Sales Data & User Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {renderSalesData()}
              </div>
              <div>
                {renderUserActivity()}
              </div>
            </div>
          </div>
        ) : (
          renderReports()
        )}
        
        {viewMode === 'detail' && renderChartDetail()}
        
        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Export Data</h3>
              <p className="text-gray-600 mb-4">Choose export format:</p>
              <div className="space-y-2">
                <button
                  onClick={() => exportData('csv')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-md transition-colors"
                >
                  📊 CSV (Spreadsheet)
                </button>
                <button
                  onClick={() => exportData('json')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-md transition-colors"
                >
                  📄 JSON (Developer)
                </button>
                <button
                  onClick={() => exportData('pdf')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-md transition-colors"
                >
                  📕 PDF (Report)
                </button>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-500 border-t pt-6">
          <p>© 2026 Analytics Dashboard - Day 6 Complete System</p>
          <p className="mt-1">Built with Next.js, TypeScript, and Tailwind CSS</p>
          <p className="mt-1">
            <button 
              onClick={updateMetrics}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Refresh Data
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}