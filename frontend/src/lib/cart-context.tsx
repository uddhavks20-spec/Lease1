"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface CartItem {
  id: string;
  title: string;
  monthly_rent: number;
  deposit_amount: number;
  image: string;
  duration: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalMonthlyRent: number;
  totalDeposit: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('lease_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to load cart', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lease_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    const exists = cart.find((i) => i.id === item.id);
    if (exists) {
      toast.error('Item already in cart');
      return;
    }
    setCart((prev) => [...prev, item]);
    toast.success('Added to cart');
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    toast.success('Removed from cart');
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalMonthlyRent = cart.reduce((acc, item) => acc + Number(item.monthly_rent), 0);
  const totalDeposit = cart.reduce((acc, item) => acc + Number(item.deposit_amount), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalMonthlyRent, totalDeposit }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
