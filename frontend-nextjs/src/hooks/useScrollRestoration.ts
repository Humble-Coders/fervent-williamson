import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface UseScrollRestorationOptions {
  /**
   * Whether to use smooth scrolling animation
   * @default false
   */
  smooth?: boolean;
  
  /**
   * Delay before scrolling (in milliseconds)
   * @default 0
   */
  delay?: number;
  
  /**
   * Whether to restore scroll position for back/forward navigation
   * @default false
   */
  restoreOnBack?: boolean;
  
  /**
   * Custom scroll target element selector
   * @default window
   */
  target?: string;
}

/**
 * Custom hook for scroll restoration that provides more control over
 * scroll behavior when navigating between routes.
 */
export const useScrollRestoration = (options: UseScrollRestorationOptions = {}) => {
  const {
    smooth = false,
    delay = 0,
    restoreOnBack = false,
    target
  } = options;
  
  const pathname = usePathname();
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const isBackNavigation = useRef(false);

  useEffect(() => {
    // Store current scroll position before navigation
    const handleBeforeUnload = () => {
      const scrollY = target
        ? document.querySelector(target)?.scrollTop || 0
        : window.pageYOffset;
      scrollPositions.current.set(pathname, scrollY);
    };

    // Listen for navigation events
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.addEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname, target]);

  useEffect(() => {
    const scrollToPosition = () => {
      const element = target ? document.querySelector(target) : window;
      
      if (!element) return;

      // Check if we should restore position for back navigation
      if (restoreOnBack && isBackNavigation.current) {
        const savedPosition = scrollPositions.current.get(pathname) || 0;
        
        if (target) {
          (element as Element).scrollTo({
            top: savedPosition,
            behavior: smooth ? 'smooth' : 'instant'
          });
        } else {
          window.scrollTo({
            top: savedPosition,
            left: 0,
            behavior: smooth ? 'smooth' : 'instant'
          });
        }
        
        isBackNavigation.current = false;
      } else {
        // Scroll to top for new navigation
        if (target) {
          (element as Element).scrollTo({
            top: 0,
            behavior: smooth ? 'smooth' : 'instant'
          });
        } else {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: smooth ? 'smooth' : 'instant'
          });
        }
      }
    };

    // Apply delay if specified
    if (delay > 0) {
      const timeoutId = setTimeout(scrollToPosition, delay);
      return () => clearTimeout(timeoutId);
    } else {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(scrollToPosition);
      return undefined;
    }
  }, [pathname, smooth, delay, restoreOnBack, target]);

  // Detect back navigation
  useEffect(() => {
    const handlePopState = () => {
      isBackNavigation.current = true;
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return {
    /**
     * Manually scroll to top
     */
    scrollToTop: () => {
      const element = target ? document.querySelector(target) : window;
      
      if (target && element) {
        (element as Element).scrollTo({
          top: 0,
          behavior: smooth ? 'smooth' : 'instant'
        });
      } else {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: smooth ? 'smooth' : 'instant'
        });
      }
    },
    
    /**
     * Manually scroll to a specific position
     */
    scrollTo: (position: number) => {
      const element = target ? document.querySelector(target) : window;
      
      if (target && element) {
        (element as Element).scrollTo({
          top: position,
          behavior: smooth ? 'smooth' : 'instant'
        });
      } else {
        window.scrollTo({
          top: position,
          left: 0,
          behavior: smooth ? 'smooth' : 'instant'
        });
      }
    }
  };
};
