export interface ActionItem {
  id: string;
  title: string;
  description: string;
  rationale: string;
  frequency: string;
  is_completed?: boolean;
}

export interface SourceCitation {
  title: string;
  url: string;
  organization: string;
  summary: string;
  attribution: string;
  is_verified: boolean;
}

export interface CrisisResource {
  id: string;
  name: string;
  region: string;
  number: string;
  description: string;
  category: string;
  official_url: string;
  is_emergency: boolean;
}

export interface EnvironmentalContext {
  temperature_celsius?: number;
  humidity_percent?: number;
  condition?: string;
  wellness_tip?: string;
  source?: string;
}

export interface CheckInResponse {
  status:
    | "urgent_escalation"
    | "professional_assessment_recommended"
    | "follow_up_required"
    | "guidance_available"
    | "unsupported_concern"
    | "unable_to_complete_safely";
  concern_category: string;
  summary: string;
  safety_message: string;
  professional_care_guidance: string;
  follow_up_questions: Array<{
    id: string;
    question: string;
    options: string[];
  }>;
  escalation_resources: CrisisResource[];
  recommended_actions: ActionItem[];
  sources: SourceCitation[];
  environmental_context?: EnvironmentalContext;
  generation_source?: "nvidia" | "curated" | "fallback" | null;
  limitations: string;
}

export interface HabitProgressEntry {
  id: string;
  plan_id: string;
  status_feeling: "improving" | "unchanged" | "worsening";
  notes?: string;
  completed_action_ids: string[];
  timestamp: string;
}
