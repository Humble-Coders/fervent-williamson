import React from 'react';
import Card from '../components/ui/Card';
import { env } from '../config/env';

const RefundPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-12 md:py-16">
        <div className="container-custom px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">💰</div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Refund Policy</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Understand our refund and cancellation policies for bookings and payments.
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  At CutQ (Bhagat Singh) believes in helping its customers as far as possible, and has therefore a liberal cancellation policy.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Cancellation Policy</h2>
              <div className="space-y-4 text-gray-700">
                <p>Under this policy:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Cancellations will be considered only if the request is made <strong>within 1-2 days of placing the order</strong>.</li>
                  <li>However, the cancellation request may not be entertained if the orders have been communicated to the vendors/merchants and they have initiated the process of shipping them.</li>
                  <li>At CutQ (Bhagat Singh) does not accept cancellation requests for perishable items like flowers, eatables etc. However, refund/replacement can be made if the customer establishes that the quality of product delivered is not good.</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Damaged or Defective Items</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  In case of receipt of damaged or defective items please report the same to our Customer Service team.
                  The request will, however, be entertained once the merchant has checked and determined the same at his own end.
                </p>
                <p>
                  <strong>This should be reported within 1-2 days of receipt of the products.</strong>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Product Not as Expected</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  In case you feel that the product received is not as shown on the site or as per your expectations,
                  you must bring it to the notice of our customer service <strong>within 1-2 days of receiving the product</strong>.
                </p>
                <p>
                  The Customer Service Team after looking into your complaint will take an appropriate decision.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Warranty Products</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  In case of complaints regarding products that come with a warranty from manufacturers,
                  please refer the issue to them.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Refund Processing</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  In case of any Refunds approved by CutQ (Bhagat Singh), <strong>it&apos;ll take 3-5 days for the refund to be processed to the end customer</strong>.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-blue-800">
                    <strong>Note:</strong> Refunds are processed back to the original payment method used for the booking.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. How to Request a Cancellation or Refund</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold">Through Your Account</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Log into your CutQ account</li>
                  <li>Go to &quot;My Appointments&quot;</li>
                  <li>Find the booking you want to cancel</li>
                  <li>Click &quot;Cancel Booking&quot; and follow the prompts</li>
                </ol>

                <h3 className="text-lg font-semibold mt-6">Contact Customer Service</h3>
                <p>
                  If you&apos;re unable to cancel through your account or need to report an issue, contact our Customer Service team:
                </p>
                <ul className="list-none space-y-2">
                  <li><strong>Email:</strong> {env.BRAND_EMAIL}</li>
                  <li><strong>Phone:</strong> {env.BRAND_PHONE}</li>
                </ul>
                <p className="mt-4">
                  <strong>Important:</strong> All cancellation and refund requests must be made within 1-2 days of placing the order or receiving the product.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact Information</h2>
              <div className="space-y-4 text-gray-700">
                <p>For questions about our cancellation and refund policy, please contact us:</p>
                <ul className="list-none space-y-2">
                  <li><strong>Email:</strong> {env.BRAND_EMAIL}</li>
                  <li><strong>Phone:</strong> {env.BRAND_PHONE}</li>
                  <li><strong>Address:</strong> {env.BRAND_ADDRESS}</li>
                </ul>
                <p className="mt-4">
                  Our Customer Service team is committed to resolving your concerns as quickly as possible.
                </p>
              </div>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RefundPolicyPage;
