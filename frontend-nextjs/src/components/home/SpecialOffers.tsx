import React from 'react';
import { Gift, ArrowRight, Crown } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  badge: string;
  emoji: string;
  gradient: string;
}

export interface SpecialOffersProps {
  offers: Offer[];
  onClaimOffer: (offerId: string) => void;
  isAuthenticated: boolean;
}

const SpecialOffers: React.FC<SpecialOffersProps> = ({
  offers,
  onClaimOffer,
  isAuthenticated,
}) => {
  if (!offers.length) return null;

  const mainOffer = offers[0];

  return (
    <section className="py-8 md:py-16 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-4 left-4 md:top-10 md:left-10 text-3xl md:text-5xl opacity-10 animate-bounce-soft">🎁</div>
        <div className="absolute top-8 right-8 md:top-20 md:right-20 text-2xl md:text-4xl opacity-10 animate-float">✨</div>
        <div className="absolute bottom-4 left-1/4 text-4xl md:text-6xl opacity-5 animate-pulse-soft">💎</div>
        <div className="absolute bottom-8 right-4 md:bottom-20 md:right-10 text-xl md:text-3xl opacity-10 animate-bounce-soft">🌟</div>
      </div>

      <div className="container-custom relative px-4">
        <Card className={`bg-gradient-to-r ${mainOffer.gradient} text-white overflow-hidden relative animate-slide-up mx-2 md:mx-0`}>
          {/* Animated background effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-shimmer"></div>
          <div className="absolute top-0 right-0 w-16 h-16 md:w-32 md:h-32 bg-white/10 rounded-full transform translate-x-8 md:translate-x-16 -translate-y-8 md:-translate-y-16 animate-pulse-soft"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 md:w-40 md:h-40 bg-white/5 rounded-full transform -translate-x-10 md:-translate-x-20 translate-y-10 md:translate-y-20 animate-float"></div>
          
          {/* Floating emojis */}
          <div className="absolute top-3 right-3 md:top-6 md:right-6 text-2xl md:text-4xl animate-bounce-soft opacity-80">
            {mainOffer.emoji}
          </div>
          <div className="absolute bottom-3 left-3 md:bottom-6 md:left-6 text-xl md:text-3xl animate-float opacity-60">
            🎉
          </div>
          <div className="absolute top-1/2 right-1/4 text-lg md:text-2xl animate-pulse-soft opacity-40">
            ⭐
          </div>

          <div className="relative z-10 flex flex-col items-center text-center p-4 md:p-8">
            <div className="mb-4 md:mb-6 flex-1">
              <div className="flex items-center justify-center mb-3 md:mb-4 gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-white/20 backdrop-blur-xl rounded-xl md:rounded-2xl flex items-center justify-center">
                  <Gift className="w-4 h-4 md:w-6 md:h-6" />
                </div>
                <Badge variant="accent" className="bg-white/20 text-white border-white/30 flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                  <Crown className="w-3 h-3 md:w-4 md:h-4" />
                  {mainOffer.badge}
                  <span className="text-sm md:text-lg">{mainOffer.emoji}</span>
                </Badge>
              </div>
              
              <h3 className="text-xl md:text-4xl font-bold mb-2 md:mb-3 flex items-center justify-center gap-2 md:gap-3">
                {mainOffer.title}
                <span className="text-xl md:text-4xl animate-bounce-soft">🎊</span>
              </h3>
              
              <p className="text-white/90 text-sm md:text-lg mb-3 md:mb-4 flex items-center justify-center gap-2">
                <span className="text-lg md:text-xl">✨</span>
                {mainOffer.description}
                <span className="text-lg md:text-xl">🌟</span>
              </p>

              {/* Discount highlight */}
              <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="bg-white/20 backdrop-blur-xl rounded-xl md:rounded-2xl px-3 md:px-4 py-1.5 md:py-2 flex items-center gap-1 md:gap-2">
                  <span className="text-lg md:text-2xl font-bold">{mainOffer.discount}</span>
                  <span className="text-sm md:text-lg">💰</span>
                </div>
                <span className="text-white/80 text-sm md:text-base">off your first service!</span>
              </div>

              {/* Features list */}
              <div className="flex flex-wrap justify-center gap-2 md:gap-4 text-xs md:text-sm mb-4 md:mb-0">
                <div className="flex items-center gap-1 md:gap-2 bg-white/10 rounded-full px-2 md:px-3 py-1">
                  <span>🚀</span>
                  <span>Instant Booking</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 bg-white/10 rounded-full px-2 md:px-3 py-1">
                  <span>💎</span>
                  <span>Premium Salons</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 bg-white/10 rounded-full px-2 md:px-3 py-1">
                  <span>⭐</span>
                  <span>Top Rated</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 md:gap-4 w-full md:w-auto">
              <Button 
                variant="secondary"
                size="md"
                className="bg-white text-primary-600 hover:bg-white/90 shadow-soft flex items-center justify-center gap-2 group text-sm md:text-base w-full md:w-auto"
                onClick={() => onClaimOffer(mainOffer.id)}
              >
                <span className="text-lg md:text-xl group-hover:animate-bounce-soft">🎁</span>
                {isAuthenticated ? 'Claim Offer' : 'Get Started & Claim'}
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              {!isAuthenticated && (
                <p className="text-white/70 text-xs md:text-sm text-center flex items-center justify-center gap-1">
                  <span>📝</span>
                  No account needed to start
                  <span>✨</span>
                </p>
              )}
            </div>
          </div>

          {/* Bottom decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
        </Card>

        {/* Additional offers for authenticated users */}
        {isAuthenticated && offers.length > 1 && (
          <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {offers.slice(1).map((offer) => (
              <Card 
                key={offer.id} 
                className={`bg-gradient-to-br ${offer.gradient} text-white relative overflow-hidden group hover:shadow-hover animate-slide-up p-4 md:p-6`}

              >
                <div className="absolute top-2 right-2 md:top-3 md:right-3 text-lg md:text-2xl group-hover:animate-bounce-soft">
                  {offer.emoji}
                </div>
                
                <div className="relative z-10">
                  <Badge variant="accent" className="bg-white/20 text-white border-white/30 mb-2 md:mb-3 text-xs">
                    {offer.badge}
                  </Badge>
                  
                  <h4 className="text-base md:text-lg font-bold mb-1 md:mb-2">{offer.title}</h4>
                  <p className="text-white/90 text-xs md:text-sm mb-3 md:mb-4">{offer.description}</p>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-white/30 text-white hover:bg-white/10 w-full text-xs md:text-sm"
                    onClick={() => onClaimOffer(offer.id)}
                  >
                    Claim Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SpecialOffers;