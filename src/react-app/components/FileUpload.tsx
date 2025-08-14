import { useState, useRef } from 'react';
import { Upload, X, Loader2, File, Image, Music } from 'lucide-react';
import { apiRequest } from '@/react-app/utils/api';

interface FileUploadProps {
  accept: string;
  onUpload: (url: string) => void;
  currentUrl?: string;
  label: string;
  description?: string;
  maxSize?: number; // in MB
}

export default function FileUpload({ 
  accept, 
  onUpload, 
  currentUrl, 
  label, 
  description,
  maxSize = 100 
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    console.log('File selected:', file.name, file.type, file.size);
    
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file...');
      
      const authData = localStorage.getItem('simple_user');
      if (!authData) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/simple-admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authData}`,
        },
        body: formData,
      });

      console.log('Upload response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }
        
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      onUpload(data.url);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const getFileIcon = () => {
    if (accept.includes('image')) return <Image className="w-8 h-8" />;
    if (accept.includes('audio')) return <Music className="w-8 h-8" />;
    return <File className="w-8 h-8" />;
  };

  const isImage = accept.includes('image');
  const isAudio = accept.includes('audio');

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragOver
            ? 'border-yellow-400 bg-yellow-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {uploading ? (
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              {getFileIcon()}
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop your file here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-yellow-600 hover:text-yellow-700 font-medium"
              >
                browse
              </button>
            </p>
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <X className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Current File Preview */}
      {currentUrl && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Current file:</p>
          {isImage ? (
            <img 
              src={currentUrl} 
              alt="Current file" 
              className="w-32 h-32 object-cover rounded-lg border border-gray-200"
            />
          ) : isAudio ? (
            <audio controls className="w-full max-w-md">
              <source src={currentUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          ) : (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <File className="w-4 h-4" />
              <span>File uploaded</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}