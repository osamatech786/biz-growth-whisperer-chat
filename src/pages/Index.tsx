import { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import EmailVerification from '@/components/EmailVerification';
import ChatHeader from '@/components/ChatHeader';
import ChatSidebar from '@/components/ChatSidebar';
import ChatContainer from '@/components/ChatContainer';
import { useSession } from '@/hooks/useSession';
import { useChatManagement } from '@/hooks/useChatManagement';
import { supabase } from '@/integrations/supabase/client';
import { useVertexAI } from '@/hooks/useVertexAI';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  suggestions?: string[];
}

const Index = () => {
  const { session, loading, createSession, destroySession } = useSession();
  const [sessionToken, setSessionToken] = useState(session?.sessionToken || '');
  const { deleteCurrentChat, startNewChat, isDeleting } = useChatManagement(sessionToken);
  const { createSession: createVertexSession } = useVertexAI();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI Assistant powered by Vertex AI. I'm here to help you with any questions or tasks you might have. What can I assist you with today?",
      sender: 'ai',
      timestamp: new Date(),
      suggestions: [
        "Tell me about your capabilities",
        "Help me solve a problem", 
        "Explain a concept",
        "Provide recommendations"
      ]
    }
  ]);
  const [showChatList, setShowChatList] = useState(false);

  useEffect(() => {
    if (session?.sessionToken) {
      setSessionToken(session.sessionToken);
    }
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.isVerified) {
    return <EmailVerification onVerified={createSession} />;
  }

  const loadChatMessages = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_token', token)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map(msg => ({
          id: msg.id,
          content: msg.message_content,
          sender: msg.sender as 'user' | 'ai',
          timestamp: new Date(msg.created_at),
          suggestions: msg.suggestions || undefined
        }));
        setMessages(loadedMessages);
      } else {
        // No messages found, show default welcome message
        setMessages([{
          id: '1',
          content: "Hello! I'm your AI Assistant powered by Vertex AI. I'm here to help you with any questions or tasks you might have. What can I assist you with today?",
          sender: 'ai',
          timestamp: new Date(),
          suggestions: [
            "Tell me about your capabilities",
            "Help me solve a problem", 
            "Explain a concept",
            "Provide recommendations"
          ]
        }]);
      }
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    }
  };

  const handleSessionSelect = (token: string) => {
    setSessionToken(token);
    loadChatMessages(token);
    setShowChatList(false);
  };

  const handleDeleteSession = async (token: string) => {
    try {
      // Soft delete all messages in the session
      const { error } = await supabase
        .from('chat_messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('session_token', token)
        .is('deleted_at', null);

      if (error) throw error;

      // If it's the current session, start a new one
      if (token === sessionToken) {
        handleStartNewChat();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleLogout = async () => {
    await destroySession();
  };

  const handleDeleteChat = async () => {
    if (confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      const success = await deleteCurrentChat();
      if (success) {
        // Clear messages from UI
        setMessages([{
          id: '1',
          content: "Hello! I'm your AI Assistant powered by Vertex AI. I'm here to help you with any questions or tasks you might have. What can I assist you with today?",
          sender: 'ai',
          timestamp: new Date(),
          suggestions: [
            "Tell me about your capabilities",
            "Help me solve a problem", 
            "Explain a concept",
            "Provide recommendations"
          ]
        }]);
      }
    }
  };

  const handleStartNewChat = async () => {
    try {
      // Create new session in Vertex AI
      const vertexSessionId = await createVertexSession();
      
      // Create new local session token
      const newToken = startNewChat();
      setSessionToken(newToken);
      
      setMessages([{
        id: '1',
        content: "Hello! I'm your AI Assistant powered by Vertex AI. I'm here to help you with any questions or tasks you might have. What can I assist you with today?",
        sender: 'ai',
        timestamp: new Date(),
        suggestions: [
          "Tell me about your capabilities",
          "Help me solve a problem", 
          "Explain a concept",
          "Provide recommendations"
        ]
      }]);
    } catch (error) {
      console.error('Error starting new chat:', error);
      // Fallback to local session creation
      const newToken = startNewChat();
      setSessionToken(newToken);
      setMessages([{
        id: '1',
        content: "Hello! I'm your AI Assistant powered by Vertex AI. I'm here to help you with any questions or tasks you might have. What can I assist you with today?",
        sender: 'ai',
        timestamp: new Date(),
        suggestions: [
          "Tell me about your capabilities",
          "Help me solve a problem", 
          "Explain a concept",
          "Provide recommendations"
        ]
      }]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex">
      {/* Sidebar for Chat List */}
      <ChatSidebar
        showChatList={showChatList}
        currentSessionToken={sessionToken}
        onSessionSelect={handleSessionSelect}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <ChatHeader
          session={session}
          onToggleChatList={() => setShowChatList(!showChatList)}
          onStartNewChat={handleStartNewChat}
          onDeleteChat={handleDeleteChat}
          onLogout={handleLogout}
          isDeleting={isDeleting}
        />

        {/* Chat Container */}
        <ChatContainer
          messages={messages}
          setMessages={setMessages}
          sessionToken={sessionToken}
        />

        {/* Background Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-200/30 dark:bg-blue-800/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-200/20 dark:bg-indigo-800/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};

export default Index;
