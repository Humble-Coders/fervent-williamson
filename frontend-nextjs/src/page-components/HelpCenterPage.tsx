'use client';
import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, MessageCircle, Mail, Phone, Clock } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { env } from '../config/env';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const HelpCenterPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqData: FAQItem[] = [
    {
      id: '1',
      question: 'How do I book an appointment?',
      answer: 'You can book an appointment by browsing salons, selecting your preferred service and time slot, then confirming your booking. You can also call the salon directly.',
      category: 'booking'
    },
    {
      id: '2',
      question: 'Can I cancel or reschedule my appointment?',
      answer: 'Yes, you can cancel or reschedule your appointment up to 24 hours before the scheduled time through your profile or by contacting the salon directly.',
      category: 'booking'
    },
    {
      id: '3',
      question: 'What payment methods are accepted?',
      answer: 'We accept all major credit cards, debit cards, digital wallets, and cash payments at the salon. Payment methods may vary by salon.',
      category: 'payment'
    },
    {
      id: '4',
      question: 'How do I create an account?',
      answer: 'Click on "Sign Up" and provide your email address or phone number. You\'ll receive an OTP to verify your account and complete the registration process.',
      category: 'account'
    },
    {
      id: '5',
      question: 'Is my personal information secure?',
      answer: 'Yes, we use industry-standard encryption and security measures to protect your personal information. We never share your data with third parties without your consent.',
      category: 'account'
    },
    {
      id: '6',
      question: 'How do I find salons near me?',
      answer: 'Use our salon finder feature on the homepage or browse by location. You can also filter by services, ratings, and distance to find the perfect salon.',
      category: 'general'
    },
    {
      id: '7',
      question: 'What if I\'m not satisfied with my service?',
      answer: 'If you\'re not satisfied with your service, please contact the salon directly first. If the issue isn\'t resolved, you can reach out to our customer support team.',
      category: 'general'
    },
    {
      id: '8',
      question: 'Do you offer refunds?',
      answer: 'Refund policies vary by salon and service. Generally, cancellations made 24+ hours in advance are eligible for full refunds. Contact customer support for specific cases.',
      category: 'payment'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Categories', icon: '📋' },
    { id: 'booking', name: 'Booking & Appointments', icon: '📅' },
    { id: 'payment', name: 'Payment & Billing', icon: '💳' },
    { id: 'account', name: 'Account & Profile', icon: '👤' },
    { id: 'general', name: 'General Questions', icon: '❓' }
  ];

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = !searchQuery || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-12 md:py-16">
        <div className="container-custom px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🆘</div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Help Center</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Find answers to common questions or get in touch with our support team
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom px-4 py-8">
        {/* Search and Categories */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2">
              <Input
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
                clearable
                onClear={() => setSearchQuery('')}
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            
            {filteredFAQs.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">Try adjusting your search or browse different categories</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredFAQs.map((faq) => (
                  <Card key={faq.id} className="overflow-hidden">
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 pr-4">{faq.question}</h3>
                        {expandedFAQ === faq.id ? (
                          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                    
                    {expandedFAQ === faq.id && (
                      <div className="px-4 pb-4 border-t border-gray-100">
                        <p className="text-gray-600 pt-4">{faq.answer}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Contact Support */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Need More Help?
            </h2>
            
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Live Chat</h3>
                    <p className="text-sm text-gray-600">Get instant help</p>
                  </div>
                </div>
                <Button variant="primary" className="w-full">
                  Start Chat
                </Button>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email Support</h3>
                    <p className="text-sm text-gray-600">{env.BRAND_EMAIL}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Send Email
                </Button>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Phone Support</h3>
                    <p className="text-sm text-gray-600">{env.BRAND_PHONE}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Call Now
                </Button>
              </Card>

              <Card className="p-6 bg-gray-50">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Support Hours</h3>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Monday - Friday: 9:00 AM - 8:00 PM</p>
                  <p>Saturday: 10:00 AM - 6:00 PM</p>
                  <p>Sunday: 12:00 PM - 5:00 PM</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;
