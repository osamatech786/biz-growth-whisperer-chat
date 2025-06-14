
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import AdminLogin from './admin/AdminLogin';
import EmailManagement from './admin/EmailManagement';
import ChatMessages from './admin/ChatMessages';
import AdminSettings from './admin/AdminSettings';
import ThemeToggle from './ThemeToggle';

interface AdminSession {
  email: string;
  isAdmin: boolean;
}

const AdminPanel = () => {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = () => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      try {
        const decoded = JSON.parse(atob(adminToken));
        setAdminSession({ email: decoded.email, isAdmin: true });
      } catch (error) {
        localStorage.removeItem('adminToken');
      }
    }
  };

  const handleLoginSuccess = (email: string) => {
    setAdminSession({ email, isAdmin: true });
  };

  const adminLogout = () => {
    localStorage.removeItem('adminToken');
    setAdminSession(null);
  };

  if (!adminSession?.isAdmin) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={adminLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmailManagement />
          <ChatMessages />
          <AdminSettings />
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
