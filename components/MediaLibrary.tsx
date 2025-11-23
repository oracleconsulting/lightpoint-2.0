'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { createBrowserClient } from '@supabase/ssr';
import { Upload, X, Image as ImageIcon, File, Video, Search, Folder, Copy, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: 'image' | 'video' | 'document';
  createdAt: Date;
  bucket: string;
}

interface MediaLibraryProps {
  bucket?: 'blog-images' | 'cpd-media' | 'webinar-videos' | 'documents';
  onSelectFile?: (file: MediaFile) => void;
  selectionMode?: boolean;
}

export function MediaLibrary({ 
  bucket = 'blog-images', 
  onSelectFile,
  selectionMode = false 
}: MediaLibraryProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Load files from storage
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage.from(bucket).list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

      if (error) throw error;

      const filesWithUrls = data.map(file => {
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(file.name);
        
        let type: 'image' | 'video' | 'document' = 'document';
        if (file.metadata?.mimetype?.startsWith('image/')) type = 'image';
        else if (file.metadata?.mimetype?.startsWith('video/')) type = 'video';

        return {
          id: file.id,
          name: file.name,
          url: publicUrl,
          size: file.metadata?.size || 0,
          type,
          createdAt: new Date(file.created_at),
          bucket,
        };
      });

      setFiles(filesWithUrls);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  }, [bucket, supabase]);

  // Load files on mount
  React.useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Handle file upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadFiles = async () => {
      setUploading(true);
      
      for (const file of acceptedFiles) {
        try {
          const fileExt = file.name.split('.').pop();
          // Use crypto.randomUUID() for secure random filenames
          const randomId = crypto.randomUUID();
          const fileName = `${randomId}.${fileExt}`;

          const { error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) throw error;
        } catch (error) {
          console.error('Error uploading file:', error);
          alert(`Failed to upload ${file.name}`);
        }
      }

      setUploading(false);
      loadFiles(); // Reload files
    };

    void uploadFiles(); // Fire and forget
  }, [bucket, supabase, loadFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: bucket === 'blog-images' || bucket === 'cpd-media' 
      ? { 'image/*': [] }
      : bucket === 'webinar-videos'
      ? { 'video/*': [] }
      : undefined,
  });

  // Handle file deletion
  const handleDelete = async (fileName: string) => {
    if (!confirm(`Delete ${fileName}? This action cannot be undone.`)) return;

    try {
      const { error } = await supabase.storage.from(bucket).remove([fileName]);
      if (error) throw error;
      
      setFiles(files.filter(f => f.name !== fileName));
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  // Copy URL to clipboard
  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Filter files by search term
  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold">Media Library</h2>
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-600">{bucket}</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        {uploading ? (
          <p className="text-gray-600">Uploading...</p>
        ) : isDragActive ? (
          <p className="text-blue-600 font-medium">Drop files here...</p>
        ) : (
          <>
            <p className="text-gray-600 font-medium mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              {bucket === 'blog-images' || bucket === 'cpd-media'
                ? 'Images only (JPG, PNG, GIF, WebP)'
                : bucket === 'webinar-videos'
                ? 'Videos only (MP4, MOV, AVI)'
                : 'All file types accepted'}
            </p>
          </>
        )}
      </div>

      {/* Files Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No files uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              role="button"
              tabIndex={0}
              className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition cursor-pointer"
              onClick={() => onSelectFile?.(file)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectFile?.(file);
                }
              }}
            >
              {/* File Preview */}
              {file.type === 'image' ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : file.type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <Video className="h-12 w-12 text-gray-400" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <File className="h-12 w-12 text-gray-400" />
                </div>
              )}

              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyUrl(file.url);
                  }}
                  className="bg-white hover:bg-gray-100"
                >
                  {copiedUrl === file.url ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(file.name);
                  }}
                  className="bg-white hover:bg-red-50 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* File Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 opacity-0 group-hover:opacity-100 transition">
                <p className="text-white text-xs font-medium truncate">{file.name}</p>
                <p className="text-white text-xs opacity-75">{formatSize(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Stats */}
      <div className="text-sm text-gray-600 text-center pt-4 border-t">
        {files.length} file{files.length !== 1 ? 's' : ''} ({formatSize(files.reduce((sum, f) => sum + f.size, 0))} total)
      </div>
    </div>
  );
}

