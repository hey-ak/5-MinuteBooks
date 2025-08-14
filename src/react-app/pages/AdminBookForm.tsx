import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Save, Loader2, Upload } from 'lucide-react';
import { useSimpleAuth } from '@/react-app/hooks/useSimpleAuth';
import { apiRequest } from '@/react-app/utils/api';
import AdminLayout from '@/react-app/components/AdminLayout';
import FileUpload from '@/react-app/components/FileUpload';
import type { Category } from '@/shared/types';

export default function AdminBookForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSimpleAuth();
  const isEditing = id !== 'new';
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category_id: '',
    audio_url: '',
    cover_image_url: '',
    duration_seconds: '',
    is_published: true,
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      navigate('/signin');
      return;
    }
    
    fetchCategories();
    if (isEditing) {
      fetchBook();
    }
  }, [id, user]);

  const fetchCategories = async () => {
    try {
      const data = await apiRequest('/api/simple-admin/categories');
      setCategories(data.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchBook = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/api/simple-admin/books/${id}`);
      const book = data.book;
      setFormData({
        title: book.title,
        author: book.author,
        description: book.description || '',
        category_id: book.category_id?.toString() || '',
        audio_url: book.audio_url,
        cover_image_url: book.cover_image_url || '',
        duration_seconds: book.duration_seconds?.toString() || '',
        is_published: !!book.is_published,
      });
    } catch (error) {
      console.error('Failed to fetch book:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const submitData = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        duration_seconds: formData.duration_seconds ? parseInt(formData.duration_seconds) : null,
      };

      const url = isEditing ? `/api/simple-admin/books/${id}` : '/api/simple-admin/books';
      const method = isEditing ? 'PUT' : 'POST';

      await apiRequest(url, {
        method,
        body: JSON.stringify(submitData),
      });

      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error saving book:', error);
      alert('Failed to save book. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-gray-800">Loading book data...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-3 mb-8">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Edit Book' : 'Add New Book'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Book Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter book title"
                />
              </div>

              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                  Author *
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter author name"
                />
              </div>

              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="duration_seconds" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  id="duration_seconds"
                  name="duration_seconds"
                  value={formData.duration_seconds}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="e.g., 300 for 5 minutes"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_published"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                />
                <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                  Publish immediately
                </label>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter book description"
                />
              </div>

              <FileUpload
                accept="audio/*"
                onUpload={(url) => setFormData(prev => ({ ...prev, audio_url: url }))}
                currentUrl={formData.audio_url}
                label="Audio File *"
                description="Upload MP3, WAV, or M4A files (max 100MB)"
                maxSize={100}
              />

              <FileUpload
                accept="image/*"
                onUpload={(url) => setFormData(prev => ({ ...prev, cover_image_url: url }))}
                currentUrl={formData.cover_image_url}
                label="Cover Image"
                description="Upload JPEG, PNG, or WebP images (max 100MB)"
                maxSize={100}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Upload className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">File Upload</p>
                    <p className="text-sm text-blue-700 mt-1">
                      You can now upload files directly from your computer up to 100MB. Files are stored securely 
                      and will be served with optimized caching.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg hover:from-yellow-600 hover:to-amber-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{submitting ? 'Saving...' : (isEditing ? 'Update Book' : 'Create Book')}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
