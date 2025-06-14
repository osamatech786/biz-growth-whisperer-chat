
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Download, Trash2, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import EmailConversationDialog from './EmailConversationDialog';

interface CollectedEmail {
  id: string;
  email: string;
  verified: boolean;
  created_at: string;
}

const EmailManagement = () => {
  const [collectedEmails, setCollectedEmails] = useState<CollectedEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [isConversationOpen, setIsConversationOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCollectedEmails();
  }, []);

  const loadCollectedEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('email_verifications')
        .select('id, email, verified, created_at')
        .eq('verified', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollectedEmails(data || []);
    } catch (error) {
      console.error('Failed to load emails:', error);
    }
  };

  const exportEmails = () => {
    const csvContent = [
      ['Email', 'Date Collected'].join(','),
      ...collectedEmails.map(item => [
        item.email,
        new Date(item.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collected-emails-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Email list has been exported to CSV",
    });
  };

  const deleteAllEmails = async () => {
    if (!confirm('Are you sure you want to delete all collected email addresses? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('email_verifications')
        .delete()
        .eq('verified', true);

      if (error) throw error;

      setCollectedEmails([]);
      toast({
        title: "Emails deleted",
        description: "All collected email addresses have been deleted",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete email addresses",
        variant: "destructive"
      });
    }
  };

  const viewConversation = (email: string) => {
    setSelectedEmail(email);
    setIsConversationOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Collected Emails ({collectedEmails.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={exportEmails} size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={deleteAllEmails} size="sm" variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectedEmails.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => viewConversation(item.email)}
                        size="sm"
                        variant="outline"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        View Chat
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EmailConversationDialog
        email={selectedEmail || ''}
        isOpen={isConversationOpen}
        onClose={() => setIsConversationOpen(false)}
      />
    </>
  );
};

export default EmailManagement;
