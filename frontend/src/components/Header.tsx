"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, ShoppingCart, User, LogOut, Package, Heart, Gift, AlertTriangle, Bell } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import api from '@/lib/api';

export function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cities, setCities] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCity, setSelectedCity] = useState(searchParams?.get('city') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [detectingCity, setDetectingCity] = useState(true);

  useEffect(() => {
    api.get('/cities').then(res => {
      const allCities = res.data.cities || [];
      setCities(allCities);

      // Auto-detect city from browser geolocation
      const saved = localStorage.getItem('detectedCity')
      if (saved) {
        setSelectedCity(saved)
        setDetectingCity(false)
        return
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords
            // Reverse geocode using free API
            fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
              .then(r => r.json())
              .then(data => {
                const detectedName = data.city || data.locality || data.principalSubdivision
                if (detectedName) {
                  const match = allCities.find((c: any) =>
                    detectedName.toLowerCase().includes(c.name.toLowerCase()) ||
                    c.name.toLowerCase().includes(detectedName.toLowerCase())
                  )
                  if (match) {
                    setSelectedCity(match.id)
                    localStorage.setItem('detectedCity', match.id)
                  }
                }
              })
              .catch(() => {})
              .finally(() => setDetectingCity(false))
          },
          () => setDetectingCity(false),
          { timeout: 5000 }
        )
      } else {
        setDetectingCity(false)
      }
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams?.toString());
    if (searchQuery) params.set('q', searchQuery);
    else params.delete('q');
    if (selectedCity) params.set('city', selectedCity);
    else params.delete('city');
    router.push(`/browse?${params.toString()}`);
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId);
    const params = new URLSearchParams(searchParams?.toString());
    if (cityId) params.set('city', cityId);
    else params.delete('city');
    router.push(`/browse?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/95">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">L</span>
          </div>
          <span className="text-xl font-bold gradient-text hidden md:inline-block">Lease</span>
        </Link>

        {/* Search & Location */}
        <form onSubmit={handleSearch} className="flex-1 flex items-center max-w-2xl gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="search"
              placeholder="Search laptops, ACs..."
              className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-full pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-full px-3 lg:px-4 py-1.5 min-w-[100px] lg:min-w-[140px] shadow-sm hover:border-primary-500 transition-all group">
            <MapPin className="h-4 w-4 text-primary-600 group-hover:scale-110 transition-transform" />
            <select
              className="bg-transparent border-none text-xs font-bold text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer outline-none w-full"
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
            >
              <option value="">Select City</option>
              {cities.map(city => (
                <option key={city.id} value={city.id} className="text-gray-900">{city.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="hidden">Search</button>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link href="/bookings">
            <Button variant="ghost" size="icon" className="relative">
              <Package className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/wishlist">
            <Button variant="ghost" size="icon" className="relative">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>
          <NotificationPanel />
          <Link href="/referrals">
            <Button variant="ghost" size="icon" className="relative">
              <Gift className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/disputes">
            <Button variant="ghost" size="icon" className="relative">
              <AlertTriangle className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Button>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
                  <User className="h-4 w-4" />
                  {user.firstName}
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
