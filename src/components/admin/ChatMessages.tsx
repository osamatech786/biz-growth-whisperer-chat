
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  session_token: string;
  message_content: string;
  sender: string;
  suggestions: string[] | null;
  created_at: string;
}

const ChatMessages = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    loadChatMessages();
  }, []);

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

  return (
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
  );
};

export default ChatMessages;
