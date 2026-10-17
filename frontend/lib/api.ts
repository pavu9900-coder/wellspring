import { CheckInResponse, HabitProgressEntry } from "./types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export const ACTIVE_PLAN_STORAGE_KEY = "wellspring.active-plan-id";

export async function submitCheckIn(payload: {
  concern_text: string;
  category?: string;
  follow_up_answers?: Record<string, string>;
  latitude?: number;
  longitude?: number;
}): Promise<CheckInResponse> {
  const res = await fetch(`${BACKEND_URL}/api/check-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `Server returned error (${res.status})`
    );
  }

  return res.json();
}

export async function saveActionPlan(
  plan: Partial<CheckInResponse>
): Promise<{ plan_id: string; status: string }> {
  const res = await fetch(`${BACKEND_URL}/api/action-plans/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plan),
  });

  if (!res.ok) {
    throw new Error("Failed to save action plan.");
  }
  return res.json();
}

export async function getActionPlan(planId: string) {
  const res = await fetch(`${BACKEND_URL}/api/action-plans/${planId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch action plan.");
  }
  return res.json();
}

export async function submitHabitProgress(payload: {
  plan_id: string;
  status_feeling: "improving" | "unchanged" | "worsening";
  notes?: string;
  completed_action_ids: string[];
}) {
  const res = await fetch(`${BACKEND_URL}/api/habits/check-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to record habit progress.");
  }
  return res.json();
}

export async function getHabitHistory(planId?: string): Promise<HabitProgressEntry[]> {
  const query = planId ? `?plan_id=${encodeURIComponent(planId)}` : "";
  const res = await fetch(`${BACKEND_URL}/api/habits/history${query}`);
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export async function searchHealthLibrary(query: string) {
  const res = await fetch(
    `${BACKEND_URL}/api/library/search?q=${encodeURIComponent(query)}`
  );
  if (!res.ok) {
    return { query, results: [] };
  }
  return res.json();
}

export async function getCrisisResources() {
  const res = await fetch(`${BACKEND_URL}/api/crisis-resources`);
  if (!res.ok) {
    return { resources: [] };
  }
  return res.json();
}

export async function getSystemHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
