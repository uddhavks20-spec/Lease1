"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    api.get('/cities').then(res => {
      const allCities = res.data.cities || [];
      setCities(allCities);
      const saved = localStorage.getItem('detectedCity');
      if (saved) {
        setSelectedCity(saved);
        return;
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`)
              .then(r => r.json())
              .then(data => {
                const detectedName = data.city || data.locality || data.principalSubdivision;
                if (detectedName) {
                  const match = allCities.find((c: any) =>
                    detectedName.toLowerCase().includes(c.name.toLowerCase()) ||
                    c.name.toLowerCase().includes(detectedName.toLowerCase())
                  );
                  if (match) {
                    setSelectedCity(match.id);
                    localStorage.setItem('detectedCity', match.id);
                  }
                }
              })
              .catch(() => {});
          },
          () => {},
          { timeout: 5000 }
        );
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

  const goToBrowse = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50 dark:bg-surface-dark/70 ${
      scrolled ? 'shadow-lg shadow-primary-500/5' : ''
    }`}>
      <div className="relative">
        {scrolled && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary-600 via-secondary-500 to-primary-600" />
        )}

        {/* ─── Condensed state (scrolled) ─── */}
        {scrolled ? (
          <div className="container flex h-14 items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-lg font-black gradient-text">Flex</Link>
              <Link href="/wishlist" className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">Wishlist</Link>
              <Link href="/cart" className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">
                Cart{cart.length > 0 && <span className="text-primary-600 ml-0.5">({cart.length})</span>}
              </Link>
              <Link href="/bookings" className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">Bookings</Link>
              <Link href="/referrals" className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">Referrals</Link>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={goToBrowse} className="text-xs font-bold text-gray-500 hover:text-primary-600 transition-colors cursor-pointer">Search</button>

              {user ? (
                <div className="relative" ref={profileRef}>
                  <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="text-xs font-bold text-gray-800 dark:text-gray-100 hover:text-primary-600 transition-colors">
                    {user.firstName}
                  </button>
                  {showProfileMenu && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                      <Link href="/profile" className="block px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setShowProfileMenu(false)}>Profile</Link>
                      <Link href="/seller/dashboard" className="block px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setShowProfileMenu(false)}>Dashboard</Link>
                      <hr className="my-1 border-gray-100 dark:border-gray-700" />
                      <button onClick={() => { logout(); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800">Log out</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login" className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">Login</Link>
                  <Link href="/signup" className="text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-4 py-1.5 rounded-full transition-colors">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* ─── Row 1: Logo | Search | Profile ─── */}
            <div className="container flex h-14 items-center justify-between gap-4">
              <Link href="/" className="text-lg font-black gradient-text shrink-0">Flex</Link>

              <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
                <div className="flex items-center bg-gray-100/80 dark:bg-gray-800/80 rounded-full border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all">
                  <div className="flex-1 min-w-0 px-5 py-2">
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-none mb-0.5">What</label>
                    <input
                      type="text"
                      placeholder="Search laptops, ACs..."
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 p-0"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 shrink-0" />
                  <div className="flex-1 min-w-0 px-5 py-2">
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide leading-none mb-0.5">Where</label>
                    <select
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-gray-100 p-0 cursor-pointer appearance-none"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                    >
                      <option value="">All locations</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.id} className="text-gray-900">{city.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pr-2 shrink-0">
                    <button type="submit" className="h-8 px-4 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-full transition-colors">
                      Search
                    </button>
                  </div>
                </div>
              </form>

              {user ? (
                <div className="relative shrink-0" ref={profileRef}>
                  <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="text-xs font-bold text-gray-800 dark:text-gray-100 hover:text-primary-600 transition-colors">
                    {user.firstName}
                  </button>
                  {showProfileMenu && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                      <Link href="/profile" className="block px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setShowProfileMenu(false)}>Profile</Link>
                      <Link href="/seller/dashboard" className="block px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setShowProfileMenu(false)}>Dashboard</Link>
                      <hr className="my-1 border-gray-100 dark:border-gray-700" />
                      <button onClick={() => { logout(); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800">Log out</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 shrink-0">
                  <Link href="/login" className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">Login</Link>
                  <Link href="/signup" className="text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-4 py-1.5 rounded-full transition-colors">Sign Up</Link>
                </div>
              )}
            </div>

            {/* ─── Row 2: Action links ─── */}
            <div className="container h-10 flex items-center gap-5">
              <Link href="/wishlist" className="text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">Wishlist</Link>
              <Link href="/cart" className="text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">
                Cart{cart.length > 0 && <span className="text-primary-600 ml-1">({cart.length})</span>}
              </Link>
              <Link href="/bookings" className="text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">Bookings</Link>
              <Link href="/referrals" className="text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors">Referrals</Link>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
