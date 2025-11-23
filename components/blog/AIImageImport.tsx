'use client';

/**
 * AI Image Import Component
 * Allows users to upload Gamma/Canva exports and automatically extract structure
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Sparkles, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIImageImportProps {
  onStructureExtracted: (structure: any) => void;
}

export function AIImageImport({ onStructureExtracted }: AIImageImportProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError(null);
    setSuccess(false);
    setIsAnalyzing(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1]; // Remove data:image/png;base64, prefix
        
        setUploadedImage(base64);

        // Send to AI analysis endpoint
        const response = await fetch('/api/blog/analyze-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: base64Data,
          }),
        });

        const result = await response.json();

        if (result.success && result.structure) {
          setSuccess(true);
          onStructureExtracted(result.structure);
        } else {
          setError(result.error || 'Failed to analyze image');
        }

        setIsAnalyzing(false);
      };

      reader.onerror = () => {
        setError('Failed to read image file');
        setIsAnalyzing(false);
      };

      reader.readAsDataURL(file);

    } catch (err: any) {
      setError(err.message || 'Failed to analyze image');
      setIsAnalyzing(false);
    }
  }, [onStructureExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: isAnalyzing,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-bold text-gray-900">AI-Powered Image Import</h3>
      </div>

      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
          ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-gray-50'}
          ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-400 hover:bg-purple-50'}
        `}
      >
        <input {...getInputProps()} />

        {uploadedImage && !isAnalyzing && (
          <div className="mb-4">
            <img 
              src={uploadedImage} 
              alt="Uploaded preview" 
              className="max-w-xs mx-auto rounded-lg shadow-lg"
            />
          </div>
        )}

        {isAnalyzing ? (
          <div className="space-y-3">
            <Loader2 className="h-12 w-12 mx-auto text-purple-600 animate-spin" />
            <p className="text-lg font-semibold text-gray-900">Analyzing with AI...</p>
            <p className="text-sm text-gray-600">
              Claude is extracting structure, content, and styling from your image
            </p>
          </div>
        ) : success ? (
          <div className="space-y-3">
            <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
            <p className="text-lg font-semibold text-green-900">Structure Extracted!</p>
            <p className="text-sm text-gray-600">
              Your blog post layout has been imported. You can now edit and customize it.
            </p>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setUploadedImage(null);
                setSuccess(false);
              }}
              variant="outline"
              size="sm"
            >
              Import Another
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="h-12 w-12 mx-auto text-gray-400" />
            <p className="text-lg font-semibold text-gray-900">
              {isDragActive ? 'Drop your image here' : 'Upload Gamma/Canva Export'}
            </p>
            <p className="text-sm text-gray-600">
              Drag & drop or click to upload a blog post design image
            </p>
            <p className="text-xs text-gray-500">
              Supported: PNG, JPG, GIF, WebP (max 10MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Analysis Failed</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-900 mb-1">How it works:</p>
            <ol className="text-blue-800 space-y-1 list-decimal list-inside">
              <li>Export your blog post design from Gamma, Canva, or Figma as an image</li>
              <li>Upload it here and our AI will analyze the layout and content</li>
              <li>We'll automatically recreate the structure using our template components</li>
              <li>Edit and customize the imported content as needed</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

