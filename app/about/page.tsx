import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Info, PaintBucket, Eye, Sparkles, Download, Shield, Code } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About PersonalAIWalls - AI-Generated Wallpapers For Personal Use',
  description: 'Learn about our AI-generated wallpaper platform. All wallpapers are for personal use only and created using artificial intelligence.',
};

export default function AboutPage() {
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
            <Info className="w-6 h-6 text-muted-foreground" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            About PersonalAIWalls
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A personal collection of AI-generated wallpapers for your devices
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="prose prose-lg dark:prose-invert mx-auto">
            <p className="text-muted-foreground/90 leading-relaxed">
              Welcome to PersonalAIWalls, a platform dedicated to sharing beautiful, high-quality AI-generated wallpapers 
              for your desktop, mobile, and tablet devices. Our mission is to provide a diverse collection of unique 
              wallpapers that can enhance your digital experience.
            </p>
          </div>
        </div>

        {/* What We Do Section */}
        <div className="grid gap-12">
          <section className="group rounded-xl bg-background/60 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <PaintBucket className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  AI-Generated Content
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    <strong>All wallpapers on this site are generated using artificial intelligence.</strong> We use advanced AI technologies to create unique, stunning wallpapers that you won't find anywhere else. Each image is carefully curated to ensure quality and appropriateness.
                  </p>
                  <p className="text-muted-foreground/90 mt-4">
                    We believe in transparency regarding AI-generated content. While AI can create amazing artwork, we acknowledge the following:
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        <strong>AI Generation Process:</strong> Wallpapers are created using AI image models that have been trained on diverse datasets. The AI generates new images based on text descriptions and parameters we provide.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        <strong>Content Originality:</strong> While AI creates unique combinations, these are based on patterns learned from existing art and photography. We make no claim that the AI-generated content is wholly original in the traditional sense.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        <strong>Content Moderation:</strong> We review AI-generated content for quality and to ensure it follows our content guidelines. We do not intentionally create or host content that infringes on existing copyrights.
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
                <Download className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Personal Use Only
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    <strong>All wallpapers on PersonalAIWalls are for personal, non-commercial use only.</strong> This means you can:
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        Use our wallpapers on your personal devices (phones, computers, tablets)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        Share our website with friends and family
                      </div>
                    </li>
                  </ul>
                  <p className="text-muted-foreground/90 mt-4">
                    <strong>You may not:</strong>
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        Sell or redistribute these wallpapers
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        Include them in commercial products or services
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        Claim ownership or copyright of the wallpapers
                      </div>
                    </li>
                  </ul>
                  <p className="text-muted-foreground/90 mt-4">
                    For any questions about usage or to request permission for other uses, please <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="group rounded-xl bg-background/60 backdrop-blur-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-primary/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Content Policy & Copyright
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    We take copyright and intellectual property rights seriously, even with AI-generated content. Our approach:
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        <strong>DMCA Compliance:</strong> We promptly respond to legitimate copyright concerns. If you believe any content infringes on your rights, please contact us through our <Link href="/contact" className="text-primary hover:underline">contact form</Link>.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        <strong>Content Monitoring:</strong> We regularly review our content to ensure it meets our quality standards and doesn't contain inappropriate material.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        <strong>No Recognizable Brands or Characters:</strong> We avoid generating content that depicts recognizable trademarks, brands, or copyrighted characters.
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
                <Code className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Advertising on Our Site
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    PersonalAIWalls displays advertisements to support the site's maintenance and operation. We use Google AdSense to provide contextually relevant ads.
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        <strong>Ad Placement:</strong> We thoughtfully place ads to minimize disruption to your browsing experience.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        <strong>Ad Content:</strong> While we don't directly control ad content, we aim to ensure ads are appropriate. If you see inappropriate ads, please let us know.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        <strong>Your Privacy:</strong> For information about how advertising may use cookies and your data, please review our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="group rounded-xl bg-background/60 backdrop-blur-xl border-t-4 border-t-primary border-primary/10 p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-muted group-hover:scale-110 transition-transform duration-300">
                <Eye className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Our Vision
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                </h2>
                <div className="prose prose-gray dark:prose-invert">
                  <p className="text-muted-foreground/90">
                    PersonalAIWalls was created with the vision of exploring and showcasing the creative possibilities of artificial intelligence in visual art. We believe in:
                  </p>
                  <ul className="mt-4 space-y-3 text-muted-foreground/90">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        <strong>Creativity:</strong> Pushing the boundaries of what AI can create
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        <strong>Transparency:</strong> Being honest about how our content is generated
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2.5" />
                      <div>
                        <strong>Responsibility:</strong> Using AI technology ethically and responsibly
                      </div>
                    </li>
                  </ul>
                  <p className="text-muted-foreground/90 mt-4">
                    We hope you enjoy using our wallpapers as much as we enjoy creating them. If you have any questions, suggestions, or feedback, please don't hesitate to <Link href="/contact" className="text-primary hover:underline">get in touch</Link>.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
} 