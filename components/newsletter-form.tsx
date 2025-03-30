'use client';

export default function NewsletterForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Newsletter subscription logic would go here
  };

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email address"
        aria-label="Email address"
        className="w-full px-3 py-2 text-sm bg-muted/30 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
      />
      <button
        type="submit"
        className="w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Subscribe
      </button>
    </form>
  );
} 