# 🚀 YIWU EXPRESS - Quick Start Guide

## ✅ Sample Data Installation Complete!

Your store now has **29 products**, **174+ variants**, **5 hero slides**, and complete attributes system.

---

## 🌐 Access Your Store

### **Customer Frontend**
```
http://localhost:3001
```
- Browse products with photos
- View hero slider on homepage
- Test shopping cart
- Search and filter products

### **Admin Panel**
```
http://localhost:3001/admin
```
**Login Credentials:**
- Email: `admin@test.com`
- Password: `password123`

**Admin Features:**
- Manage products and variants
- Edit hero slides
- Configure categories
- View orders
- Manage inventory

### **Database Studio**
```bash
npm run db:studio
```
Opens at: http://localhost:5555
- View all database tables
- Edit records directly
- Query data

---

## 📦 What's Included

### Products by Category
| Category | Products | Example Items |
|----------|----------|---------------|
| **Cookware** | 4 | Non-Stick Pans, Stock Pots, Woks |
| **Bakeware** | 4 | Cake Pans, Muffin Tins, Baking Sheets |
| **Kitchen Utensils** | 3 | Utensil Sets, Chef Knives, Whisks |
| **Small Appliances** | 3 | Blenders, Toasters, Coffee Makers |
| **Tableware** | 3 | Dinner Sets, Wine Glasses, Flatware |
| **Electronics** | 4 | Headphones, Smartphones, Laptops |
| **Clothing** | 4 | T-Shirts, Jeans, Dresses, Shoes |
| **Furniture** | 4 | Office Chairs, Tables, Sofas, Beds |

### Hero Slides
1. **Premium Cookware** - NEW ARRIVAL
2. **Electronics** - HOT DEALS
3. **Fashion** - BESTSELLER
4. **Furniture** - PREMIUM QUALITY
5. **Wholesale** - WHOLESALE

---

## 🎯 Common Tasks

### Start Development Server
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run dev
```
Access at: http://localhost:3001

### Add More Products
```bash
npm run db:seed:products
```

### Reset Hero Slides
```bash
npm run db:seed:hero
```

### View Database
```bash
npm run db:studio
```

### Full Reset (All Data)
```bash
npm run db:seed
```

---

## 🛠️ File Locations

### Seeding Scripts
- **Products**: `web/prisma/seed-comprehensive-products.ts`
- **Hero Slides**: `web/prisma/seed-hero-slides.ts`
- **All Data**: `web/prisma/seed.ts`

### Documentation
- **Complete Guide**: `SAMPLE_DATA_COMPLETE.md`
- **Product Guide**: `COMPREHENSIVE_PRODUCTS_GUIDE.md`
- **This Guide**: `QUICK_START.md`

### Batch Files
- **Complete Setup**: `SETUP-COMPLETE-STORE.bat`
- **Products Only**: `SEED-PRODUCTS.bat`

---

## 💡 Quick Tips

### Testing Features
- **Search**: Try searching for "pan", "laptop", or "chair"
- **Filters**: Filter by category, price, or attributes
- **Variants**: Products have multiple size/color options
- **Cart**: Add items and test checkout flow
- **Wholesale**: Bulk order pricing is enabled

### Customization
- **Images**: Replace Unsplash URLs with your photos
- **Prices**: Update in admin panel or seeding scripts
- **Hero Slides**: Edit text, images, and CTAs in admin
- **Categories**: Add/edit in category management

### Development
- **Hot Reload**: Changes auto-refresh in dev mode
- **Prisma Studio**: Real-time database editor
- **Admin Panel**: Full CRUD operations
- **API Routes**: Test at `/api/products`, `/api/categories`

---

## 📊 Sample Data Stats

- **Total Products**: 29
- **Total Variants**: ~174
- **Total Categories**: 30 (including subcategories)
- **Hero Slides**: 5
- **Product Images**: High-quality 800x800 from Unsplash
- **Pricing Tiers**: Retail, Compare At, Cost, Wholesale
- **Attributes**: 7 types (Brand, Color, Size, Material, etc.)

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Change port in server.js or use:
npm run dev -- -p 3002
```

### Database Issues
```bash
# Reset database
npx prisma db push --force-reset

# Re-seed data
npm run db:seed
```

### Missing Dependencies
```bash
npm install
npx prisma generate
```

---

## 📞 Support

For issues or questions:
1. Check `SAMPLE_DATA_COMPLETE.md` for detailed documentation
2. Review `COMPREHENSIVE_PRODUCTS_GUIDE.md` for product details
3. Inspect database with `npm run db:studio`

---

**🌟 Enjoy building with YIWU EXPRESS!**