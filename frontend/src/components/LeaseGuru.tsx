"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, ArrowRight, Zap, Shield, TrendingUp, IndianRupee, MapPin, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

interface Message {
  role: 'bot' | 'user';
  text: string;
  table?: any[];
  highlight?: string;
}

interface LeaseGuruProps {
  role?: 'buyer' | 'seller' | 'renter';
  context?: any;
}

const MOCK_LISTINGS = [
  { id: 'a', title: 'MacBook Pro M2', rate: 250, deposit: 8000, distance: 0.3, rating: 4.8, seller: 'Rahul S.', price: 120000 },
  { id: 'b', title: 'MacBook Pro M2', rate: 190, deposit: 6000, distance: 4.2, rating: 4.2, seller: 'Ankit K.', price: 120000 },
  { id: 'c', title: 'Split AC 1.5T', rate: 300, deposit: 10000, distance: 0.8, rating: 4.9, seller: 'Priya M.', price: 45000 },
  { id: 'd', title: 'Split AC 1.5T', rate: 350, deposit: 12000, distance: 0.05, rating: 4.5, seller: 'Vikram S.', price: 45000 },
  { id: 'e', title: '3-Seater Sofa', rate: 150, deposit: 5000, distance: 1.2, rating: 4.6, seller: 'Neha G.', price: 25000 },
  { id: 'f', title: '3-Seater Sofa', rate: 120, deposit: 4000, distance: 3.5, rating: 4.0, seller: 'Deepak R.', price: 25000 },
];

function getSmartRecommendation(listings: any[], days: number) {
  return listings.map(l => {
    const rentalCost = l.rate * days;
    const travelCost = l.distance < 1 ? 0 : l.distance < 2 ? 50 : l.distance < 3 ? 100 : 150;
    const depositWeight = l.deposit * 0.01;
    const ratingPenalty = (5 - l.rating) * 100;
    const totalCost = rentalCost + travelCost + depositWeight + ratingPenalty;
    return { ...l, rentalCost, travelCost, totalCost, score: Math.max(0, 1000 - totalCost) };
  }).sort((a, b) => b.score - a.score);
}

function getBuyVsRent(buyPrice: number, dailyRate: number, days: number) {
  const rentTotal = dailyRate * days;
  const diff = buyPrice - rentTotal;
  return { buyPrice, rentTotal, diff, percent: Math.round((diff / buyPrice) * 100) };
}

function getSellerEstimate(itemValue: number) {
  const dailyRate = Math.round(itemValue * 0.015);
  const deposit = Math.round(itemValue * 0.3);
  const monthly = dailyRate * 15;
  const semester = dailyRate * 60;
  return { dailyRate, deposit, monthly, semester };
}

