import React from 'react';
import Card from '../components/ui/Card';
import { env } from '../config/env';

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-12 md:py-16">
        <div className="container-custom px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">📋</div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Please read these terms carefully before using our services.
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Definitions and General Terms</h2>
              <div className="space-y-4 text-gray-700">
                <p>For the purpose of these Terms and Conditions, the term &quot;we&quot;, &quot;us&quot;, &quot;our&quot; used anywhere on this page shall mean <strong>CutQ (Bhagat Singh)</strong>, whose registered/operational office is <strong>Vidyaranyapura, Bangalore, Bengaluru, Karnataka 560097</strong>. &quot;You&quot;, &quot;your&quot;, &quot;user&quot;, &quot;visitor&quot; shall mean any natural or legal person who is visiting our website and/or agreed to purchase from us.</p>

                <p>Your use of the website and/or purchase from us are governed by following Terms and Conditions:</p>

                <ul className="list-disc pl-6 space-y-2">
                  <li>The content of the pages of this website is subject to change without notice.</li>
                  <li>Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials found or offered on this website for any particular purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.</li>
                  <li>Your use of any information or materials on our website and/or product pages is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services or information available through our website and/or product pages meet your specific requirements.</li>
                  <li>Our website contains material which is owned by or licensed to us. This material includes, but are not limited to, the design, layout, look, appearance and graphics. Reproduction is prohibited other than in accordance with the copyright notice, which forms part of these terms and conditions.</li>
                  <li>All trademarks reproduced in our website which are not the property of, or licensed to, the operator are acknowledged on the website. Unauthorized use of information provided by us shall give rise to a claim for damages and/or be a criminal offense.</li>
                  <li>From time to time our website may also include links to other websites. These links are provided for your convenience to provide further information.</li>
                  <li>You may not create a link to our website from another website or document without CutQ (Bhagat Singh&apos;s) prior written consent.</li>
                  <li>Any dispute arising out of use of our website and/or purchase with us and/or any engagement with us is subject to the laws of India.</li>
                  <li>We shall be under no liability whatsoever in respect of any loss or damage arising directly or indirectly out of the decline of authorization for any Transaction, on Account of the Cardholder having exceeded the preset limit mutually agreed by us with our acquiring bank from time to time.</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <div className="space-y-4 text-gray-700">
                <p>By accessing and using CutQ (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <div className="space-y-4 text-gray-700">
                <p>CutQ is a platform that connects customers with beauty salons and service providers. Our services include:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Salon discovery and search functionality</li>
                  <li>Online appointment booking and management</li>
                  <li>Payment processing for services</li>
                  <li>Review and rating system</li>
                  <li>Customer support and communication tools</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">Account Creation</h3>
                <p>To use certain features of our service, you must create an account. You agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized use</li>
                  <li>Be responsible for all activities under your account</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">Account Termination</h3>
                <p>We reserve the right to terminate accounts that violate these terms or engage in fraudulent activity.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Booking and Payments</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">Booking Policy</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Bookings are subject to salon availability and confirmation</li>
                  <li>You must provide accurate information when booking</li>
                  <li>Cancellation policies vary by salon and are clearly displayed</li>
                  <li>No-shows may result in charges as per salon policy</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">Payment Terms</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Payments are processed securely through third-party providers</li>
                  <li>Prices are set by individual salons and may change</li>
                  <li>Refunds are subject to salon and service-specific policies</li>
                  <li>Additional fees may apply for certain payment methods</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. User Conduct</h2>
              <div className="space-y-4 text-gray-700">
                <p>You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the service for any unlawful purpose</li>
                  <li>Harass, abuse, or harm other users or salon staff</li>
                  <li>Submit false or misleading information</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Use automated tools to access or interact with the service</li>
                  <li>Post inappropriate content in reviews or communications</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Reviews and Content</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">User-Generated Content</h3>
                <p>By submitting reviews, photos, or other content, you:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Grant us a license to use, display, and distribute your content</li>
                  <li>Confirm that your content is accurate and honest</li>
                  <li>Agree not to post offensive, defamatory, or inappropriate content</li>
                  <li>Understand that we may remove content that violates our guidelines</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <div className="space-y-4 text-gray-700">
                <p>CutQ acts as a platform connecting customers with salons. We are not responsible for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>The quality of services provided by salons</li>
                  <li>Disputes between customers and salons</li>
                  <li>Injuries or damages occurring at salon premises</li>
                  <li>Loss of data or service interruptions</li>
                  <li>Actions or omissions of third-party service providers</li>
                </ul>
                <p className="font-semibold">Our total liability is limited to the amount paid for services through our platform.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
              <div className="space-y-4 text-gray-700">
                <p>All content, trademarks, and intellectual property on our platform are owned by us or our licensors. You may not:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Copy, modify, or distribute our content without permission</li>
                  <li>Use our trademarks or branding without authorization</li>
                  <li>Reverse engineer or attempt to extract source code</li>
                  <li>Create derivative works based on our platform</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Privacy</h2>
              <div className="space-y-4 text-gray-700">
                <p>Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Modifications</h2>
              <div className="space-y-4 text-gray-700">
                <p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the service constitutes acceptance of the modified terms.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
              <div className="space-y-4 text-gray-700">
                <p>These terms are governed by the laws of India. Any dispute arising out of use of our website and/or purchase with us and/or any engagement with us is subject to the laws of India. Any disputes will be resolved in the courts having jurisdiction in Bangalore, Karnataka, India.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Service Provider Information</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  CutQ services are operated and provided by <strong>Gem Infinity Estates LLP</strong>,
                  a limited liability partnership authorized to provide digital platform services
                  and communication services including SMS notifications and customer communications.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800">
                    <strong>Important:</strong> SMS messages, notifications, and other communications
                    from CutQ may be sent through Gem Infinity Estates LLP. This ensures reliable
                    service delivery and compliance with telecommunications regulations.
                  </p>
                </div>
                <p>
                  By using CutQ services, you acknowledge and agree that Gem Infinity Estates LLP
                  is authorized to send you service-related communications including but not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Booking confirmations and updates</li>
                  <li>Appointment reminders and notifications</li>
                  <li>Account verification and security messages</li>
                  <li>Customer service communications</li>
                  <li>Payment and billing notifications</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
              <div className="space-y-4 text-gray-700">
                <p>If you have any questions about these Terms of Service, please contact us:</p>
                <ul className="list-none space-y-2">
                  <li><strong>Email:</strong> {env.BRAND_EMAIL}</li>
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

export default TermsOfServicePage;
