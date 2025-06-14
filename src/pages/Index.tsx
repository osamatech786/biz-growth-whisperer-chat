
import { useState } from 'react';
import { Bot, User, Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatMessage from '@/components/ChatMessage';
import MessageInput from '@/components/MessageInput';
import TypingIndicator from '@/components/TypingIndicator';
import EmailVerification from '@/components/EmailVerification';
import { useSession } from '@/hooks/useSession';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  suggestions?: string[];
}

const Index = () => {
  const { session, loading, createSession, destroySession } = useSession();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI Business Advisor. I'm here to help you grow your business with strategic insights and actionable recommendations. What aspect of your business would you like to focus on today?",
      sender: 'ai',
      timestamp: new Date(),
      suggestions: [
        "Increase revenue streams",
        "Improve customer retention", 
        "Optimize operations",
        "Market expansion strategy"
      ]
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.isVerified) {
    return <EmailVerification onVerified={createSession} />;
  }

  const saveMessageToDatabase = async (message: Message) => {
    try {
      await supabase
        .from('chat_messages')
        .insert({
          session_token: session.sessionToken,
          message_content: message.content,
          sender: message.sender,
          suggestions: message.suggestions || null
        });
    } catch (error) {
      console.error('Failed to save message to database:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    await saveMessageToDatabase(userMessage);
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(async () => {
      const aiResponses = [
        {
          content: "Great question! Let me analyze your situation. Based on current market trends, here are three strategic approaches I recommend for revenue growth...",
          suggestions: ["Implement subscription model", "Launch referral program", "Expand to B2B market", "Create premium tier"]
        },
        {
          content: "Customer retention is crucial for sustainable growth. Studies show it costs 5x more to acquire new customers than retain existing ones. Here's my analysis...",
          suggestions: ["Implement loyalty program", "Improve onboarding", "Regular check-ins", "Personalized offers"]
        },
        {
          content: "Operational efficiency can significantly impact your bottom line. Let me share some data-driven insights on optimization opportunities...",
          suggestions: ["Automate repetitive tasks", "Streamline workflows", "Reduce overhead costs", "Implement KPI tracking"]
        }
      ];

      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: randomResponse.content,
        sender: 'ai',
        timestamp: new Date(),
        suggestions: randomResponse.suggestions
      };

      setMessages(prev => [...prev, aiMessage]);
      await saveMessageToDatabase(aiMessage);
      setIsTyping(false);
    }, 2000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleLogout = async () => {
    await destroySession();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Business Advisor</h1>
              <p className="text-sm text-gray-600">Strategic insights for business growth</p>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Logged in as: {session.email}
              </div>
              <Button onClick={() => navigate('/admin')} variant="outline" size="sm">
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Online
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col h-[calc(100vh-100px)]">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-6 pb-6">
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              onSuggestionClick={handleSuggestionClick}
            />
          ))}
          {isTyping && <TypingIndicator />}
        </div>

        {/* Input Area */}
        <MessageInput onSend={handleSendMessage} disabled={isTyping} />
      </div>

      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default Index;
