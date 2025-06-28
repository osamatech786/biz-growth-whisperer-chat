
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
      const { data, error } = await supabase.functions.invoke('vertex-ai-agent', {
        body: {
          message,
          sessionId: sessionId || currentSession,
          operation: 'stream_query'
        }
      });

      if (error) throw error;

      // Convert the response to a ReadableStream if it's not already
      if (data && typeof data === 'string') {
        const encoder = new TextEncoder();
        return new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(data));
            controller.close();
          }
        });
      }

      // If it's already a stream, return it
      return data;
    } catch (error) {
      console.error('Error streaming query:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message: string, sessionId?: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('vertex-ai-agent', {
        body: {
          message,
          sessionId: sessionId || currentSession,
          operation: 'stream_query'
        }
      });

      if (error) throw error;
      
      // Extract the text response from the Vertex AI response
      if (data && typeof data === 'object') {
        // Handle the Vertex AI response format
        if (data.candidates && data.candidates.length > 0) {
          return data.candidates[0].content || data.candidates[0].text || JSON.stringify(data);
        }
        if (data.response) {
          return data.response;
        }
        return JSON.stringify(data);
      }
      
      return data || "I apologize, but I couldn't process your request at the moment. Please try again.";
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
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
