'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Declare the global grecaptcha type
declare global {
  interface Window {
    grecaptcha: any;
    onloadCallback: () => void;
  }
}

export default function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });
  
  useEffect(() => {
    // Define the callback function
    window.onloadCallback = () => {
      window.grecaptcha.render('recaptcha-container', {
        sitekey: '6LeKB7AqAAAAAIs6uPfOq1obJL5lDXZ3GkcOHr-t',
        theme: 'light',
      });
    };

    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?onload=onloadCallback&render=explicit`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      window.onloadCallback = undefined as any;
    };
  }, []);

  const sendMessage = async () => {
    try {
      setIsLoading(true);
      setStatus({ type: null, message: null });

      // Get reCAPTCHA response
      const recaptchaResponse = window.grecaptcha?.getResponse();
      
      if (!recaptchaResponse) {
        setStatus({
          type: 'error',
          message: 'Please complete the reCAPTCHA verification'
        });
        return;
      }

      // Send data to API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message,
          recaptchaToken: recaptchaResponse
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Success
      setStatus({
        type: 'success',
        message: 'Message sent successfully! We will get back to you soon.'
      });
      
      // Reset form
      setName('');
      setEmail('');
      setMessage('');
      window.grecaptcha?.reset();
      
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send message. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className="space-y-8">
      <div className="group rounded-xl bg-background/60 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-primary/10">
        <form 
          ref={formRef}
          onSubmit={handleSubmit} 
          className="space-y-6"
        >
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Your Name
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-12 bg-background/60"
              placeholder="John Doe"
            />
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 bg-background/60"
              placeholder="john@example.com"
            />
          </div>

          {/* Message Input */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2">
              Your Message
            </label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="w-full bg-background/60 resize-none"
              placeholder="Type your message here..."
            />
          </div>

          {/* reCAPTCHA Container */}
          <div className="flex justify-center">
            <div id="recaptcha-container"></div>
          </div>
          
          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 font-medium mt-6"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Status Messages */}
      {status.message && (
        <div className={`mt-4 p-4 rounded-xl ${
          status.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/10 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-200'
        }`}>
          {status.message}
        </div>
      )}
    </div>
  );
} 