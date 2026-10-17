-- Supabase PostgreSQL Migration for WellSpring AI
-- Migration: 001_initial_schema.sql
-- Enables UUID extension and establishes relational schema with RLS

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Action Plans Table
CREATE TABLE IF NOT EXISTS public.action_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    concern_category VARCHAR(100) NOT NULL,
    summary TEXT NOT NULL,
    safety_message TEXT NOT NULL,
    professional_care_guidance TEXT,
    limitations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on user_id and created_at
CREATE INDEX IF NOT EXISTS idx_action_plans_user_id ON public.action_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_created_at ON public.action_plans(created_at DESC);

-- 2. Action Items Table
CREATE TABLE IF NOT EXISTS public.action_items (
    id VARCHAR(100) PRIMARY KEY,
    plan_id UUID NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    rationale TEXT NOT NULL,
    frequency VARCHAR(50) DEFAULT 'daily',
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_items_plan_id ON public.action_items(plan_id);

-- 3. Source Citations Table
CREATE TABLE IF NOT EXISTS public.source_citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    organization VARCHAR(255) NOT NULL,
    summary TEXT,
    attribution VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_source_citations_plan_id ON public.source_citations(plan_id);

-- 4. Checkin Progress History Table
CREATE TABLE IF NOT EXISTS public.checkin_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
    status_feeling VARCHAR(50) NOT NULL, -- 'improving', 'unchanged', 'worsening'
    notes TEXT,
    completed_action_ids TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkin_history_plan_id ON public.checkin_history(plan_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_history ENABLE ROW LEVEL SECURITY;

-- Anonymous / Authenticated Read Policy (for transient or user sessions)
CREATE POLICY "Allow public select of action plans" ON public.action_plans
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert of action plans" ON public.action_plans
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update of action plans" ON public.action_plans
    FOR UPDATE USING (true);

CREATE POLICY "Allow public select of action items" ON public.action_items
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert of action items" ON public.action_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update of action items" ON public.action_items
    FOR UPDATE USING (true);

CREATE POLICY "Allow public select of source citations" ON public.source_citations
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert of source citations" ON public.source_citations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select of checkin history" ON public.checkin_history
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert of checkin history" ON public.checkin_history
    FOR INSERT WITH CHECK (true);
