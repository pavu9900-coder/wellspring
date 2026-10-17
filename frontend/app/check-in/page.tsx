"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  HeartHandshake,
  AlertOctagon,
  HelpCircle,
  CheckCircle,
  ExternalLink,
  Save,
  ArrowRight,
  ShieldAlert,
  CloudSun,
  RotateCcw,
  Sparkles,
  PhoneCall,
} from "lucide-react";
import { ACTIVE_PLAN_STORAGE_KEY, submitCheckIn, saveActionPlan } from "@/lib/api";
import { CheckInResponse, ActionItem, SourceCitation } from "@/lib/types";

function CheckInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [concern, setConcern] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Workflow state
  const [response, setResponse] = useState<CheckInResponse | null>(null);
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});
  const [savedPlanId, setSavedPlanId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Auto-fill query parameter if present
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setConcern(q);
    }
  }, [searchParams]);

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concern.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);
    setFollowUpAnswers({});
    setSavedPlanId(null);

    try {
      const data = await submitCheckIn({ concern_text: concern });
      setResponse(data);
    } catch (err: any) {
      setError(err.message || "Failed to process health check-in.");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!response) return;

    setLoading(true);
    setError(null);

    try {
      const data = await submitCheckIn({
        concern_text: concern,
        category: response.concern_category,
        follow_up_answers: followUpAnswers,
      });
      setResponse(data);
    } catch (err: any) {
      setError(err.message || "Failed to process follow-up answers.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!response || saving || savedPlanId) return;
    setSaving(true);
    try {
      const res = await saveActionPlan(response);
      window.localStorage.setItem(ACTIVE_PLAN_STORAGE_KEY, res.plan_id);
      setSavedPlanId(res.plan_id);
    } catch (err: any) {
      setError("Failed to save plan to database.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConcern("");
    setResponse(null);
    setFollowUpAnswers({});
    setSavedPlanId(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="border-b border-subtle pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-forest-950 flex items-center gap-2.5">
            <HeartHandshake className="w-7 h-7 text-forest-700" />
            Health & Wellness Check-in
          </h1>
          <p className="text-sm text-ink-700 mt-1">
            Share what physical or daily routine challenges you are experiencing.
          </p>
        </div>
        {response && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:text-forest-900 bg-warm-100 hover:bg-warm-200 rounded-lg transition-colors self-start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Check-in
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-coral-50 border border-coral-200 text-coral-800 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-coral-600" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Input Concern */}
      {!response && (
        <form onSubmit={handleInitialSubmit} className="space-y-6">
          <div className="bg-warm-50 p-6 rounded-2xl border border-warm-200 shadow-soft space-y-4">
            <label className="block text-sm font-semibold text-forest-900">
              Describe your concern or symptom in your own words:
            </label>
            <textarea
              rows={4}
                maxLength={2000}
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              placeholder="E.g., I've had difficulty sleeping for the past 2 weeks and wake up feeling mentally exhausted. My neck also feels tense from sitting at my laptop all day..."
              className="w-full p-4 rounded-xl bg-[#FAF8F5] border border-warm-300 text-ink-900 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-forest-500 text-sm leading-relaxed"
              required
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <span className="text-xs text-ink-500">
                Grounded in official National Library of Medicine guidelines.
              </span>
              <button
                type="submit"
                disabled={loading || !concern.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-warm-50 text-sm font-semibold shadow-soft transition-transform active:scale-95"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-warm-50 border-t-transparent rounded-full animate-spin" />
                    <span>Evaluating Safety...</span>
                  </>
                ) : (
                  <>
                    <span>Continue Check-in</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* STEP: Urgent Escalation / Red Flag Warning */}
      {response && response.status === "urgent_escalation" && (
        <div className="p-8 rounded-2xl bg-coral-50 border-2 border-coral-300 shadow-raised space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-coral-600 text-warm-50 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-bold text-coral-900">
                Immediate Clinical or Crisis Attention Required
              </h2>
              <p className="text-sm font-medium text-coral-800">
                {response.safety_message}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-warm-50 border border-coral-200 text-xs text-ink-700 leading-relaxed">
            {response.professional_care_guidance}
          </div>

          {/* Crisis Hotline Numbers */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider">
              Emergency & Verified Crisis Helplines
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {response.escalation_resources.map((res) => (
                <div
                  key={res.id}
                  className="p-4 rounded-xl bg-warm-50 border border-warm-200 space-y-2 shadow-soft"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-forest-900">{res.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-coral-100 text-coral-800">
                      {res.region}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-lg font-bold text-coral-700">
                    <PhoneCall className="w-5 h-5" />
                    <span>{res.number}</span>
                  </div>
                  <p className="text-xs text-ink-500">{res.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP: Out-of-Scope / Medication Refusal */}
      {response &&
        (response.status === "professional_assessment_recommended" ||
          response.status === "unsupported_concern") && (
          <div className="p-6 rounded-2xl bg-warm-100 border border-warm-300 space-y-4">
            <div className="flex items-center gap-3 text-forest-900">
              <ShieldAlert className="w-6 h-6 text-coral-600 shrink-0" />
              <h2 className="font-serif text-xl font-bold">
                Professional Clinical Consultation Recommended
              </h2>
            </div>
            <p className="text-sm text-ink-700 leading-relaxed">
              {response.safety_message}
            </p>
            <div className="p-4 rounded-xl bg-warm-50 text-xs text-forest-900 font-medium">
              {response.professional_care_guidance}
            </div>
          </div>
        )}

      {/* STEP 2: Follow-up Clarification Questions */}
      {response && response.status === "follow_up_required" && (
        <form onSubmit={handleFollowUpSubmit} className="space-y-6">
          <div className="p-6 rounded-2xl bg-warm-50 border border-warm-200 shadow-soft space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-sage-500">
                  Step 2 of 2
                </span>
                <h2 className="font-serif text-xl font-bold text-forest-950 mt-0.5">
                  Context Clarification
                </h2>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-forest-50 text-forest-800 font-medium capitalize">
                {response.concern_category.replace("_", " ")}
              </span>
            </div>

            <p className="text-xs text-ink-700 leading-relaxed">
              {response.summary}
            </p>

            {/* Render Follow-up Questions */}
            <div className="space-y-5 pt-2">
              {response.follow_up_questions.map((q) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm font-semibold text-forest-900 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-forest-700 shrink-0" />
                    {q.question}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((option) => {
                      const isSelected = followUpAnswers[q.id] === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() =>
                            setFollowUpAnswers((prev) => ({
                              ...prev,
                              [q.id]: option,
                            }))
                          }
                          className={`text-left text-xs p-3 rounded-xl border transition-all ${
                            isSelected
                              ? "bg-forest-50 border-forest-600 text-forest-950 font-semibold ring-1 ring-forest-600"
                              : "bg-[#FAF8F5] border-warm-200 text-ink-700 hover:border-forest-300"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-subtle flex justify-end">
              <button
                type="submit"
                disabled={loading || response.follow_up_questions.some((question) => !followUpAnswers[question.id])}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-warm-50 text-sm font-semibold shadow-soft transition-transform active:scale-95"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-warm-50 border-t-transparent rounded-full animate-spin" />
                    <span>Synthesizing Health Guidance...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-sage-200" />
                    <span>Generate My Action Plan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* STEP 3: Full Guidance Available & Action Plan */}
      {response && response.status === "guidance_available" && (
        <div className="space-y-8">
          {/* Action Plan Summary Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-warm-200 shadow-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-sage-500">
                  Your wellness action plan
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  response.generation_source === "nvidia"
                    ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
                    : "bg-forest-50 text-forest-800 ring-1 ring-forest-200"
                }`}>
                  <Sparkles className="h-3 w-3" />
                  {response.generation_source === "nvidia"
                    ? "AI-personalized"
                    : response.generation_source === "fallback"
                      ? "AI fallback"
                      : "Reviewed guidance"}
                </span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-forest-50 text-forest-800 font-semibold capitalize">
                {response.concern_category.replace("_", " ")}
              </span>
            </div>

            <h2 className="font-serif text-2xl font-bold text-forest-950">
              Evidence-Grounded Routine
            </h2>
            <p className="text-sm text-ink-700 leading-relaxed">
              {response.summary}
            </p>
            {response.generation_source === "fallback" && (
              <p className="text-xs text-ink-500">
                The AI service could not respond in time, so this plan uses reviewed health guidance. You can still save and use it safely.
              </p>
            )}

            {/* Environmental wellness tip if available */}
            {response.environmental_context && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-forest-50/60 border border-forest-100 text-xs text-forest-950">
                <CloudSun className="w-5 h-5 text-forest-700 shrink-0" />
                <div>
                  <span className="font-bold">
                    Ambient Weather ({response.environmental_context.temperature_celsius}°C, {response.environmental_context.condition}):
                  </span>{" "}
                  {response.environmental_context.wellness_tip}
                </div>
              </div>
            )}
          </div>

          {/* Action Items List */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-bold text-forest-950">
              Calibrated Daily Actions
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {response.recommended_actions.map((act) => (
                <div
                  key={act.id}
                  className="p-5 rounded-2xl bg-warm-50 border border-warm-200 shadow-soft space-y-2 hover:border-forest-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-forest-950 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-forest-700 shrink-0" />
                      {act.title}
                    </h4>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-warm-100 text-ink-700 capitalize">
                      {act.frequency}
                    </span>
                  </div>
                  <p className="text-xs text-ink-800 leading-relaxed">
                    {act.description}
                  </p>
                  <div className="pt-2 border-t border-subtle text-[11px] text-ink-500 italic">
                    <span className="font-semibold not-italic text-forest-900">Why this helps: </span>
                    {act.rationale}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verified Health Source Citations */}
          {response.sources.length > 0 && (
            <div className="p-6 rounded-2xl bg-warm-100/70 border border-warm-200 space-y-3">
              <h4 className="text-xs font-bold text-forest-950 uppercase tracking-wider flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-forest-700" />
                Verified Clinical Guidance Sources
              </h4>
              <p className="text-xs text-ink-500">
                These sources directly ground your recommendations. All references correspond to official health authorities.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {response.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-xl bg-warm-50 border border-warm-200 hover:border-forest-500 transition-colors space-y-1 block group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-forest-900 group-hover:underline">
                        {src.title}
                      </span>
                      <ExternalLink className="w-3 h-3 text-ink-400 group-hover:text-forest-800" />
                    </div>
                    <p className="text-[11px] text-forest-800 font-medium">{src.organization}</p>
                    <p className="text-[10px] text-ink-500 line-clamp-2">{src.summary}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action Plan Persistence CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-forest-50 via-white to-sky-50 border border-forest-100 text-ink-900 shadow-card">
            <div>
              <h4 className="font-serif text-lg font-bold">
                Adopt this routine into your habits?
              </h4>
              <p className="text-xs text-ink-700 mt-0.5">
                Save to your habit tracker to log daily completion and monitor how your symptoms respond.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {savedPlanId ? (
                <button
                  onClick={() => router.push("/habits")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold transition-transform active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" />
                  View Habit Tracker &rarr;
                </button>
              ) : (
                <button
                  onClick={handleSavePlan}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-forest-50 border border-forest-100 text-forest-950 text-xs font-bold transition-transform active:scale-95"
                >
                  <Save className="w-4 h-4 text-forest-800" />
                  {saving ? "Saving..." : "Save to Habits"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto py-12 text-center text-ink-500 text-sm">
          Loading check-in workspace...
        </div>
      }
    >
      <CheckInContent />
    </Suspense>
  );
}
