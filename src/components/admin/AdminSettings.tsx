
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminSettingsData {
  AI_API_KEY: string;
  AI_API_URL: string;
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettingsData>({ AI_API_KEY: '', AI_API_URL: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['AI_API_KEY', 'AI_API_URL']);

      if (error) throw error;

      const settingsObj: AdminSettingsData = { AI_API_KEY: '', AI_API_URL: '' };
      data?.forEach(setting => {
        settingsObj[setting.setting_key as keyof AdminSettingsData] = setting.setting_value || '';
      });
      setSettings(settingsObj);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateSetting = async (key: keyof AdminSettingsData, value: string) => {
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

  return (
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
  );
};

export default AdminSettings;
