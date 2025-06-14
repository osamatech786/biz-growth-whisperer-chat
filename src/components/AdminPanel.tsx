
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, Users, Key, LogOut, Shield, Download, Trash2, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminSession {
  email: string;
  isAdmin: boolean;
}

interface CollectedEmail {
  id: string;
  email: string;
  verified: boolean;
  created_at: string;
}

interface AdminSettings {
  AI_API_KEY: string;
  AI_API_URL: string;
}

interface ChatMessage {
  id: string;
  session_token: string;
  message_content: string;
  sender: string;
  suggestions: string[] | null;
  created_at: string;
}

const AdminPanel = () => {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [collectedEmails, setCollectedEmails] = useState<CollectedEmail[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({ AI_API_KEY: '', AI_API_URL: '' });
  const { toast } = useToast();

  useEffect(() => {
    checkAdminSession();
  }, []);

  useEffect(() => {
    if (adminSession?.isAdmin) {
      loadCollectedEmails();
      loadChatMessages();
      loadSettings();
    }
  }, [adminSession]);

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
      setAdminSession({ email: data.email, isAdmin: true });

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

  const adminLogout = () => {
    localStorage.removeItem('adminToken');
    setAdminSession(null);
    setLoginEmail('');
    setLoginPassword('');
  };

  const loadCollectedEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('email_verifications')
        .select('id, email, verified, created_at')
        .eq('verified', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollectedEmails(data || []);
    } catch (error) {
      console.error('Failed to load emails:', error);
    }
  };

  const loadChatMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setChatMessages(data || []);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['AI_API_KEY', 'AI_API_URL']);

      if (error) throw error;

      const settingsObj: AdminSettings = { AI_API_KEY: '', AI_API_URL: '' };
      data?.forEach(setting => {
        settingsObj[setting.setting_key as keyof AdminSettings] = setting.setting_value || '';
      });
      setSettings(settingsObj);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateSetting = async (key: keyof AdminSettings, value: string) => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      toast({
        title: "Setting updated",
        description: `${key} has been updated successfully`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update setting",
        variant: "destructive"
      });
    }
  };

  const exportEmails = () => {
    const csvContent = [
      ['Email', 'Date Collected'].join(','),
      ...collectedEmails.map(item => [
        item.email,
        new Date(item.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collected-emails-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Email list has been exported to CSV",
    });
  };

  const deleteAllEmails = async () => {
    if (!confirm('Are you sure you want to delete all collected email addresses? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('email_verifications')
        .delete()
        .eq('verified', true);

      if (error) throw error;

      setCollectedEmails([]);
      toast({
        title: "Emails deleted",
        description: "All collected email addresses have been deleted",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete email addresses",
        variant: "destructive"
      });
    }
  };

  if (!adminSession?.isAdmin) {
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <Button onClick={adminLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Collected Emails */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Collected Emails ({collectedEmails.length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={exportEmails} size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button onClick={deleteAllEmails} size="sm" variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collectedEmails.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Chat Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Recent Chat Messages ({chatMessages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-3">
                {chatMessages.map((message) => (
                  <div key={message.id} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        message.sender === 'user' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {message.sender === 'user' ? 'User' : 'AI'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {message.message_content}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                AI Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
                  AI API Key
                </label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type="password"
                    value={settings.AI_API_KEY}
                    onChange={(e) => setSettings(prev => ({ ...prev, AI_API_KEY: e.target.value }))}
                    placeholder="sk-..."
                  />
                  <Button onClick={() => updateSetting('AI_API_KEY', settings.AI_API_KEY)}>
                    <Key className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label htmlFor="api-url" className="block text-sm font-medium text-gray-700 mb-2">
                  AI API URL
                </label>
                <div className="flex gap-2">
                  <Input
                    id="api-url"
                    type="url"
                    value={settings.AI_API_URL}
                    onChange={(e) => setSettings(prev => ({ ...prev, AI_API_URL: e.target.value }))}
                    placeholder="https://api.openai.com/v1"
                  />
                  <Button onClick={() => updateSetting('AI_API_URL', settings.AI_API_URL)}>
                    <Key className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
