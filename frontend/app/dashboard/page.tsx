"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  CheckCircle2,
  BookOpen,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import {
  ACTIVE_PLAN_STORAGE_KEY,
  getActionPlan,
  getHabitHistory,
  getSystemHealth,
} from "@/lib/api";
import { ActionItem, HabitProgressEntry } from "@/lib/types";

interface SavedPlan {
  concern_category: string;
  summary: string;
  actions: ActionItem[];
}

export default function DashboardPage() {
  const [history, setHistory] = useState<HabitProgressEntry[]>([]);
  const [systemState, setSystemState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activePlan, setActivePlan] = useState<SavedPlan | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const planId = window.localStorage.getItem(ACTIVE_PLAN_STORAGE_KEY);
        const [histData, sysHealth, plan] = await Promise.all([
          getHabitHistory(planId || undefined),
          getSystemHealth(),
          planId ? getActionPlan(planId).catch(() => null) : Promise.resolve(null),
        ]);
        setHistory(histData || []);
        setSystemState(sysHealth);
        setActivePlan(plan);
      } catch (e) {
        console.error("Dashboard loading error", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const completedCount = activePlan?.actions.filter((item) => item.is_completed).length || 0;

  return (
    <div className="space-y-8 py-4">
      {/* Top Banner / Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-warm-100/70 border border-warm-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sage-500">
            <Compass className="w-4 h-4 text-forest-700" />
            <span>Wellness Overview</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-forest-950">
            Good day. Here is your daily rhythm.
          </h1>
          <p className="text-sm text-ink-700">
            Keep track of intentional adjustments to support restorative rest and everyday vitality.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/check-in"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-warm-50 text-sm font-semibold shadow-soft transition-transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-sage-200" />
            <span>Start Check-in</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Active Action Plan & Environmental Tip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Action Plan (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl bg-warm-50 border border-warm-200 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-sage-500 uppercase tracking-wider">
                  Active Routine
                </span>
                <h2 className="font-serif text-xl font-bold text-forest-950 mt-0.5">
                  {activePlan
                    ? `${activePlan.concern_category.replaceAll("_", " ")} routine`
                    : "Your next steps will appear here"}
                </h2>
              </div>
              {activePlan && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-forest-50 text-forest-800 capitalize">
                  {completedCount} of {activePlan.actions.length} completed
                </span>
              )}
            </div>

            {activePlan ? (
              <>
                <p className="text-sm leading-relaxed text-ink-700">{activePlan.summary}</p>
                <div className="space-y-3 pt-2">
                  {activePlan.actions.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border ${
                        item.is_completed
                          ? "bg-forest-50/50 border-forest-200 text-forest-900"
                          : "bg-[#FAF8F5] border-warm-200 text-ink-900"
                      }`}
                    >
                      <div className="mt-0.5">
                        {item.is_completed ? (
                          <CheckCircle2 className="w-5 h-5 text-forest-700 fill-forest-100" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-warm-300" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className={`text-sm font-bold ${item.is_completed ? "line-through text-forest-900/70" : "text-forest-950"}`}>
                            {item.title}
                          </h4>
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-warm-100 text-ink-700">
                            {item.frequency}
                          </span>
                        </div>
                        <p className="text-xs text-ink-700">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-warm-300 bg-warm-100/60 p-5 text-sm text-ink-700">
                Save a plan from your health check-in to see your real routine here.
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Link
                href="/habits"
                className="text-xs font-bold text-forest-800 hover:underline flex items-center gap-1"
              >
                Open habit tracker &rarr;
              </Link>
            </div>
          </div>

          {/* Recent Symptom Progress Logs */}
          <div className="p-6 rounded-2xl bg-warm-50 border border-warm-200 shadow-soft space-y-3">
            <h3 className="font-serif text-lg font-bold text-forest-950 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-forest-700" />
              Recent Progress Check-ins
            </h3>
            {history.length === 0 ? (
              <p className="text-xs text-ink-500 py-3">
                No recent check-ins recorded yet. Log how your symptoms are feeling in the Habit tracker.
              </p>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 3).map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl bg-warm-100/60 border border-subtle flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold capitalize text-forest-900">
                        Feeling: {h.status_feeling}
                      </span>
                      {h.notes && <p className="text-[11px] text-ink-500 mt-0.5">{h.notes}</p>}
                    </div>
                    <span className="text-[10px] text-ink-400">
                      {new Date(h.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Context & Health Resources (1 Col) */}
        <div className="space-y-6">
          {/* Honest AI status */}
          <div className="p-5 rounded-2xl bg-white border border-warm-200 shadow-soft space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-forest-900 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-forest-700" />
              <span>AI-guided check-ins</span>
            </div>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              systemState?.services?.nvidia_llm?.configured
                ? "bg-sky-50 text-sky-700"
                : "bg-forest-50 text-forest-800"
            }`}>
              {systemState?.services?.nvidia_llm?.configured
                ? "AI provider configured"
                : "Reviewed guidance ready"}
            </span>
            <p className="text-xs text-ink-700 leading-relaxed">
              Every check-in runs safety checks first. If the AI provider cannot respond, you still receive a reviewed, evidence-grounded plan.
            </p>
            <div className="text-[10px] text-ink-500 border-t border-subtle pt-2">
              AI availability depends on your local API key and internet connection.
            </div>
          </div>

          {/* Authoritative Health Library Highlight */}
          <div className="p-5 rounded-2xl bg-warm-100/70 border border-warm-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-forest-950 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-forest-700" />
                Evidence Library
              </span>
              <Link href="/library" className="text-[11px] text-forest-800 font-bold hover:underline">
                View all &rarr;
              </Link>
            </div>
            <p className="text-xs text-ink-500">
              Curated medical resources from the National Library of Medicine.
            </p>
            <div className="space-y-2 pt-1">
              <a
                href="https://medlineplus.gov/healthy-sleep.html"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-xl bg-warm-50 border border-warm-200 hover:border-forest-400 transition-colors"
              >
                <h5 className="text-xs font-bold text-forest-900">Healthy Sleep Habits</h5>
                <p className="text-[10px] text-ink-500 mt-0.5 line-clamp-2">
                  Circadian cues, bedroom temperature, and stimulus control for restful sleep.
                </p>
              </a>
              <a
                href="https://medlineplus.gov/stress.html"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-xl bg-warm-50 border border-warm-200 hover:border-forest-400 transition-colors"
              >
                <h5 className="text-xs font-bold text-forest-900">Managing Everyday Stress</h5>
                <p className="text-[10px] text-ink-500 mt-0.5 line-clamp-2">
                  Physiological stress responses and non-invasive relaxation mechanisms.
                </p>
              </a>
            </div>
          </div>

          {/* Quick Crisis Safety Banner */}
          <div className="p-5 rounded-2xl bg-coral-50 border border-coral-200 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-coral-800 font-bold">
              <ShieldAlert className="w-4 h-4 shrink-0 text-coral-600" />
              <span>Emergency Help Available</span>
            </div>
            <p className="text-coral-900 leading-relaxed text-[11px]">
              If you or a loved one is experiencing intense emotional distress, call Tele-MANAS at{" "}
              <span className="font-bold">14416</span> (India) or 988 (US). For physical emergencies, dial <span className="font-bold">112</span>.
            </p>
            <Link
              href="/safety"
              className="inline-block text-[11px] font-bold text-coral-700 hover:underline pt-1"
            >
              Emergency Directory &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
