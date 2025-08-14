import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import Layout from '@/react-app/components/Layout';
import BookCard from '@/react-app/components/BookCard';
import { useSimpleAuth } from '@/react-app/hooks/useSimpleAuth';
import { apiRequest } from '@/react-app/utils/api';
import type { Book, Category } from '@/shared/types';

export default function Home() {
  const { user, loading: authLoading } = useSimpleAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchBooks();
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      // Small delay to ensure user is fully authenticated
      setTimeout(() => {
        fetchFavorites();
      }, 100);
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetchBooks();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchBooks = async () => {
    try {
      const url = selectedCategory 
        ? `/api/books?category_id=${selectedCategory}`
        : '/api/books';
      const response = await fetch(url);
      const data = await response.json();
      setBooks(data.books);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;
    
    try {
      const data = await apiRequest('/api/favorites');
      const favoriteIds = new Set<number>(data.favorites.map((fav: any) => Number(fav.id)));
      setFavorites(favoriteIds);
    } catch (error) {
      // Silently handle auth errors - user might not be fully authenticated yet
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        console.log('User not authenticated for favorites');
      } else {
        console.error('Failed to fetch favorites:', error);
      }
    }
  };

  const handleFavoriteToggle = (bookId: number, isFavorited: boolean) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (isFavorited) {
        newFavorites.add(bookId);
      } else {
        newFavorites.delete(bookId);
      }
      return newFavorites;
    });
  };

  const selectedCategoryName = categories.find(cat => cat.id === selectedCategory)?.name;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            Learn Something New in Just
            <span className="bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent"> 5 Minutes</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your learning with our curated collection of book summaries in bite-sized 5-minute audio format
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-gray-800 text-lg font-semibold">Browse by Category</h2>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full transition-all duration-200 ${
                selectedCategory === null
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-yellow-50 hover:text-gray-800'
              }`}
            >
              All Books
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-yellow-50 hover:text-gray-800'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        <div>
          <h2 className="text-gray-800 text-2xl font-bold mb-6">
            {selectedCategoryName ? `${selectedCategoryName} Books` : 'All Books'}
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse">
                  <div className="aspect-square bg-gray-100 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : books.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {books.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  onFavoriteToggle={user ? handleFavoriteToggle : undefined}
                  isFavorited={favorites.has(book.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                No books found in this category.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
