-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name text,
  role text DEFAULT 'Operator',
  impact_points int DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create intakes table
CREATE TABLE IF NOT EXISTS public.intakes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  input_type text DEFAULT 'text',
  status text DEFAULT 'VERIFYING',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on intakes
ALTER TABLE public.intakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own intakes"
  ON public.intakes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own intakes"
  ON public.intakes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create actions table
CREATE TABLE IF NOT EXISTS public.actions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_id uuid REFERENCES public.intakes(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text DEFAULT 'PENDING',
  description text,
  action_text text,
  icon text,
  priority text DEFAULT 'Medium',
  confidence int DEFAULT 0,
  instructions jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on actions
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view actions for their intakes"
  ON public.actions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.intakes
    WHERE intakes.id = actions.intake_id AND intakes.user_id = auth.uid()
  ));

CREATE POLICY "Users can update actions"
  ON public.actions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.intakes
    WHERE intakes.id = actions.intake_id AND intakes.user_id = auth.uid()
  ));

-- Functions and Triggers
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, impact_points)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 100);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
