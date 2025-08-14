import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Heart, Share2, Clock, Tag } from 'lucide-react';
import Layout from '@/react-app/components/Layout';
import AudioPlayer from '@/react-app/components/AudioPlayer';
import { useSimpleAuth } from '@/react-app/hooks/useSimpleAuth';
import { apiRequest } from '@/react-app/utils/api';
import type { Book } from '@/shared/types';

export default function BookPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useSimpleAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBook();
      if (user) {
        checkIfFavorited();
      }
    }
  }, [id, user]);

  const fetchBook = async () => {
    try {
      const response = await fetch(`/api/books/${id}`);
      if (response.ok) {
        const data = await response.json();
        setBook(data.book);
      } else {
        console.error('Book not found');
      }
    } catch (error) {
      console.error('Failed to fetch book:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorited = async () => {
    try {
      const data = await apiRequest('/api/favorites');
      const favoriteIds = data.favorites.map((fav: any) => fav.id);
      setIsFavorited(favoriteIds.includes(Number(id)));
    } catch (error) {
      console.error('Failed to check favorites:', error);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user || !book) return;

    try {
      if (isFavorited) {
        await apiRequest(`/api/favorites/${book.id}`, {
          method: 'DELETE',
        });
      } else {
        await apiRequest('/api/favorites', {
          method: 'POST',
          body: JSON.stringify({ book_id: book.id }),
        });
      }
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share && book) {
      try {
        await navigator.share({
          title: book.title,
          text: `Listen to "${book.title}" by ${book.author} on Bookwave`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
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

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-2xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!book) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Book Not Found</h1>
          <Link to="/" className="text-yellow-600 hover:text-yellow-700">
            Return to Home
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Books</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Cover and Info */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg sticky top-8">
              {/* Cover Image */}
              <div className="aspect-square bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl mb-6 overflow-hidden">
                {book.cover_image_url ? (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">5</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Book Details */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">{book.title}</h1>
                  <p className="text-gray-600 text-lg">{book.author}</p>
                </div>

                {/* Metadata */}
                <div className="space-y-2">
                  {book.category_name && (
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 text-sm">{book.category_name}</span>
                    </div>
                  )}
                  
                  {book.duration_seconds && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 text-sm">{formatDuration(book.duration_seconds)}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4">
                  {user && (
                    <button
                      onClick={handleFavoriteToggle}
                      className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-all duration-200 ${
                        isFavorited
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                      <span>{isFavorited ? 'Favorited' : 'Add to Favorites'}</span>
                    </button>
                  )}
                  
                  <button
                    onClick={handleShare}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Audio Player and Description */}
          <div className="lg:col-span-2 space-y-8">
            {/* Audio Player */}
            <AudioPlayer
              audioUrl={book.audio_url}
              title={book.title}
              author={book.author}
            />

            {/* Description */}
            {book.description && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                <h2 className="text-gray-800 text-xl font-semibold mb-4">About This Book</h2>
                <p className="text-gray-700 leading-relaxed">{book.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
