'use client';
import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { env } from '../config/env';

const CookiePolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-12 md:py-16">
        <div className="container-custom px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🍪</div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Learn how we use cookies to improve your experience on our website.
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are Cookies?</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Cookies are small text files that are stored on your device when you visit our website. 
                  They help us provide you with a better experience by remembering your preferences and 
                  understanding how you use our services.
                </p>
                <p>
                  Cookies cannot harm your device or files. They are widely used across the internet to 
                  make websites work more efficiently and provide information to website owners.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Cookies</h2>
              <div className="space-y-4 text-gray-700">
                <p>We use cookies for several purposes:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
                  <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our website</li>
                  <li><strong>Functionality Cookies:</strong> Remember your preferences and settings</li>
                  <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Types of Cookies We Use</h2>
              
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Essential Cookies</h3>
                  <p className="text-blue-800 mb-3">
                    These cookies are necessary for the website to function and cannot be switched off.
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-blue-700">
                    <li>Authentication and security</li>
                    <li>Shopping cart functionality</li>
                    <li>Form submission</li>
                    <li>Load balancing</li>
                  </ul>
                </div>

                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">Performance Cookies</h3>
                  <p className="text-green-800 mb-3">
                    These cookies help us understand how visitors use our website.
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-green-700">
                    <li>Google Analytics</li>
                    <li>Page load times</li>
                    <li>Error tracking</li>
                    <li>User behavior analysis</li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3">Functionality Cookies</h3>
                  <p className="text-purple-800 mb-3">
                    These cookies remember your preferences and provide enhanced features.
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-purple-700">
                    <li>Language preferences</li>
                    <li>Location settings</li>
                    <li>Theme preferences</li>
                    <li>Recently viewed items</li>
                  </ul>
                </div>

                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-orange-900 mb-3">Marketing Cookies</h3>
                  <p className="text-orange-800 mb-3">
                    These cookies are used to deliver relevant advertisements and track campaign effectiveness.
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-orange-700">
                    <li>Facebook Pixel</li>
                    <li>Google Ads</li>
                    <li>Retargeting campaigns</li>
                    <li>Social media integration</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Cookies</h2>
              <div className="space-y-4 text-gray-700">
                <p>We also use third-party services that may set their own cookies:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Google Analytics:</strong> For website analytics and performance monitoring</li>
                  <li><strong>Google Maps:</strong> For location services and salon mapping</li>
                  <li><strong>Payment Processors:</strong> For secure payment processing</li>
                  <li><strong>Social Media:</strong> For social sharing and login functionality</li>
                  <li><strong>Customer Support:</strong> For live chat and help desk services</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Managing Your Cookie Preferences</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">Browser Settings</h3>
                <p>You can control cookies through your browser settings:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Block all cookies</li>
                  <li>Block third-party cookies only</li>
                  <li>Delete existing cookies</li>
                  <li>Set cookies to expire when you close your browser</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">Cookie Consent</h3>
                <p>
                  When you first visit our website, you&apos;ll see a cookie banner that allows you to
                  accept or customize your cookie preferences. You can change these preferences 
                  at any time using the cookie settings link in our footer.
                </p>

                <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                  <p className="text-yellow-800">
                    <strong>Note:</strong> Disabling certain cookies may affect the functionality 
                    of our website and limit your user experience.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookie Retention</h2>
              <div className="space-y-4 text-gray-700">
                <p>Different cookies have different retention periods:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                  <li><strong>Persistent Cookies:</strong> Remain for a set period (typically 30 days to 2 years)</li>
                  <li><strong>Authentication Cookies:</strong> Usually expire after 30 days of inactivity</li>
                  <li><strong>Analytics Cookies:</strong> Typically retained for 2 years</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Updates to This Policy</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We may update this Cookie Policy from time to time to reflect changes in our 
                  practices or for other operational, legal, or regulatory reasons. We will notify 
                  you of any material changes by posting the updated policy on our website.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <div className="space-y-4 text-gray-700">
                <p>If you have any questions about our use of cookies, please contact us:</p>
                <ul className="list-none space-y-2">
                  <li><strong>Email:</strong> {env.BRAND_EMAIL}</li>
                  <li><strong>Phone:</strong> {env.BRAND_PHONE}</li>
                  <li><strong>Address:</strong> {env.BRAND_ADDRESS}</li>
                </ul>
              </div>
            </section>

            {/* Cookie Settings Button */}
            <div className="bg-primary-50 p-6 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-primary-900 mb-3">Manage Your Cookie Preferences</h3>
              <p className="text-primary-800 mb-4">
                You can update your cookie preferences at any time by clicking the button below.
              </p>
              <Button 
                variant="primary" 
                onClick={() => {
                  // This would typically open a cookie consent manager
                  alert('Cookie preferences panel would open here');
                }}
              >
                Cookie Settings
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CookiePolicyPage;
