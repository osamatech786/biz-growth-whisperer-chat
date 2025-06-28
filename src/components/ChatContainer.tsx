import { useState } from 'react';
import ChatMessage from '@/components/ChatMessage';
import MessageInput from '@/components/MessageInput';
import TypingIndicator from '@/components/TypingIndicator';
import { supabase } from '@/integrations/supabase/client';
import { useVertexAI } from '@/hooks/useVertexAI';

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
  userEmail?: string;
}

const ChatContainer = ({ messages, setMessages, sessionToken, userEmail }: ChatContainerProps) => {
  const [isTyping, setIsTyping] = useState(false);
  const { sendMessage, currentSession, setCurrentSession } = useVertexAI();

  // Set the current Vertex AI session to match the chat session
  if (currentSession !== sessionToken) {
    setCurrentSession(sessionToken);
  }

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

    try {
      // Send message to Vertex AI agent with user email
      const aiResponse = await sendMessage(content, sessionToken, userEmail);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse || "I apologize, but I couldn't process your request at the moment. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      await saveMessageToDatabase(aiMessage);
    } catch (error) {
      console.error('Error sending message to Vertex AI:', error);
      
      // Fallback error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm experiencing technical difficulties. Please try again later.",
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      await saveMessageToDatabase(errorMessage);
    } finally {
      setIsTyping(false);
    }
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
