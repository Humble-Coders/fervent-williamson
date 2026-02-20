import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
// import { Helmet } from 'react-helmet-async'; // Removed - using Next.js metadata instead
// import { generateBreadcrumbData } from '../../utils/seoUtils'; // Removed unused import

export interface BreadcrumbItem {
  name: string;
  url: string;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items, 
  className = '', 
  showHome = true 
}) => {
  // Prepare breadcrumb items with home if needed
  const breadcrumbItems = showHome 
    ? [{ name: 'Home', url: '/' }, ...items]
    : items;

  // Generate structured data for SEO
  // const _structuredData = generateBreadcrumbData(breadcrumbItems); // Removed unused variable

  return (
    <>
      {/* Structured Data for SEO - TODO: Move to Next.js metadata */}
      {/* <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet> */}

      {/* Breadcrumb Navigation */}
      <nav 
        aria-label="Breadcrumb" 
        className={`flex items-center space-x-1 text-sm text-gray-600 ${className}`}
      >
        <ol className="flex items-center space-x-1" itemScope itemType="https://schema.org/BreadcrumbList">
          {breadcrumbItems.map((item, index) => (
            <li 
              key={index}
              className="flex items-center"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {/* Add separator except for first item */}
              {index > 0 && (
                <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
              )}
              
              {/* Breadcrumb Item */}
              {item.isActive || index === breadcrumbItems.length - 1 ? (
                <span 
                  className="text-gray-900 font-medium"
                  itemProp="name"
                  aria-current="page"
                >
                  {index === 0 && showHome ? (
                    <span className="flex items-center">
                      <Home className="w-4 h-4 mr-1" />
                      {item.name}
                    </span>
                  ) : (
                    item.name
                  )}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200 flex items-center"
                  itemProp="item"
                >
                  <span itemProp="name">
                    {index === 0 && showHome ? (
                      <span className="flex items-center">
                        <Home className="w-4 h-4 mr-1" />
                        {item.name}
                      </span>
                    ) : (
                      item.name
                    )}
                  </span>
                </Link>
              )}
              
              {/* Hidden meta for structured data */}
              <meta itemProp="position" content={String(index + 1)} />
              {!item.isActive && index !== breadcrumbItems.length - 1 && (
                <link itemProp="item" href={`https://cutq.store${item.url}`} />
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumb;
