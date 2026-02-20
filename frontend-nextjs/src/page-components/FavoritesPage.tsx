'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import { Heart, Star, MapPin, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link'; // import { Link } from 'next/navigation';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import userService, { FavoriteWithSalon } from '../services/userService';

const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteWithSalon[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch favorites on component mount
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const favoritesData = await userService.getFavorites();
        setFavorites(favoritesData);
      } catch (error) {
        logger.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (salonId: string) => {
    try {
      await userService.removeFavorite(salonId);
      // Remove from local state
      setFavorites(prev => prev.filter(fav => fav.salon.id !== salonId));
    } catch (error) {
      logger.error('Error removing favorite:', error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 pb-20">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl animate-pulse-soft">❤️</span>
            <h1 className="text-3xl font-bold text-text-primary font-heading">
              Your Favorites
            </h1>
            <span className="text-4xl animate-pulse-soft" style={{ animationDelay: '1s' }}>✨</span>
          </div>
          <p className="text-text-secondary flex items-center justify-center gap-2">
            <span>💫</span>
            Your saved salons and beauty spots
            <span>🏪</span>
          </p>
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite, index) => {
              const salon = favorite.salon;
              return (
                <Card
                  key={favorite.id}
                  className="group relative overflow-hidden smooth-transform gpu-accelerated animate-slide-up hover:shadow-hover"

                >
                  {/* Remove Favorite Button */}
                  <button
                    onClick={() => handleRemoveFavorite(salon.id)}
                    className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Heart className="w-4 h-4 text-accent-500 fill-current" />
                  </button>

                  {/* Salon Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={salon.images?.[0] || 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800'}
                      alt={salon.name}
                      className="w-full h-full object-cover smooth-transform gpu-accelerated smooth-scale group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

                    {/* Status Badge */}
                    {salon.isOpen && (
                      <div className="absolute top-4 left-4">
                        <Badge variant="success" className="bg-green-500 text-white">
                          <Clock className="w-3 h-3 mr-1" />
                          Open Now
                        </Badge>
                      </div>
                    )}

                    {/* Floating emoji */}
                    <div className="absolute bottom-4 right-4 text-3xl bg-white/80 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center">
                      💎
                    </div>
                  </div>

                  {/* Salon Info */}
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-text-primary group-hover:text-primary-600 smooth-hover mb-2">
                        {salon.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-text-muted mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{salon.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(salon.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-text-primary">
                          {salon.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant={salon.isOpen ? "success" : "default"} size="sm">
                        {salon.isOpen ? "Open" : "Closed"}
                      </Badge>
                    </div>

                    {/* Book Now Button */}
                    <Link href={`/salons/${salon.name.toLowerCase().replace(/\s+/g, '-')}/${salon.displayId}`}>
                      <Button
                        variant="primary"
                        className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 shadow-soft transform hover:scale-105 smooth-transform gpu-accelerated group"
                      >
                        <span className="mr-2">📅</span>
                        Book Now
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 animate-fade-in">
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-neutral-100 to-primary-100 rounded-full flex items-center justify-center">
              <Heart className="w-16 h-16 text-neutral-400" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">
              No Favorites Yet
            </h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Start exploring salons and add them to your favorites to see them here!
            </p>
            <Link href="/salons">
              <Button variant="primary" size="lg" className="flex items-center gap-2">
                <span>🔍</span>
                Discover Salons
                <span>✨</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;