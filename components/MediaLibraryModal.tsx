'use client';

import { MediaLibrary } from './MediaLibrary';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  bucket: 'blog-images' | 'cpd-media' | 'webinar-videos' | 'documents';
}

export function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  bucket,
}: MediaLibraryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        role="button"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-2xl font-heading font-bold text-gray-900">Media Library</h2>
            <p className="text-sm text-gray-600 mt-1">Select an image or upload a new one</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-gray-200"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <MediaLibrary
            bucket={bucket}
            onSelectFile={(file) => {
              onSelect(file.url);
              onClose();
            }}
            selectionMode
          />
        </div>
      </div>
    </div>
  );
}

