
import { useState } from 'react';
import ChatMessage from '@/components/ChatMessage';
import MessageInput from '@/components/MessageInput';
import TypingIndicator from '@/components/TypingIndicator';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  suggestions?: string[];
}

interface ChatContainerProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  sessionToken: string;
}

const ChatContainer = ({ messages, setMessages, sessionToken }: ChatContainerProps) => {
  const [isTyping, setIsTyping] = useState(false);

  const saveMessageToDatabase = async (message: Message) => {
    try {
      await supabase
        .from('chat_messages')
        .insert({
          session_token: sessionToken,
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

  return (
    <div className="flex-1 max-w-6xl mx-auto px-6 py-6 flex flex-col h-[calc(100vh-100px)]">
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
  );
};

export default ChatContainer;
