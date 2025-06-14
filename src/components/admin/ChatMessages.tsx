
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  session_token: string;
  message_content: string;
  sender: string;
  suggestions: string[] | null;
  created_at: string;
  deleted_at: string | null;
}

const ChatMessages = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    loadChatMessages();
  }, []);

  const loadChatMessages = async () => {
    try {
      // Load all messages including deleted ones for admin view
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

  const activeMessages = chatMessages.filter(msg => !msg.deleted_at);
  const deletedMessages = chatMessages.filter(msg => msg.deleted_at);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Chat Messages ({activeMessages.length} active, {deletedMessages.length} deleted)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto space-y-3">
          {/* Active Messages */}
          {activeMessages.map((message) => (
            <div key={message.id} className="border rounded-lg p-3 bg-white">
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

          {/* Deleted Messages */}
          {deletedMessages.map((message) => (
            <div key={message.id} className="border rounded-lg p-3 bg-red-50 border-red-200 opacity-70">
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
                <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" />
                  Deleted
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
