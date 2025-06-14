
import ChatList from '@/components/ChatList';

interface ChatSidebarProps {
  showChatList: boolean;
  currentSessionToken: string;
  onSessionSelect: (sessionToken: string) => void;
  onDeleteSession: (sessionToken: string) => void;
}

const ChatSidebar = ({ 
  showChatList, 
  currentSessionToken, 
  onSessionSelect, 
  onDeleteSession 
}: ChatSidebarProps) => {
  return (
    <div className={`${showChatList ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700`}>
      <ChatList
        currentSessionToken={currentSessionToken}
        onSessionSelect={onSessionSelect}
        onDeleteSession={onDeleteSession}
      />
    </div>
  );
};

export default ChatSidebar;
