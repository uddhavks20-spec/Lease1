"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Bot, Zap, MapPin, Star, AlertTriangle, ShoppingCart, LifeBuoy, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

interface Message {
  role: 'bot' | 'user';
  text: string;
  table?: any[];
  highlight?: string;
  ticket?: string;
}

interface LeaseGuruProps {
  role?: 'buyer' | 'seller' | 'renter' | 'wholesaler';
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://lease1-backend.vercel.app/api';

const INTENT_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  TRANSACTIONAL_SALES: { label: 'Sales', icon: ShoppingCart, color: 'bg-blue-500' },
  ESCROW_SUPPORT: { label: 'Support', icon: LifeBuoy, color: 'bg-amber-500' },
  INTERFACE_OPS: { label: 'Guide', icon: BookOpen, color: 'bg-emerald-500' },
};

function LeaseGuru({ role = 'buyer' }: LeaseGuruProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentIntent, setCurrentIntent] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      const greetings: Record<string, string> = {
        seller: "Yo! I'm Lease Guru \u2014 your personal pricing sidekick. Got stuff lying around? Tell me what it is and what it's worth, and I'll tell you exactly what to charge and how much you could earn. No fluff, just math.",
        buyer: "Hey! Lease Guru here. Looking to rent something smart? Tell me what you need, for how long, and I'll run the real numbers \u2014 I'll check what's available, compare options, and find you the best deal within campus. What are you shopping for?",
        renter: "Sup! Lease Guru at your service. Managing active rentals? I can help you track costs, understand your deposit status, or see if extending makes more sense than buying. What do you need?",
        wholesaler: "Hey wholesaler! Lease Guru here. I can help you optimize your inventory turnover, suggest volume-friendly pricing, and analyze utilization rates. What products are you moving?",
      };
      setMessages([{ role: 'bot', text: greetings[role] || greetings.buyer }]);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const addBotMsg = useCallback((text: string, table?: any[], highlight?: string, ticket?: string) => {
    setMessages(prev => [...prev, { role: 'bot', text, table, highlight, ticket }]);
  }, []);

  const handleSend = useCallback(async () => {
    const q = input.trim();
    if (!q || isTyping) return;
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setInput('');
    setIsTyping(true);
    setError(false);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: q,
          role: role === 'buyer' ? 'renter' : role,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      setIsTyping(false);
      setCurrentIntent(data.intent);

      if (data.table && data.table.length > 0) {
        setTimeout(() => addBotMsg(data.reply, data.table, undefined, data.escalationTicket), 200);
      } else {
        setTimeout(() => addBotMsg(data.reply, undefined, undefined, data.escalationTicket), 200);
      }
    } catch (e) {
      setIsTyping(false);
      setError(true);
      // Fallback to simple local response
      const lower = q.toLowerCase();
      let fb = '';
      if (lower.includes('hi') || lower.includes('hey') || lower.includes('hello')) {
        fb = "Hey! What can I help you with? Try asking about listings, pricing, or how the platform works.";
      } else if (lower.includes('price') || lower.includes('sell') || lower.includes('list')) {
        fb = "For pricing help, try asking something like 'what should I charge for my laptop worth ₹50,000?'";
      } else if (lower.includes('deposit') || lower.includes('refund') || lower.includes('escrow')) {
        fb = "Security deposits are held in escrow and refunded within 24 hours after both parties sign off on return.";
      } else if (lower.includes('how') || lower.includes('help') || lower.includes('guide')) {
        fb = "I can guide you through listing items, making bookings, or managing your account. Just ask!";
      } else {
        fb = "I'm having trouble connecting to my brain right now. Try again in a moment, or ask something simple like 'how do I list an item?'";
      }
      setTimeout(() => addBotMsg(fb), 200);
    }
  }, [input, isTyping, role, addBotMsg]);

  const intentInfo = currentIntent ? INTENT_LABELS[currentIntent] : null;

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={"w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 " + (isOpen ? 'bg-gray-900 rotate-90' : 'bg-gradient-to-br from-primary-600 to-secondary-600')}
      >
        {isOpen ? <X className="text-white w-6 h-6" /> : <Bot className="text-white w-7 h-7" />}
      </button>

      {isOpen && (
        <Card className="absolute bottom-20 right-0 w-[380px] h-[560px] border-none shadow-[0_20px_60px_rgba(0,0,0,0.25)] rounded-[32px] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary-600 to-secondary-700 p-5 text-white shrink-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Zap className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm uppercase tracking-widest">Lease Guru</h4>
                  <Badge className="bg-yellow-300 text-yellow-900 border-none text-[8px] font-black px-1.5 py-0">AI</Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold opacity-80 uppercase tracking-wider">
                    {intentInfo ? (
                      <span className="flex items-center gap-1">
                        <intentInfo.icon className="w-2.5 h-2.5" />
                        {intentInfo.label}
                      </span>
                    ) : (
                      'Online \u2022 Multi-Agent'
                    )}
                  </span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-white/70 mt-2 font-medium leading-relaxed">
              Multi-agent AI: Sales, Escrow &amp; Ops specialists.
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i}>
                <div className={"flex " + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={"max-w-[88%] p-3.5 rounded-2xl text-sm font-medium leading-relaxed " + (m.role === 'user'
                    ? 'bg-primary-600 text-white rounded-tr-none shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-tl-none shadow-sm border border-gray-100 dark:border-gray-700')}>
                    {m.text.split('\n').map((line, j) => (
                      <React.Fragment key={j}>
                        {line.startsWith('> ') ? (
                          <span className="block text-[10px] text-gray-400 dark:text-gray-500 italic border-l-2 border-gray-300 dark:border-gray-600 pl-2 my-1">{line.slice(2)}</span>
                        ) : (
                          <>
                            {line.split(/(\*\*[^*]+\*\*)/g).map((part, k) =>
                              part.startsWith('**') && part.endsWith('**')
                                ? <span key={k} className="font-black text-primary-600 dark:text-primary-400">{part.slice(2, -2)}</span>
                                : part
                            )}
                          </>
                        )}
                        {j < m.text.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                {m.table && m.table.length > 0 && (
                  <div className="mt-2 mx-1 overflow-x-auto">
                    <table className="w-full text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800">
                          {Object.keys(m.table[0]).map(h => (
                            <th key={h} className="px-2 py-1.5 text-left font-black text-gray-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {m.table.map((row: any, idx: number) => (
                          <tr key={idx} className={"border-b border-gray-50 dark:border-gray-800 " + (idx === 0 ? 'bg-green-50 dark:bg-green-900/10 font-bold text-green-800 dark:text-green-300' : '')}>
                            {Object.keys(m.table![0]).map((key) => (
                              <td key={key} className="px-2 py-1.5 whitespace-nowrap">{'' + row[key]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {m.highlight === 'proximity' && (
                      <div className="mt-1.5 text-[9px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Winner by proximity + value
                      </div>
                    )}
                    {m.highlight === 'value' && (
                      <div className="mt-1.5 text-[9px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Unanimous winner
                      </div>
                    )}
                    {m.highlight === 'balanced' && (
                      <div className="mt-1.5 text-[9px] font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1">
                        <Star className="w-3 h-3" /> Best overall value
                      </div>
                    )}
                  </div>
                )}
                {m.ticket && (
                  <div className="mt-1.5 mx-1 p-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="w-3 h-3" />
                      Ticket generated — admin will review within 24h
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-3.5 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-center">
                <div className="text-[9px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                  Offline mode — using local responses
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0">
            <div className="relative">
              <input
                className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl pl-4 pr-14 py-3.5 text-sm font-medium outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all"
                placeholder={role === 'seller' || role === 'wholesaler' ? "Ask about pricing..." : "e.g. compare laptop listings..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
                className="absolute right-1.5 top-1.5 p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Footer with contact */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 text-[9px] text-gray-400 text-center font-medium shrink-0">
            Powered by Lease Multi-Agent System &middot; Escalate: <strong>kishanuddhav2004@gmail.com</strong>
          </div>
        </Card>
      )}
    </div>
  );
}

export { LeaseGuru };
export default LeaseGuru;