function LeaseGuru({ role = 'buyer', context }: LeaseGuruProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      const greetings: Record<string, string> = {
        seller: "Yo! I'm Lease Guru \u2014 your personal pricing sidekick. Got stuff lying around? Tell me what it is and what it's worth, and I'll tell you exactly what to charge and how much you could earn. No fluff, just math.",
        buyer: "Hey! Lease Guru here. Looking to rent something smart? Tell me what you need, for how long, and I'll run the real numbers \u2014 compare listings, check if renting even makes sense, and find you the best deal within campus. What are you shopping for?",
        renter: "Sup! Lease Guru at your service. Managing active rentals? I can help you track costs, understand your deposit status, or see if extending makes more sense than buying. What do you need?",
      };
      setMessages([{ role: 'bot', text: greetings[role] || greetings.buyer }]);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const addBotMsg = (text: string, table?: any[], highlight?: string) => {
    setMessages(prev => [...prev, { role: 'bot', text, table, highlight }]);
  };

  const handleSend = () => {
    const q = input.trim();
    if (!q || isTyping) return;
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = q.toLowerCase();
      let reply = '';
      let table: any[] | undefined;
      let highlight: string | undefined;

      // SMART PRICE COMPARISON
      if ((lower.includes('compare') || lower.includes('which') || lower.includes('best') || lower.includes('recommend') || lower.includes('macbook') || lower.includes('ac') || lower.includes('sofa')) && (lower.includes('listing') || lower.includes('option') || lower.includes('rent') || lower.includes('between'))) {
        const itemType = lower.includes('macbook') ? 'MacBook Pro M2' : lower.includes('ac') ? 'Split AC 1.5T' : lower.includes('sofa') ? '3-Seater Sofa' : null;
        const relevant = itemType ? MOCK_LISTINGS.filter(l => l.title === itemType) : MOCK_LISTINGS.slice(0, 4);
        const days = 30;
        const ranked = getSmartRecommendation(relevant, days);

        if (ranked.length === 0) {
          reply = "Hmm, I don't have active listings in that category right now. But tell me what you're looking for and I can still run the buy-vs-rent math for you!";
        } else {
          table = ranked.map((l, i) => ({
            '#': i + 1,
            Seller: l.seller,
            'Rate': formatCurrency(l.rate) + '/day',
            'Deposit': formatCurrency(l.deposit),
            'Distance': l.distance < 1 ? '' + Math.round(l.distance * 1000) + 'm' : '' + l.distance + 'km',
            'Rating': '' + l.rating + '\u2605',
            'Total Cost': formatCurrency(l.rentalCost + l.travelCost),
          }));

          const best = ranked[0];
          const worst = ranked[ranked.length - 1];

          if (best.distance < worst.distance && best.rate > worst.rate) {
            highlight = 'proximity';
            reply = "Okay here's the breakdown for " + days + " days. **" + best.seller + "** is " + formatCurrency(best.rate) + "/day vs " + formatCurrency(worst.rate) + "/day for " + worst.seller + " â€” yeah " + worst.seller.split(' ')[0] + " is cheaper by " + formatCurrency(worst.rate - best.rate) + "/day. BUT " + best.seller.split(' ')[0] + " is literally " + (best.distance < 1 ? '' + Math.round(best.distance * 1000) + 'm' : '' + best.distance + 'km') + " away â€” that's a walk. " + worst.seller.split(' ')[0] + " is " + worst.distance + "km away, which means " + (worst.distance > 3 ? 'at least \u20B9150 in cab fare and 45 min of your life' : 'some travel time and cost') + ". **My call:** Go with " + best.seller + ". The slightly higher daily rate is more than offset by the convenience. The app already factored this in. " + best.seller.split(' ')[0] + " wins.";
          } else if (best.rate <= worst.rate && best.distance <= worst.distance) {
            highlight = 'value';
            reply = "Clear winner here. **" + best.seller + "** is cheaper AND closer. " + formatCurrency(best.rate) + "/day, " + (best.distance < 1 ? '' + Math.round(best.distance * 1000) + 'm' : '' + best.distance + 'km') + " away, " + best.rating + "\u2605 rating. That's a no-brainer. Don't overthink it â€” go with " + best.seller.split(' ')[0] + ".";
          } else {
            highlight = 'balanced';
            reply = "Here's the full comparison for " + days + " days of rental. **" + best.seller + "** is my pick. " + formatCurrency(best.rate) + "/day, " + (best.distance < 1 ? '' + Math.round(best.distance * 1000) + 'm' : '' + best.distance + 'km') + " away, " + best.rating + "\u2605 rating. The math says it's the smartest option when you factor in everything â€” rate, distance, deposit lock, and seller reliability. Scroll the table above to see how they all stack up.";
          }
        }
      }
      // BUY vs RENT
      else if ((lower.includes('buy') || lower.includes('purchase') || lower.includes('own')) && (lower.includes('rent') || lower.includes('lease')) || lower.includes('buy vs rent') || (lower.includes('worth') && lower.includes('rent'))) {
        const buyPrice = 120000;
        const dailyRate = 250;
        const days = 60;
        const calc = getBuyVsRent(buyPrice, dailyRate, days);
        table = [
          { Metric: 'Buy Price', Value: formatCurrency(calc.buyPrice) },
          { Metric: 'Rent Total (' + days + ' days)', Value: formatCurrency(calc.rentTotal) },
          { Metric: 'You Save by Renting', Value: formatCurrency(calc.diff) },
          { Metric: 'Savings %', Value: '' + calc.percent + '%' },
        ];
        reply = "Buying new = **" + formatCurrency(buyPrice) + "**. You need it **" + days + " days**. Renting = **" + formatCurrency(calc.rentTotal) + "** total. That's **" + formatCurrency(calc.diff) + "** still in your pocket â€” for literally the same outcome. At " + days + " days of usage, renting is the obvious play. You save **" + calc.percent + "%** with zero headache. If you were gonna use it for 8+ months, buying secondhand starts to make sense â€” but for " + days + " days? Rent it and move on.";
      }
      // SELLER PRICING
      else if ((lower.includes('price') || lower.includes('charge') || lower.includes('list') || lower.includes('sell') || lower.includes('how much')) && (role === 'seller' || lower.includes('seller') || lower.includes('list'))) {
        const itemValue = 50000;
        const est = getSellerEstimate(itemValue);
        table = [
          { Metric: 'Suggested Daily Rate', Value: formatCurrency(est.dailyRate) },
          { Metric: 'Security Deposit', Value: formatCurrency(est.deposit) },
          { Metric: 'Est. Monthly Income (15 days)', Value: formatCurrency(est.monthly) },
          { Metric: 'Est. Semester Income (60 days)', Value: formatCurrency(est.semester) },
        ];
        reply = "For an item worth around **" + formatCurrency(itemValue) + "** here's what I'd recommend: **Rate:** " + formatCurrency(est.dailyRate) + "/day (that's ~1.5% of item value â€” standard for the platform). **Deposit:** " + formatCurrency(est.deposit) + " (covers you without scaring renters off). At " + formatCurrency(est.dailyRate) + "/day, even 15 rental days/month = **" + formatCurrency(est.monthly) + "/month** in passive income. Over a semester that's **" + formatCurrency(est.semester) + "**. Quick tip: keep your pickup radius small (under 1km) â€” builds trust, better reviews, higher rating over time.";
      }
      // SELLER INCOME ESTIMATE
      else if ((lower.includes('earn') || lower.includes('income') || lower.includes('money') || lower.includes('passive')) && (role === 'seller' || lower.includes('seller'))) {
        const itemValue = 30000;
        const est = getSellerEstimate(itemValue);
        reply = "That **" + formatCurrency(itemValue) + "** item sitting in your cupboard? It's losing value every month. List it at **" + formatCurrency(est.dailyRate) + "/day**. Even 12 rental days a month = **" + formatCurrency(est.dailyRate * 12) + "/month** in passive income â€” for something you weren't using anyway. When you eventually sell it, you've already earned back a huge chunk of what you paid. That's the play. *(Numbers assume typical demand â€” actual results vary)*";
      }
      // DEPOSIT INFO
      else if (lower.includes('deposit') || lower.includes('refund') || lower.includes('security') || lower.includes('escrow')) {
        reply = "Security deposit is held in escrow â€” 100% refundable when the item comes back undamaged. Think of it as a temporary hold that comes right back to your account. No drama, no resale hassle. Both sides stay protected.";
      }
      // GREETINGS
      else if (lower.includes('hi') || lower.includes('hey') || lower.includes('hello') || lower.includes('sup') || lower.includes('yo')) {
        reply = role === 'seller'
          ? "Hey! Ready to turn your idle stuff into income? Tell me what you've got â€” I'll help you price it and estimate your earnings."
          : "What's up! Looking for something to rent? Tell me the item and how long you need it â€” I'll find you the smartest deal on campus.";
      }
      // HELP
      else if (lower.includes('help') || lower.includes('what can you') || lower.includes('abilities') || lower.includes('do')) {
        reply = "Here's what I can do:\n\n**For Renters:**\n- Compare listings â€” I'll rank them by rate, distance, deposit & rating\n- Buy vs Rent math â€” I'll tell you honestly if renting actually saves you money\n\n**For Sellers:**\n- Suggest optimal daily rate & deposit for your item\n- Estimate your monthly/semester income potential\n\nJust ask! Try: \"compare MacBook listings\" or \"what should I charge for my AC\" or \"buy vs rent for 2 months\"";
      }
      // THANKS
      else if (lower.includes('thank') || lower.includes('thanks')) {
        reply = "Anytime! Hit me up whenever you need the real math on a rental decision. \uD83D\uDC4D";
      }
      // FALLBACK
      else {
        reply = role === 'seller'
          ? "Tell me what item you're looking to list and its rough value, and I'll help you with pricing, deposit, and income estimates. Or just say 'hi' to get started!"
          : "Tell me what you need to rent and for how long, and I'll run the numbers â€” compare options, check if buying vs renting makes sense, all of it. Try something like 'compare AC listings' or 'buy vs rent a laptop for 2 months'!";
      }

      setIsTyping(false);

      if (reply) {
        if (table && table.length > 0) {
          setTimeout(() => addBotMsg(reply, table, highlight), 300);
        } else {
          setTimeout(() => addBotMsg(reply), 300);
        }
      }
    }, 1200);
  };

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
                  <span className="text-[9px] font-bold opacity-80 uppercase tracking-wider">Online &bull; Smart Pricing</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-white/70 mt-2 font-medium leading-relaxed">
              Your smarter financial self. I do the math so you don&apos;t have to.
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
                        {line.startsWith('**') && line.endsWith('**') ? (
                          <span className="font-black text-primary-600 dark:text-primary-400">{line.slice(2, -2)}</span>
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
                        {m.table.map((row, idx) => (
                          <tr key={idx} className={"border-b border-gray-50 dark:border-gray-800 " + (idx === 0 ? 'bg-green-50 dark:bg-green-900/10 font-bold text-green-800 dark:text-green-300' : '')}>
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="px-2 py-1.5 whitespace-nowrap">{'' + val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {highlight === 'proximity' && (
                      <div className="mt-1.5 text-[9px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Winner by proximity + value
                      </div>
                    )}
                    {highlight === 'value' && (
                      <div className="mt-1.5 text-[9px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Unanimous winner &mdash; cheaper AND closer
                      </div>
                    )}
                    {highlight === 'balanced' && (
                      <div className="mt-1.5 text-[9px] font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1">
                        <Star className="w-3 h-3" /> Best overall when factoring all metrics
                      </div>
                    )}
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
          </div>

          {/* Input */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0">
            <div className="relative">
              <input
                className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl pl-4 pr-14 py-3.5 text-sm font-medium outline-none ring-2 ring-transparent focus:ring-primary-500 transition-all"
                placeholder={role === 'seller' ? "Ask about pricing..." : "e.g. compare MacBook listings..."}
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

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 text-[9px] text-gray-400 text-center font-medium shrink-0">
            Need help? Contact <strong>kishanuddhav2004@gmail.com</strong> or <strong>+91 9336185009</strong>
          </div>
        </Card>
      )}
    </div>
  );
}

export { LeaseGuru };
export default LeaseGuru;