import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, FileWarning, Shield, ExternalLink, HelpCircle, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'DMCA Policy - PersonalAIWalls',
  description: 'Our DMCA policy explains how we handle copyright concerns and takedown requests for AI-generated wallpapers.',
};

export default function DMCAPage() {
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
            <Shield className="w-6 h-6 text-muted-foreground" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            DMCA Policy
          </h1>
          <p className="text-muted-foreground text-lg">
            Last updated: {formattedDate}
          </p>
        </div>

        {/* Introduction Section */}
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <p className="text-lg text-muted-foreground/90 leading-relaxed mb-6">
            PersonalAIWalls respects the intellectual property rights of others and complies with the Digital Millennium Copyright Act (DMCA). This policy outlines how to submit copyright infringement notifications and how we handle them.
          </p>
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
                  AI-Generated Content and Copyright
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    PersonalAIWalls features AI-generated wallpapers. We understand the unique challenges this presents regarding copyright:
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        While AI systems are trained on diverse datasets, we do not intentionally generate or host content that infringes on existing copyrights.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        We review AI-generated content before publishing it to minimize potential infringement issues.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        We take all copyright concerns seriously and respond promptly to legitimate takedown requests.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="group rounded-xl bg-background/60 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Reporting Copyright Infringement
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    If you believe your copyrighted work has been used on our site in a way that constitutes infringement, please submit a DMCA takedown notice containing the following information:
                  </p>
                  <ol className="mt-4 space-y-3 text-muted-foreground/90 list-decimal pl-4">
                    <li>
                      <div>
                        <strong>Identification</strong> of the copyrighted work you claim has been infringed.
                      </div>
                    </li>
                    <li>
                      <div>
                        <strong>Identification</strong> of the material on our site that you claim is infringing, with enough detail so we can locate it (e.g., URL).
                      </div>
                    </li>
                    <li>
                      <div>
                        <strong>Your contact information</strong>, including your address, telephone number, and email.
                      </div>
                    </li>
                    <li>
                      <div>
                        A statement that you <strong>have a good faith belief</strong> that the use is not authorized by the copyright owner, its agent, or the law.
                      </div>
                    </li>
                    <li>
                      <div>
                        A statement, <strong>under penalty of perjury</strong>, that the information in your notice is accurate and that you are the copyright owner or authorized to act on the owner's behalf.
                      </div>
                    </li>
                    <li>
                      <div>
                        Your <strong>physical or electronic signature</strong>.
                      </div>
                    </li>
                  </ol>
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
                  Our DMCA Process
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    When we receive a valid DMCA notification, we will:
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        Promptly remove or disable access to the allegedly infringing content
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        Make a reasonable attempt to notify the content uploader of the removal
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        Provide information about submitting a counter-notification if appropriate
                      </div>
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
                  Submit a DMCA Notice
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    Send your DMCA takedown notice to our designated copyright agent:
                  </p>
                  <div className="mt-6 flex flex-col gap-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="text-muted-foreground/90">
                        <strong>Copyright Agent</strong><br />
                        PersonalAIWalls<br />
                        Email: <a href="mailto:dmca@personalwallpapers.io" className="text-primary hover:underline">dmca@personalwallpapers.io</a>
                      </p>
                    </div>
                    <p className="text-muted-foreground/90">
                      Please note that under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that material is infringing may be subject to liability.
                    </p>
                    <p className="text-muted-foreground/90">
                      You can also contact us through our <Link href="/contact" className="text-primary hover:underline">contact form</Link>.
                    </p>
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