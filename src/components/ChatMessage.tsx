
import { Bot, User, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  suggestions?: string[];
}

interface ChatMessageProps {
  message: Message;
  onSuggestionClick: (suggestion: string) => void;
}

const ChatMessage = ({ message, onSuggestionClick }: ChatMessageProps) => {
  const isAI = message.sender === 'ai';

  return (
    <div className={`flex gap-4 animate-fade-in ${isAI ? 'justify-start' : 'justify-end'}`}>
      {isAI && (
        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div className={`max-w-3xl ${isAI ? 'order-1' : 'order-0'}`}>
        <div
          className={`rounded-2xl px-6 py-4 shadow-sm ${
            isAI
              ? 'bg-white border border-gray-100'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
          
          {/* Timestamp */}
          <div className="flex items-center gap-1 mt-3 text-xs opacity-60">
            <Clock className="w-3 h-3" />
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* AI Suggestions */}
        {isAI && message.suggestions && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
              <Sparkles className="w-4 h-4" />
              Quick Actions
            </div>
            <div className="flex flex-wrap gap-2">
              {message.suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onSuggestionClick(suggestion)}
                  className="text-xs bg-white/80 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isAI && (
        <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
