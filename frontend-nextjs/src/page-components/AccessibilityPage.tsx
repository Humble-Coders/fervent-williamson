import React from 'react';
import Card from '../components/ui/Card';
import { env } from '../config/env';

const AccessibilityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-12 md:py-16">
        <div className="container-custom px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">♿</div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Accessibility Statement</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Our commitment to making CutQ accessible to everyone, regardless of ability.
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom px-4 py-8">
        <Card className="p-8 max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-8">
              <strong>Last updated:</strong> January 1, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Our Commitment to Accessibility</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  CutQ is committed to ensuring digital accessibility for people with disabilities. 
                  We are continually improving the user experience for everyone and applying the 
                  relevant accessibility standards.
                </p>
                <p>
                  We believe that everyone should have equal access to beauty services and our 
                  platform, regardless of their abilities or the technologies they use.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Accessibility Standards</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  CutQ aims to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 
                  Level AA standards. These guidelines explain how to make web content more 
                  accessible to people with disabilities.
                </p>
                <h3 className="text-lg font-semibold">Standards We Follow</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>WCAG 2.1 Level AA compliance</li>
                  <li>Section 508 of the Rehabilitation Act</li>
                  <li>Americans with Disabilities Act (ADA) guidelines</li>
                  <li>EN 301 549 European accessibility standard</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Accessibility Features</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">Visual Accessibility</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>High contrast color schemes</li>
                  <li>Scalable text that can be enlarged up to 200%</li>
                  <li>Alternative text for all images</li>
                  <li>Clear visual focus indicators</li>
                  <li>Consistent navigation and layout</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">Motor Accessibility</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Full keyboard navigation support</li>
                  <li>Large clickable areas for buttons and links</li>
                  <li>No time-sensitive actions required</li>
                  <li>Drag and drop alternatives provided</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">Cognitive Accessibility</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Clear and simple language</li>
                  <li>Consistent navigation patterns</li>
                  <li>Error messages with clear instructions</li>
                  <li>Progress indicators for multi-step processes</li>
                  <li>Help and support readily available</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">Auditory Accessibility</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Text alternatives for audio content</li>
                  <li>Visual indicators for audio alerts</li>
                  <li>Multiple contact methods available</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Assistive Technology Support</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Our website is designed to work with assistive technologies, including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Screen readers (JAWS, NVDA, VoiceOver, TalkBack)</li>
                  <li>Voice recognition software</li>
                  <li>Keyboard-only navigation</li>
                  <li>Switch navigation devices</li>
                  <li>Magnification software</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Browser and Device Compatibility</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">Supported Browsers</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Chrome (latest 2 versions)</li>
                  <li>Firefox (latest 2 versions)</li>
                  <li>Safari (latest 2 versions)</li>
                  <li>Edge (latest 2 versions)</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">Mobile Accessibility</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>iOS VoiceOver support</li>
                  <li>Android TalkBack support</li>
                  <li>Touch-friendly interface design</li>
                  <li>Responsive design for all screen sizes</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Known Limitations</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  While we strive for full accessibility, we acknowledge some current limitations:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Some third-party embedded content may not be fully accessible</li>
                  <li>Complex interactive maps may have limited screen reader support</li>
                  <li>Some PDF documents may not be fully accessible (we're working to improve this)</li>
                </ul>
                <p>
                  We are actively working to address these limitations and improve accessibility 
                  across all areas of our platform.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Ongoing Efforts</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">Regular Testing</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Automated accessibility testing in our development process</li>
                  <li>Manual testing with assistive technologies</li>
                  <li>User testing with people with disabilities</li>
                  <li>Regular accessibility audits by third-party experts</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">Team Training</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Regular accessibility training for our development team</li>
                  <li>Accessibility guidelines integrated into our design process</li>
                  <li>Collaboration with accessibility experts and advocates</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Alternative Access Methods</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  If you encounter accessibility barriers on our website, we offer alternative 
                  ways to access our services:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Phone booking assistance: {env.BRAND_PHONE}</li>
                  <li>Email support: {env.BRAND_EMAIL}</li>
                  <li>Live chat support (with keyboard navigation)</li>
                  <li>In-person assistance at partner salons</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Feedback and Complaints</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We welcome feedback about the accessibility of CutQ. If you encounter 
                  accessibility barriers or have suggestions for improvement:
                </p>
                <ul className="list-none space-y-2">
                  <li><strong>Email:</strong> accessibility@cutq.store</li>
                  <li><strong>Phone:</strong> {env.BRAND_PHONE}</li>
                  <li><strong>Mail:</strong> {env.BRAND_ADDRESS}</li>
                </ul>
                <p>
                  We aim to respond to accessibility feedback within 2 business days and 
                  will work with you to provide the information or service you need in an 
                  accessible format.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Formal Complaints Process</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  If you are not satisfied with our response to your accessibility concern, 
                  you may file a formal complaint:
                </p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Contact our accessibility coordinator at accessibility@cutq.store</li>
                  <li>Provide details about the accessibility barrier you encountered</li>
                  <li>Include any relevant documentation or screenshots</li>
                  <li>We will investigate and respond within 10 business days</li>
                </ol>
                <p>
                  You may also file a complaint with relevant regulatory authorities if 
                  you believe we have not adequately addressed your accessibility concerns.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
              <div className="space-y-4 text-gray-700">
                <p>For accessibility-related questions or concerns:</p>
                <ul className="list-none space-y-2">
                  <li><strong>Accessibility Coordinator:</strong> accessibility@cutq.store</li>
                  <li><strong>General Contact:</strong> {env.BRAND_EMAIL}</li>
                  <li><strong>Phone:</strong> {env.BRAND_PHONE}</li>
                  <li><strong>Address:</strong> {env.BRAND_ADDRESS}</li>
                </ul>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AccessibilityPage;
