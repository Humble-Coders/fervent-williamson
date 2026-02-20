import { Metadata } from 'next';
import { generateMetadata } from '@/utils/metadata';
import AccessibilityPage from '@/page-components/AccessibilityPage';

export const metadata: Metadata = generateMetadata({
  title: 'Accessibility Statement | CutQ',
  description: 'Learn about CutQ\'s commitment to digital accessibility and our efforts to make our platform usable by everyone.',
  keywords: ['accessibility', 'WCAG', 'ADA compliance', 'assistive technology', 'inclusive design', 'cutq accessibility']
});

export default function AccessibilityRoute() {
  return <AccessibilityPage />;
}
