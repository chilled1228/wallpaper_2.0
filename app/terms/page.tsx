import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Scale, Shield, FileCheck, AlertCircle, Users, RefreshCw, Mail, Gavel, Handshake } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms & Conditions - PersonalAIWalls',
  description: 'Read about our terms and conditions for using the PersonalAIWalls platform',
};

export default function TermsAndConditions() {
  // Format current date for the last updated section
  const formattedDate = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

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
            <Scale className="w-6 h-6 text-muted-foreground" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Terms & Conditions
          </h1>
          <p className="text-muted-foreground text-lg">
            Last updated: {formattedDate}
          </p>
        </div>

        {/* Introduction Section */}
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <p className="text-lg text-muted-foreground/90 leading-relaxed mb-6">
            Welcome to PersonalAIWalls. By accessing or using our services, you agree to be bound by these Terms & Conditions. Please read them carefully before using our platform.
          </p>
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground/80">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              Protected Service
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-muted" />
            <span className="flex items-center gap-1.5">
              <FileCheck className="w-4 h-4" />
              Legal Compliance
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-muted" />
            <span className="flex items-center gap-1.5">
              <Handshake className="w-4 h-4" />
              Fair Usage
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-12">
          <section className="group rounded-xl bg-background/60 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <Gavel className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Acceptance of Terms
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    By accessing or using PersonalAIWalls, you agree to:
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Comply with these Terms & Conditions
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Follow our community guidelines
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Respect intellectual property rights
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Use the service responsibly
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="group rounded-xl bg-background/60 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  User Responsibilities
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    As a user of PersonalAIWalls, you are responsible for:
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Maintaining account security
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Creating appropriate content
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Respecting other users
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Following platform guidelines
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="group rounded-xl bg-background/60 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Prohibited Activities
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    The following activities are strictly prohibited:
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Unauthorized access or use
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Sharing inappropriate content
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Harassment or abuse
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Violation of intellectual property
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Section with Special Styling */}
          <section className="group rounded-xl bg-background/60 backdrop-blur-xl border-t-4 border-t-primary border-primary/10 p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Contact Us
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    If you have any questions about these Terms & Conditions, please contact us:
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <Link 
                      href="mailto:support@personalwallpapers.io" 
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors duration-200"
                    >
                      <Mail className="w-4 h-4" />
                      <span>support@personalwallpapers.io</span>
                    </Link>
                    <Link 
                      href="/contact" 
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors duration-200"
                    >
                      <Users className="w-4 h-4" />
                      <span>Contact Form</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
} 