# Homepage Fixes - Requirements

## Problem Statement

The homepage at http://localhost:8081/ has the following issues:
1. **Scrolling is not working** - Users cannot scroll down the page
2. **Products list is not displaying** - Should show all products from database, not just featured/new arrivals
3. **Parent categories not showing at top** - Should display parent categories list prominently

## User Story

As a **website visitor**
I want to **view all products and browse parent categories on the homepage**
So that **I can discover products and navigate the catalog easily**

## Functional Requirements

### FR1: Fix Scrolling Functionality
- Page must be scrollable vertically
- Remove any CSS overflow/height constraints preventing scroll
- Ensure smooth scroll behavior works

### FR2: Display All Products
- Homepage should fetch and display **all active products** from database
- Not limited to featured or new arrivals only
- Products should be paginated (load more or infinite scroll)
- Display format: grid layout, 4 columns on desktop, responsive

### FR3: Display Parent Categories at Top
- Show all parent categories (top-level categories with no parent)
- Display prominently near the top of the page, after hero
- Include category image/icon, name, and link
- Responsive grid: 4-6 categories per row on desktop

### FR4: Data Fetching
- Products: Fetch from `/api/products` endpoint
- Categories: Fetch parent categories from `/api/categories` endpoint
- Both should be cached and optimized with React Query

## Non-Functional Requirements

### NFR1: Performance
- Initial page load < 3 seconds
- Smooth scrolling performance (60fps)
- Lazy loading for images

### NFR2: Responsive Design
- Mobile: Stack categories and products (1-2 columns)
- Tablet: 2-3 columns
- Desktop: 4-6 columns

### NFR3: Accessibility
- Keyboard navigation support
- ARIA labels for screen readers
- Focus states visible

## Acceptance Criteria

### AC1: Scrolling Works
- [ ] User can scroll from top to bottom of homepage
- [ ] Scroll is smooth and performant
- [ ] No fixed height containers blocking scroll

### AC2: All Products Display
- [ ] Homepage shows all active products from database
- [ ] Products load in paginated/infinite scroll manner
- [ ] Grid layout is responsive
- [ ] Product cards show: image, name, price, category

### AC3: Parent Categories Display
- [ ] All parent categories are fetched and displayed
- [ ] Categories appear at top of page after hero section
- [ ] Each category shows: image/icon, name
- [ ] Categories are clickable and link to category page
- [ ] Responsive grid layout

### AC4: API Integration
- [ ] Products fetched from `/api/products`
- [ ] Categories fetched from `/api/categories?parent=null` or similar
- [ ] React Query caching implemented
- [ ] Loading states displayed
- [ ] Error states handled gracefully

## Technical Constraints

- Must use existing API endpoints
- Must maintain current design system (colors, fonts, spacing)
- Must not break existing features (hero, footer, navigation)
- Must use TypeScript
- Must use Tailwind CSS for styling

## Dependencies

- Existing API endpoints: `/api/products`, `/api/categories`
- React Query (@tanstack/react-query)
- Next.js 14+ app router
- Prisma ORM for database

## Out of Scope

- Product filtering/sorting (future enhancement)
- Category hierarchy navigation beyond parent level
- Product quick view/modal
- Shopping cart integration on homepage
