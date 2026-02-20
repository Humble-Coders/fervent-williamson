import React from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { env } from '../../config/env';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-neutral-200 mt-auto">
      <div className="container-custom">
        <div className="py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center space-x-2 mb-3 sm:mb-4">
                <img
                  src="/logo.png"
                  alt="CutQ Logo"
                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                />
                <span className="text-base sm:text-lg font-bold text-text-primary font-heading">CutQ</span>
              </Link>
              <p className="text-sm sm:text-base text-text-secondary mb-3 sm:mb-4 max-w-sm">
                Your one-stop platform for booking salon services on-demand.
                Find the perfect salon and book your appointment in seconds.
              </p>
              <div className="flex space-x-3 sm:space-x-4">
                <a
                  href="#"
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-neutral-100 hover:bg-primary-100 rounded-lg flex items-center justify-center transition-colors group"
                >
                  <Instagram className="w-4 h-4 sm:w-5 sm:h-5 text-text-muted group-hover:text-primary-500" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-neutral-100 hover:bg-primary-100 rounded-lg flex items-center justify-center transition-colors group"
                >
                  <Facebook className="w-4 h-4 sm:w-5 sm:h-5 text-text-muted group-hover:text-primary-500" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-neutral-100 hover:bg-primary-100 rounded-lg flex items-center justify-center transition-colors group"
                >
                  <Twitter className="w-4 h-4 sm:w-5 sm:h-5 text-text-muted group-hover:text-primary-500" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-text-primary mb-3 sm:mb-4">Quick Links</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link href="/salons" className="text-text-secondary hover:text-primary-500 transition-colors">
                    Find Salons
                  </Link>
                </li>
                <li>
                  <Link href="/coupons" className="text-text-secondary hover:text-primary-500 transition-colors">
                    Deals & Coupons
                  </Link>
                </li>
                <li>
                  <Link href="/booking" className="text-text-secondary hover:text-primary-500 transition-colors">
                    Book Appointment
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="text-text-secondary hover:text-primary-500 transition-colors">
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="text-text-secondary hover:text-primary-500 transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-text-secondary hover:text-primary-500 transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-text-secondary hover:text-primary-500 transition-colors">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-semibold text-text-primary mb-4">Services</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/services/hair" className="text-text-secondary hover:text-primary-500 transition-colors">
                    Hair Services
                  </Link>
                </li>
                <li>
                  <Link href="/services/nails" className="text-text-secondary hover:text-primary-500 transition-colors">
                    Nail Services
                  </Link>
                </li>
                <li>
                  <Link href="/services/facial" className="text-text-secondary hover:text-primary-500 transition-colors">
                    Facial Treatments
                  </Link>
                </li>
                <li>
                  <Link href="/services/massage" className="text-text-secondary hover:text-primary-500 transition-colors">
                    Massage Therapy
                  </Link>
                </li>
                <li>
                  <Link href="/services/makeup" className="text-text-secondary hover:text-primary-500 transition-colors">
                    Makeup Services
                  </Link>
                </li>
                <li>
                  <Link href="/services/spa" className="text-text-secondary hover:text-primary-500 transition-colors">
                    Spa Treatments
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold text-text-primary mb-4">Contact</h3>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-text-muted" />
                  <span className="text-text-secondary">{env.BRAND_EMAIL}</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-text-muted" />
                  <span className="text-text-secondary">{env.BRAND_PHONE}</span>
                </li>
                <li className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-text-muted mt-0.5" />
                  <span className="text-text-secondary">
                    {env.BRAND_ADDRESS}
                  </span>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-text-primary mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/privacy" className="text-text-secondary hover:text-primary-500 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-text-secondary hover:text-primary-500 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-text-secondary hover:text-primary-500 transition-colors">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link href="/refund-policy" className="text-text-secondary hover:text-primary-500 transition-colors">
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="text-text-secondary hover:text-primary-500 transition-colors">
                    Security
                  </Link>
                </li>
                <li>
                  <Link href="/accessibility" className="text-text-secondary hover:text-primary-500 transition-colors">
                    Accessibility
                  </Link>
                </li>
                <li>
                  <Link href="/communication-policy" className="text-text-secondary hover:text-primary-500 transition-colors">
                    Communication Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-6 border-t border-neutral-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-text-muted text-small">
                © 2025 CutQ. All rights reserved.
              </p>
              <p className="text-text-muted text-xs mt-1">
                Operated by Gem Infinity Estates LLP
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-end">
              <Link href="/privacy" className="text-text-muted hover:text-primary-500 text-small transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-text-muted hover:text-primary-500 text-small transition-colors">
                Terms
              </Link>
              <Link href="/security" className="text-text-muted hover:text-primary-500 text-small transition-colors">
                Security
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;