"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface Message {
  role: 'bot' | 'user';
  text: string;
}

interface LeaseBotProps {
  role: 'seller' | 'buyer' | 'renter';
  context?: any;
}

export function LeaseBot({ role, context }: LeaseBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      const initialText = role === 'seller' 
        ? "Hi! I'm your Lease Pricing Advisor. Ready to turn your unused items into passive income? Ask me anything about pricing or security!"
        : role === 'renter'
        ? "Welcome back to your dashboard! I'm here to help you manage your rentals and payments. Have questions about your active orders?"
        : "Hello! I'm LeaseBot. Looking for a smart deal? I can help you understand how much you'll save by renting today!";
      setMessages([{ role: 'bot', text: initialText }]);
    }
  }, [role]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');

    // Persuasive framing logic
    setTimeout(() => {
      let botResponse = "";
      const lower = userMsg.toLowerCase();

      if (role === 'seller') {
        if (lower.includes('price') || lower.includes('rent') || lower.includes('earn')) {
          botResponse = "Great question! Our engine uses real-time market weights. For example, a 16GB laptop or 43\" 4K TV isn't just an item—it's an asset that can pay back your original investment in just a few months while sitting idle. Why let it depreciate when it can earn you passive yield?";
        } else if (lower.includes('security') || lower.includes('safe') || lower.includes('damage')) {
          botResponse = "We've got you covered! We hard-lock a 35% security deposit based on the True Market Value. This completely removes any risk of damage or loss, so you can earn worry-free.";
        } else {
          botResponse = "Listing on Lease is the smartest way to optimize your assets. Your items earn for you, and we handle all the escrow and verification hassles!";
        }
      } else {
        if (lower.includes('price') || lower.includes('cost') || lower.includes('save')) {
          botResponse = "Renting is all about capital efficiency! Why spend ₹35,000 upfront for an AC or Laptop when you can get the same utility for a low monthly subscription? You save 90% of your cash for other university needs.";
        } else if (lower.includes('deposit') || lower.includes('return')) {
          botResponse = "The security deposit is 100% refundable. Think of it as a temporary hold that comes right back to your account the moment you return the item. It's much smarter than buying and being stuck with resale hassles!";
        } else {
          botResponse = "By renting on Lease, you get premium gadgets and furniture without the huge upfront cost. It's the ultimate student hack for a better lifestyle!";
        }
      }

      setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {/* Floating Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-gray-900 rotate-90' : 'bg-primary-600 hover:scale-110 active:scale-95'
        }`}
      >
        {isOpen ? <X className="text-white" /> : <Bot className="text-white w-7 h-7" />}
      </button>

      {/* Chat Drawer */}
      {isOpen && (
        <Card className="absolute bottom-20 right-0 w-[350px] h-[500px] border-none shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-[32px] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-primary-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-widest">Lease Advisor</h4>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold opacity-80 uppercase">Always Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 scrollbar-hide" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium leading-relaxed ${
                  m.role === 'user' 
                  ? 'bg-primary-600 text-white rounded-tr-none shadow-md shadow-primary-200' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-tl-none shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            <div className="relative">
              <input
                className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl pl-4 pr-12 py-3 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all"
                placeholder="Ask LeaseBot..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                className="absolute right-2 top-2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
