import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft, Search, HelpCircle } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* 404 Illustration */}
          <div className="mx-auto w-32 h-32 mb-8">
            <div className="relative">
              <div className="text-8xl font-bold text-primary-200 select-none">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="w-12 h-12 text-primary-400" />
              </div>
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
            It might have been moved, deleted, or you entered the wrong URL.
          </p>

          {/* Action Buttons */}
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link href="/">
              <Button className="w-full sm:w-auto">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Help Section */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-center text-gray-500 mb-4">
              <HelpCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">Need help?</span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <Link href="/help" className="text-primary-600 hover:text-primary-700 underline">
                  Visit our Help Center
                </Link>
              </p>
              <p>
                <Link href="/salons" className="text-primary-600 hover:text-primary-700 underline">
                  Browse Salons
                </Link>
              </p>
              <p>
                <Link href="/services/hair" className="text-primary-600 hover:text-primary-700 underline">
                  Explore Services
                </Link>
              </p>
            </div>
          </div>

          {/* Popular Links */}
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Popular Pages
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Link 
                href="/salons" 
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Find Salons
              </Link>
              <Link 
                href="/services/hair" 
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Hair Services
              </Link>
              <Link 
                href="/services/nails" 
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Nail Services
              </Link>
              <Link 
                href="/services/spa" 
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Spa Services
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
