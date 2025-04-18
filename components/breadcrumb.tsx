import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SchemaMarkup, generateBreadcrumbSchema } from './schema-markup';

interface BreadcrumbProps {
  items: {
    name: string;
    url: string;
  }[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <>
      <SchemaMarkup
        type="BreadcrumbList"
        data={generateBreadcrumbSchema(items)}
      />
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center text-sm text-muted-foreground">
        <ol className="flex items-center space-x-2">
          {items.map((item, index) => (
            <li key={item.url} className="flex items-center">
              {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
              {index === items.length - 1 ? (
                <span className="text-foreground font-medium">{item.name}</span>
              ) : (
                <Link
                  href={item.url}
                  className="hover:text-foreground transition-colors duration-200"
                >
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
} 