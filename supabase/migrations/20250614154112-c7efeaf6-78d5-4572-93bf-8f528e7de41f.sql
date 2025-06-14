
-- Add a deleted_at column to chat_messages for soft delete functionality
ALTER TABLE public.chat_messages 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL;

-- Create an index for better performance when filtering deleted messages
CREATE INDEX idx_chat_messages_deleted_at ON public.chat_messages(deleted_at);

-- Update the existing policy to handle deleted messages
DROP POLICY IF EXISTS "Allow public access to chat messages" ON public.chat_messages;

-- Create new policies for better access control
CREATE POLICY "Allow public access to active chat messages" 
  ON public.chat_messages 
  FOR SELECT 
  USING (deleted_at IS NULL);

CREATE POLICY "Allow public insert of chat messages" 
  ON public.chat_messages 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update of chat messages" 
  ON public.chat_messages 
  FOR UPDATE 
  USING (true);

-- Allow admin to see all messages including deleted ones
CREATE POLICY "Allow admin access to all chat messages" 
  ON public.chat_messages 
  FOR ALL 
  USING (true);
