
-- Create a table for storing chat messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT NOT NULL,
  message_content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  suggestions TEXT[], -- Array to store AI suggestions
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better performance when querying by session
CREATE INDEX idx_chat_messages_session_token ON public.chat_messages(session_token);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policy that allows public access for chat functionality
CREATE POLICY "Allow public access to chat messages" 
  ON public.chat_messages 
  FOR ALL 
  USING (true);
