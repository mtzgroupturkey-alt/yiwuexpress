import { useState, useEffect } from "react";
import {
  Bell,
  MapPin,
  Search,
  Mic,
  Camera,
  SlidersHorizontal,
  Grid3x3,
  List,
  Home,
  FolderOpen,
  ShoppingCart,
  Package,
  User,
  Scan,
  ChevronDown,
  TrendingUp,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { ProductCard } from "./components/ProductCard";
import { FlashSaleCard } from "./components/FlashSaleCard";
import { ScrollArea } from "./components/ui/scroll-area";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./components/ui/carousel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";

// Mock Data
const categories = [
  { id: "electronics", name: "Electronics", emoji: "📱" },
  { id: "fashion", name: "Fashion", emoji: "👗" },
  { id: "grocery", name: "Grocery", emoji: "🍎" },
  { id: "home", name: "Home & Living", emoji: "🏠" },
  { id: "books", name: "Books", emoji: "📚" },
  { id: "gaming", name: "Gaming", emoji: "🎮" },
  { id: "sports", name: "Sports", emoji: "🏃" },
  { id: "automotive", name: "Automotive", emoji: "🚗" },
];

const recentSearches = ["Headphones", "Laptop", "Running Shoes", "Coffee Maker"];
const trendingSearches = ["iPhone 15", "Nike Air Max", "PS5 Controller"];

const flashSales = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMGhlYWRwaG9uZXMlMjBwcm9kdWN0fGVufDF8fHx8MTc4MjQ0NDY1N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    productName: "Premium Wireless Headphones",
    originalPrice: 299.99,
    currentPrice: 149.99,
    discount: 50,
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000 + 34 * 60 * 1000), // 2h 34m from now
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzbWFydHdhdGNoJTIwcHJvZHVjdHxlbnwxfHx8fDE3ODI1Nzc4MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    productName: "Smart Watch Pro",
    originalPrice: 399.99,
    currentPrice: 239.99,
    discount: 40,
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000 + 15 * 60 * 1000),
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBjb250cm9sbGVyJTIwcHJvZHVjdHxlbnwxfHx8fDE3ODI1Nzc4MDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    productName: "Gaming Controller Elite",
    originalPrice: 179.99,
    currentPrice: 107.99,
    discount: 40,
    endTime: new Date(Date.now() + 1 * 60 * 60 * 1000 + 45 * 60 * 1000),
  },
];

const products = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlbGVzcyUyMGhlYWRwaG9uZXMlMjBwcm9kdWN0fGVufDF8fHx8MTc4MjQ0NDY1N3ww&ixlib=rb-4.1.0&q=80&w=1080",
    name: "Premium Wireless Noise-Cancelling Headphones",
    price: 149.99,
    originalPrice: 299.99,
    rating: 4.5,
    reviews: 1243,
    isOnSale: true,
    installmentPrice: 49.99,
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzbWFydHdhdGNoJTIwcHJvZHVjdHxlbnwxfHx8fDE3ODI1Nzc4MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    name: "Smart Watch Pro - Health & Fitness Tracker",
    price: 239.99,
    originalPrice: 399.99,
    rating: 4.7,
    reviews: 892,
    isNew: true,
    isOnSale: true,
    stockCount: 3,
    installmentPrice: 79.99,
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBjb21wdXRlciUyMHByb2R1Y3R8ZW58MXx8fHwxNzgyNDU5MTUxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    name: "Ultra-Thin Laptop 15.6\" - Intel i7, 16GB RAM",
    price: 899.99,
    rating: 4.6,
    reviews: 567,
    isNew: true,
    installmentPrice: 299.99,
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1771726588700-e3baad15ae16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNpZ25lciUyMHNuZWFrZXJzJTIwcHJvZHVjdHxlbnwxfHx8fDE3ODI1Nzc4MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    name: "Premium Designer Sneakers - Limited Edition",
    price: 189.99,
    originalPrice: 249.99,
    rating: 4.8,
    reviews: 2341,
    isOnSale: true,
    stockCount: 5,
    installmentPrice: 63.33,
  },
  {
    id: "5",
    image: "https://images.unsplash.com/photo-1608354580875-30bd4168b351?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBtYWtlciUyMGFwcGxpYW5jZXxlbnwxfHx8fDE3ODI1Nzc4MDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    name: "Professional Espresso Coffee Maker Machine",
    price: 329.99,
    rating: 4.4,
    reviews: 445,
    installmentPrice: 109.99,
  },
  {
    id: "6",
    image: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBjb250cm9sbGVyJTIwcHJvZHVjdHxlbnwxfHx8fDE3ODI1Nzc4MDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    name: "Elite Gaming Controller with RGB Lighting",
    price: 107.99,
    originalPrice: 179.99,
    rating: 4.9,
    reviews: 1876,
    isOnSale: true,
    installmentPrice: 35.99,
  },
  {
    id: "7",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW1lcmElMjBsZW5zJTIwcHJvZHVjdHxlbnwxfHx8fDE3ODI1Nzc4MDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    name: "Professional Camera Lens 50mm f/1.8",
    price: 449.99,
    rating: 4.7,
    reviews: 334,
    isNew: true,
    stockCount: 2,
    installmentPrice: 149.99,
  },
  {
    id: "8",
    image: "https://images.unsplash.com/photo-1509762774605-f07235a08f1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWNrcGFjayUyMHRyYXZlbCUyMGJhZ3xlbnwxfHx8fDE3ODI1NzMzOTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    name: "Travel Backpack with USB Charging Port",
    price: 79.99,
    originalPrice: 129.99,
    rating: 4.6,
    reviews: 998,
    isOnSale: true,
    installmentPrice: 26.66,
  },
];

