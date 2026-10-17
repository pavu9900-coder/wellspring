"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ShieldCheck,
  BookOpen,
  CalendarCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
  Activity,
  Layers,
  PhoneForwarded,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [quickConcern, setQuickConcern] = useState("");

  const quickPills = [
    "Trouble falling asleep at night",
    "Stiff neck from long desk hours",
    "Feeling overwhelmed with workday stress",
    "Building a consistent morning hydration routine",
  ];

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickConcern.trim()) return;
    router.push(`/check-in?q=${encodeURIComponent(quickConcern.trim())}`);
  };

  return (
    <div className="space-y-20 py-4">
      {/* Editorial Hero */}
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-forest-50 via-white to-sky-50 border border-white p-8 sm:p-12 lg:p-16 shadow-card">
        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-sky-100/65 blur-3xl" />
        <div className="pointer-events-none absolute right-24 bottom-[-12rem] h-80 w-80 rounded-full bg-forest-100/70 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(270px,0.85fr)] lg:items-center">
          <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/85 border border-forest-100 text-forest-800 text-xs font-semibold shadow-soft">
            <span className="w-2 h-2 rounded-full bg-forest-500" />
            Evidence-Grounded Health Action Companion
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-forest-950 font-normal leading-[1.15] tracking-tight">
            Small, intentional daily adjustments.{" "}
            <span className="italic font-normal text-forest-800">
              Rooted in reviewed health science.
            </span>
          </h1>

          <p className="text-lg text-ink-700 leading-relaxed max-w-2xl">
            WellSpring AI helps you understand everyday sleep disruptions, work tension,
            and physical fatigue—translating official clinical guidelines into practical,
            safe routines without diagnostic guesswork.
          </p>

          {/* Quick Check-in Launcher */}
          <form onSubmit={handleQuickSubmit} className="pt-2 max-w-xl">
            <div className="flex flex-col sm:flex-row gap-2 bg-warm-50 p-2 rounded-2xl border border-warm-300/80 shadow-soft focus-within:border-forest-500 focus-within:ring-2 focus-within:ring-forest-100 transition-all">
              <input
                type="text"
                value={quickConcern}
                onChange={(e) => setQuickConcern(e.target.value)}
                aria-label="Describe what you are noticing"
                placeholder="Describe what you're noticing (e.g. restless sleep, screen fatigue)..."
                className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none text-ink-900 placeholder:text-ink-500"
              />
              <button
                type="submit"
                disabled={!quickConcern.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 disabled:opacity-50 disabled:cursor-not-allowed text-warm-50 text-sm font-semibold shadow-soft transition-transform active:scale-95 shrink-0"
              >
                <span>Check In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Pills */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs text-ink-500 font-medium py-1">Common topics:</span>
              {quickPills.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => router.push(`/check-in?q=${encodeURIComponent(pill)}`)}
                  className="text-xs px-2.5 py-1 rounded-full bg-warm-50 hover:bg-forest-50 border border-warm-200 text-ink-700 hover:text-forest-900 transition-colors"
                >
                  {pill}
                </button>
              ))}
            </div>
          </form>

          {/* Clinical Transparency Tag */}
          <div className="flex items-center gap-2 pt-2 text-xs text-ink-500">
            <ShieldCheck className="w-4 h-4 text-forest-700 shrink-0" />
            <span>
              Deterministic safety checks run before any AI generation. We do not provide medical diagnosis or alter prescriptions.
            </span>
          </div>
          </div>

          <aside className="relative hidden lg:block">
            <div className="absolute -inset-3 rounded-[2rem] bg-white/40 blur-xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/90 bg-white/85 p-6 shadow-card backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest-50 text-forest-800">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-50 px-3 py-1.5 text-[11px] font-semibold text-forest-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-forest-500" />
                  Safety first
                </span>
              </div>
              <h2 className="mt-6 font-serif text-2xl font-bold leading-tight text-forest-950">
                A clear next step, at your pace.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">
                Start with what you’re noticing. WellSpring checks safety, asks only useful follow-up questions, and builds a practical routine.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  ["01", "Share what’s on your mind"],
                  ["02", "Get grounded, practical guidance"],
                  ["03", "Save small steps to your habits"],
                ].map(([number, label]) => (
                  <div key={number} className="flex items-center gap-3 rounded-xl bg-forest-50/65 px-3.5 py-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] font-bold text-forest-800 shadow-soft">
                      {number}
                    </span>
                    <span className="text-xs font-semibold text-forest-950">{label}</span>
                    <CheckCircle2 className="ml-auto h-4 w-4 text-forest-600" />
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-start gap-2 border-t border-forest-100 pt-4 text-[11px] leading-relaxed text-ink-500">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
                <span>Educational support only. Never a diagnosis or a substitute for clinical care.</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Safety & Workflow Sequence */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="font-serif text-3xl text-forest-950 font-bold">
            How WellSpring Works
          </h2>
          <p className="text-sm text-ink-700">
            Every step is designed around healthcare safety, transparent evidence citations, and daily follow-through.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-warm-50 border border-warm-200/80 shadow-soft space-y-3">
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-serif text-lg font-bold text-forest-900">
              Safety Triage
            </h3>
            <p className="text-xs text-ink-700 leading-relaxed">
              Before anything else, deterministic clinical red-flag rules check for chest pressure, shortness of breath, and crisis distress.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-warm-50 border border-warm-200/80 shadow-soft space-y-3">
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-serif text-lg font-bold text-forest-900">
              Context Clarification
            </h3>
            <p className="text-xs text-ink-700 leading-relaxed">
              If your concern is within everyday scope, we ask brief targeted questions about duration, caffeine, and daily screen habits.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-warm-50 border border-warm-200/80 shadow-soft space-y-3">
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-serif text-lg font-bold text-forest-900">
              Evidence Grounding
            </h3>
            <p className="text-xs text-ink-700 leading-relaxed">
              Guidance is linked directly to authoritative topic libraries from the U.S. National Library of Medicine (MedlinePlus).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-warm-50 border border-warm-200/80 shadow-soft space-y-3">
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <h3 className="font-serif text-lg font-bold text-forest-900">
              Sustainable Action
            </h3>
            <p className="text-xs text-ink-700 leading-relaxed">
              Receive 2–4 calibrated daily steps with clear biological rationale and non-causal wellness check-ins.
            </p>
          </div>
        </div>
      </section>

      {/* Distinction from Chatbots */}
      <section className="rounded-3xl bg-gradient-to-br from-white via-sage-50 to-sky-50 border border-forest-100 shadow-card p-8 sm:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-forest-700">
              Designed For Real Health Habits
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl leading-tight">
              Not a chatbot wrapper. A structured wellness companion.
            </h2>
            <p className="text-ink-700 text-sm leading-relaxed">
              Most AI tools act like open-ended chatbots that generate speculative diagnoses or hallucinate references. WellSpring is architected around boundaries:
            </p>
            <ul className="space-y-3 pt-2 text-xs sm:text-sm text-ink-800">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0 mt-0.5" />
                <span>Zero fabricated medical citations—every source links to verified health portals.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0 mt-0.5" />
                <span>Explicit non-interference: we never advise stopping or altering prescription medication.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0 mt-0.5" />
                <span>Instant escalation to Tele-MANAS (14416) and 112 emergency response if acute signs occur.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/85 p-6 rounded-2xl border border-forest-100 shadow-soft space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-coral-500" />
              Scope & Safety Boundaries
            </h3>
            <div className="space-y-2 text-xs text-ink-700">
              <div className="p-3 rounded-xl bg-forest-50 border border-forest-100">
                <p className="font-semibold text-forest-900">Supported Scope</p>
                <p className="mt-0.5 text-ink-700">Sleep hygiene, work stress management, screen fatigue, hydration, and light physical movement.</p>
              </div>
              <div className="p-3 rounded-xl bg-coral-50 border border-coral-100">
                <p className="font-semibold text-coral-700">Unsupported Conditions</p>
                <p className="mt-0.5 text-ink-700">Acute chest pain, severe psychiatric crisis, oncological diagnosis, pregnancy complications, prescription changes.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="text-center py-8 space-y-4">
        <h3 className="font-serif text-2xl text-forest-950 font-bold">
          Ready to establish a grounded routine?
        </h3>
        <p className="text-sm text-ink-700 max-w-lg mx-auto">
          Start your first wellness check-in now. It takes less than two minutes.
        </p>
        <div>
          <Link
            href="/check-in"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-800 hover:bg-forest-900 text-warm-50 text-sm font-semibold shadow-card transition-transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-sage-200" />
            Begin Health Check-in
          </Link>
        </div>
      </section>
    </div>
  );
}
