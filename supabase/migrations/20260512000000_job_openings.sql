-- Job Openings table
CREATE TABLE IF NOT EXISTS public.job_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL,
  experience TEXT NOT NULL,
  salary TEXT,
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}'::TEXT[],
  benefits TEXT[] DEFAULT '{}'::TEXT[],
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_openings_department ON public.job_openings(department);
CREATE INDEX IF NOT EXISTS idx_job_openings_is_active ON public.job_openings(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_job_openings_is_featured ON public.job_openings(is_featured) WHERE is_featured = true;

-- RLS
ALTER TABLE public.job_openings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job openings are readable by all" ON public.job_openings
  FOR SELECT USING (is_active = true OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Admins can manage job openings" ON public.job_openings
  FOR ALL USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_job_openings_updated_at
  BEFORE UPDATE ON public.job_openings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data from Careers.tsx
INSERT INTO public.job_openings (title, department, location, type, experience, salary, description, requirements, benefits, is_featured)
VALUES 
(
  'Senior Full Stack Engineer', 
  'Engineering', 
  'San Jose, CA', 
  'Full-time', 
  'Senior', 
  '$150k - $200k', 
  'Build scalable platform connecting farmers with buyers globally. Experience with React, Node.js, and cloud infrastructure required.',
  ARRAY['5+ years of full-stack development experience', 'Expertise in React, TypeScript, and Node.js', 'Experience with cloud platforms (AWS, GCP, Azure)', 'Passion for sustainable agriculture'],
  ARRAY['Equity', 'Health insurance', 'Flexible work', 'Impact bonus'],
  true
),
(
  'Product Manager', 
  'Product', 
  'San Francisco, CA', 
  'Full-time', 
  'Mid', 
  '$120k - $160k', 
  'Lead product strategy for our farmer and buyer platforms. Drive user research, feature development, and market expansion.',
  ARRAY['3+ years of product management experience', 'Experience with B2B or marketplace platforms', 'Strong analytical and communication skills', 'Understanding of agricultural industry preferred'],
  ARRAY['Equity', 'Health insurance', 'Remote options', 'Learning budget'],
  true
),
(
  'Farmer Success Manager', 
  'Operations', 
  'Remote', 
  'Full-time', 
  'Mid', 
  '$80k - $100k', 
  'Support farmers in maximizing their success on Wakulima. Provide training, resolve issues, and gather feedback.',
  ARRAY['2+ years of customer success experience', 'Background in agriculture or farming', 'Excellent communication and problem-solving skills', 'Fluency in Spanish preferred'],
  ARRAY['Health insurance', 'Remote work', 'Travel opportunities', 'Performance bonus'],
  false
);

-- Add General Application role with a fixed UUID
INSERT INTO public.job_openings (id, title, department, location, type, experience, salary, description, requirements, benefits, is_featured, is_active)
VALUES ('00000000-0000-0000-0000-000000000000', 'General Application', 'General', 'Remote', 'Full-time', 'Any', 'Competitive', 'Submit your resume for future opportunities at Wakulima.', ARRAY['Passion for agriculture', 'Strong work ethic'], ARRAY['Equity', 'Health insurance'], false, false);
