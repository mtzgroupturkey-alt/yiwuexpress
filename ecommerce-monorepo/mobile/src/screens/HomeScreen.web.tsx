// Web-specific Home Screen - Matches Figma Design Exactly
// This file is used when running on web platform (http://localhost:8081)

import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api.config';

const getEmojiForCategory = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('electric') || n.includes('phone') || n.includes('tech')) return '📱';
  if (n.includes('fashion') || n.includes('cloth') || n.includes('wear')) return '👗';
  if (n.includes('grocery') || n.includes('food') || n.includes('fruit')) return '🍎';
  if (n.includes('home') || n.includes('furniture') || n.includes('living')) return '🏠';
  if (n.includes('book') || n.includes('read')) return '📚';
  if (n.includes('shipping') || n.includes('logistics') || n.includes('cargo')) return '🚢';
  if (n.includes('customs') || n.includes('document')) return '📋';
  if (n.includes('warehouse')) return '🏭';
  if (n.includes('source') || n.includes('find')) return '🔍';
  return '📦';
};

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  emoji: string;
}

interface ProductData {
  id: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  thumbnail?: string | null;
  images?: string[];
  description?: string | null;
  hsCode?: string | null;
  weightKg?: number | null;
  countryOfOrigin?: string | null;
}

export default function HomeScreenWeb() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<{ companyName: string; companyLogo: string }>({
    companyName: 'YIWU EXPRESS',
    companyLogo: ''
  });
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [detailQuantity, setDetailQuantity] = useState<number>(1);
  const [quoteSuccess, setQuoteSuccess] = useState<boolean>(false);

  // Fetch settings on mount
  useEffect(() => {
    const apiBase = getApiUrl();
    fetch(`${apiBase}/settings`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.settings) {
          setSettings({
            companyName: res.settings.companyName || 'YIWU EXPRESS',
            companyLogo: res.settings.companyLogo || ''
          });
        }
      })
      .catch(err => console.log('Failed to fetch settings:', err));
  }, []);

  // Fetch categories from DB
  useEffect(() => {
    const apiBase = getApiUrl();
    fetch(`${apiBase}/categories?level=1`)
      .then(res => res.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          const fetchedCats = res.data.map((c: any) => ({
            id: c.slug,
            name: c.name,
            slug: c.slug,
            emoji: getEmojiForCategory(c.name)
          }));
          setCategories([
            { id: 'all', name: 'All', slug: 'all', emoji: '📦' },
            ...fetchedCats
          ]);
        } else {
          loadFallbackCategories();
        }
      })
      .catch(() => {
        loadFallbackCategories();
      });
  }, []);

  const loadFallbackCategories = () => {
    setCategories([
      { id: 'all', name: 'All', slug: 'all', emoji: '📦' },
      { id: 'electronics', name: 'Electronics', slug: 'electronics', emoji: '📱' },
      { id: 'fashion', name: 'Fashion', slug: 'fashion', emoji: '👗' },
      { id: 'grocery', name: 'Grocery', slug: 'grocery', emoji: '🍎' },
      { id: 'home', name: 'Home & Living', slug: 'home', emoji: '🏠' },
      { id: 'books', name: 'Books', slug: 'books', emoji: '📚' },
    ]);
  };

  // Fetch products with pagination
  useEffect(() => {
    setLoading(true);
    setError(null);
    const apiBase = getApiUrl();
    const categoryQuery = activeCategory !== 'all' ? `&category=${activeCategory}` : '';
    
    fetch(`${apiBase}/products?page=${page}&limit=10${categoryQuery}`)
      .then(res => {
        if (!res.ok) throw new Error('Network response error');
        return res.json();
      })
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          if (page === 1) {
            setProducts(res.data);
          } else {
            setProducts(prev => [...prev, ...res.data]);
          }
          // If less products returned than limit, we reached the end
          setHasMore(res.data.length === 10);
        } else {
          throw new Error('Invalid response structure');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load products:', err);
        setError('Failed to load products from database.');
        setLoading(false);
      });
  }, [page, activeCategory]);

  const handleCategorySelect = (slug: string) => {
    setActiveCategory(slug);
    setPage(1);
    setProducts([]);
    setHasMore(true);
  };

  const loadNextPage = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Scroll handler for infinite scroll pagination
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (selectedProduct) return; // disable pagination on details view
    const target = e.currentTarget;
    const threshold = 150; // trigger pagination 150px before reaching bottom
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + threshold;
    if (isAtBottom && !loading && hasMore) {
      loadNextPage();
    }
  };

  const handleProductClick = (product: ProductData) => {
    setSelectedProduct(product);
    setDetailQuantity(1);
    setQuoteSuccess(false);
  };

  const handleBackToHome = () => {
    setSelectedProduct(null);
  };

  const handleRequestQuote = () => {
    setQuoteSuccess(true);
    setTimeout(() => {
      setQuoteSuccess(false);
    }, 4000);
  };

  return (
    <div 
      onScroll={handleScroll}
      style={{
        height: '100vh',
        overflowY: 'auto',
        backgroundColor: '#F5F7FA',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Mobile Container */}
      <div style={{
        maxWidth: '428px',
        margin: '0 auto',
        backgroundColor: 'white',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        minHeight: '100vh',
        position: 'relative',
        paddingBottom: '100px'
      }}>
        
        {selectedProduct ? (
          /* PRODUCT DETAIL SCREEN */
          <div>
            {/* Header - Sticky */}
            <header style={{
              position: 'sticky',
              top: 0,
              zIndex: 50,
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px'
            }}>
              <button 
                onClick={handleBackToHome}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '22px',
                  cursor: 'pointer',
                  color: '#1A3C5E',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                ←
              </button>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#1A3C5E'
              }}>
                Product Details
              </div>
              <button style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>
            </header>

            {/* Product Image Section */}
            <div style={{
              position: 'relative',
              width: '100%',
              paddingTop: '100%', // 1:1 aspect ratio
              backgroundColor: '#f3f4f6'
            }}>
              {selectedProduct.thumbnail ? (
                <img 
                  src={selectedProduct.thumbnail} 
                  alt={selectedProduct.name}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
                }}>
                  <span style={{ fontSize: '72px' }}>📦</span>
                </div>
              )}
            </div>

            {/* Product Info Body */}
            <div style={{ padding: '20px' }}>
              {/* Rating and Reviews */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginBottom: '8px'
              }}>
                <span style={{ color: '#f59e0b', fontSize: '14px' }}>★★★★★</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>4.8</span>
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>(120 reviews)</span>
              </div>

              {/* Title */}
              <h1 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#111827',
                margin: '0 0 12px 0',
                lineHeight: '26px'
              }}>
                {selectedProduct.name}
              </h1>

              {/* Price and Badges */}
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <span style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1A3C5E'
                }}>${selectedProduct.price.toFixed(2)}</span>
                {selectedProduct.compareAtPrice && selectedProduct.compareAtPrice > selectedProduct.price && (
                  <span style={{
                    fontSize: '16px',
                    color: '#9ca3af',
                    textDecoration: 'line-through'
                  }}>${selectedProduct.compareAtPrice.toFixed(2)}</span>
                )}
                <span style={{
                  fontSize: '11px',
                  backgroundColor: '#EBF5FF',
                  color: '#1A3C5E',
                  fontWeight: 'bold',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}>
                  In Stock
                </span>
              </div>

              {/* Logistics & Product Specs Table */}
              <div style={{
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#374151',
                  margin: '0 0 12px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Logistics & Specs</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px 16px', fontSize: '13px' }}>
                  <div style={{ color: '#6b7280' }}>SKU:</div>
                  <div style={{ color: '#111827', fontWeight: '500' }}>{selectedProduct.sku || 'N/A'}</div>
                  
                  <div style={{ color: '#6b7280' }}>HS Code:</div>
                  <div style={{ color: '#111827', fontWeight: '500' }}>{selectedProduct.hsCode || 'N/A'}</div>
                  
                  <div style={{ color: '#6b7280' }}>Weight:</div>
                  <div style={{ color: '#111827', fontWeight: '500' }}>{selectedProduct.weightKg ? `${selectedProduct.weightKg} kg` : 'N/A'}</div>
                  
                  <div style={{ color: '#6b7280' }}>Origin:</div>
                  <div style={{ color: '#111827', fontWeight: '500' }}>{selectedProduct.countryOfOrigin || 'China'}</div>
                  
                  <div style={{ color: '#6b7280' }}>Estimated Delivery:</div>
                  <div style={{ color: '#22c55e', fontWeight: 'bold' }}>🕒 2-3 Days (Air Cargo)</div>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#111827',
                  margin: '0 0 8px 0'
                }}>Description</h3>
                <p style={{
                  fontSize: '13.5px',
                  color: '#4b5563',
                  lineHeight: '22px',
                  margin: 0
                }}>
                  {selectedProduct.description || 'No description provided. High-quality global trade goods sourced directly from Yiwu, China.'}
                </p>
              </div>

              {/* Quantity Selector */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 0',
                borderTop: '1px solid #e5e7eb',
                borderBottom: '1px solid #e5e7eb',
                marginBottom: '32px'
              }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>Order Quantity:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button 
                    disabled={detailQuantity <= 1}
                    onClick={() => setDetailQuantity(q => q - 1)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      fontSize: '18px',
                      cursor: detailQuantity <= 1 ? 'not-allowed' : 'pointer',
                      opacity: detailQuantity <= 1 ? 0.5 : 1
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', minWidth: '24px', textAlign: 'center' }}>
                    {detailQuantity}
                  </span>
                  <button 
                    onClick={() => setDetailQuantity(q => q + 1)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      fontSize: '18px',
                      cursor: 'pointer'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Success Notification Alert */}
              {quoteSuccess && (
                <div style={{
                  backgroundColor: '#ecfdf5',
                  color: '#065f46',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  border: '1px solid #a7f3d0',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  ✓ Quote Request submitted successfully!
                </div>
              )}

              {/* Call to Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={handleRequestQuote}
                  style={{
                    flex: 1,
                    backgroundColor: '#1A3C5E',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    height: '48px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                  onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  Request Quote
                </button>
                <button 
                  style={{
                    backgroundColor: '#F59E0B',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0 24px',
                    height: '48px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                  onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  🛒 Add to Cart
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* HOME SCREEN PRODUCT LIST */
          <div>
            {/* Header - Sticky */}
            <header style={{
              position: 'sticky',
              top: 0,
              zIndex: 50,
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              {/* Top Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px'
              }}>
                {/* Logo & Company Name */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {settings.companyLogo ? (
                    <img 
                      src={settings.companyLogo.startsWith('http') ? settings.companyLogo : `${getApiUrl().replace('/api', '')}${settings.companyLogo}`}
                      alt={settings.companyName}
                      style={{
                        height: '28px',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: '#1A3C5E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      YE
                    </div>
                  )}
                  <span style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#1A3C5E',
                    letterSpacing: '0.5px'
                  }}>
                    {settings.companyName}
                  </span>
                </div>

                {/* Right Icons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Notifications */}
                  <button style={{
                    position: 'relative',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>5</span>
                  </button>

                  {/* Profile Avatar */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#6b7280'
                  }}>
                    U
                  </div>
                </div>
              </div>

              {/* Location Selector */}
              <div style={{ padding: '0 16px 8px 16px' }}>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: '#6b7280',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 0'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>Deliver to: San Francisco, USA</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>
            </header>

            {/* Search Section */}
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <svg style={{
                    position: 'absolute',
                    left: '12px',
                    width: '16px',
                    height: '16px',
                    color: '#9ca3af'
                  }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search for products, brands, categories..."
                    style={{
                      width: '100%',
                      height: '44px',
                      paddingLeft: '40px',
                      paddingRight: '80px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <button style={{
                      padding: '6px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '50%'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                        <line x1="12" x2="12" y1="19" y2="22"/>
                      </svg>
                    </button>
                    <button style={{
                      padding: '6px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      borderRadius: '50%'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                        <circle cx="12" cy="13" r="3"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Categories - Horizontal Scroll */}
            <div style={{
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb',
              padding: '12px 16px',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}>
              <div style={{ display: 'inline-flex', gap: '8px' }}>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.slug)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      backgroundColor: activeCategory === cat.slug ? '#1A3C5E' : '#f3f4f6',
                      color: activeCategory === cat.slug ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Flash Sales Section */}
            <div style={{
              background: 'linear-gradient(to right, #1A3C5E, #2D5F8D)',
              padding: '16px'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '12px'
              }}>⚡ Flash Sales</h2>
              <div style={{
                overflowX: 'auto',
                display: 'flex',
                gap: '12px'
              }}>
                {[
                  { name: 'Wireless Headphones', price: 149.99, original: 299.99 },
                  { name: 'Smart Watch Pro', price: 239.99, original: 399.99 },
                ].map((item, idx) => (
                  <div key={idx} style={{
                    minWidth: '220px',
                    height: '290px',
                    borderRadius: '16px',
                    backgroundColor: '#334155',
                    padding: '16px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: '#F59E0B',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      ⚡ 50% OFF
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '16px',
                      right: '16px'
                    }}>
                      <p style={{
                        color: 'white',
                        fontSize: '11px',
                        marginBottom: '8px',
                        opacity: 0.9
                      }}>{item.name}</p>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                        <span style={{
                          color: 'white',
                          fontSize: '20px',
                          fontWeight: 'bold'
                        }}>${item.price}</span>
                        <span style={{
                          color: 'rgba(255,255,255,0.5)',
                          fontSize: '12px',
                          textDecoration: 'line-through'
                        }}>${item.original}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          padding: '6px',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>02</div>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>:</span>
                        <div style={{
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          padding: '6px',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>34</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter & Sort Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: 'white',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                <select style={{
                  width: '140px',
                  height: '36px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '0 8px',
                  fontSize: '14px'
                }}>
                  <option>Popular</option>
                  <option>Newest</option>
                  <option>Price: Low-High</option>
                </select>
                <button style={{
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}>
                  Filter
                </button>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button style={{
                  padding: '8px',
                  backgroundColor: '#1A3C5E',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                </button>
                <button style={{
                  padding: '8px',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                    <line x1="8" x2="21" y1="6" y2="6"/>
                    <line x1="8" x2="21" y1="12" y2="12"/>
                    <line x1="8" x2="21" y1="18" y2="18"/>
                    <line x1="3" x2="3.01" y1="6" y2="6"/>
                    <line x1="3" x2="3.01" y1="12" y2="12"/>
                    <line x1="3" x2="3.01" y1="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div style={{ padding: '16px', color: '#dc2626', textAlign: 'center', fontSize: '14px' }}>
                {error}
              </div>
            )}

            {/* Products Grid */}
            <div style={{ padding: '16px' }}>
              {products.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
                  <p style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</p>
                  <p style={{ fontSize: '14px' }}>No products found in this category.</p>
                </div>
              )}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}>
                {products.map((item) => {
                  const hasComparePrice = item.compareAtPrice && item.compareAtPrice > item.price;
                  const discount = hasComparePrice 
                    ? Math.round(((item.compareAtPrice! - item.price) / item.compareAtPrice!) * 100)
                    : 0;

                  return (
                    <div 
                      key={item.id} 
                      onClick={() => handleProductClick(item)}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        transition: 'transform 0.2s',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; }}
                    >
                      <div style={{
                        position: 'relative',
                        paddingTop: '100%', // 1:1 square ratio
                        backgroundColor: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        {item.thumbnail ? (
                          <img 
                            src={item.thumbnail} 
                            alt={item.name}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div style={{
                            position: 'absolute',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
                          }}>
                            <span style={{ fontSize: '36px' }}>📦</span>
                          </div>
                        )}
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          width: '28px',
                          height: '28px',
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                        </div>
                        {discount > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            backgroundColor: '#1A3C5E',
                            color: 'white',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            letterSpacing: '0.5px'
                          }}>
                            -{discount}%
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginBottom: '6px'
                        }}>
                          <span style={{ color: '#f59e0b', fontSize: '10px' }}>★</span>
                          <span style={{ fontSize: '10px', fontWeight: '600', color: '#374151' }}>4.5</span>
                          <span style={{ fontSize: '10px', color: '#9ca3af' }}>(24)</span>
                        </div>
                        <p style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#111827',
                          lineHeight: '16px',
                          marginBottom: '8px',
                          height: '32px',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {item.name}
                        </p>
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'space-between',
                          marginTop: 'auto'
                        }}>
                          <div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#111827'
                            }}>${item.price.toFixed(2)}</div>
                            {hasComparePrice && (
                              <div style={{
                                fontSize: '10px',
                                color: '#9ca3af',
                                textDecoration: 'line-through'
                              }}>${item.compareAtPrice!.toFixed(2)}</div>
                            )}
                            <div style={{
                              fontSize: '9px',
                              color: '#6b7280',
                              marginTop: '2px'
                        }}>🕒 2-3 days</div>
                          </div>
                          <button style={{
                            backgroundColor: '#1A3C5E',
                            color: 'white',
                            border: 'none',
                            borderRadius: '16px',
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}>
                            Quote
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Loading Indicator */}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid rgba(26,60,94,0.1)',
                  borderTopColor: '#1A3C5E',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <style>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}

            {/* Fallback Load More Button */}
            {!loading && hasMore && products.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 32px 0' }}>
                <button
                  onClick={loadNextPage}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #1A3C5E',
                    color: '#1A3C5E',
                    padding: '8px 24px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#1A3C5E';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#1A3C5E';
                  }}
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom Navigation */}
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: '428px',
          margin: '0 auto',
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          boxShadow: '0 -1px 3px 0 rgba(0, 0, 0, 0.1)',
          zIndex: 100
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            height: '64px'
          }}>
            {[
              { id: 'home', label: 'Home', badge: 0 },
              { id: 'categories', label: 'Categories', badge: 0 },
              { id: 'cart', label: 'Cart', badge: 3 },
              { id: 'orders', label: 'Orders', badge: 0 },
              { id: 'profile', label: 'Profile', badge: 0 },
            ].map((tab, index) => (
              <button
                key={tab.id}
                onClick={selectedProduct ? handleBackToHome : undefined}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: index === 0 && !selectedProduct ? '#1A3C5E' : '#9ca3af',
                  position: 'relative'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {index === 0 && <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>}
                  {index === 1 && <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>}
                  {index === 2 && <><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></>}
                  {index === 3 && <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/></>}
                  {index === 4 && <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}
                </svg>
                {tab.badge > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '25%',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>{tab.badge}</span>
                )}
                <span style={{ fontSize: '10px' }}>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* FAB - Barcode Scanner */}
        <button style={{
          position: 'fixed',
          bottom: '80px',
          right: '16px',
          width: '56px',
          height: '56px',
          backgroundColor: '#F59E0B',
          border: 'none',
          borderRadius: '50%',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 90
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
            <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
            <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
            <rect x="7" y="7" width="10" height="10" rx="1"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
