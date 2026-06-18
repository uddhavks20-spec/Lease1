"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Search, User, Menu, X, LayoutGrid, Sofa, Laptop, Snowflake, Bike, Armchair, Package, MapPin } from 'lucide-react';
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
  const [activeSection, setActiveSection] = useState<'what' | 'where' | 'both' | null>(null);
  const [lastClicked, setLastClicked] = useState<'what' | 'where'>('what');
  const [hoveredSection, setHoveredSection] = useState<'what' | 'where' | null>(null);
  const [searchHovered, setSearchHovered] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [sliderStyle, setSliderStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const whatRef = useRef<HTMLDivElement>(null);
  const whereRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const whatInputRef = useRef<HTMLInputElement>(null);
  const whereInputRef = useRef<HTMLInputElement>(null);
  const bigRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLDivElement>(null);
  const [morphTarget, setMorphTarget] = useState({ dx: 0, dy: 0, scale: 1 });

  const categories = [
    { label: 'Laptops', icon: Laptop, query: 'laptop', color: 'bg-blue-100 text-blue-600', subtitle: 'Work & study' },
    { label: 'ACs', icon: Snowflake, query: 'ac', color: 'bg-gray-200 text-gray-700', subtitle: 'Beat the heat' },
    { label: 'Furniture', icon: Sofa, query: 'furniture', color: 'bg-amber-100 text-amber-600', subtitle: 'Home essentials' },
    { label: 'Bikes', icon: Bike, query: 'bike', color: 'bg-green-100 text-green-600', subtitle: 'Ride around' },
    { label: 'Chairs', icon: Armchair, query: 'chair', color: 'bg-purple-100 text-purple-600', subtitle: 'Sit in style' },
    { label: 'Appliances', icon: Package, query: 'appliance', color: 'bg-gray-200 text-gray-700', subtitle: 'Daily needs' },
  ];

  const cityIcons = ['bg-gray-200 text-gray-700', 'bg-orange-100 text-orange-600', 'bg-green-100 text-green-600', 'bg-blue-100 text-blue-600', 'bg-gray-200 text-gray-700', 'bg-purple-100 text-purple-600'];
  const citySubtitles = ['Popular rental spot', 'Near you', 'Trending now', 'Top rated', 'Budget friendly', 'Premium picks'];

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 80) {
        setScrolled(true);
        setActiveSection(null);
      } else if (y <= 60) {
        setScrolled(false);
      }
    };
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
    { label: 'Home', href: '/', imgSrc: '/images/nav/home.png' },
    { label: 'Listings', href: '/browse', imgSrc: '/images/nav/listings.png' },
    { label: 'Wishlist', href: '/wishlist', imgSrc: '/images/nav/wishlist.png' },
    { label: 'Cart', href: '/cart', imgSrc: '/images/nav/cart.png', count: cart.length },
    { label: 'Bookings', href: '/bookings', imgSrc: '/images/nav/bookings.png' },
    { label: 'Referrals', href: '/referrals', imgSrc: '/images/nav/referrals.png' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const closeProfile = () => setShowProfileMenu(false);

  const filteredCities = cities.filter(c =>
    c.name.toLowerCase().includes(cityInput.toLowerCase())
  );

  useEffect(() => {
    if (activeSection && searchRef.current) {
      const rect = searchRef.current.getBoundingClientRect();
      const fullWidth = rect.width;
      const halfWidth = fullWidth / 2;
      const isBoth = activeSection === 'both';
      setDropdownPos({
        top: rect.bottom + 8,
        left: isBoth ? rect.left : (activeSection === 'where' ? rect.left + halfWidth : rect.left),
        width: isBoth ? fullWidth : halfWidth,
      });
    }
  }, [activeSection]);

  useEffect(() => {
    const target = activeSection === 'both' ? lastClicked : (activeSection || hoveredSection);
    if (!target || !searchRef.current || !whatRef.current || !whereRef.current || !btnRef.current) return;
    const id = requestAnimationFrame(() => {
      const container = searchRef.current!;
      const btn = btnRef.current!;
      const sectionRef = target === 'what' ? whatRef.current! : whereRef.current!;
      const containerRect = container.getBoundingClientRect();
      const sectionRect = sectionRef.getBoundingClientRect();
      const btnLeft = btn.getBoundingClientRect().left - containerRect.left;
      const pad = activeSection ? 0 : 1;
      const left = sectionRect.left - containerRect.left - pad;
      const maxWidth = btnLeft - left - 4;
      setSliderStyle({
        left,
        width: Math.min(sectionRect.width + pad * 2, maxWidth),
      });
    });
    return () => cancelAnimationFrame(id);
  }, [activeSection, hoveredSection, lastClicked]);

  useEffect(() => {
    const calc = () => {
      if (bigRef.current && miniRef.current) {
        const big = bigRef.current.getBoundingClientRect();
        const mini = miniRef.current.getBoundingClientRect();
        setMorphTarget({
          dx: (mini.left + mini.width / 2) - (big.left + big.width / 2),
          dy: (mini.top + mini.height / 2) - (big.top + big.height / 2),
          scale: mini.width / big.width,
        });
      }
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const renderProfileMenu = (close: () => void) => {
    return (
      <div className="absolute right-0 top-full mt-2 w-44 bg-gray-900/90 backdrop-blur-md rounded-xl shadow-xl border border-white/10 py-2 z-50">
        <Link href="/profile" className="block px-4 py-2.5 text-xs font-bold text-white/80 hover:text-white hover:bg-white/10" onClick={close}>Profile</Link>
        <Link href="/seller/dashboard" className="block px-4 py-2.5 text-xs font-bold text-white/80 hover:text-white hover:bg-white/10" onClick={close}>Dashboard</Link>
        <hr className="my-1 border-white/10" />
        <button onClick={() => { logout(); close(); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-white/10">Log out</button>
      </div>
    );
  };

  const headerClass = `fixed top-0 z-50 w-full overflow-visible transition-all duration-300`;

  return (
    <>
    <header className={headerClass}>
      <div className="overflow-visible">
        <div className="bg-transparent relative z-10">
          <div className="container flex items-center justify-center h-20 relative">
            <div className="w-36 shrink-0">
              <Link href="/" className="text-xl font-black gradient-text">Flex</Link>
            </div>

            <nav className="hidden md:flex items-center flex-1 gap-2">
              <div className="flex items-center justify-end gap-6 flex-1">
                {navItems.slice(0, 3).map(item => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-2 px-3 py-1 text-sm font-semibold transition-colors ${
                        active ? 'text-white' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      <span className="relative inline-flex shrink-0">
                        <img src={item.imgSrc} alt="" className="h-[60px] w-[60px] object-contain transition-transform duration-200 ease-out group-hover:scale-125" draggable={false} />
                        {item.count != null && item.count > 0 && (
                          <span className="absolute -top-1 -right-1.5 text-[9px] font-bold bg-black text-white rounded-full min-w-[16px] h-4 flex items-center justify-center leading-none px-1">{item.count}</span>
                        )}
                      </span>
                      <span>{item.label}</span>
                      {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white rounded-full" />}
                    </Link>
                  );
                })}
              </div>
              <div ref={miniRef} className={`flex items-center transition-all duration-300 ease-out ${scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <form onSubmit={handleSearch}>
                  <div className="flex items-center bg-white/10 backdrop-blur-md rounded-full px-3 py-1.5 shadow-sm border border-white/20">
                    <Search className="h-3.5 w-3.5 text-white/60 mr-1.5 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search anything..."
                      className="w-[120px] bg-transparent border-none outline-none text-xs font-medium text-white placeholder:text-white/40 p-0"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </form>
              </div>
              <div className="flex items-center justify-start gap-6 flex-1">
                {navItems.slice(3).map(item => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center gap-2 px-3 py-1 text-sm font-semibold transition-colors ${
                        active ? 'text-white' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      <span className="relative inline-flex shrink-0">
                        <img src={item.imgSrc} alt="" className="h-[60px] w-[60px] object-contain transition-transform duration-200 ease-out group-hover:scale-125" draggable={false} />
                        {item.count != null && item.count > 0 && (
                          <span className="absolute -top-1 -right-1.5 text-[9px] font-bold bg-black text-white rounded-full min-w-[16px] h-4 flex items-center justify-center leading-none px-1">{item.count}</span>
                        )}
                      </span>
                      <span>{item.label}</span>
                      {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white rounded-full" />}
                    </Link>
                  );
                })}
              </div>
            </nav>
            <div className="w-36 shrink-0 flex items-center justify-end gap-3">
              {user ? (
                <div className="relative hidden md:block" ref={profileRef}>
                  <button onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/30 hover:shadow-md transition-all">
                    <User className="h-4 w-4 text-white" />
                    <span className="text-xs font-bold text-white">{user.firstName}</span>
                  </button>
                  {showProfileMenu && renderProfileMenu(closeProfile)}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-3">
                  <Link href="/login" className="text-sm font-bold text-white/80 hover:text-white transition-colors">Login</Link>
                  <Link href="/signup" className="text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-5 py-2 rounded-full transition-colors border border-white/20">Sign Up</Link>
                </div>
              )}
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden p-2 rounded-full hover:bg-white/10 transition-colors">
                {showMobileMenu ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
              </button>
            </div>
          </div>
        </div>

        <div ref={searchRef} className="relative z-20 flex-1 max-w-2xl mx-auto my-3">
          <form onSubmit={handleSearch}>
            <div ref={bigRef} className="relative flex items-center bg-white rounded-full shadow-md shadow-gray-300/60 dark:shadow-gray-900/50 hover:shadow-lg transition-shadow group overflow-hidden"
              style={{
                transform: scrolled ? `translate(${morphTarget.dx}px, ${morphTarget.dy}px) scale(${morphTarget.scale})` : 'translate(0px, 0px) scale(1)',
                opacity: scrolled ? 0 : 1,
                transformOrigin: 'center center',
                transition: 'all 0.7s ease-out',
              }}
              onMouseEnter={() => setSearchHovered(true)} onMouseLeave={() => setSearchHovered(false)}>
              <div
                className={`absolute rounded-full bg-gray-200 shadow-md transition-all duration-300 ease-out pointer-events-none z-0 ${
                  (activeSection || hoveredSection) ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  top: activeSection ? 0 : 1,
                  bottom: activeSection ? 0 : 1,
                  left: (activeSection || hoveredSection) ? sliderStyle.left : 4,
                  width: (activeSection || hoveredSection) ? sliderStyle.width : 0,
                }}
              />
              <div
                ref={whatRef}
                className={`relative flex-1 min-w-0 px-4 pt-3.5 pb-2.5 rounded-full transition-all duration-200 cursor-pointer z-10 ${activeSection === 'what' ? '' : 'hover:bg-transparent'}`}
                onMouseEnter={() => setHoveredSection('what')}
                onMouseLeave={() => setHoveredSection(null)}
                onClick={() => whatInputRef.current?.focus()}
              >
                <label htmlFor="search-what" className={`block text-[9px] font-bold uppercase tracking-wide leading-none mb-1 transition-colors duration-200 ${activeSection === 'what' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>What</label>
                <input
                  id="search-what"
                  ref={whatInputRef}
                  type="text"
                  placeholder="Search categories..."
                  className="w-full bg-transparent border-none outline-none text-xs font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 p-0"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); if (!activeSection) setActiveSection('what'); }}
                  onFocus={() => {
                    const next = activeSection === 'both' ? 'what' : (activeSection === 'where' ? 'both' : 'what');
                    setLastClicked('what');
                    setActiveSection(next);
                  }}
                />
              </div>
              <div className={`w-px h-8 bg-gray-900 shrink-0 transition-opacity duration-200 z-10 ${(searchHovered || activeSection) ? 'opacity-0' : 'opacity-100'}`} />
              <div
                ref={whereRef}
                className={`relative flex-1 min-w-0 px-4 pt-3.5 pb-2.5 rounded-full transition-all duration-200 cursor-pointer z-10 ${activeSection === 'where' ? '' : 'hover:bg-transparent'}`}
                onMouseEnter={() => setHoveredSection('where')}
                onMouseLeave={() => setHoveredSection(null)}
                onClick={() => whereInputRef.current?.focus()}
              >
                <label htmlFor="search-where" className={`block text-[9px] font-bold uppercase tracking-wide leading-none mb-1 transition-colors duration-200 ${activeSection === 'where' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>Where</label>
                <input
                  id="search-where"
                  ref={whereInputRef}
                  type="text"
                  placeholder="Search locations"
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
                  onFocus={() => {
                    const next = activeSection === 'both' ? 'where' : (activeSection === 'where' ? 'both' : 'where');
                    setLastClicked('where');
                    setActiveSection(next);
                  }}
                />
              </div>
              <div ref={btnRef} className="pr-1 shrink-0 z-20 relative">
                <button type="submit" className={`h-11 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-all shadow-md ${activeSection ? 'px-3 gap-1.5' : 'w-11'}`}>
                  <Search className="h-5 w-5 shrink-0" />
                  {activeSection && <span className="text-xs font-bold whitespace-nowrap">Search</span>}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {showMobileMenu && (
        <div className="md:hidden border-t border-gray-200/50 dark:border-gray-800/30 bg-gray-50/90 dark:bg-gray-950/40 backdrop-blur-xl">
          <nav className="container py-4 space-y-1">
            {navItems.map(item => {
              return (
                <Link key={item.href} href={item.href} onClick={() => setShowMobileMenu(false)} className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${isActive(item.href) ? 'text-black bg-gray-100 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50'}`}>
                  <img src={item.imgSrc} alt="" className="h-6 w-6 object-contain" />
                  <span>{item.label}</span>
                  {item.count != null && item.count > 0 && (
                    <span className="ml-auto text-[10px] font-bold bg-black text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">{item.count}</span>
                  )}
                </Link>
              );
            })}
            <hr className="my-2 border-gray-200/50 dark:border-gray-800/30" />
            {user ? (
          <React.Fragment>
                <Link href="/profile" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-white/50 rounded-xl"><User className="h-4 w-4" /> Profile</Link>
                <Link href="/seller/dashboard" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-white/50 rounded-xl"><LayoutGrid className="h-4 w-4" /> Dashboard</Link>
                <button onClick={() => { logout(); setShowMobileMenu(false); }} className="w-full text-left px-4 py-3 text-sm font-semibold text-red-500 hover:bg-white/50 rounded-xl">Log out</button>
          </React.Fragment>
            ) : (
              <div className="flex gap-3 px-4 pt-2">
                <Link href="/login" onClick={() => setShowMobileMenu(false)} className="flex-1 text-center text-sm font-bold text-black border border-gray-300 py-2.5 rounded-full">Login</Link>
                <Link href="/signup" onClick={() => setShowMobileMenu(false)} className="flex-1 text-center text-sm font-bold text-white bg-black py-2.5 rounded-full">Sign Up</Link>
              </div>
            )}
          </nav>
        </div>
      )}

      {activeSection && dropdownPos && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[9999]"
          style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {activeSection === 'what' && (
            <div className="p-4">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Browse by category</p>
              <div className="grid grid-cols-3 gap-2">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => { setSearchQuery(cat.query); setActiveSection(null); }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:shadow-md ${
                        searchQuery === cat.query
                          ? 'bg-gray-100 dark:bg-gray-800 ring-2 ring-gray-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl ${cat.color} flex items-center justify-center`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">{cat.label}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{cat.subtitle}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeSection === 'where' && (
            <div className="max-h-80 overflow-y-auto">
              <div className="p-4 pb-2">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Suggested destinations</p>
              </div>
              <div className="p-2 pt-0">
                {filteredCities.length > 0 ? filteredCities.map((city, i) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => { setSelectedCity(city.id); setCityInput(city.name); setActiveSection(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                      selectedCity === city.id
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl ${cityIcons[i % cityIcons.length]} flex items-center justify-center shrink-0`}>
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{city.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{citySubtitles[i % citySubtitles.length]}</p>
                    </div>
                  </button>
                )) : (
                  <button
                    type="button"
                    onClick={() => { setSelectedCity(''); setActiveSection(null); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">All locations</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Browse everything</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeSection === 'both' && lastClicked === 'what' && (
            <div className="p-4">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Browse by category</p>
              <div className="grid grid-cols-3 gap-2">
                {categories.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => { setSearchQuery(cat.query); setActiveSection(null); }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:shadow-md ${
                        searchQuery === cat.query
                          ? 'bg-gray-100 dark:bg-gray-800 ring-2 ring-gray-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl ${cat.color} flex items-center justify-center`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">{cat.label}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{cat.subtitle}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeSection === 'both' && lastClicked === 'where' && (
            <div className="max-h-80 overflow-y-auto">
              <div className="p-4 pb-2">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Suggested destinations</p>
              </div>
              <div className="p-2 pt-0">
                {filteredCities.length > 0 ? filteredCities.map((city, i) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => { setSelectedCity(city.id); setCityInput(city.name); setActiveSection(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                      selectedCity === city.id
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl ${cityIcons[i % cityIcons.length]} flex items-center justify-center shrink-0`}>
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{city.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{citySubtitles[i % citySubtitles.length]}</p>
                    </div>
                  </button>
                )) : (
                  <button
                    type="button"
                    onClick={() => { setSelectedCity(''); setActiveSection(null); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">All locations</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Browse everything</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </header>
      <div className="transition-all duration-700 ease-out" style={{ height: scrolled ? 80 : 160 }} />
    </>
  );
}
