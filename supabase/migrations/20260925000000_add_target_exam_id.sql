ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_exam_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
