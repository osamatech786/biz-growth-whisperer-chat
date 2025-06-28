
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminSettingsData {
  GENERAL_SETTING: string;
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettingsData>({ GENERAL_SETTING: '' });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['GENERAL_SETTING']);

      if (error) throw error;

      const settingsObj: AdminSettingsData = { GENERAL_SETTING: '' };
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
          General Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
          <p className="font-medium mb-2">AI Configuration</p>
          <p>The AI chat is powered by Vertex AI using a service account configuration. The authentication is handled securely through environment variables.</p>
        </div>
        
        <div>
          <label htmlFor="general-setting" className="block text-sm font-medium text-gray-700 mb-2">
            General Setting
          </label>
          <div className="flex gap-2">
            <Input
              id="general-setting"
              type="text"
              value={settings.GENERAL_SETTING}
              onChange={(e) => setSettings(prev => ({ ...prev, GENERAL_SETTING: e.target.value }))}
              placeholder="Enter general setting value"
            />
            <Button onClick={() => updateSetting('GENERAL_SETTING', settings.GENERAL_SETTING)}>
              <Key className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminSettings;
