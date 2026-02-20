'use client';
import React, { useState } from 'react';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Star,
  Shield,
  ArrowLeft,
  Wallet,
  Smartphone
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet' | 'bank';
  name: string;
  last4: string;
  expiryDate?: string;
  isDefault: boolean;
  brand: string;
  icon: string;
}

const PaymentMethodsPage: React.FC = () => {
  const router = useRouter();
  const [showAddCard, setShowAddCard] = useState(false);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  
  // Form state for adding new card
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    nickname: ''
  });

  // Mock payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      name: 'Personal Card',
      last4: '1234',
      expiryDate: '12/26',
      isDefault: true,
      brand: 'Visa',
      icon: '💳'
    },
    {
      id: '2',
      type: 'card',
      name: 'Business Card',
      last4: '5678',
      expiryDate: '08/25',
      isDefault: false,
      brand: 'Mastercard',
      icon: '💳'
    },
    {
      id: '3',
      type: 'wallet',
      name: 'Apple Pay',
      last4: '9012',
      isDefault: false,
      brand: 'Apple',
      icon: '📱'
    }
  ]);

  const handleSetDefault = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
  };

  const handleDeleteMethod = (id: string) => {
    setPaymentMethods(methods => methods.filter(method => method.id !== id));
  };

  const handleAddCard = () => {
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: 'card',
      name: newCard.nickname || 'New Card',
      last4: newCard.cardNumber.slice(-4),
      expiryDate: newCard.expiryDate,
      isDefault: paymentMethods.length === 0,
      brand: 'Visa', // Would detect from card number in real app
      icon: '💳'
    };
    
    setPaymentMethods([...paymentMethods, newMethod]);
    setNewCard({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      nickname: ''
    });
    setShowAddCard(false);
  };

  const getCardIcon = (method: PaymentMethod) => {
    switch (method.brand.toLowerCase()) {
      case 'visa':
        return (
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
        );
      case 'mastercard':
        return (
          <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
        );
      case 'apple':
        return (
          <div className="w-12 h-12 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 pb-20">
      {/* Beautiful Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700">
        {/* Background decorations */}
        <div className="absolute top-4 left-4 text-3xl opacity-20 animate-float">💳</div>
        <div className="absolute top-6 right-6 text-2xl opacity-15 animate-bounce-soft">💎</div>
        <div className="absolute bottom-4 left-1/4 text-2xl opacity-25 animate-pulse-soft">🔒</div>
        
        <div className="relative z-10 px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 w-10 h-10 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/30 smooth-hover"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Header Content */}
          <div className="text-center text-white mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-4xl animate-pulse-soft">💳</span>
              <h1 className="text-3xl font-bold font-heading">
                Payment Methods
              </h1>
              <span className="text-4xl animate-pulse-soft" style={{ animationDelay: '1s' }}>✨</span>
            </div>
            <p className="text-white/90 flex items-center justify-center gap-2">
              <span>🔒</span>
              Manage your secure payment options
              <span>💎</span>
            </p>
          </div>

          {/* Security Notice */}
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-4">
            <div className="flex items-center gap-3 text-white">
              <Shield className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">Your payment information is encrypted and secure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods List */}
      <div className="px-4 py-6 space-y-4">
        {paymentMethods.map((method, index) => (
          <Card
            key={method.id}
            className="group relative overflow-hidden smooth-transform gpu-accelerated animate-slide-up hover:shadow-hover"

          >
            <div className="flex items-center gap-4 p-4">
              {/* Card Icon */}
              {getCardIcon(method)}

              {/* Card Details */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-text-primary">{method.name}</h3>
                  {method.isDefault && (
                    <Badge variant="success" className="bg-green-500 text-white animate-pulse-soft">
                      <Check className="w-3 h-3 mr-1" />
                      Default
                      <span className="ml-1">✅</span>
                    </Badge>
                  )}
                </div>
                <div className="text-text-secondary mb-1">
                  •••• •••• •••• {method.last4}
                  {method.expiryDate && (
                    <span className="ml-2">• {method.expiryDate}</span>
                  )}
                </div>
                <p className="text-sm text-text-muted">{method.brand}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    className="p-2 text-text-muted hover:text-yellow-500 hover:bg-yellow-50 rounded-xl smooth-hover"
                    title="Set as default"
                  >
                    <Star className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setEditingCard(method.id)}
                  className="p-2 text-text-muted hover:text-primary-600 hover:bg-primary-50 rounded-xl smooth-hover"
                  title="Edit"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteMethod(method.id)}
                  className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-xl smooth-hover"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </Card>
        ))}

        {/* Add New Payment Method */}
        <Card
          interactive
          className="group cursor-pointer border-2 border-dashed border-primary-300 hover:border-primary-500 hover:bg-primary-50 smooth-hover animate-slide-up"

          onClick={() => setShowAddCard(true)}
        >
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-100 to-accent-100 group-hover:from-primary-200 group-hover:to-accent-200 rounded-2xl flex items-center justify-center mb-4 smooth-hover">
              <Plus className="w-8 h-8 text-primary-600 group-hover:scale-110 smooth-transform" />
            </div>
            <h3 className="text-lg font-bold text-text-primary group-hover:text-primary-600 smooth-hover mb-2 flex items-center gap-2">
              <span>💳</span>
              Add Payment Method
              <span>✨</span>
            </h3>
            <p className="text-text-secondary text-sm">
              Credit card, debit card, or digital wallet
            </p>
          </div>
        </Card>
      </div>

      {/* Add Card Modal */}
      <Modal
        isOpen={showAddCard}
        onClose={() => setShowAddCard(false)}
        title="Add Payment Method"
      >
        <div className="space-y-4">
          <Input
            label="Card Number"
            type="text"
            placeholder="1234 5678 9012 3456"
            value={newCard.cardNumber}
            onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
            leftIcon={<CreditCard className="w-4 h-4" />}
          />
          
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Expiry Date"
              type="text"
              placeholder="MM/YY"
              value={newCard.expiryDate}
              onChange={(e) => setNewCard({ ...newCard, expiryDate: e.target.value })}
            />
            <Input
              label="CVV"
              type="text"
              placeholder="123"
              value={newCard.cvv}
              onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
            />
          </div>
          
          <Input
            label="Cardholder Name"
            type="text"
            placeholder="John Doe"
            value={newCard.cardholderName}
            onChange={(e) => setNewCard({ ...newCard, cardholderName: e.target.value })}
          />
          
          <Input
            label="Card Nickname (Optional)"
            type="text"
            placeholder="Personal Card"
            value={newCard.nickname}
            onChange={(e) => setNewCard({ ...newCard, nickname: e.target.value })}
          />
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddCard(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddCard}
              className="flex-1 flex items-center justify-center gap-2"
              disabled={!newCard.cardNumber || !newCard.expiryDate || !newCard.cvv || !newCard.cardholderName}
            >
              <span>💳</span>
              Add Card
              <span>✨</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaymentMethodsPage;