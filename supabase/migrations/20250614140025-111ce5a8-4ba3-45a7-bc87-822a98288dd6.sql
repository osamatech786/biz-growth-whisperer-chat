
-- Create table for email verification codes
CREATE TABLE public.email_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for verified user sessions
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for admin settings (API keys, etc.)
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for admin users
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for email_verifications (public access for verification process)
CREATE POLICY "Allow public access to email verifications" 
  ON public.email_verifications 
  FOR ALL 
  USING (true);

-- Create policies for user_sessions (public access for session management)
CREATE POLICY "Allow public access to user sessions" 
  ON public.user_sessions 
  FOR ALL 
  USING (true);

-- Create policies for admin_settings (restrict to admin users only)
CREATE POLICY "Only admin users can access settings" 
  ON public.admin_settings 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- Create policies for admin_users (restrict to admin users only)
CREATE POLICY "Only admin users can access admin_users table" 
  ON public.admin_users 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- Insert default admin user (you can change this later)
INSERT INTO public.admin_users (email, password_hash) 
VALUES ('admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'); -- password: "password"

-- Insert default API key setting
INSERT INTO public.admin_settings (setting_key, setting_value) 
VALUES ('AI_API_KEY', ''), ('AI_API_URL', '');

-- Create indexes for better performance
CREATE INDEX idx_email_verifications_email ON public.email_verifications(email);
CREATE INDEX idx_email_verifications_code ON public.email_verifications(verification_code);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_email ON public.user_sessions(email);
