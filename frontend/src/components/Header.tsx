"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, ShoppingCart, LogOut, Package, Heart, Gift, Bell, Home, Plus } from 'lucide-react';
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
  const [scrolled, setScrolled] = useState(false);
  const [cities, setCities] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCity, setSelectedCity] = useState(searchParams?.get('city') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [detectingCity, setDetectingCity] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      scrolled ? 'shadow-lg shadow-primary-500/5 h-14' : 'h-16'
    } bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50 dark:bg-surface-dark/70`}>
      <div className="relative container flex h-full items-center justify-between gap-4">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600" />
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <span className="text-xl font-bold gradient-text hidden md:inline-block">Flex</span>
        </Link>

        {/* Search & Location */}
        <form onSubmit={handleSearch} className="flex-1 flex items-center max-w-2xl gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search laptops, ACs..."
              className="w-full bg-gray-100/80 dark:bg-gray-800/80 border-none rounded-full pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary-500/50 focus:bg-white dark:focus:bg-gray-800 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-full px-3 lg:px-4 py-1.5 min-w-[100px] lg:min-w-[140px] hover:border-primary-500/50 hover:shadow-sm hover:shadow-primary-500/10 transition-all group">
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
        <div className="flex items-center gap-1">
          <Link href="/" title="Home">
            <Button variant="ghost" size="icon" className="relative hover:ring-2 hover:ring-primary-500/30 hover:ring-offset-2 transition-all rounded-xl">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/bookings">
            <Button variant="ghost" size="icon" className="relative hover:ring-2 hover:ring-primary-500/30 hover:ring-offset-2 transition-all rounded-xl">
              <Package className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/wishlist">
            <Button variant="ghost" size="icon" className="relative hover:ring-2 hover:ring-primary-500/30 hover:ring-offset-2 transition-all rounded-xl">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>
          <NotificationPanel />
          <Link href="/referrals">
            <Button variant="ghost" size="icon" className="relative hover:ring-2 hover:ring-primary-500/30 hover:ring-offset-2 transition-all rounded-xl">
              <Gift className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative hover:ring-2 hover:ring-secondary-500/30 hover:ring-offset-2 transition-all rounded-xl">
              <ShoppingCart className={`h-5 w-5 transition-colors ${cart.length > 0 ? 'text-secondary-600' : ''}`} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Button>
          </Link>

          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          <Button
            variant="default"
            size="sm"
            title="Add Listing"
            onClick={async () => {
              try {
                const res = await api.get('/users/me/roles');
                const roles = res.data.roles || [];
                if (roles.includes('seller')) {
                  router.push('/seller/items/new');
                } else {
                  router.push('/profile?section=seller');
                }
              } catch {
                router.push('/profile');
              }
            }}
            className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-md shadow-primary-600/20 gap-1.5 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline text-xs font-bold">List</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
          </Button>

          {user ? (
            <div className="flex items-center gap-1">
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="hidden md:flex gap-2 hover:ring-2 hover:ring-primary-500/30 hover:ring-offset-2 transition-all rounded-xl">
                  <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-black">{user.firstName?.charAt(0) || 'U'}</span>
                  </div>
                  <span className="text-xs font-bold">{user.firstName}</span>
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} className="hover:ring-2 hover:ring-primary-500/30 hover:ring-offset-2 transition-all rounded-xl">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="hover:ring-2 hover:ring-primary-500/30 hover:ring-offset-2 transition-all rounded-xl text-xs font-bold">Login</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-md shadow-primary-600/20 rounded-xl text-xs font-bold">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
