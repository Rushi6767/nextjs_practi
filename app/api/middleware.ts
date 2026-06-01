// app/api-test/page.tsx
// API Testing Dashboard with Interactive Endpoint Tester
'use client';

import React, { useState, useEffect } from 'react';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: {
    message: string;
    code: string;
    timestamp: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

export default function ApiTestPage() {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [endpoint, setEndpoint] = useState('/users');
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [requestBody, setRequestBody] = useState('');
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [apiKey, setApiKey] = useState('test-api-key-123');

  const handleRequest = async () => {
    setLoading(true);
    setStatusCode(null);
    
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      };
      
      if (method !== 'GET' && requestBody) {
        options.body = requestBody;
      }
      
      const res = await fetch(`/api${endpoint}`, options);
      setStatusCode(res.status);
      
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Request failed',
          code: 'REQUEST_ERROR',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const endpoints = [
    { path: '/users', methods: ['GET', 'POST'] },
    { path: '/users/1', methods: ['GET', 'PUT', 'DELETE'] },
    { path: '/products', methods: ['GET', 'POST'] },
    { path: '/products/1', methods: ['GET', 'PUT', 'DELETE'] },
    { path: '/orders', methods: ['GET', 'POST'] },
    { path: '/orders/1', methods: ['GET', 'PUT', 'DELETE'] },
    { path: '/stats', methods: ['GET'] },
    { path: '/health', methods: ['GET'] },
    { path: '/docs', methods: ['GET'] },
    { path: '/generate-api-key', methods: ['POST'] },
  ];

  const getExampleBody = (endpoint: string, method: string): string => {
    if (method === 'GET') return '';
    
    switch (endpoint) {
      case '/users':
        return JSON.stringify({
          username: 'new_user',
          email: 'user@example.com',
          fullName: 'New User',
          password: 'SecurePass123!',
          role: 'user',
        }, null, 2);
      
      case '/products':
        return JSON.stringify({
          name: 'New Product',
          description: 'Product description here',
          price: 99.99,
          category: 'Electronics',
          inStock: true,
        }, null, 2);
      
      case '/orders':
        return JSON.stringify({
          userId: '2',
          items: [
            { productId: '1', quantity: 2 },
            { productId: '2', quantity: 1 },
          ],
          status: 'pending',
        }, null, 2);
      
      case '/users/1':
        return JSON.stringify({
          fullName: 'Updated User Name',
          role: 'admin',
        }, null, 2);
      
      case '/products/1':
        return JSON.stringify({
          price: 149.99,
          inStock: false,
        }, null, 2);
      
      case '/orders/1':
        return JSON.stringify({
          status: 'shipped',
        }, null, 2);
      
      default:
        return '';
    }
  };

  useEffect(() => {
    const body = getExampleBody(endpoint, method);
    setRequestBody(body);
  }, [endpoint, method]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <span>🔌</span> API Testing Dashboard
              <span className="text-sm font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                Day 7
              </span>
            </h1>
            <p className="text-gray-600 mt-1">Test and explore your API endpoints</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">API Key:</span>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h2 className="text-lg font-bold mb-4">Request</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
                  <select
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    {endpoints.map((ep) => (
                      <optgroup key={ep.path} label={ep.path}>
                        {ep.methods.map((m) => (
                          <option key={`${ep.path}-${m}`} value={ep.path}>
                            {m} {ep.path}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                  <div className="flex gap-2">
                    {['GET', 'POST', 'PUT', 'DELETE'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setMethod(m as any)}
                        className={`px-4 py-1 rounded-md text-sm font-medium transition-colors ${
                          method === m
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Request Body</label>
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    rows={8}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="JSON request body"
                  />
                </div>
                
                <button
                  onClick={handleRequest}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>

          {/* Response Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Response</h2>
                {statusCode && (
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    statusCode >= 200 && statusCode < 300
                      ? 'bg-green-100 text-green-800'
                      : statusCode >= 400
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    Status: {statusCode}
                  </span>
                )}
              </div>
              
              {response ? (
                <div>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </div>
                  
                  {/* Pagination Info */}
                  {response.pagination && (
                    <div className="mt-4 text-sm text-gray-500">
                      <p>Page {response.pagination.page} of {response.pagination.totalPages}</p>
                      <p>Showing {response.pagination.limit} of {response.pagination.total} items</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-6xl mb-4">🔍</p>
                  <p>Send a request to see the response</p>
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-3">Quick Tips</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="font-medium text-blue-800">Authentication</p>
                  <p className="text-blue-600">Use the API key header: <code className="bg-blue-100 px-1 rounded">x-api-key</code></p>
                  <p className="text-xs text-blue-500 mt-1">Default key: <code>test-api-key-123</code></p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <p className="font-medium text-green-800">Rate Limiting</p>
                  <p className="text-green-600">100 requests per minute per IP</p>
                  <p className="text-xs text-green-500 mt-1">Check <code>X-RateLimit-*</code> headers</p>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <p className="font-medium text-purple-800">Pagination</p>
                  <p className="text-purple-600">Use <code>page</code> and <code>limit</code> params</p>
                  <p className="text-xs text-purple-500 mt-1">Default: page=1, limit=20</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <p className="font-medium text-yellow-800">API Docs</p>
                  <p className="text-yellow-600">Visit <code>/api/docs</code> for documentation</p>
                  <p className="text-xs text-yellow-500 mt-1">Includes all endpoints and schemas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-500 border-t pt-6">
          <p>© 2026 API Routes System - Day 7 Complete System</p>
          <p className="mt-1">Built with Next.js API Routes, TypeScript, and Tailwind CSS</p>
          <p className="mt-1 text-gray-400">
            Try endpoints: /users, /products, /orders, /stats, /health, /docs
          </p>
        </div>
      </div>
    </div>
  );
}