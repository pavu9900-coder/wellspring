import React from "react";
import Link from "next/link";
import { ShieldAlert, ExternalLink, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-subtle bg-warm-100/60 mt-16 text-xs text-ink-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="font-serif text-base font-bold text-forest-950">
                WellSpring AI
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-sage-100 text-forest-800 font-semibold">
                Everyday Health Action Companion
              </span>
            </div>
            <p className="text-ink-700 leading-relaxed max-w-md">
              Evidence-grounded physical wellness education and daily routines.
              Grounded in official National Library of Medicine (MedlinePlus) guidance
              with deterministic clinical safety triage.
            </p>
            <div className="flex items-center gap-2 text-forest-800 font-medium pt-1">
              <ShieldAlert className="w-4 h-4 text-coral-600 shrink-0" />
              <span>Not a diagnostic tool. Does not replace a licensed medical physician.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-ink-900 mb-3 text-sm">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/check-in" className="hover:text-forest-800 transition-colors">
                  Daily Health Check-in
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-forest-800 transition-colors">
                  Wellness Dashboard
                </Link>
              </li>
              <li>
                <Link href="/habits" className="hover:text-forest-800 transition-colors">
                  Habit Tracker
                </Link>
              </li>
              <li>
                <Link href="/library" className="hover:text-forest-800 transition-colors">
                  Verified Health Library
                </Link>
              </li>
            </ul>
          </div>

          {/* Helplines & Authorities */}
          <div>
            <h4 className="font-semibold text-ink-900 mb-3 text-sm">Crisis & Health Sources</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://telemanas.mohfw.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-forest-800"
                >
                  Tele-MANAS (14416)
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://112.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-forest-800"
                >
                  National Emergency (112)
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://medlineplus.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-forest-800"
                >
                  NIH / MedlinePlus
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <Link href="/safety" className="text-coral-700 font-semibold hover:underline">
                  Full Safety & Emergency Directory &rarr;
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© {new Date().getFullYear()} WellSpring AI. Educational prototype for everyday wellness guidance.</p>
          <p className="flex items-center gap-1 text-ink-500">
            Engineered with healthcare safety, privacy, and evidence grounding.
          </p>
        </div>
      </div>
    </footer>
  );
}
