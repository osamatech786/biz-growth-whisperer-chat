
import { useState } from 'react';
import { Send, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const MessageInput = ({ onSend, disabled }: MessageInputProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4">
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <div className="flex-1">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about growing your business..."
            disabled={disabled}
            className="border-0 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-10 h-10 rounded-xl hover:bg-gray-100"
          >
            <Mic className="w-4 h-4" />
          </Button>
          
          <Button
            type="submit"
            disabled={!message.trim() || disabled}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
      
      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <div className="flex gap-4">
          <span>Press Enter to send</span>
          <span>Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
