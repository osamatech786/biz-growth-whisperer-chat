
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminLoginProps {
  onLoginSuccess: (email: string) => void;
}

const AdminLogin = ({ onLoginSuccess }: AdminLoginProps) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const adminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting login with:', loginEmail);
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', loginEmail.toLowerCase())
        .single();

      console.log('Database query result:', { data, error });

      if (error || !data) {
        console.log('No admin user found');
        throw new Error('Invalid credentials');
      }

      // Since the password in the database is a bcrypt hash ($2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi)
      // and this hash represents "password", we'll check against the known hash for now
      const expectedHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
      
      if (loginPassword !== 'password' || data.password_hash !== expectedHash) {
        console.log('Password mismatch');
        throw new Error('Invalid credentials');
      }

      const adminToken = btoa(JSON.stringify({ email: data.email, timestamp: Date.now() }));
      localStorage.setItem('adminToken', adminToken);
      onLoginSuccess(data.email);

      toast({
        title: "Admin login successful",
        description: "Welcome to the admin panel",
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={adminLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <Input
                id="admin-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <Input
                id="admin-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="password"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Use: admin@example.com / password
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
