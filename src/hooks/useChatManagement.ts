
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useChatManagement = (sessionToken: string) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const deleteCurrentChat = async () => {
    if (!sessionToken) return false;

    setIsDeleting(true);
    try {
      // Soft delete all messages in the current session
      const { error } = await supabase
        .from('chat_messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('session_token', sessionToken)
        .is('deleted_at', null);

      if (error) throw error;

      toast({
        title: "Chat deleted",
        description: "Your chat history has been cleared",
      });
      
      return true;
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete chat history",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const startNewChat = () => {
    // Generate a new session token
    return crypto.randomUUID();
  };

  return {
    deleteCurrentChat,
    startNewChat,
    isDeleting
  };
};
