import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface SalonInfoProps {
  salon: {
    id: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    workingHours?: {
      [key: string]: { open: string; close: string; isOpen?: boolean; closed?: boolean };
    };
    amenities?: string[];
    teamSize?: number;
    yearsInBusiness?: number;
    certifications?: string[];
    mapsLink?: string;
  };
}

const SalonInfo: React.FC<SalonInfoProps> = ({ salon }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayEmojis = ['📅', '📅', '📅', '📅', '📅', '🎉', '🌟'];

  return (
    <section className="py-6 md:py-12 relative overflow-hidden">
      <div className="container-custom relative px-4">
        <div className="space-y-6">
          {/* About Section */}
          <div className="animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📖</span>
              <h2 className="text-xl md:text-2xl font-bold text-text-primary font-heading">
                About Our CutQ
              </h2>
            </div>

            <Card className="mb-4">
              <p className="text-text-secondary leading-relaxed mb-4 text-sm md:text-base">
                <span className="text-lg mr-2">💫</span>
                {salon.description}
              </p>

              {/* Salon Stats - Compact Mobile Layout */}
              <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4">
                <div className="text-center p-2 md:p-3 bg-primary-50 rounded-lg">
                  <div className="text-lg md:text-xl mb-1">👥</div>
                  <div className="text-lg md:text-xl font-bold text-primary-600">{salon.teamSize || 1}</div>
                  <div className="text-xs md:text-sm text-text-muted">Expert<br className="md:hidden"/>Stylists</div>
                </div>
                <div className="text-center p-2 md:p-3 bg-primary-50 rounded-lg">
                  <div className="text-lg md:text-xl mb-1">🎂</div>
                  <div className="text-lg md:text-xl font-bold text-primary-600">{salon.yearsInBusiness || 1}</div>
                  <div className="text-xs md:text-sm text-text-muted">Years<br className="md:hidden"/>Experience</div>
                </div>
                <div className="text-center p-2 md:p-3 bg-green-50 rounded-lg">
                  <div className="text-lg md:text-xl mb-1">🏆</div>
                  <div className="text-lg md:text-xl font-bold text-green-600">{(salon.certifications || []).length}</div>
                  <div className="text-xs md:text-sm text-text-muted">Certification</div>
                </div>
              </div>

              {/* Amenities */}
              {salon.amenities && salon.amenities?.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2 text-sm md:text-base">
                    <span>🎯</span>
                    Amenities & Features
                  </h3>
                  <div className="flex flex-wrap gap-1 md:gap-2">
                    {(salon.amenities || []).map((amenity) => (
                      <Badge
                        key={amenity}
                        variant="primary"
                        size="sm"
                        className="text-xs"
                      >
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {salon.certifications && salon.certifications?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2 text-sm md:text-base">
                    <span>🏅</span>
                    Certifications
                  </h3>
                  <div className="flex flex-wrap gap-1 md:gap-2">
                    {salon.certifications.map((cert) => (
                      <Badge
                        key={cert}
                        variant="success"
                        size="sm"
                        className="text-xs"
                      >
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Contact & Hours */}
          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📞</span>
              <h2 className="text-xl md:text-2xl font-bold text-text-primary font-heading">
                Contact & Hours
              </h2>
            </div>

            {/* Contact Info */}
            <Card className="mb-4">
              <h3 className="font-semibold text-text-primary mb-3 text-sm md:text-base">
                Get in Touch
              </h3>

              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg hover:bg-primary-50 smooth-hover group">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-primary-100 to-accent-100 rounded-lg flex items-center justify-center group-hover:scale-110 smooth-transform">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm">Address</p>
                    <p className="text-text-secondary text-xs md:text-sm truncate">
                      {salon.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg hover:bg-primary-50 smooth-hover group">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-accent-100 to-primary-100 rounded-lg flex items-center justify-center group-hover:scale-110 smooth-transform">
                    <Phone className="w-4 h-4 md:w-5 md:h-5 text-accent-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm">Phone</p>
                    <p className="text-text-secondary text-xs md:text-sm">
                      {salon.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg hover:bg-primary-50 smooth-hover group">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 smooth-transform">
                    <Mail className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary text-sm">Email</p>
                    <p className="text-text-secondary text-xs md:text-sm truncate">
                      {salon.email}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Working Hours */}
            <Card>
              <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2 text-sm md:text-base">
                <span>🕐</span>
                Opening Hours
              </h3>

              <div className="space-y-2">
                {days.map((day, index) => {
                  const hours = salon.workingHours?.[day.toLowerCase()];
                  const isToday = new Date().getDay() === (index + 1) % 7;

                  return (
                    <div
                      key={day}
                      className={`flex items-center justify-between p-2 md:p-3 rounded-lg smooth-hover ${
                        isToday
                          ? 'bg-gradient-to-r from-primary-100 to-primary-200 border border-primary-200'
                          : 'bg-neutral-50 hover:bg-primary-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm md:text-base">{dayEmojis[index]}</span>
                        <span className={`font-medium text-sm md:text-base ${isToday ? 'text-primary-700' : 'text-text-primary'}`}>
                          {day.substring(0, 3)}
                          <span className="hidden sm:inline">{day.substring(3)}</span>
                        </span>
                        {isToday && (
                          <Badge variant="primary" size="sm" className="animate-pulse-soft text-xs">
                            Today
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {(hours?.closed || hours?.isOpen === false) ? (
                          <span className="text-error-600 font-medium text-xs md:text-sm">
                            Closed
                          </span>
                        ) : hours ? (
                          <span className={`font-medium text-xs md:text-sm ${isToday ? 'text-primary-700' : 'text-text-secondary'}`}>
                            {hours.open} - {hours.close}
                          </span>
                        ) : (
                          <span className="text-text-secondary font-medium text-xs md:text-sm">
                            Not set
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SalonInfo;