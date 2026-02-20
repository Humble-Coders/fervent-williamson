'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { env } from '../config/env';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email Support',
      description: 'Get help via email',
      contact: env.BRAND_EMAIL,
      action: `mailto:${env.BRAND_EMAIL}`,
      availability: '24/7 - Response within 24 hours'
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Phone Support',
      description: 'Speak with our team',
      contact: env.BRAND_PHONE,
      action: `tel:${env.BRAND_PHONE}`,
      availability: 'Mon-Fri, 9:00 AM - 6:00 PM'
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: 'Live Chat',
      description: 'Chat with support',
      contact: 'Available on website',
      action: '#',
      availability: 'Mon-Fri, 9:00 AM - 6:00 PM'
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Office Address',
      description: 'Visit our office',
      contact: env.BRAND_ADDRESS,
      action: '#',
      availability: 'Mon-Fri, 9:00 AM - 5:00 PM'
    }
  ];

  const faqCategories = [
    {
      title: 'Booking & Appointments',
      description: 'Questions about making, changing, or canceling bookings'
    },
    {
      title: 'Payment & Billing',
      description: 'Issues with payments, refunds, or billing'
    },
    {
      title: 'Account & Profile',
      description: 'Help with your account settings and profile'
    },
    {
      title: 'Technical Support',
      description: 'Website issues, app problems, or technical difficulties'
    },
    {
      title: 'Salon Partnership',
      description: 'Information about joining CutQ as a salon partner'
    },
    {
      title: 'General Inquiries',
      description: 'Other questions or feedback'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-12 md:py-16">
        <div className="container-custom px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">📞</div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              We're here to help! Get in touch with our support team for any questions or assistance.
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Contact Form */}
          <Card className="p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a Message</h2>
              <p className="text-gray-600">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="booking">Booking & Appointments</option>
                      <option value="payment">Payment & Billing</option>
                      <option value="technical">Technical Support</option>
                      <option value="partnership">Salon Partnership</option>
                      <option value="feedback">Feedback</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Brief description of your inquiry"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Please provide details about your inquiry..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-vertical"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent Successfully!</h3>
                <p className="text-gray-600 mb-4">
                  Thank you for contacting us. We'll get back to you within 24 hours.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      subject: '',
                      message: '',
                      category: 'general'
                    });
                  }}
                >
                  Send Another Message
                </Button>
              </div>
            )}
          </Card>

          {/* Contact Methods */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
              <div className="space-y-4">
                {contactMethods.map((method, index) => (
                  <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 flex-shrink-0">
                        {method.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{method.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{method.description}</p>
                        <p className="font-medium text-gray-900 mb-1">{method.contact}</p>
                        <p className="text-xs text-gray-500">{method.availability}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Help */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Quick Help?</h3>
              <div className="space-y-3">
                <Link
                  href="/help"
                  className="w-full flex items-center justify-start px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Visit Help Center
                </Link>
                <Link
                  href="/help#faq"
                  className="w-full flex items-center justify-start px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Browse FAQ
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* FAQ Categories */}
        <Card className="p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Common Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {faqCategories.map((category, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors cursor-pointer"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{category.title}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ContactPage;
