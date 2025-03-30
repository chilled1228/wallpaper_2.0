import { Metadata } from 'next';
import { MessageSquare } from 'lucide-react';
import ContactFormWrapper from './contact-form-wrapper';

export const metadata: Metadata = {
  title: 'Contact Us - FreeWallpapers',
  description: 'Have questions, suggestions or feedback about FreeWallpapers? Reach out to our team.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16 relative">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center justify-center p-2 mb-4 rounded-2xl bg-muted/50 backdrop-blur-sm">
            <MessageSquare className="w-6 h-6 text-muted-foreground" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Contact Us
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have a question or feedback? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.
          </p>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <ContactFormWrapper />
          
          {/* Alternative Contact Method */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Prefer email? Reach us directly at{' '}
              <a
                href="mailto:support@freewallpapers.com"
                className="text-foreground hover:underline"
              >
                support@freewallpapers.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 