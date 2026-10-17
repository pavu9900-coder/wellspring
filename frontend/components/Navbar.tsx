"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HeartHandshake,
  Compass,
  CalendarCheck2,
  BookOpen,
  PhoneCall,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Compass },
    { href: "/check-in", label: "Health Check-in", icon: HeartHandshake },
    { href: "/habits", label: "Habits & Routine", icon: CalendarCheck2 },
    { href: "/library", label: "Health Library", icon: BookOpen },
    { href: "/safety", label: "Crisis & Safety", icon: PhoneCall },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-subtle shadow-[0_1px_8px_rgba(28,61,41,0.035)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[4.5rem]">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-forest-700 to-forest-900 text-white flex items-center justify-center font-serif text-lg font-bold shadow-soft transition-transform group-hover:scale-105">
              W
            </div>
            <div>
              <span className="font-serif text-lg font-bold tracking-tight text-forest-950">
                WellSpring <span className="text-sage-500 font-sans text-xs tracking-wider uppercase font-semibold">AI</span>
              </span>
              <p className="text-[10px] text-ink-500 leading-none">Everyday Health Companion</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                    isActive
                      ? "bg-forest-50 text-forest-900 font-semibold"
                      : "text-ink-700 hover:text-forest-900 hover:bg-warm-100"
                  }`}
                >
                  <Icon className="w-4 h-4 text-forest-700" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Emergency Hotline Alert Pill & CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/safety"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-coral-50 border border-coral-100 text-coral-700 hover:bg-coral-100 transition-colors"
              title="Urgent health help & verified crisis lines"
            >
              <span className="w-2 h-2 rounded-full bg-coral-500 animate-pulse" />
              Helpline 14416 / 112
            </Link>
            <Link
              href="/check-in"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-warm-50 text-xs font-semibold tracking-wide shadow-soft transition-transform active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-sage-200" />
              Start Check-in
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-ink-700 hover:bg-warm-100"
              aria-label="Toggle navigation"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-subtle bg-white px-4 pt-2 pb-4 space-y-1 shadow-card">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-forest-50 text-forest-900 font-bold"
                    : "text-ink-700 hover:bg-warm-100"
                }`}
              >
                <Icon className="w-4 h-4 text-forest-700" />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-subtle">
            <Link
              href="/safety"
              onClick={() => setIsOpen(false)}
              className="block text-center py-2 text-xs font-semibold text-coral-700 bg-coral-50 rounded-lg"
            >
              Urgent Support: Tele-MANAS 14416 / 112
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
