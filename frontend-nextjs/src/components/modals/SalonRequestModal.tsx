import React, { useState } from 'react';
import { X, Building2, Mail, Phone, MapPin, User, Send } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import { buildApiUrl } from '../../config/env';

interface SalonRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SalonRequestData {
  salonName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  description: string;
}

const SalonRequestModal: React.FC<SalonRequestModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<SalonRequestData>({
    salonName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (field: keyof SalonRequestData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.salonName || !formData.ownerName || !formData.email || !formData.phone) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(buildApiUrl('salon-requests'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Your CutQ request has been submitted successfully! We will contact you soon.' });
        // Reset form after successful submission
        setTimeout(() => {
          setFormData({
            salonName: '',
            ownerName: '',
            email: '',
            phone: '',
            address: '',
            description: '',
          });
          onClose();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit salon request' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Join CutQ Store</h2>
              <p className="text-sm text-gray-600">Request to add your salon</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {message && (
            <Alert
              type={message.type}
              message={message.text}
              className="mb-4"
            />
          )}

          <div className="space-y-4">
            <Input
              label="CutQ Name *"
              placeholder="Enter your CutQ name"
              value={formData.salonName}
              onChange={(e) => handleInputChange('salonName', e.target.value)}
              leftIcon={<Building2 className="w-5 h-5" />}
              required
            />

            <Input
              label="Owner Name *"
              placeholder="Enter owner's full name"
              value={formData.ownerName}
              onChange={(e) => handleInputChange('ownerName', e.target.value)}
              leftIcon={<User className="w-5 h-5" />}
              required
            />

            <Input
              label="Email Address *"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              leftIcon={<Mail className="w-5 h-5" />}
              required
            />

            <Input
              label="Phone Number *"
              type="tel"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              leftIcon={<Phone className="w-5 h-5" />}
              required
            />

            <Input
              label="Address"
              placeholder="Enter CutQ address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              leftIcon={<MapPin className="w-5 h-5" />}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                placeholder="Tell us about your salon, services, and what makes you special..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>What happens next?</strong><br />
              Our team will review your request and contact you within 24-48 hours to discuss the next steps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalonRequestModal;
