"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, User, Menu, X, Home, LayoutGrid, Heart, ShoppingCart, Calendar, Gift, Sofa, Laptop, Snowflake, Bike, Armchair, Package, MapPin } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import api from '@/lib/api';

export function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [scrolled, setScrolled] = useState(false);
  const [cities, setCities] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCity, setSelectedCity] = useState(searchParams?.get('city') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');
  const [cityInput, setCityInput] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeSection, setActiveSection] = useState<'what' | 'where' | null>(null);
  const [hoveredSection, setHoveredSection] = useState<'what' | 'where' | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const categories = [
    { label: 'Laptops', icon: Laptop, query: 'laptop' },
    { label: 'ACs', icon: Snowflake, query: 'ac' },
    { label: 'Furniture', icon: Sofa, query: 'furniture' },
    { label: 'Bikes', icon: Bike, query: 'bike' },
    { label: 'Chairs', icon: Armchair, query: 'chair' },
    { label: 'Appliances', icon: Package, query: 'appliance' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setActiveSection(null);
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
        const found = allCities.find((c: any) => c.id === saved);
        if (found) setCityInput(found.name);
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
                    setCityInput(match.name);
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

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Listings', href: '/browse', icon: LayoutGrid },
    { label: 'Wishlist', href: '/wishlist', icon: Heart },
    { label: 'Cart', href: '/cart', icon: ShoppingCart, count: cart.length },
    { label: 'Bookings', href: '/bookings', icon: Calendar },
    { label: 'Referrals', href: '/referrals', icon: Gift },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const closeProfile = () => setShowProfileMenu(false);

  const filteredCities = cities.filter(c =>
    c.name.toLowerCase().includes(cityInput.toLowerCase())
  );

  const renderProfileMenu = (close: () => void) => {
    return (
      <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50">
        <Link href="/profile" className="block px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={close}>Profile</Link>
        <Link href="/seller/dashboard" className="block px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={close}>Dashboard</Link>
        <hr className="my-1 border-gray-100 dark:border-gray-700" />
        <button onClick={() => { logout(); close(); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800">Log out</button>
      </div>
    );
  };

  const headerClass = `sticky top-0 z-50 w-full overflow-visible transition-all duration-300 bg-gradient-to-b from-secondary-50 via-secondary-100 to-secondary-200 dark:from-secondary-950/30 dark:via-secondary-900/40 dark:to-secondary-800/50 ${scrolled ? 'shadow-lg shadow-secondary-300/20' : 'shadow-md shadow-secondary-200/30'}`;

  return (
    <header className={headerClass}>
      <div className="container overflow-visible">
        {!scrolled ? (
          <>
            <div className="flex items-center justify-center h-16">
              <div className="w-36 shrink-0">
                <Link href="/" className="text-xl font-black gradient-text">Flex</Link>
              </div>
              <nav className="hidden md:flex items-center justify-center gap-1 flex-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors ${
                        active ? 'text-primary-600' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? 'text-primary-600' : ''}`} />
                      <span>{item.label}</span>
                      {item.count && item.count > 0 && (
                        <span className="ml-0.5 text-[10px] font-bold bg-primary-600 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">{item.count}</span>
                      )}
                      {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-600 rounded-full" />}
                    </Link>
                  );
                })}
              </nav>
              <div className="w-36 shrink-0 flex items-center justify-end gap-3">
                {user ? (
                  <div className="relative hidden md:block" ref={profileRef}>
                    <button onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-100">{user.firstName}</span>
                    </button>
                    {showProfileMenu && renderProfileMenu(closeProfile)}
                  </div>
                ) : (
                  <div className="hidden md:flex items-center gap-3">
                    <Link href="/login" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">Login</Link>
                    <Link href="/signup" className="text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 px-5 py-2 rounded-full transition-colors">Sign Up</Link>
                  </div>
                )}
                <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 rounded-full hover:bg-white/50 transition-colors">
                  {showMobileMenu ? <X className="h-5 w-5 text-gray-700 dark:text-gray-300" /> : <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
                </button>
              </div>
            </div>

            <div className="flex justify-center pt-4 pb-5 relative">
              <div ref={searchRef} className="relative flex-1 max-w-xl">
                <form onSubmit={handleSearch}>
                  <div className="relative flex items-center bg-secondary-50 dark:bg-secondary-950/30 rounded-full shadow-md shadow-secondary-100/60 dark:shadow-secondary-900/50 border border-secondary-100 dark:border-secondary-900/40 hover:shadow-lg transition-shadow group">
                    <div
                      className={`absolute top-1 bottom-1 rounded-full bg-white dark:bg-gray-800 shadow-md transition-all duration-300 ease-out pointer-events-none ${
                        activeSection === 'what' || (!activeSection && hoveredSection === 'what')
                          ? 'left-1 w-[calc(50%-24px)] opacity-100'
                          : activeSection === 'where' || (!activeSection && hoveredSection === 'where')
                          ? 'left-[calc(50%-20px)] w-[calc(50%-24px)] opacity-100'
                          : 'left-1 w-0 opacity-0'
                      }`}
                    />
                    <div
                      className={`relative flex-1 min-w-0 px-4 pt-2.5 pb-1.5 rounded-full transition-all duration-200 cursor-pointer z-10 ${activeSection === 'what' ? '' : 'hover:bg-transparent'}`}
                      onClick={() => setActiveSection(activeSection === 'what' ? null : 'what')}
                      onMouseEnter={() => setHoveredSection('what')}
                      onMouseLeave={() => setHoveredSection(null)}
                    >
                      <label className={`block text-[9px] font-bold uppercase tracking-wide leading-none mb-1 transition-colors duration-200 ${activeSection === 'what' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>What</label>
                      <input
                        type="text"
                        placeholder="Search categories..."
                        className="w-full bg-transparent border-none outline-none text-xs font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 p-0"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); if (!activeSection) setActiveSection('what'); }}
                        onFocus={() => setActiveSection('what')}
                      />
                    </div>
                    <div className="w-px h-8 bg-primary-200/60 dark:bg-primary-800/30 shrink-0 shadow-[0_0_4px_rgba(255,0,110,0.1)] transition-opacity duration-200 z-10" />
                    <div
                      className={`relative flex-1 min-w-0 px-4 pt-2.5 pb-1.5 rounded-full transition-all duration-200 cursor-pointer z-10 ${activeSection === 'where' ? '' : 'hover:bg-transparent'}`}
                      onClick={() => setActiveSection(activeSection === 'where' ? null : 'where')}
                      onMouseEnter={() => setHoveredSection('where')}
                      onMouseLeave={() => setHoveredSection(null)}
                    >
                      <label className={`block text-[9px] font-bold uppercase tracking-wide leading-none mb-1 transition-colors duration-200 ${activeSection === 'where' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>Where</label>
                      <input
                        type="text"
                        placeholder="Search destinations"
                        className="w-full bg-transparent border-none outline-none text-xs font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 p-0"
                        value={cityInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCityInput(val);
                          const match = cities.find(c => c.name.toLowerCase().includes(val.toLowerCase()));
                          if (match && val.length >= match.name.length) {
                            setSelectedCity(match.id);
                          } else {
                            setSelectedCity('');
                          }
                          if (!activeSection) setActiveSection('where');
                        }}
                        onFocus={() => setActiveSection('where')}
                      />
                    </div>
                    <div className="pr-1 shrink-0">
                      <button type="submit" className="h-9 w-9 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center transition-colors shadow-md">
                        <Search className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </form>

                {activeSection && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    {activeSection === 'what' && (
                      <div className="p-4">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Categories</p>
                        <div className="grid grid-cols-3 gap-2">
                          {categories.map(cat => {
                            const Icon = cat.icon;
                            return (
                              <button
                                key={cat.label}
                                type="button"
                                onClick={() => { setSearchQuery(cat.query); setActiveSection(null); }}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:shadow-md ${
                                  searchQuery === cat.query
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-100 dark:border-gray-700 hover:border-primary-200'
                                }`}
                              >
                                <div className="w-10 h-10 rounded-full bg-secondary-50 dark:bg-secondary-900/40 flex items-center justify-center">
                                  <Icon className="h-5 w-5 text-primary-600" />
                                </div>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{cat.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {activeSection === 'where' && (
                      <div className="max-h-80 overflow-y-auto">
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search destinations"
                              className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 p-0"
                              value={cityInput}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCityInput(val);
                                const match = cities.find(c => c.name.toLowerCase().includes(val.toLowerCase()));
                                if (match && val.length >= match.name.length) {
                                  setSelectedCity(match.id);
                                } else {
                                  setSelectedCity('');
                                }
                              }}
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="p-2">
                          {filteredCities.length > 0 ? filteredCities.map(city => (
                            <button
                              key={city.id}
                              type="button"
                              onClick={() => { setSelectedCity(city.id); setCityInput(city.name); setActiveSection(null); }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                selectedCity === city.id
                                  ? 'bg-primary-50 dark:bg-primary-900/20'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-secondary-50 dark:bg-secondary-900/40 flex items-center justify-center shrink-0">
                                <MapPin className="h-4 w-4 text-primary-600" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{city.name}</p>
                              </div>
                            </button>
                          )) : (
                            <button
                              type="button"
                              onClick={() => { setSelectedCity(''); setActiveSection(null); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              <div className="w-8 h-8 rounded-lg bg-secondary-50 dark:bg-secondary-900/40 flex items-center justify-center shrink-0">
                                <MapPin className="h-4 w-4 text-primary-600" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">All locations</p>
                              </div>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between h-14 gap-4">
            <Link href="/" className="text-lg font-black gradient-text shrink-0">Flex</Link>
            <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-auto">
              <div className="flex items-center bg-white dark:bg-gray-800 rounded-full shadow-md shadow-gray-200/60 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="flex-1 min-w-0 px-4 py-2">
                  <input type="text" placeholder="Search anything..." className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 p-0" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="pr-1.5 shrink-0">
                  <button type="submit" className="h-8 w-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center transition-colors">
                    <Search className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </form>
            <div className="flex items-center gap-3 shrink-0">
              {user ? (
                <div className="relative hidden md:block" ref={profileRef}>
                  <button onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-100">{user.firstName}</span>
                  </button>
                  {showProfileMenu && renderProfileMenu(closeProfile)}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-3">
                  <Link href="/login" className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-primary-600 transition-colors">Login</Link>
                  <Link href="/signup" className="text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-4 py-1.5 rounded-full transition-colors">Sign Up</Link>
                </div>
              )}
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 rounded-full hover:bg-white/50 transition-colors">
                {showMobileMenu ? <X className="h-5 w-5 text-gray-700 dark:text-gray-300" /> : <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {showMobileMenu && (
        <div className="md:hidden border-t border-secondary-200/50 dark:border-secondary-800/30 bg-secondary-50/95 dark:bg-secondary-950/40 backdrop-blur-xl">
          <nav className="container py-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setShowMobileMenu(false)} className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${isActive(item.href) ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50'}`}>
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.count && item.count > 0 && (
                    <span className="ml-auto text-[10px] font-bold bg-primary-600 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">{item.count}</span>
                  )}
                </Link>
              );
            })}
            <hr className="my-2 border-secondary-200/50 dark:border-secondary-800/30" />
            {user ? (
              <>
                <Link href="/profile" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-white/50 rounded-xl"><User className="h-4 w-4" /> Profile</Link>
                <Link href="/seller/dashboard" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-white/50 rounded-xl"><LayoutGrid className="h-4 w-4" /> Dashboard</Link>
                <button onClick={() => { logout(); setShowMobileMenu(false); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-red-500 hover:bg-white/50 rounded-xl">Log out</button>
              </>
            ) : (
              <div className="flex gap-3 px-4 pt-2">
                <Link href="/login" onClick={() => setShowMobileMenu(false)} className="flex-1 text-center text-sm font-bold text-primary-600 border border-primary-200 py-2.5 rounded-full">Login</Link>
                <Link href="/signup" onClick={() => setShowMobileMenu(false)} className="flex-1 text-center text-sm font-bold text-white bg-primary-600 py-2.5 rounded-full">Sign Up</Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
