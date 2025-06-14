
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailVerificationProps {
  onVerified: (email: string) => void;
}

const EmailVerification = ({ onVerified }: EmailVerificationProps) => {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendVerificationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      // Generate 6-digit code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store verification code in database
      const { error } = await supabase
        .from('email_verifications')
        .insert({
          email: email.toLowerCase(),
          verification_code: verificationCode,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        });

      if (error) throw error;

      toast({
        title: "Verification code sent!",
        description: `Code sent to ${email}. For demo purposes, your code is: ${verificationCode}`,
      });

      setStep('code');
    } catch (error) {
      console.error('Verification code send failed:', error);
      toast({
        title: "Error",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    try {
      // Check verification code
      const { data, error } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('verification_code', code)
        .eq('verified', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        throw new Error('Invalid or expired verification code');
      }

      // Mark as verified
      await supabase
        .from('email_verifications')
        .update({ verified: true })
        .eq('id', data[0].id);

      toast({
        title: "Email verified!",
        description: "You can now access the chat.",
      });

      onVerified(email.toLowerCase());
    } catch (error) {
      console.error('Verification failed:', error);
      toast({
        title: "Verification failed",
        description: "Invalid or expired code. Please try again.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  if (step === 'email') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Access AI Chat</h1>
            <p className="text-gray-600 mt-2">Enter your email to get started</p>
          </div>

          <form onSubmit={sendVerificationCode} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full"
                disabled={loading}
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Enter Verification Code</h1>
          <p className="text-gray-600 mt-2">Code sent to {email}</p>
        </div>

        <form onSubmit={verifyCode} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              6-Digit Code
            </label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              required
              className="w-full text-center text-xl tracking-widest"
              disabled={loading}
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
            <CheckCircle className="w-4 h-4 ml-2" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep('email')}
            className="w-full"
            disabled={loading}
          >
            Back to Email
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EmailVerification;