function App() {
  const [activeCategory, setActiveCategory] = useState("electronics");
  const [activeTab, setActiveTab] = useState("home");
  const [cartCount, setCartCount] = useState(3);
  const [notificationCount, setNotificationCount] = useState(5);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("popular");
  const [activeFilters, setActiveFilters] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [showRecentSearches, setShowRecentSearches] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Mobile Container */}
      <div className="max-w-[428px] mx-auto bg-white shadow-2xl min-h-screen relative pb-20">
        {/* Header - Sticky */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo */}
            <div className="text-xl font-bold text-[#1A3C5E]">ShopHub</div>

            {/* Right Icons */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative">
                <Bell className="w-5 h-5 text-gray-700" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-600">
                    {notificationCount}
                  </Badge>
                )}
              </button>

              {/* Profile Avatar */}
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Location Selector */}
          <div className="px-4 pb-2">
            <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
              <MapPin className="w-3 h-3" />
              <span>Deliver to: San Francisco, USA</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </header>

        {/* Search Experience */}
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          {/* Search Bar */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for products, brands, categories..."
                className="pl-10 pr-20 h-11 bg-gray-50 border-gray-200 focus:bg-white"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setShowRecentSearches(true)}
                onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
              />
              <div className="absolute right-2 flex gap-2">
                <button className="p-1.5 hover:bg-gray-100 rounded-full">
                  <Mic className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-1.5 hover:bg-gray-100 rounded-full">
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Recent & Trending Searches */}
            {showRecentSearches && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
                {/* Recent Searches */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">Recent Searches</p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-gray-200"
                      >
                        {search}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Trending Searches */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Trending Searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((search, index) => (
                      <Badge
                        key={index}
                        className="bg-[#F59E0B] hover:bg-[#D97706] cursor-pointer"
                      >
                        🔥 {search}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Navigation - Horizontal Scroll */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    activeCategory === category.id
                      ? "bg-[#1A3C5E] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{category.emoji}</span>
                  <span>{category.name}</span>
                </button>
              ))}
              <button className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 whitespace-nowrap">
                See All
              </button>
            </div>
          </ScrollArea>
        </div>

        {/* Main Content - Scrollable */}
        <div className="overflow-y-auto">
          {/* Flash Sale Carousel */}
          <div className="px-4 py-4 bg-gradient-to-r from-[#1A3C5E] to-[#2D5F8D]">
            <h2 className="text-lg font-bold text-white mb-3">⚡ Flash Sales</h2>
            <Carousel className="w-full">
              <CarouselContent>
                {flashSales.map((sale) => (
                  <CarouselItem key={sale.id}>
                    <FlashSaleCard {...sale} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-1 mt-3">
                {flashSales.map((_, index) => (
                  <div
                    key={index}
                    className="w-2 h-2 rounded-full bg-white/50"
                  />
                ))}
              </div>
            </Carousel>
          </div>

          {/* Filter & Sort Bar */}
          <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low-High</SelectItem>
                  <SelectItem value="price-high">Price: High-Low</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="relative">
                <SlidersHorizontal className="w-4 h-4 mr-1" />
                Filter
                {activeFilters > 0 && (
                  <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                    {activeFilters}
                  </Badge>
                )}
              </Button>
            </div>

            {/* View Toggle */}
            <div className="flex gap-1 ml-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${
                  viewMode === "grid"
                    ? "bg-[#1A3C5E] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${
                  viewMode === "list"
                    ? "bg-[#1A3C5E] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            {/* Load More */}
            <div className="mt-6 text-center">
              <Button variant="outline" className="w-full">
                Load More Products
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Tab Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto bg-white border-t border-gray-200 shadow-lg">
          <div className="grid grid-cols-5 h-16">
            {[
              { id: "home", icon: Home, label: "Home", badge: 0 },
              { id: "categories", icon: FolderOpen, label: "Categories", badge: 0 },
              { id: "cart", icon: ShoppingCart, label: "Cart", badge: cartCount },
              { id: "orders", icon: Package, label: "Orders", badge: 0 },
              { id: "profile", icon: User, label: "Profile", badge: 0 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 relative ${
                  activeTab === tab.id ? "text-[#1A3C5E]" : "text-gray-500"
                }`}
              >
                <div className="relative">
                  <tab.icon className="w-5 h-5" />
                  {tab.badge > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-600">
                      {tab.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px]">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Floating Action Button - Barcode Scanner */}
        <button className="fixed bottom-20 right-4 max-w-[428px] w-14 h-14 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110">
          <Scan className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

export default App;
