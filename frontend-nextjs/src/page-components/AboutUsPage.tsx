'use client';
import React from 'react';
import { Users, Target, Award, Heart, Sparkles, Globe } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const AboutUsPage: React.FC = () => {
  const teamMembers = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      image: '/api/placeholder/150/150',
      bio: 'Former beauty industry executive with 15+ years of experience transforming how people discover and book beauty services.'
    },
    {
      name: 'Michael Chen',
      role: 'CTO',
      image: '/api/placeholder/150/150',
      bio: 'Tech veteran who previously built scalable platforms at major tech companies. Passionate about creating seamless user experiences.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Head of Operations',
      image: '/api/placeholder/150/150',
      bio: 'Operations expert who ensures our platform runs smoothly and our salon partners receive exceptional support.'
    },
    {
      name: 'David Kim',
      role: 'Head of Design',
      image: '/api/placeholder/150/150',
      bio: 'Award-winning designer focused on creating beautiful, intuitive interfaces that make booking beauty services effortless.'
    }
  ];

  const values = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Customer First',
      description: 'Every decision we make is guided by what\'s best for our customers and salon partners.'
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Quality Excellence',
      description: 'We partner only with top-rated salons that meet our high standards for service and professionalism.'
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'Accessibility',
      description: 'Beautiful, professional beauty services should be accessible to everyone, everywhere.'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Innovation',
      description: 'We continuously innovate to make discovering and booking beauty services easier and more enjoyable.'
    }
  ];

  const stats = [
    { number: '50,000+', label: 'Happy Customers' },
    { number: '2,500+', label: 'Partner Salons' },
    { number: '100,000+', label: 'Bookings Completed' },
    { number: '4.9/5', label: 'Average Rating' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-12 md:py-16">
        <div className="container-custom px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">✨</div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">About CutQ Store</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Connecting beauty enthusiasts with exceptional salons and service providers worldwide
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom px-4 py-8">
        {/* Mission Section */}
        <Card className="p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              To revolutionize the beauty industry by creating a seamless platform that connects customers 
              with exceptional salons, making professional beauty services accessible, convenient, and enjoyable for everyone.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">For Customers</h3>
                <p className="text-gray-600">
                  Discover amazing salons, book appointments effortlessly, and enjoy personalized beauty experiences 
                  tailored to your preferences and schedule.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">For Salons</h3>
                <p className="text-gray-600">
                  Grow your business with powerful tools for appointment management, customer engagement, 
                  and marketing that help you focus on what you do best.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Section */}
        <Card className="p-8 mb-12 bg-gradient-to-r from-primary-50 to-accent-50">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Our Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Values Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=6366f1&color=fff&size=96`;
                    }}
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-primary-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Story Section */}
        <Card className="p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Our Story</h2>
          <div className="max-w-3xl mx-auto space-y-6 text-gray-700">
            <p>
              CutQ was born from a simple frustration: finding and booking quality beauty services
              shouldn&apos;t be complicated, time-consuming, or unreliable. Our founder, Sarah Johnson,
              experienced this firsthand when she moved to a new city and struggled to find a trusted salon.
            </p>
            <p>
              After countless hours of research, phone calls, and disappointing experiences, Sarah realized 
              there had to be a better way. She envisioned a platform that would make discovering and booking 
              beauty services as easy as ordering food or booking a ride.
            </p>
            <p>
              Today, CutQ serves thousands of customers and partners with hundreds of salons across the country.
              We&apos;ve facilitated over 100,000 successful bookings and continue to grow our network of trusted beauty professionals.
            </p>
            <p>
              But we&apos;re just getting started. Our vision extends beyond simple booking – we&apos;re building a
              comprehensive ecosystem that empowers both customers and salon owners to thrive in the modern beauty industry.
            </p>
          </div>
        </Card>

        {/* CTA Section */}
        <Card className="p-8 text-center bg-gradient-to-r from-primary-500 to-accent-500 text-white">
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto">
            Whether you&apos;re looking for your next beauty appointment or want to grow your salon business,
            we&apos;re here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
              Find a Salon
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              Partner With Us
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AboutUsPage;
