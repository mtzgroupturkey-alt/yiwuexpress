-- ========================================
-- VERIFY E-COMMERCE DATABASE TABLES
-- Run this in pgAdmin Query Tool
-- ========================================

-- Make sure you're connected to the 'ecommerce' database!

-- 1. Count total tables
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Expected: 21

-- 2. List all tables with row counts
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Show tables with record counts
SELECT 
    'users' as table_name, 
    COUNT(*) as record_count 
FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'carts', COUNT(*) FROM carts
UNION ALL
SELECT 'cart_items', COUNT(*) FROM cart_items
UNION ALL
SELECT 'countries', COUNT(*) FROM countries
UNION ALL
SELECT 'shipping_rates', COUNT(*) FROM shipping_rates
UNION ALL
SELECT 'wholesale_inquiries', COUNT(*) FROM wholesale_inquiries
UNION ALL
SELECT 'addresses', COUNT(*) FROM addresses
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes
UNION ALL
SELECT 'shipments', COUNT(*) FROM shipments
UNION ALL
SELECT 'company_infos', COUNT(*) FROM company_infos
UNION ALL
SELECT 'system_settings', COUNT(*) FROM system_settings
UNION ALL
SELECT 'permission_roles', COUNT(*) FROM permission_roles
UNION ALL
SELECT 'role_permissions', COUNT(*) FROM role_permissions
UNION ALL
SELECT 'user_permissions', COUNT(*) FROM user_permissions
UNION ALL
SELECT 'order_exceptions', COUNT(*) FROM order_exceptions
ORDER BY table_name;

-- 4. Show sample products
SELECT 
    id,
    sku,
    name,
    price,
    stock,
    "isActive"
FROM products
ORDER BY "createdAt" DESC
LIMIT 10;

-- 5. Show sample users
SELECT 
    id,
    email,
    name,
    role,
    "createdAt"
FROM users
ORDER BY "createdAt" DESC;

-- 6. Show categories
SELECT 
    id,
    name,
    slug,
    "isActive"
FROM categories
ORDER BY name;

-- 7. Show countries
SELECT 
    id,
    code,
    name,
    currency,
    flag,
    "isActive"
FROM countries
ORDER BY name;

-- Expected Results:
-- ✓ 21 tables total
-- ✓ 4 users (including test accounts)
-- ✓ 5 products
-- ✓ 3 categories
-- ✓ 2 countries
-- ✓ Total ~27 records across all tables
