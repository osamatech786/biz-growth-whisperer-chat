
import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatSession {
  session_token: string;
  first_message: string;
  created_at: string;
  message_count: number;
  last_activity: string;
}

interface ChatListProps {
  currentSessionToken: string;
  onSessionSelect: (sessionToken: string) => void;
  onDeleteSession: (sessionToken: string) => void;
}

const ChatList = ({ currentSessionToken, onSessionSelect, onDeleteSession }: ChatListProps) => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadChatSessions();
  }, []);

  const loadChatSessions = async () => {
    try {
      // Get all unique session tokens with their first message and stats
      const { data, error } = await supabase
        .from('chat_messages')
        .select('session_token, message_content, created_at, sender')
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group messages by session token
      const sessionMap = new Map<string, ChatSession>();
      
      data?.forEach((message) => {
        if (!sessionMap.has(message.session_token)) {
          // Find the first user message for this session
          const firstUserMessage = data
            .filter(m => m.session_token === message.session_token && m.sender === 'user')
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
          
          const sessionMessages = data.filter(m => m.session_token === message.session_token);
          const lastMessage = sessionMessages[sessionMessages.length - 1];
          
          sessionMap.set(message.session_token, {
            session_token: message.session_token,
            first_message: firstUserMessage?.message_content || 'New conversation',
            created_at: message.created_at,
            message_count: sessionMessages.length,
            last_activity: lastMessage.created_at
          });
        }
      });

      const sessions = Array.from(sessionMap.values())
        .sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime());
      
      setChatSessions(sessions);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionToken: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      onDeleteSession(sessionToken);
      // Remove from local state
      setChatSessions(prev => prev.filter(session => session.session_token !== sessionToken));
    }
  };

  const truncateMessage = (message: string, maxLength: number = 40) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Chat History</h3>
      
      {chatSessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No chat history yet</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {chatSessions.map((session) => (
            <div
              key={session.session_token}
              onClick={() => onSessionSelect(session.session_token)}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                currentSessionToken === session.session_token
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {truncateMessage(session.first_message)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(session.created_at).toLocaleDateString()}
                    </div>
                    <span>{session.message_count} messages</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDeleteSession(session.session_token, e)}
                  className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatList;
