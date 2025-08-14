import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useSimpleAuth } from '@/react-app/hooks/useSimpleAuth';
import { apiRequest } from '@/react-app/utils/api';
import AdminLayout from '@/react-app/components/AdminLayout';
import { 
  Book, 
  Plus, 
  Settings, 
  BarChart3,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import type { Book as BookType, Category } from '@/shared/types';

export default function AdminDashboard() {
  const { user } = useSimpleAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<BookType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'books' | 'categories' | 'stats'>('books');

  useEffect(() => {
    if (user?.type === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [booksData, categoriesData] = await Promise.all([
        apiRequest('/api/simple-admin/books'),
        apiRequest('/api/simple-admin/categories')
      ]);
      
      setBooks(booksData.books);
      setCategories(categoriesData.categories);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookPublication = async (bookId: number, isPublished: boolean) => {
    try {
      await apiRequest(`/api/simple-admin/books/${bookId}/toggle-publication`, {
        method: 'PATCH',
        body: JSON.stringify({ is_published: !isPublished }),
      });

      setBooks(prev => prev.map(book => 
        book.id === bookId 
          ? { ...book, is_published: !isPublished ? 1 : 0 }
          : book
      ));
    } catch (error) {
      console.error('Failed to toggle publication:', error);
    }
  };

  const deleteBook = async (bookId: number) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      await apiRequest(`/api/simple-admin/books/${bookId}`, {
        method: 'DELETE',
      });

      setBooks(prev => prev.filter(book => book.id !== bookId));
    } catch (error) {
      console.error('Failed to delete book:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-gray-800">Loading admin dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  const stats = {
    totalBooks: books.length,
    publishedBooks: books.filter(book => book.is_published).length,
    totalCategories: categories.length,
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <Book className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-gray-600 text-sm">Total Books</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalBooks}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <Eye className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-gray-600 text-sm">Published Books</p>
                <p className="text-2xl font-bold text-gray-800">{stats.publishedBooks}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-gray-600 text-sm">Categories</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalCategories}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => navigate('/admin/books/new')}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg hover:from-yellow-600 hover:to-amber-700 transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Book</span>
          </button>
          
          <button
            onClick={() => navigate('/admin/categories/new')}
            className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Category</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'books', label: 'Books', icon: Book },
                { id: 'categories', label: 'Categories', icon: Settings },
                { id: 'stats', label: 'Statistics', icon: BarChart3 },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === id
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'books' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Manage Books</h3>
                {books.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Author</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {books.map(book => (
                          <tr key={book.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-800">{book.title}</td>
                            <td className="py-3 px-4 text-gray-600">{book.author}</td>
                            <td className="py-3 px-4 text-gray-600">{book.category_name || 'Uncategorized'}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                book.is_published 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {book.is_published ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => navigate(`/admin/books/${book.id}/edit`)}
                                  className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => toggleBookPublication(book.id, !!book.is_published)}
                                  className={`p-1 transition-colors ${
                                    book.is_published 
                                      ? 'text-gray-600 hover:text-gray-800' 
                                      : 'text-green-600 hover:text-green-800'
                                  }`}
                                  title={book.is_published ? 'Hide' : 'Publish'}
                                >
                                  {book.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => deleteBook(book.id)}
                                  className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Book className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No books found. Add your first book!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Manage Categories</h3>
                {categories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map(category => (
                      <div key={category.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-2">{category.name}</h4>
                        <p className="text-gray-600 text-sm mb-3">{category.description || 'No description'}</p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/admin/categories/${category.id}/edit`)}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No categories found. Add your first category!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-800 mb-4">Book Statistics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Books:</span>
                        <span className="font-medium">{stats.totalBooks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Published:</span>
                        <span className="font-medium text-green-600">{stats.publishedBooks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Drafts:</span>
                        <span className="font-medium text-gray-600">{stats.totalBooks - stats.publishedBooks}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-800 mb-4">Category Statistics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Categories:</span>
                        <span className="font-medium">{stats.totalCategories}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
