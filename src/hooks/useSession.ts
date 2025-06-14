
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Session {
  email: string;
  sessionToken: string;
  isVerified: boolean;
}

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const sessionToken = localStorage.getItem('sessionToken');
    if (!sessionToken) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        localStorage.removeItem('sessionToken');
        setLoading(false);
        return;
      }

      // Update last activity
      await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('session_token', sessionToken);

      setSession({
        email: data.email,
        sessionToken: data.session_token,
        isVerified: true
      });
    } catch (error) {
      console.error('Session check failed:', error);
      localStorage.removeItem('sessionToken');
    }
    setLoading(false);
  };

  const createSession = async (email: string) => {
    const sessionToken = crypto.randomUUID();
    
    try {
      const { error } = await supabase
        .from('user_sessions')
        .insert({
          email,
          session_token: sessionToken,
          is_active: true
        });

      if (error) throw error;

      localStorage.setItem('sessionToken', sessionToken);
      setSession({
        email,
        sessionToken,
        isVerified: true
      });

      return true;
    } catch (error) {
      console.error('Session creation failed:', error);
      return false;
    }
  };

  const destroySession = async () => {
    const sessionToken = localStorage.getItem('sessionToken');
    if (sessionToken) {
      try {
        await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .eq('session_token', sessionToken);
      } catch (error) {
        console.error('Session destruction failed:', error);
      }
    }
    
    localStorage.removeItem('sessionToken');
    setSession(null);
  };

  return {
    session,
    loading,
    createSession,
    destroySession,
    checkSession
  };
};
