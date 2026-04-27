'use client';

import { useRef, useState } from 'react';
import { FileText, Upload } from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface DocumentsPanelProps {
  caseId: string;
  documents?: any[];
}

export function DocumentsPanel({ caseId, documents = [] }: DocumentsPanelProps) {
  const utils = trpc.useUtils();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRecord = trpc.caseDocument.createRecord.useMutation({
    onSuccess: () => utils.case.get.invalidate(caseId),
  });

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${caseId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from('case-documents')
        .upload(path, file, { upsert: false });

      if (uploadError) throw uploadError;

      await createRecord.mutateAsync({
        caseId,
        fileName: file.name,
        storagePath: path,
        mimeType: file.type || undefined,
        fileSize: file.size,
      });
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    uploadFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#2B80FF]" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`rounded-lg border-2 border-dashed p-6 text-center transition ${
            dragOver ? 'border-[#2B80FF] bg-blue-50' : 'border-gray-200 bg-gray-50'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <Upload className="mx-auto h-8 w-8 text-[#2B80FF]" />
          <p className="mt-2 text-sm font-medium">Drop documents here</p>
          <p className="text-xs text-muted-foreground">Phase 1 stores files and metadata only. Extraction comes later.</p>
          <Input
            ref={inputRef}
            type="file"
            className="mt-4"
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading && <p className="mt-2 text-sm text-[#2B80FF]">Uploading...</p>}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="space-y-2">
          {documents.length === 0 && (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No documents uploaded yet.
            </p>
          )}
          {documents.map((document) => (
            <div key={document.id} className="flex items-center justify-between rounded-lg border bg-white p-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{document.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {document.file_size ? `${(Number(document.file_size) / 1024 / 1024).toFixed(2)} MB` : 'Stored'} · {document.mime_type || 'unknown type'}
                </p>
              </div>
              <Badge variant="outline">{document.extraction_status || 'pending'}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
