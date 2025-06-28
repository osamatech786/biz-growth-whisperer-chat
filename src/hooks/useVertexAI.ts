
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
      console.log('Creating new Vertex AI session...');
      
      const { data, error } = await supabase.functions.invoke('vertex-ai-agent', {
        body: {
          message: 'Create new session',
          operation: 'create_session'
        }
      });

      if (error) {
        console.error('Error creating session:', error);
        throw error;
      }
      
      // Generate a unique session ID for tracking
      const sessionId = crypto.randomUUID();
      setCurrentSession(sessionId);
      console.log('Created session with ID:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message: string, sessionId?: string): Promise<string> => {
    setIsLoading(true);
    try {
      console.log('Sending message to Vertex AI:', { message: message.substring(0, 50), sessionId });
      
      const { data, error } = await supabase.functions.invoke('vertex-ai-agent', {
        body: {
          message,
          sessionId: sessionId || currentSession,
          operation: 'stream_query'
        }
      });

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      console.log('Received response from Vertex AI:', data);
      
      // Handle different response formats from Vertex AI
      if (data) {
        // If it's a direct string response
        if (typeof data === 'string') {
          return data;
        }
        
        // If it's an object with a response field
        if (data.response) {
          return data.response;
        }
        
        // If it's a candidates array (typical Vertex AI format)
        if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
          const candidate = data.candidates[0];
          if (candidate.content) {
            return candidate.content;
          }
          if (candidate.output) {
            return candidate.output;
          }
        }
        
        // If it's a direct output field
        if (data.output) {
          return data.output;
        }
        
        // If it's a predictions array
        if (data.predictions && Array.isArray(data.predictions) && data.predictions.length > 0) {
          return data.predictions[0].content || data.predictions[0].output || JSON.stringify(data.predictions[0]);
        }
        
        // Fallback: return stringified data
        return JSON.stringify(data);
      }
      
      return "I apologize, but I couldn't process your request. Please try again.";
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const streamQuery = async (message: string, sessionId?: string): Promise<ReadableStream> => {
    setIsLoading(true);
    try {
      console.log('Starting stream query...');
      
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
      return data?.sessions || [];
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
