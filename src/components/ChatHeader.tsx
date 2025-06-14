
import { Bot, Shield, Plus, Trash2, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import { useNavigate } from 'react-router-dom';

interface ChatHeaderProps {
  session: {
    email: string;
  };
  onToggleChatList: () => void;
  onStartNewChat: () => void;
  onDeleteChat: () => void;
  onLogout: () => void;
  isDeleting: boolean;
}

const ChatHeader = ({ 
  session, 
  onToggleChatList, 
  onStartNewChat, 
  onDeleteChat, 
  onLogout, 
  isDeleting 
}: ChatHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={onToggleChatList}
            variant="outline"
            size="sm"
            className="mr-2"
          >
            <List className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Business Advisor</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Strategic insights for business growth</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Logged in as: {session.email}
            </div>
            <ThemeToggle />
            <Button onClick={onStartNewChat} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
            <Button onClick={onDeleteChat} variant="outline" size="sm" disabled={isDeleting}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Chat
            </Button>
            <Button onClick={() => navigate('/admin')} variant="outline" size="sm">
              <Shield className="w-4 h-4 mr-2" />
              Admin
            </Button>
            <Button onClick={onLogout} variant="outline" size="sm">
              Logout
            </Button>
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Online
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
