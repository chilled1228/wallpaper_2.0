import { Metadata } from 'next';
import { ArrowRight, AlertTriangle, Scale, BookOpen, FileWarning, Shield, ExternalLink, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Disclaimer - PersonalAIWalls',
  description: 'Read our disclaimer to understand the terms of using our PersonalAIWalls platform',
};

export default function Disclaimer() {
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
            <AlertTriangle className="w-6 h-6 text-muted-foreground" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Disclaimer
          </h1>
          <p className="text-muted-foreground text-lg">
            Last updated: {formattedDate}
          </p>
        </div>

        {/* Introduction Section */}
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <p className="text-lg text-muted-foreground/90 leading-relaxed mb-6">
            Please read this disclaimer carefully before using PersonalAIWalls. By accessing and using our platform, you acknowledge and agree to the terms outlined in this disclaimer.
          </p>
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground/80">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Use at own risk
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-muted" />
            <span className="flex items-center gap-1.5">
              <Scale className="w-4 h-4" />
              Legal compliance
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-muted" />
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              No warranty
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-12">
          <section className="group rounded-xl bg-background/60 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <FileWarning className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  General Disclaimer
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    The information provided on PersonalAIWalls is for general informational and educational purposes only. We make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the information, products, services, or related graphics contained on the platform.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="group rounded-xl bg-background/60 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <Scale className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  User Responsibility
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    By using PersonalAIWalls, you acknowledge and agree that:
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      You use the platform and its content at your own risk
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      You are responsible for ensuring compliance with applicable laws and regulations
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      You will not use the platform for any illegal or unauthorized purposes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      You are responsible for the content you generate using our wallpapers
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="group rounded-xl bg-background/60 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Content Disclaimer
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    The wallpapers and content on our platform:
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      May not be suitable for all purposes or contexts
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Should be reviewed and verified before use in any professional or critical context
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      May require modification to meet specific needs or requirements
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Are not guaranteed to produce specific results or outcomes
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="group rounded-xl bg-background/60 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <ExternalLink className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Third-Party Links
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    Our platform may contain links to external websites or services. We are not responsible for:
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      The content or accuracy of any linked websites
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      The privacy practices of third-party websites
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Any damages or losses incurred through the use of external links
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
                <HelpCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Questions or Concerns?
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    If you have any questions about this Disclaimer, please contact us:
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <Link 
                      href="mailto:support@personalwallpapers.io"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors duration-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>support@personalwallpapers.io</span>
                    </Link>
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors duration-200"
                    >
                      <HelpCircle className="w-4 h-4" />
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