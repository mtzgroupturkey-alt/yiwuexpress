'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';

export const NewsletterBar: React.FC = () => {
  const { tNewsletter } = useStorefrontTranslation();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 4000);
  };

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-6 py-6">
      <div className="bg-[#EFF6FF] border border-blue-200/80 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Icon & Text */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#00407a] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {tNewsletter('title')}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {tNewsletter('subtitle')}
            </p>
          </div>
        </div>

        {/* Right: Input & Submit */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-md w-full md:w-auto">
          {subscribed ? (
            <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-lg w-full">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{tNewsletter('success')}</span>
            </div>
          ) : (
            <>
              <input
                id="newsletter-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tNewsletter('placeholder')}
                className="bg-white border border-slate-300 focus:border-[#00407a] focus:ring-1 focus:ring-[#00407a] text-xs sm:text-sm text-slate-800 px-3.5 py-2 rounded-lg flex-1 md:w-72 outline-none shadow-xs"
              />
              <button
                id="newsletter-subscribe-btn"
                type="submit"
                className="bg-[#00407a] hover:bg-[#003366] text-white font-bold text-xs sm:text-sm px-5 py-2 rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                {tNewsletter('subscribe')}
              </button>
            </>
          )}
        </form>
      </div>
    </section>
  );
};
