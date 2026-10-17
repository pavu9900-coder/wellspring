"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarCheck2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShieldAlert,
  Save,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  ACTIVE_PLAN_STORAGE_KEY,
  getActionPlan,
  getHabitHistory,
  submitHabitProgress,
} from "@/lib/api";
import { ActionItem, HabitProgressEntry } from "@/lib/types";

export default function HabitsPage() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [planTitle, setPlanTitle] = useState("Your wellness routine");
  const [planLoading, setPlanLoading] = useState(true);
  const [planLoadError, setPlanLoadError] = useState<string | null>(null);

  const [feeling, setFeeling] = useState<"improving" | "unchanged" | "worsening">("improving");
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<HabitProgressEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackAlert, setFeedbackAlert] = useState<string | null>(null);

  useEffect(() => {
    async function loadActivePlan() {
      const planId = window.localStorage.getItem(ACTIVE_PLAN_STORAGE_KEY);
      if (!planId) {
        setPlanLoading(false);
        return;
      }

      try {
        const plan = await getActionPlan(planId);
        setActivePlanId(planId);
        setPlanTitle(
          plan.concern_category
            ? `${plan.concern_category.replaceAll("_", " ")} routine`
            : "Your wellness routine"
        );
        setActions(
          (plan.actions || []).map((action: ActionItem) => ({
            ...action,
            is_completed: Boolean(action.is_completed),
          }))
        );
        const hist = await getHabitHistory(planId);
        setHistory(hist || []);
      } catch {
        setPlanLoadError("Your saved routine could not be loaded. Check that the local backend is running, then refresh this page.");
      }
      setPlanLoading(false);
    }
    loadActivePlan();
  }, []);

  const toggleAction = (id: string) => {
    setActions((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, is_completed: !a.is_completed } : a
      )
    );
  };

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlanId) return;
    setSubmitting(true);
    setFeedbackAlert(null);

    const completedIds = actions.filter((a) => a.is_completed).map((a) => a.id);

    try {
      const res = await submitHabitProgress({
        plan_id: activePlanId,
        status_feeling: feeling,
        notes: notes.trim(),
        completed_action_ids: completedIds,
      });

      if (res.safety_alert) {
        setFeedbackAlert(res.safety_alert);
      } else {
        setFeedbackAlert("Your reflection has been recorded for today.");
      }

      setNotes("");
      const updated = await getHabitHistory(activePlanId);
      setHistory(updated || []);
    } catch (err: any) {
      setFeedbackAlert(err.message || "Failed to record check-in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="border-b border-subtle pb-4">
        <h1 className="font-serif text-3xl font-bold text-forest-950 flex items-center gap-2.5">
          <CalendarCheck2 className="w-7 h-7 text-forest-700" />
          Habit Planning & Reflection
        </h1>
        <p className="text-sm text-ink-700 mt-1">
          Monitor your daily routine completion and log how your wellness concern is progressing over time.
        </p>
      </div>

      {/* Non-causal Framing Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-forest-50/70 border border-forest-100 text-xs text-forest-950 leading-relaxed flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Health Transparency Notice: </span>
          Wellness improvements are multifaceted. Completing habits supports healthy living, but we do not make causal claims that an action alone resolves underlying physical conditions. If symptoms worsen, always consult a licensed doctor.
        </div>
      </div>

      {planLoadError && (
        <div role="alert" className="rounded-xl border border-coral-200 bg-coral-50 p-4 text-sm text-coral-800">
          {planLoadError}
        </div>
      )}

      {/* Today's Action Checklist */}
      {planLoading ? (
        <div className="rounded-2xl border border-warm-200 bg-white p-8 text-center text-sm text-ink-500 shadow-soft">
          Loading your saved routine…
        </div>
      ) : !activePlanId ? (
        <div className="rounded-2xl border border-warm-200 bg-white p-8 text-center shadow-soft sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-50 text-forest-800">
            <CalendarCheck2 className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-serif text-xl font-bold text-forest-950">Start with a routine made for you</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-700">
            Complete a wellness check-in and save the action plan. Your saved steps will appear here so you can track them and reflect over time.
          </p>
          <Link href="/check-in" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-forest-800 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-forest-900">
            Create a wellness plan
            <TrendingUp className="h-4 w-4" />
          </Link>
        </div>
      ) : (
      <div className="p-6 rounded-2xl bg-white border border-warm-200 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-forest-950">
            {planTitle}
          </h2>
          <span className="text-xs text-ink-500">
            {actions.filter((a) => a.is_completed).length} of {actions.length} completed
          </span>
        </div>

        {actions.length === 0 ? (
          <p className="rounded-xl bg-warm-100 p-4 text-sm text-ink-700">This plan does not contain any daily actions yet.</p>
        ) : <div className="space-y-3 pt-2">
          {actions.map((act) => (
            <div
              key={act.id}
              role="checkbox"
              aria-checked={Boolean(act.is_completed)}
              tabIndex={0}
              onClick={() => toggleAction(act.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleAction(act.id);
                }
              }}
              className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                act.is_completed
                  ? "bg-forest-50/60 border-forest-200 text-forest-950"
                  : "bg-[#FAF8F5] border-warm-200 hover:border-forest-300 text-ink-900"
              }`}
            >
              <div className="mt-0.5">
                {act.is_completed ? (
                  <CheckCircle2 className="w-5 h-5 text-forest-700 fill-forest-100" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-warm-300" />
                )}
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-sm font-bold ${
                      act.is_completed ? "line-through text-forest-900/70" : "text-forest-950"
                    }`}
                  >
                    {act.title}
                  </h4>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-warm-100 text-ink-700">
                    {act.frequency}
                  </span>
                </div>
                <p className="text-xs text-ink-700">{act.description}</p>
              </div>
            </div>
          ))}
        </div>
        }
      </div>
      )}

      {/* Daily Symptom Reflection Form */}
      {activePlanId && !planLoading && <form onSubmit={handleProgressSubmit} className="p-6 rounded-2xl bg-white border border-warm-200 shadow-card space-y-5">
        <h3 className="font-serif text-lg font-bold text-forest-950 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-forest-700" />
          How are your symptoms feeling overall?
        </h3>

        {/* 3 Feeling Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(["improving", "unchanged", "worsening"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFeeling(opt)}
              className={`p-3.5 rounded-xl border text-center transition-all ${
                feeling === opt
                  ? opt === "worsening"
                    ? "bg-coral-50 border-coral-500 text-coral-900 font-bold ring-1 ring-coral-500"
                    : "bg-forest-50 border-forest-600 text-forest-950 font-bold ring-1 ring-forest-600"
                  : "bg-[#FAF8F5] border-warm-200 text-ink-700 hover:border-forest-300"
              }`}
            >
              <span className="capitalize text-sm">{opt}</span>
            </button>
          ))}
        </div>

        {/* Optional Notes */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-ink-700">
            Optional observation or note:
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g., Fell asleep 20 minutes faster after stopping screen time..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-warm-300 text-ink-900 placeholder:text-ink-500 text-xs focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>

        {/* Alert Feedback if Worsening */}
        {feedbackAlert && (
          <div
            className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
              feeling === "worsening"
                ? "bg-coral-50 border border-coral-200 text-coral-900 font-medium"
                : "bg-forest-50 border border-forest-100 text-forest-900 font-medium"
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-forest-700" />
            <span>{feedbackAlert}</span>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-warm-50 text-xs font-bold shadow-soft transition-transform active:scale-95"
          >
            <Save className="w-4 h-4 text-warm-50" />
            {submitting ? "Saving Check-in..." : "Save Today's Reflection"}
          </button>
        </div>
      </form>}

      {/* Progress History Log */}
      <div className="p-6 rounded-2xl bg-warm-50 border border-warm-200 shadow-soft space-y-4">
        <h3 className="font-serif text-lg font-bold text-forest-950 flex items-center gap-2">
          <Clock className="w-5 h-5 text-forest-700" />
          Reflection History
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-ink-500 py-2">
            No reflections recorded yet. Complete today's check-in above to begin tracking.
          </p>
        ) : (
          <div className="space-y-2.5">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-warm-100/60 border border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold capitalize text-forest-900">
                    Status: {item.status_feeling}
                  </span>
                  {item.notes && <p className="text-[11px] text-ink-600 mt-0.5">{item.notes}</p>}
                </div>
                <div className="text-[11px] text-ink-500 sm:text-right">
                  <span>{new Date(item.timestamp).toLocaleString()}</span>
                  <span className="block text-[10px] text-sage-500 font-medium">
                    {item.completed_action_ids.length} actions completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
