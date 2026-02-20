import React from 'react';
import Card from '../components/ui/Card';
import { env } from '../config/env';

const SecurityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-12 md:py-16">
        <div className="container-custom px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Security & Data Protection</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Learn how we protect your data and ensure secure transactions on our platform.
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Our Commitment to Security</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  At CutQ, we take the security of your personal information and payment data 
                  very seriously. We implement industry-standard security measures to protect 
                  your data from unauthorized access, disclosure, alteration, and destruction.
                </p>
                <p>
                  Our security practices are regularly reviewed and updated to ensure we maintain 
                  the highest standards of data protection.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Data Encryption</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">Data in Transit</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All data transmitted between your device and our servers is encrypted using TLS 1.3</li>
                  <li>HTTPS encryption is enforced across all pages of our website</li>
                  <li>API communications use end-to-end encryption</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">Data at Rest</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All stored data is encrypted using AES-256 encryption</li>
                  <li>Database encryption keys are managed separately from data</li>
                  <li>Regular encryption key rotation is performed</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Payment Security</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">PCI DSS Compliance</h3>
                <p>
                  We are committed to maintaining PCI DSS (Payment Card Industry Data Security Standard) 
                  compliance to ensure the secure handling of credit card information.
                </p>

                <h3 className="text-lg font-semibold mt-6">Secure Payment Processing</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We partner with certified payment processors (Stripe, PayPal)</li>
                  <li>Credit card information is never stored on our servers</li>
                  <li>All payment data is tokenized for additional security</li>
                  <li>3D Secure authentication is supported for enhanced protection</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">Fraud Prevention</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Real-time fraud detection and monitoring</li>
                  <li>Machine learning algorithms to identify suspicious transactions</li>
                  <li>Multi-factor authentication for sensitive operations</li>
                  <li>Regular security audits and penetration testing</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Account Security</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">Password Protection</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Passwords are hashed using bcrypt with salt</li>
                  <li>Strong password requirements enforced</li>
                  <li>Password reset functionality with secure tokens</li>
                  <li>Account lockout protection against brute force attacks</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">Two-Factor Authentication</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>SMS-based OTP verification available</li>
                  <li>Email verification for account changes</li>
                  <li>Session management with automatic timeout</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Infrastructure Security</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">Server Security</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Servers hosted in secure, certified data centers</li>
                  <li>Regular security patches and updates</li>
                  <li>Firewall protection and intrusion detection systems</li>
                  <li>24/7 monitoring and incident response</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">Access Controls</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Role-based access control (RBAC) for all systems</li>
                  <li>Multi-factor authentication for administrative access</li>
                  <li>Regular access reviews and privilege audits</li>
                  <li>Principle of least privilege enforced</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Privacy & GDPR Compliance</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">Data Minimization</h3>
                <p>
                  We only collect and process personal data that is necessary for providing 
                  our services. Data is retained only for as long as required by law or 
                  business necessity.
                </p>

                <h3 className="text-lg font-semibold mt-6">Your Rights</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Right to access your personal data</li>
                  <li>Right to rectification of inaccurate data</li>
                  <li>Right to erasure ("right to be forgotten")</li>
                  <li>Right to data portability</li>
                  <li>Right to object to processing</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Incident Response</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">Security Incident Procedures</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>24/7 security monitoring and alerting</li>
                  <li>Dedicated incident response team</li>
                  <li>Immediate containment and investigation procedures</li>
                  <li>Notification to affected users within 72 hours</li>
                  <li>Cooperation with law enforcement when necessary</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">Business Continuity</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Regular data backups with encryption</li>
                  <li>Disaster recovery procedures tested quarterly</li>
                  <li>Redundant systems and failover capabilities</li>
                  <li>Service level agreements for uptime</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Third-Party Security</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We carefully vet all third-party service providers and require them to 
                  maintain appropriate security standards:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Due diligence assessments for all vendors</li>
                  <li>Contractual security requirements</li>
                  <li>Regular security reviews and audits</li>
                  <li>Data processing agreements (DPAs) in place</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Security Best Practices for Users</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">Protect Your Account</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use a strong, unique password for your CutQ account</li>
                  <li>Enable two-factor authentication when available</li>
                  <li>Log out of your account when using shared devices</li>
                  <li>Keep your contact information up to date</li>
                  <li>Report suspicious activity immediately</li>
                </ul>

                <h3 className="text-lg font-semibold mt-6">Safe Browsing</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Always access CutQ through our official website</li>
                  <li>Look for the padlock icon in your browser's address bar</li>
                  <li>Be cautious of phishing emails or suspicious links</li>
                  <li>Keep your browser and devices updated</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Our Security Team</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  If you have security concerns or want to report a potential vulnerability:
                </p>
                <ul className="list-none space-y-2">
                  <li><strong>Security Email:</strong> security@cutq.store</li>
                  <li><strong>General Contact:</strong> {env.BRAND_EMAIL}</li>
                  <li><strong>Phone:</strong> {env.BRAND_PHONE}</li>
                  <li><strong>Address:</strong> {env.BRAND_ADDRESS}</li>
                </ul>
                <p className="mt-4">
                  We appreciate responsible disclosure of security vulnerabilities and 
                  will work with security researchers to address any issues promptly.
                </p>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SecurityPage;
