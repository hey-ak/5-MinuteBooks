import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import Layout from '@/react-app/components/Layout';
import BookCard from '@/react-app/components/BookCard';
import { useSimpleAuth } from '@/react-app/hooks/useSimpleAuth';
import { apiRequest } from '@/react-app/utils/api';
import type { Book } from '@/shared/types';

export default function Favorites() {
  const { user, loading: isPending } = useSimpleAuth();
  const [favorites, setFavorites] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else if (!isPending) {
      setLoading(false);
    }
  }, [user, isPending]);

  const fetchFavorites = async () => {
    try {
      const data = await apiRequest('/api/favorites');
      setFavorites(data.favorites);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = (bookId: number, isFavorited: boolean) => {
    if (!isFavorited) {
      // Remove from favorites list
      setFavorites(prev => prev.filter(book => book.id !== bookId));
    }
  };

  if (isPending || loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="aspect-square bg-gray-100 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Sign in to see your favorites</h1>
          <p className="text-gray-600 text-lg">
            Create an account to save and organize your favorite audiobooks.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-8">
          <Heart className="w-8 h-8 text-red-400 fill-current" />
          <h1 className="text-3xl font-bold text-gray-800">Your Favorites</h1>
        </div>

        {/* Favorites Grid */}
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {favorites.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onFavoriteToggle={handleFavoriteToggle}
                isFavorited={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="w-20 h-20 text-gray-200 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No favorites yet</h2>
            <p className="text-gray-600 text-lg mb-8">
              Start exploring our audiobook collection and add books to your favorites.
            </p>
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg hover:from-yellow-600 hover:to-amber-700 transition-all duration-200 transform hover:scale-105"
            >
              Browse Books
            </a>
          </div>
        )}
      </div>
    </Layout>
  );
}
