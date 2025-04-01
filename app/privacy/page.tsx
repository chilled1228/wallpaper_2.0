import { ArrowRight, Shield, Lock, Bell, UserCheck, Cookie, Link2, Users, RefreshCw, Mail, DollarSign } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - PersonalAIWalls',
  description: 'Our privacy policy explains how we handle your data and use cookies, including for advertising purposes.'
};

export default function PrivacyPolicy() {
  // Format date server-side
  const formattedDate = new Intl.DateTimeFormat('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  }).format(new Date());

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
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-lg">
            Last updated: {formattedDate}
          </p>
        </div>

        {/* Introduction Section */}
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <p className="text-lg text-muted-foreground/90 leading-relaxed mb-6">
            At PersonalAIWalls, we prioritize the protection of your privacy and personal information. This Privacy Policy outlines our practices for collecting, using, and safeguarding your data when you use our AI-generated wallpaper services.
          </p>
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground/80">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              Secure by design
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-muted" />
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              Data protection
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-muted" />
            <span className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              User control
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-12">
          <section className="group rounded-xl bg-background/60 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Personal Information
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    We may collect personal information that you voluntarily provide to us when you:
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Register for an account
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Sign up for our newsletter
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Contact us through our support channels
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Upload content or download wallpapers
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Participate in our community features
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="group rounded-xl bg-background/60 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Device Information
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    When you visit our website, we automatically collect certain information about your device, including:
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      IP address
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Browser type and version
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Operating system
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Access times and dates
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Pages viewed
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Referring website addresses
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="group rounded-xl bg-background/60 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <Cookie className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Cookies and Tracking Technologies
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    We use cookies and similar tracking technologies to track activity on our website and store certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.
                  </p>
                  <p className="text-muted-foreground/90 mt-4">
                    Types of cookies we use:
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      <strong>Essential cookies:</strong> Required for the website to function properly
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      <strong>Preference cookies:</strong> Allow us to remember your preferences
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      <strong>Analytics cookies:</strong> Help us understand how visitors interact with our website
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      <strong>Advertising cookies:</strong> Used to deliver relevant advertisements and track campaign performance
                    </li>
                  </ul>
                  <p className="text-muted-foreground/90 mt-4">
                    You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="group rounded-xl bg-background/60 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Advertising
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    We use Google AdSense, an advertising service provided by Google, to display ads on our website. Google AdSense may use cookies and other tracking technologies to collect information about your visits to our site and other websites to provide targeted advertisements based on your interests.
                  </p>
                  <p className="text-muted-foreground/90 mt-4">
                    Google AdSense implementation on our site:
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      We display Google AdSense advertisements on various pages of our website
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our site and other sites on the Internet
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google's Ads Settings</a>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      You can also opt out of a third-party vendor's use of cookies for personalized advertising by visiting <a href="http://www.aboutads.info" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="group rounded-xl bg-background/60 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <Bell className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  How We Use Your Information
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    We use the information we collect for various purposes, including:
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Providing, operating, and maintaining our website
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Improving, personalizing, and expanding our services
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Understanding and analyzing how you use our website
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Developing new products, services, features, and functionality
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Communicating with you about updates, security alerts, and support
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Displaying personalized advertisements based on your interests
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="group rounded-xl bg-background/60 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <Link2 className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  AI-Generated Content
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    PersonalAIWalls provides AI-generated wallpapers. We want to be transparent about our content:
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      Our wallpapers are created using artificial intelligence tools and technologies
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      We strive to ensure all content is appropriate and adheres to our guidelines
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      We do not claim ownership of any copyrighted materials that may be inadvertently generated by AI tools
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      All wallpapers are intended for personal use only, not for commercial purposes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      If you believe any content infringes on your rights, please contact us immediately
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
                  Children's Privacy
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    Our service is not intended for use by individuals under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us so that we can take necessary actions.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="group rounded-xl bg-background/60 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <RefreshCw className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Changes to This Privacy Policy
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
                  </p>
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
                    If you have any questions about this Privacy Policy, please contact us:
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <a 
                      href="mailto:support@personalwallpapers.io" 
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors duration-200"
                    >
                      <Mail className="w-4 h-4" />
                      <span>support@personalwallpapers.io</span>
                    </a>
                    <a 
                      href="/contact" 
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors duration-200"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Contact Form</span>
                    </a>
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