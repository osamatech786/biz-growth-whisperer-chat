
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  session_token: string;
  message_content: string;
  sender: string;
  suggestions: string[] | null;
  created_at: string;
  deleted_at: string | null;
}

interface EmailConversationDialogProps {
  email: string;
  isOpen: boolean;
  onClose: () => void;
}

const EmailConversationDialog = ({ email, isOpen, onClose }: EmailConversationDialogProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && email) {
      loadConversation();
    }
  }, [isOpen, email]);

  const loadConversation = async () => {
    setLoading(true);
    try {
      // First, get the session tokens for this email
      const { data: sessions, error: sessionError } = await supabase
        .from('user_sessions')
        .select('session_token')
        .eq('email', email);

      if (sessionError) throw sessionError;

      if (sessions && sessions.length > 0) {
        const sessionTokens = sessions.map(s => s.session_token);

        // Then get all messages for these sessions, including deleted ones
        const { data: chatMessages, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .in('session_token', sessionTokens)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(chatMessages || []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const exportConversation = () => {
    const csvContent = [
      ['Timestamp', 'Sender', 'Message', 'Status'].join(','),
      ...messages.map(msg => [
        new Date(msg.created_at).toLocaleString(),
        msg.sender === 'user' ? 'User' : 'AI',
        `"${msg.message_content.replace(/"/g, '""')}"`,
        msg.deleted_at ? 'Deleted' : 'Active'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${email}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Conversation has been exported to CSV",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Conversation with {email}</DialogTitle>
            <Button onClick={exportConversation} size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {loading ? (
            <div className="text-center py-4">Loading conversation...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No messages found for this email</div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.deleted_at 
                    ? 'bg-red-50 border border-red-200 opacity-60' 
                    : message.sender === 'user' 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-green-50 border border-green-200'
                }`}
              >
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
                  {message.deleted_at && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" />
                      Deleted
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700">{message.message_content}</p>
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Suggestions:</p>
                    <div className="flex flex-wrap gap-1">
                      {message.suggestions.map((suggestion, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {suggestion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailConversationDialog;
