import React from 'react';
import ScrollToTop from './ScrollToTop';

interface PageWrapperProps {
  children: React.ReactNode;
}

/**
 * PageWrapper component that wraps standalone pages (not using layouts)
 * and includes scroll restoration functionality.
 */
const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  return (
    <>
      <ScrollToTop />
      {children}
    </>
  );
};

export default PageWrapper;
