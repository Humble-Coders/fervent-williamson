import React, { useState, useEffect } from 'react';
import { MapPin, ChevronLeft, ChevronRight, Award, Sparkles, Scissors, Star, Zap } from 'lucide-react';
// import Button from '../ui/Button'; // Removed unused import
import Badge from '../ui/Badge';

interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  emoji: string;
}

export interface HeroSectionProps {
  slides: HeroSlide[];
  isAuthenticated: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ slides, isAuthenticated: _isAuthenticated }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] overflow-hidden">
      {/* Background Image Carousel */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
          </div>
        ))}
      </div>

      {/* Floating Icons */}
      {/* <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-8 left-4 md:top-20 md:left-20 animate-bounce-soft opacity-70">
          <Palette className="w-6 h-6 md:w-8 md:h-8 text-white/80" />
        </div>
        <div className="absolute top-12 right-8 md:top-32 md:right-32 animate-float opacity-60" style={{ animationDelay: '2s' }}>
          <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-white/70" />
        </div>
        <div className="absolute bottom-20 left-8 md:bottom-40 md:left-40 animate-bounce-soft opacity-50" style={{ animationDelay: '4s' }}>
          <Scissors className="w-5 h-5 md:w-7 md:h-7 text-white/60" />
        </div>
        <div className="absolute top-32 right-4 md:top-60 md:right-20 animate-float opacity-40" style={{ animationDelay: '6s' }}>
          <Star className="w-4 h-4 md:w-6 md:h-6 text-white/50" />
        </div>
      </div> */}

      {/* Hero Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container-custom px-3 sm:px-4">
          <div className="max-w-3xl mx-auto text-center md:text-left">
            <div className="animate-slide-up">
              <Badge variant="accent" size="sm" className="mb-4 sm:mb-6 bg-white/20 backdrop-blur-xl border border-white/30 text-white">
                <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="mr-1 sm:mr-2 text-xs sm:text-sm">Premium Beauty Services</span>
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-6xl lg:text-7xl font-bold text-white mb-3 sm:mb-4 md:mb-6 font-display animate-slide-up" style={{ animationDelay: '200ms' }}>
              <span className="flex items-center justify-center md:justify-start gap-1 sm:gap-2 md:gap-3">
                Find the Best
                <Scissors className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-primary-300 animate-bounce-soft" />
              </span>
              <span className="flex bg-gradient-to-r from-primary-300 to-primary-400 bg-clip-text text-transparent items-center justify-center md:justify-start gap-1 sm:gap-2 md:gap-3">
                CutQ Near You
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-primary-400 animate-pulse-soft" />
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-xl text-white/90 mb-4 sm:mb-6 md:mb-8 leading-relaxed animate-slide-up flex items-center justify-center md:justify-start gap-1 sm:gap-2 px-2 sm:px-4 md:px-0" style={{ animationDelay: '400ms' }}>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-300" />
              <span className="text-center md:text-left">Book your next salon appointment in seconds. Discover premium beauty services with top-rated professionals in your area.</span>
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-accent-300" />
            </p>
            
            {/* <div className="flex flex-col sm:flex-row gap-3 md:gap-4 animate-slide-up px-4 md:px-0" style={{ animationDelay: '600ms' }}>
              <Button
                variant="primary"
                size="md"
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-glow transform hover:scale-105 transition-all duration-300 text-sm md:text-base"
              >
                <CalendarIcon className="w-5 h-5 mr-2" />
                {isAuthenticated ? 'Book Now' : 'Get Started'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="md"
                className="border-white/30 text-white hover:bg-white/10 backdrop-blur-xl text-sm md:text-base"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Find Salons
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div> */}

            {/* Current slide emoji indicator */}
            {/* <div className="mt-6 md:mt-8 flex flex-col md:flex-row items-center gap-2 md:gap-4 animate-slide-up px-4 md:px-0" style={{ animationDelay: '800ms' }}>
              <span className="text-white/70 text-xs md:text-sm">Currently featuring:</span>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-full px-3 md:px-4 py-1.5 md:py-2">
                <span className="text-lg md:text-2xl">{slides[currentSlide]?.emoji}</span>
                <span className="text-white font-medium text-sm md:text-base">{slides[currentSlide]?.subtitle}</span>
              </div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Carousel Controls */}
      <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-1 md:space-x-2">
        {slides.map((slide, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-8 h-8 md:w-12 md:h-12 rounded-full transition-all duration-300 flex items-center justify-center text-lg md:text-2xl ${
              index === currentSlide 
                ? 'bg-white/30 backdrop-blur-xl scale-125' 
                : 'bg-white/10 hover:bg-white/20 backdrop-blur-xl'
            }`}
          >
            {slide.emoji}
          </button>
        ))}
      </div>

      {/* Navigation Arrows */}
      <div className="hidden md:block">
        <button
          onClick={prevSlide}
          className="absolute left-6 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-6 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
};

export default HeroSection;