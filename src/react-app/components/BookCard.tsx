import { useState } from 'react';
import { Heart, Play, Clock } from 'lucide-react';
import { Link } from 'react-router';
import { useSimpleAuth } from '@/react-app/hooks/useSimpleAuth';
import { useNotifications } from '@/react-app/hooks/useNotifications';
import { apiRequest } from '@/react-app/utils/api';
import type { Book } from '@/shared/types';

interface BookCardProps {
  book: Book;
  onFavoriteToggle?: (bookId: number, isFavorited: boolean) => void;
  isFavorited?: boolean;
}

export default function BookCard({ book, onFavoriteToggle, isFavorited = false }: BookCardProps) {
  const { user } = useSimpleAuth();
  const { showSuccess, showError } = useNotifications();
  const [isToggling, setIsToggling] = useState(false);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || !onFavoriteToggle) return;
    
    setIsToggling(true);
    try {
      if (isFavorited) {
        await apiRequest(`/api/favorites/${book.id}`, {
          method: 'DELETE',
        });
        showSuccess('Removed from Favorites', `"${book.title}" has been removed from your favorites.`);
      } else {
        await apiRequest('/api/favorites', {
          method: 'POST',
          body: JSON.stringify({ book_id: book.id }),
        });
        showSuccess('Added to Favorites', `"${book.title}" has been added to your favorites.`);
      }
      onFavoriteToggle(book.id, !isFavorited);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      showError('Failed to Update Favorites', 'Please try again later.');
    } finally {
      setIsToggling(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Link
      to={`/book/${book.id}`}
      className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-yellow-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
    >
      <div className="relative">
        {/* Cover Image */}
        <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl mb-4 overflow-hidden min-h-48 flex items-center justify-center">
          {book.cover_image_url ? (
            <img
              src={book.cover_image_url}
              alt={book.title}
              className="w-full h-auto object-contain rounded-xl"
            />
          ) : (
            <div className="w-full h-48 flex items-center justify-center">
              <Play className="w-12 h-12 text-gray-400" />
            </div>
          )}
          
          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        </div>

        {/* Favorite Button */}
        {user && onFavoriteToggle && (
          <button
            onClick={handleFavoriteToggle}
            disabled={isToggling}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
              isFavorited
                ? 'bg-red-500 text-white'
                : 'bg-white/90 text-gray-600 hover:text-red-400'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Book Info */}
      <div>
        <h3 className="text-gray-800 font-semibold mb-2 line-clamp-2 group-hover:text-yellow-700 transition-colors">
          {book.title}
        </h3>
        <p className="text-gray-600 text-sm mb-2">{book.author}</p>
        
        <div className="flex items-center justify-between">
          {book.category_name && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
              {book.category_name}
            </span>
          )}
          
          {book.duration_seconds && (
            <div className="flex items-center space-x-1 text-gray-500 text-xs">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(book.duration_seconds)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
