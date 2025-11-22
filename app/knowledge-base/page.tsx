'use client';

import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { trpc } from '@/lib/trpc/Provider';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import KnowledgeBaseChat from '@/components/kb/KnowledgeBaseChat';
import DocumentComparison from '@/components/kb/DocumentComparison';
import { processMultipleDocuments } from '@/lib/kbDocumentProcessor';
import { 
  Upload, 
  FileText, 
  Search, 
  Calendar, 
  Rss, 
  AlertCircle,
  CheckCircle,
  Trash2,
  Eye,
  RefreshCw,
  Plus,
  MessageCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { logger } from '../../lib/logger';


export default function KnowledgeBasePage() {
  const { currentUser, isAdmin, isManager } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'CRG' | 'Charter' | 'Precedents' | 'Forms' | 'Legislation' | 'Other'>('CRG');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, filename: '' });
  const [comparisonResults, setComparisonResults] = useState<any[]>([]);
  const [processingDoc, setProcessingDoc] = useState<string | null>(null);

  const uploadForComparison = trpc.knowledge.uploadForComparison.useMutation();
  const approveStaged = trpc.knowledge.approveStaged.useMutation();
  const utils = trpc.useUtils();

  // Check permissions
  if (!isAdmin && !isManager) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Only administrators and managers can access the Knowledge Base management portal.
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Return to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: knowledgeEntries, isLoading } = trpc.knowledge.list.useQuery({
    searchQuery: searchQuery || undefined,
    limit: 100,
  });

  const { data: updateTimeline } = trpc.knowledge.getTimeline.useQuery({
    limit: 50,
  });

  const { data: rssFeeds } = trpc.knowledge.listRssFeeds.useQuery();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadingFiles(files);
  };

  const handleUpload = async () => {
    if (uploadingFiles.length === 0 || !currentUser) return;

    setIsProcessing(true);
    setComparisonResults([]);

    try {
      logger.info('📤 Processing', uploadingFiles.length, 'documents...');

      // Process all documents
      const processedDocs = await processMultipleDocuments(
        uploadingFiles,
        currentUser.organization_id,
        (current, total, filename) => {
          setUploadProgress({ current, total, filename });
        }
      );

      logger.info(`✅ Processed ${processedDocs.length} documents`);

      // Upload each for AI comparison
      const comparisons = [];
      for (const doc of processedDocs) {
        logger.info(`🤖 Comparing: ${doc.filename}`);
        
        // Convert ArrayBuffer to base64 for transmission
        const base64Buffer = Buffer.from(doc.fileBuffer).toString('base64');
        
        const result = await uploadForComparison.mutateAsync({
          filename: doc.filename,
          fileBuffer: base64Buffer, // Send as base64
          fileType: doc.fileType,
          fileSize: doc.fileSize,
          extractedText: doc.extractedText,
          documentChunks: doc.documentChunks,
          category: selectedCategory, // Include selected category
        });

        comparisons.push({
          filename: doc.filename,
          stagedId: result.stagingId,
          comparison: result.comparison,
        });
      }

      setComparisonResults(comparisons);
      logger.info('✅ All documents compared');

    } catch (error: any) {
      logger.error('❌ Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setUploadProgress({ current: 0, total: 0, filename: '' });
    }
  };

  const handleApprove = async (stagedId: string, filename: string) => {
    setProcessingDoc(stagedId);
    try {
      await approveStaged.mutateAsync({ stagedId });
      
      // Remove from comparison results
      setComparisonResults(prev => prev.filter(r => r.stagedId !== stagedId));
      
      // Refresh knowledge list
      await utils.knowledge.list.invalidate();
      await utils.knowledge.getTimeline.invalidate();
      
      logger.info(`✅ Approved: ${filename}`);
    } catch (error: any) {
      logger.error('❌ Approval failed:', error);
      alert(`Failed to approve: ${error.message}`);
    } finally {
      setProcessingDoc(null);
    }
  };

  const handleReject = async (stagedId: string, filename: string) => {
    if (!confirm(`Reject "${filename}"? This will delete it from staging.`)) {
      return;
    }

    setProcessingDoc(stagedId);
    try {
      // Just remove from comparison results (staged entry will remain until admin deletes it)
      setComparisonResults(prev => prev.filter(r => r.stagedId !== stagedId));
      
      logger.info(`❌ Rejected: ${filename}`);
    } finally {
      setProcessingDoc(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Knowledge Base Management</h1>
              <p className="text-sm text-muted-foreground">
                Upload, manage, and monitor HMRC guidance documents
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard">
                <Button variant="outline">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="chat">
              <MessageCircle className="h-4 w-4 mr-2" />
              Ask Questions
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload & Compare
            </TabsTrigger>
            <TabsTrigger value="browse">
              <FileText className="h-4 w-4 mr-2" />
              Browse Knowledge
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Calendar className="h-4 w-4 mr-2" />
              Update Timeline
            </TabsTrigger>
            <TabsTrigger value="rss">
              <Rss className="h-4 w-4 mr-2" />
              RSS Feeds
            </TabsTrigger>
          </TabsList>

          {/* CHAT TAB */}
          <TabsContent value="chat" className="space-y-6">
            <KnowledgeBaseChat />
          </TabsContent>

          {/* UPLOAD & COMPARE TAB */}
          <TabsContent value="upload" className="space-y-6">
            {/* Processing Progress */}
            {isProcessing && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="py-6">
                  <div className="flex items-center gap-4">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">
                        Processing Documents...
                      </p>
                      {uploadProgress.total > 0 && (
                        <p className="text-sm text-blue-700 mt-1">
                          {uploadProgress.current} of {uploadProgress.total}: {uploadProgress.filename}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comparison Results */}
            {comparisonResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">AI Comparison Results</h2>
                  <Badge variant="outline">
                    {comparisonResults.length} document{comparisonResults.length !== 1 ? 's' : ''} analysed
                  </Badge>
                </div>
                {comparisonResults.map((result, index) => (
                  <DocumentComparison
                    key={result.stagedId}
                    filename={result.filename}
                    comparison={result.comparison}
                    onApprove={() => handleApprove(result.stagedId, result.filename)}
                    onReject={() => handleReject(result.stagedId, result.filename)}
                    isProcessing={processingDoc === result.stagedId}
                  />
                ))}
              </div>
            )}

            {/* Upload Form (shown when not processing and no results) */}
            {!isProcessing && comparisonResults.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-600" />
                    Upload Documents for Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Category Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Document Category <span className="text-red-500">*</span>
                    </label>
                    <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as typeof selectedCategory)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CRG">CRG - Complaints Resolution Guidance</SelectItem>
                        <SelectItem value="Charter">Charter - HMRC Charter Documents</SelectItem>
                        <SelectItem value="Precedents">Precedents - Historical Complaint Cases</SelectItem>
                        <SelectItem value="Forms">Forms - HMRC Forms & Templates</SelectItem>
                        <SelectItem value="Legislation">Legislation - Tax Law & Statutory References</SelectItem>
                        <SelectItem value="Other">Other - General Tax Guidance</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Select where these documents should be stored in the knowledge base
                    </p>
                  </div>

                  {/* Upload Zone */}
                  <div className="border-2 border-dashed border-blue-200 rounded-lg p-8 text-center bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
                    <input
                      type="file"
                      id="kb-file-upload"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isProcessing}
                    />
                    <label htmlFor="kb-file-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-blue-100 rounded-full">
                          <Upload className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-lg">Drop files here or click to browse</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Supported: PDF, Word, Excel, CSV, TXT
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Selected Files */}
                  {uploadingFiles.length > 0 && (
                    <div className="space-y-3">
                      <p className="font-medium">Selected Files ({uploadingFiles.length}):</p>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {uploadingFiles.map((file, index) => (
                          <div key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium text-sm">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setUploadingFiles(files => files.filter((_, i) => i !== index))}
                              disabled={isProcessing}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button 
                        onClick={handleUpload} 
                        className="w-full" 
                        size="lg"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Upload & Compare Against Existing Knowledge
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Info Card */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm space-y-2">
                        <p className="font-medium text-blue-900">What happens when you upload?</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-800">
                          <li>Documents are extracted and analysed with AI</li>
                          <li>Content is compared against existing knowledge base</li>
                          <li>AI detects: duplicates, overlaps, new information, and gaps</li>
                          <li>You'll see a detailed comparison report for each document</li>
                          <li>Approve documents individually to add them to the knowledge base</li>
                          <li>Each approval is versioned and tracked in the timeline</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* BROWSE KNOWLEDGE TAB */}
          <TabsContent value="browse" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Knowledge Base Entries</CardTitle>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search knowledge..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading knowledge base...
                  </div>
                ) : knowledgeEntries && knowledgeEntries.length > 0 ? (
                  <div className="space-y-3">
                    {knowledgeEntries.map((entry: any) => (
                      <div key={entry.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{entry.title}</h3>
                              <Badge variant="outline">{entry.category}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {entry.content.substring(0, 200)}...
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span>Source: {entry.source || 'Manual Upload'}</span>
                              <span>Added: {new Date(entry.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No results found.' : 'No knowledge base entries yet.'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* UPDATE TIMELINE TAB */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base Update Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {updateTimeline && updateTimeline.length > 0 ? (
                    updateTimeline.map((update: any) => (
                      <div key={update.id} className="flex gap-4 pb-4 border-b last:border-0">
                        <div className="flex-shrink-0 mt-1">
                          {update.action === 'added' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : update.action === 'updated' ? (
                            <RefreshCw className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Trash2 className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{update.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {update.action === 'added' ? 'Added to' : update.action === 'updated' ? 'Updated in' : 'Removed from'} {update.category}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{new Date(update.created_at).toLocaleString()}</span>
                            <span>By: {update.user_name || 'System'}</span>
                            {update.source && <span>Source: {update.source}</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No updates yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RSS FEEDS TAB */}
          <TabsContent value="rss" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Rss className="h-5 w-5 text-orange-600" />
                      RSS Feed Management
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Automatically monitor HMRC and tax guidance sources for updates
                    </p>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feed
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-900 mb-1">Awaiting Configuration</p>
                      <p className="text-yellow-800">
                        RSS feed integration will be configured once you provide the code oversight document.
                        This will enable automatic monitoring of HMRC guidance updates.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Placeholder for RSS feeds */}
                <div className="text-center py-8 text-muted-foreground">
                  <Rss className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>RSS feed configuration coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

