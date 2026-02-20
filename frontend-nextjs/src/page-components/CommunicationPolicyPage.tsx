import React from 'react';
import Card from '../components/ui/Card';
import { env } from '../config/env';

const CommunicationPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-12 md:py-16">
        <div className="container-custom px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">📱</div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Communication Policy</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Learn how CutQ communicates with you through SMS, email, and other channels.
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Communication Channels</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  CutQ uses multiple communication channels to keep you informed about your 
                  bookings, account updates, and important service information.
                </p>
                <h3 className="text-lg font-semibold">Primary Communication Methods</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>SMS/Text Messages:</strong> Booking confirmations, reminders, and updates</li>
                  <li><strong>Email:</strong> Account notifications, receipts, and detailed information</li>
                  <li><strong>In-App Notifications:</strong> Real-time updates within the CutQ platform</li>
                  <li><strong>Phone Calls:</strong> Customer support and urgent matters</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. SMS Communication</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">SMS Service Provider</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800">
                    <strong>Important Notice:</strong> SMS messages from CutQ are sent through our 
                    authorized service provider <strong>Gem Infinity Estates LLP</strong>. You may 
                    see this name as the sender on your SMS notifications.
                  </p>
                </div>
                
                <h3 className="text-lg font-semibold">Types of SMS Messages</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>OTP Verification:</strong> One-time passwords for account security</li>
                  <li><strong>Booking Confirmations:</strong> Immediate confirmation of your appointments</li>
                  <li><strong>Appointment Reminders:</strong> 24-hour and 2-hour reminders</li>
                  <li><strong>Status Updates:</strong> Changes to your booking status</li>
                  <li><strong>Verification Codes:</strong> Account verification and password resets</li>
                  <li><strong>Emergency Notifications:</strong> Urgent updates about your appointments</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">SMS Consent and Opt-out</h3>
                <p>
                  By creating an account with CutQ, you consent to receive SMS messages related 
                  to your bookings and account. You can opt-out of non-essential SMS messages 
                  at any time by:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Replying "STOP" to any SMS message</li>
                  <li>Updating your communication preferences in your account settings</li>
                  <li>Contacting our customer support team</li>
                </ul>
                <p className="text-sm text-gray-600 mt-2">
                  <em>Note: Essential messages like booking confirmations and security alerts 
                  cannot be disabled for account security and service delivery purposes.</em>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Email Communication</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">Email Types</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Transactional Emails:</strong> Booking receipts, confirmations, and updates</li>
                  <li><strong>Account Emails:</strong> Welcome messages, password resets, security alerts</li>
                  <li><strong>Marketing Emails:</strong> Promotional offers, newsletters, and updates (optional)</li>
                  <li><strong>Support Emails:</strong> Customer service communications</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">Email Preferences</h3>
                <p>
                  You can manage your email preferences in your account settings. Marketing 
                  emails are optional and you can unsubscribe at any time using the link 
                  provided in each email.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Communication Frequency</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">Booking-Related Communications</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Immediate:</strong> Booking confirmation (SMS + Email)</li>
                  <li><strong>24 hours before:</strong> Appointment reminder (SMS)</li>
                  <li><strong>2 hours before:</strong> Final reminder (SMS)</li>
                  <li><strong>As needed:</strong> Status updates or changes (SMS + Email)</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">Account-Related Communications</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Security alerts:</strong> Immediate (SMS + Email)</li>
                  <li><strong>Account updates:</strong> As needed (Email)</li>
                  <li><strong>Marketing messages:</strong> Weekly maximum (Email, optional)</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Protection in Communications</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">Information Security</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All communications are encrypted in transit</li>
                  <li>Personal information is limited to what's necessary</li>
                  <li>SMS and email content is logged for customer service purposes</li>
                  <li>Communication data is retained according to our Privacy Policy</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">Third-Party Providers</h3>
                <p>
                  CutQ works with trusted third-party communication providers to deliver 
                  messages reliably and securely:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>SMS Services:</strong> Gem Infinity Estates LLP (authorized provider)</li>
                  <li><strong>Email Services:</strong> Secure SMTP providers with encryption</li>
                  <li><strong>Push Notifications:</strong> Platform-specific notification services</li>
                </ul>
                <p className="text-sm text-gray-600 mt-2">
                  All third-party providers are required to maintain strict data protection 
                  standards and comply with applicable privacy regulations.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Communication Preferences</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">Managing Your Preferences</h3>
                <p>You can control how CutQ communicates with you:</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Log into your CutQ account</li>
                  <li>Go to "Account Settings" → "Communication Preferences"</li>
                  <li>Choose your preferred communication methods</li>
                  <li>Set your notification frequency</li>
                  <li>Save your changes</li>
                </ol>

                <h3 className="text-lg font-semibold mt-6">Available Options</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>SMS Notifications:</strong> Essential only, All notifications, or Disabled</li>
                  <li><strong>Email Notifications:</strong> Transactional only, All emails, or Marketing emails</li>
                  <li><strong>Push Notifications:</strong> Enabled or Disabled</li>
                  <li><strong>Phone Calls:</strong> Emergency only or Customer service calls allowed</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Emergency Communications</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  In case of emergencies or urgent matters affecting your booking, CutQ may 
                  contact you through multiple channels regardless of your communication preferences:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Salon closure or emergency cancellations</li>
                  <li>Security alerts for your account</li>
                  <li>Payment or billing issues requiring immediate attention</li>
                  <li>Health and safety notifications</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Compliance and Regulations</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">Regulatory Compliance</h3>
                <p>
                  CutQ's communication practices comply with applicable regulations including:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Telephone Consumer Protection Act (TCPA)</li>
                  <li>CAN-SPAM Act for email communications</li>
                  <li>GDPR for data protection and consent</li>
                  <li>Local telecommunications regulations</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">Authorized Messaging</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800">
                    <strong>Verification Notice:</strong> CutQ is authorized to send SMS messages 
                    through <strong>Gem Infinity Estates LLP</strong>. This partnership ensures 
                    reliable message delivery and compliance with telecommunications regulations.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Information</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  For questions about our communication policy or to update your preferences:
                </p>
                <ul className="list-none space-y-2">
                  <li><strong>Email:</strong> {env.BRAND_EMAIL}</li>
                  <li><strong>Phone:</strong> {env.BRAND_PHONE}</li>
                  <li><strong>Address:</strong> {env.BRAND_ADDRESS}</li>
                  <li><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM</li>
                </ul>
                <p className="mt-4">
                  You can also manage your communication preferences directly in your 
                  CutQ account settings at any time.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Policy Updates</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We may update this Communication Policy from time to time. When we make 
                  significant changes, we will notify you through:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Email notification to your registered email address</li>
                  <li>In-app notification when you next use CutQ</li>
                  <li>SMS notification for major changes affecting SMS communications</li>
                  <li>Updated policy posted on our website</li>
                </ul>
                <p>
                  Continued use of CutQ services after policy updates constitutes acceptance 
                  of the revised Communication Policy.
                </p>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CommunicationPolicyPage;
