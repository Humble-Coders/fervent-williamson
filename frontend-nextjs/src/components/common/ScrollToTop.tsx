'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface ScrollToTopProps {
  smooth?: boolean;
}

/**
 * ScrollToTop component that automatically scrolls to the top of the page
 * when the route changes. This ensures users start at the top of each new page.
 */
const ScrollToTop: React.FC<ScrollToTopProps> = ({ smooth = false }) => {
  const pathname = usePathname();

  useEffect(() => {
    // Small delay to ensure the page has rendered
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: smooth ? 'smooth' : 'instant'
      });
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      scrollToTop();
    });
  }, [pathname, smooth]);

  return null; // This component doesn't render anything
};

export default ScrollToTop;
