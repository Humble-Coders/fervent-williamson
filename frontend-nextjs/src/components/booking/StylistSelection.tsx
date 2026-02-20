import React from 'react';
import { Star } from 'lucide-react';
// import Card from '../ui/Card'; // Removed unused import
import Badge from '../ui/Badge';

interface Stylist {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  specialties: string[];
  experience: string;
  emoji: string;
}

interface StylistSelectionProps {
  stylists: Stylist[];
  selectedStylist: string | null;
  onStylistSelect: (stylistId: string) => void;
}

const StylistSelection: React.FC<StylistSelectionProps> = ({
  stylists,
  selectedStylist,
  onStylistSelect,
}) => {
  return (
    <div>
      <div className="grid grid-cols-1 gap-2 sm:gap-3">
        {stylists.map((stylist) => (
          <div
            key={stylist.id}
            onClick={() => onStylistSelect(stylist.id)}
            className={`relative p-2.5 sm:p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
              selectedStylist === stylist.id
                ? 'border-primary-500 bg-primary-50 shadow-lg scale-[1.02]'
                : 'border-gray-200 hover:border-primary-300 bg-white'
            }`}
          >
            {/* Selection Indicator */}
            {selectedStylist === stylist.id && (
              <div className="absolute top-2 right-2 w-5 h-5 sm:w-6 sm:h-6 bg-primary-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-xs sm:text-sm font-bold">✓</span>
              </div>
            )}

            {/* Horizontal Layout */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Stylist Avatar - Smaller and Circular */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center shadow-sm">
                  {stylist.avatar ? (
                    <img
                      src={stylist.avatar}
                      alt={stylist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl sm:text-2xl">{stylist.emoji}</span>
                  )}
                </div>
              </div>

              {/* Stylist Info - Compact Layout */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-900 truncate pr-2">
                    {stylist.name}
                  </h4>
                </div>

                {/* Rating and Experience in one line */}
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                          i < Math.floor(stylist.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-600 ml-0.5">
                      {stylist.rating}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-600">
                    {stylist.experience}
                  </span>
                </div>

                {/* Specialties - Compact */}
                <div className="flex flex-wrap gap-1">
                  {stylist.specialties.slice(0, 2).map((specialty) => (
                    <Badge
                      key={specialty}
                      variant="primary"
                      size="sm"
                      className="text-xs px-2 py-0.5"
                    >
                      {specialty}
                    </Badge>
                  ))}
                  {stylist.specialties.length > 2 && (
                    <Badge variant="primary" size="sm" className="text-xs px-2 py-0.5">
                      +{stylist.specialties.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800 flex items-center gap-2">
          <span>💡</span>
          <strong>Tip:</strong> All our stylists are certified professionals with years of experience
        </p>
      </div> */}
    </div>
  );
};

export default StylistSelection;