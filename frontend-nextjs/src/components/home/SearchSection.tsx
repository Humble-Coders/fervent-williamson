import React from 'react';
import { Search } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

export interface SearchSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({
  searchQuery,
  onSearchChange,
  onSearch,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <section className="py-4 md:py-12 relative z-20 -mt-6 md:-mt-16">
      <div className="container-custom px-4">
        <Card className="backdrop-blur-xl bg-white/95 border border-white/50 shadow-glass-lg animate-slide-up mx-0">
          <form onSubmit={handleSubmit} className="relative flex items-center gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="hidden md:block absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search businesses, services..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-3 md:pl-12 pr-3 md:pr-4 py-3 md:py-4 text-sm md:text-base bg-transparent border-none outline-none placeholder-text-muted focus:ring-2 focus:ring-primary-200 rounded-lg transition-all"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl shadow-glow hover:shadow-glow-lg smooth-transform gpu-accelerated hover:scale-105 flex items-center justify-center flex-shrink-0 min-w-[48px] md:min-w-[120px]"
            >
              <Search className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline ml-2">Search</span>
            </Button>
          </form>
        </Card>
      </div>
    </section>
  );
};

export default SearchSection;