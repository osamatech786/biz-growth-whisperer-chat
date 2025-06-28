
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VertexAISession {
  sessionId: string;
  name?: string;
}

export const useVertexAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  const createSession = async (): Promise<string> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('vertex-ai-agent', {
        body: {
          message: 'Create new session',
          operation: 'create_session'
        }
      });

      if (error) throw error;
      
      // Generate a unique session ID for tracking
      const sessionId = crypto.randomUUID();
      setCurrentSession(sessionId);
      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const streamQuery = async (message: string, sessionId?: string): Promise<ReadableStream> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/vertex-ai-agent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId: sessionId || currentSession,
          operation: 'stream_query'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.body!;
    } catch (error) {
      console.error('Error streaming query:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message: string, sessionId?: string): Promise<string> => {
    const stream = await streamQuery(message, sessionId);
    const reader = stream.getReader();
    let result = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        result += chunk;
      }
      
      return result;
    } finally {
      reader.releaseLock();
    }
  };

  const listSessions = async (): Promise<VertexAISession[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('vertex-ai-agent', {
        body: {
          message: 'List sessions',
          operation: 'list_sessions'
        }
      });

      if (error) throw error;
      
      // Parse response to extract session information
      return data.sessions || [];
    } catch (error) {
      console.error('Error listing sessions:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionId: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('vertex-ai-agent', {
        body: {
          sessionId,
          operation: 'delete_session',
          message: 'Delete session'
        }
      });

      if (error) throw error;
      
      if (currentSession === sessionId) {
        setCurrentSession(null);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    currentSession,
    setCurrentSession,
    createSession,
    streamQuery,
    sendMessage,
    listSessions,
    deleteSession
  };
};
