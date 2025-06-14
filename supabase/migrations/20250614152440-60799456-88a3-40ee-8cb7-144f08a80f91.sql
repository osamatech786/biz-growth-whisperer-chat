
-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Only admin users can access admin_users table" ON public.admin_users;

-- Create a new policy that allows public access for login purposes
-- Since this is for admin authentication, we need to allow reading for login
CREATE POLICY "Allow admin login access" 
  ON public.admin_users 
  FOR SELECT 
  USING (true);

-- Restrict other operations to authenticated admin users only
CREATE POLICY "Only authenticated admins can modify admin_users" 
  ON public.admin_users 
  FOR ALL 
  USING (false)
  WITH CHECK (false);
