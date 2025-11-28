'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/Provider';
import { Save, Lock, Send, FileText, CheckCircle2, Clock, RefreshCw, Edit2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { FormattedLetter } from './FormattedLetter';

interface LetterManagerProps {
  complaintId: string;
  generatedLetter?: string;
  clientReference?: string;
  onLetterSaved?: () => void;
  onRegenerateLetter?: (letterId: string, currentContent: string) => void;
}

export function LetterManager({ complaintId, generatedLetter, clientReference, onLetterSaved, onRegenerateLetter }: LetterManagerProps) {
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<any>(null);
  const [editContent, setEditContent] = useState('');
  const [editReason, setEditReason] = useState('');
  const [sendForm, setSendForm] = useState({
    sentBy: '',
    sentMethod: 'post' as 'post' | 'email' | 'post_and_email' | 'fax',
    hmrcReference: '',
    notes: '',
  });

  // Use listActive to show only non-superseded letters
  const { data: savedLetters, refetch: refetchLetters } = trpc.letters.listActive.useQuery({ complaintId });
  
  const saveLetter = trpc.letters.save.useMutation({
    onSuccess: () => {
      refetchLetters();
      onLetterSaved?.();
      alert('Letter saved successfully!');
    },
  });

  const lockLetter = trpc.letters.lock.useMutation({
    onSuccess: () => {
      refetchLetters();
      alert('Letter locked! Ready to send.');
    },
  });

  const markAsSent = trpc.letters.markAsSent.useMutation({
    onSuccess: () => {
      refetchLetters();
      setShowSendDialog(false);
      alert('Letter marked as sent and added to timeline!');
    },
  });

  const updateContent = trpc.letters.updateContent.useMutation({
    onSuccess: () => {
      refetchLetters();
      setShowEditDialog(false);
      setSelectedLetter(null);
      setEditContent('');
      setEditReason('');
      alert('Letter updated successfully! (No extra time logged)');
    },
    onError: (error) => {
      alert(`Failed to update letter: ${error.message}`);
    },
  });

  const regenerateLetter = trpc.letters.regenerate.useMutation({
    onSuccess: (newLetter) => {
      refetchLetters();
      alert('Letter regenerated successfully! The old version has been archived. (No extra time logged)');
    },
    onError: (error) => {
      alert(`Failed to regenerate letter: ${error.message}`);
    },
  });

  const handleSaveLetter = () => {
    if (!generatedLetter) return;
    
    saveLetter.mutate({
      complaintId,
      letterType: 'initial_complaint',
      letterContent: generatedLetter,
      notes: 'Auto-saved from generator',
    });
  };

  const handleLockLetter = (letterId: string) => {
    if (confirm('Lock this letter? Once locked, it cannot be regenerated.')) {
      lockLetter.mutate({ letterId });
    }
  };

  const handleSendLetter = (letter: any) => {
    setSelectedLetter(letter);
    setShowSendDialog(true);
  };

  const handleConfirmSent = () => {
    if (!selectedLetter || !sendForm.sentBy) {
      alert('Please fill in who sent the letter');
      return;
    }

    markAsSent.mutate({
      letterId: selectedLetter.id,
      ...sendForm,
    });
  };

  const handleEditLetter = (letter: any) => {
    setSelectedLetter(letter);
    setEditContent(letter.letter_content);
    setEditReason('');
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!selectedLetter || !editContent.trim()) {
      alert('Letter content cannot be empty');
      return;
    }

    updateContent.mutate({
      letterId: selectedLetter.id,
      newContent: editContent,
      editReason: editReason || undefined,
    });
  };

  const handleRegenerateLetter = (letter: any) => {
    if (onRegenerateLetter) {
      // Use parent's regeneration flow (with AI)
      onRegenerateLetter(letter.id, letter.letter_content);
    } else {
      // Simple regeneration - just mark as needing regeneration
      alert('To regenerate with AI, use the "Refine Letter" feature above.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Display current generated letter with formatting */}
      {generatedLetter && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Current Generated Letter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900">Not saved yet</p>
                <p className="text-yellow-700">This letter will be lost if you refresh the page. Save it to keep it permanently.</p>
              </div>
            </div>

            <FormattedLetter 
              content={generatedLetter} 
              clientReference={clientReference || complaintId}
            />

            <Button onClick={handleSaveLetter} disabled={saveLetter.isPending} className="gap-2 w-full">
              <Save className="h-4 w-4" />
              Save Letter to Database
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Saved letters list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Saved Letters ({savedLetters?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!savedLetters || savedLetters.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No saved letters yet. Generate and save a letter to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {savedLetters.map((letter: any) => (
                <div
                  key={letter.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {letter.letter_type.replace('_', ' ').toUpperCase()}
                        </span>
                        {letter.is_regeneration && (
                          <Badge variant="outline" className="gap-1 text-blue-600 border-blue-300">
                            <RefreshCw className="h-3 w-3" />
                            Regenerated
                          </Badge>
                        )}
                        {letter.locked_at && (
                          <Badge variant="secondary" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Locked
                          </Badge>
                        )}
                        {letter.sent_at && (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Sent
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Generated: {format(new Date(letter.created_at), 'dd MMM yyyy HH:mm')}
                      </p>
                      {letter.is_regeneration && letter.notes && (
                        <p className="text-xs text-blue-600">
                          {letter.notes}
                        </p>
                      )}
                      {letter.sent_at && (
                        <>
                          <p className="text-sm">
                            <strong>Sent:</strong> {format(new Date(letter.sent_at), 'dd MMM yyyy')} via {letter.sent_method}
                          </p>
                          {letter.sent_by && (
                            <p className="text-sm">
                              <strong>Sent by:</strong> {letter.sent_by}
                            </p>
                          )}
                          {letter.hmrc_reference && (
                            <p className="text-sm">
                              <strong>HMRC Ref:</strong> {letter.hmrc_reference}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {/* Edit button - available if not sent */}
                      {!letter.sent_at && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditLetter(letter)}
                          className="gap-1"
                          title="Edit letter content (no extra time)"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </Button>
                      )}
                      
                      {/* Regenerate button - available if not sent */}
                      {!letter.sent_at && onRegenerateLetter && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRegenerateLetter(letter)}
                          className="gap-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                          title="Regenerate with AI (replaces this letter, no extra time)"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Regenerate
                        </Button>
                      )}
                      
                      {/* Lock button - available if not locked */}
                      {!letter.locked_at && !letter.sent_at && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLockLetter(letter.id)}
                          className="gap-1"
                        >
                          <Lock className="h-3 w-3" />
                          Lock
                        </Button>
                      )}
                      
                      {/* Mark as Sent button - available if locked but not sent */}
                      {letter.locked_at && !letter.sent_at && (
                        <Button
                          size="sm"
                          onClick={() => handleSendLetter(letter)}
                          className="gap-1"
                        >
                          <Send className="h-3 w-3" />
                          Mark as Sent
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Letter preview (collapsed) */}
                  <details className="text-sm">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      View letter content
                    </summary>
                    <div className="mt-3">
                      <FormattedLetter 
                        content={letter.letter_content} 
                        clientReference={clientReference || complaintId}
                      />
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send dialog */}
      {showSendDialog && selectedLetter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Mark Letter as Sent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sentBy">Sent by (name) *</Label>
                <Input
                  id="sentBy"
                  placeholder="e.g., James Howard"
                  value={sendForm.sentBy}
                  onChange={(e) => setSendForm({ ...sendForm, sentBy: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="sentMethod">Send method *</Label>
                <select
                  id="sentMethod"
                  value={sendForm.sentMethod}
                  onChange={(e) => setSendForm({ ...sendForm, sentMethod: e.target.value as any })}
                  className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="post">Post</option>
                  <option value="email">Email</option>
                  <option value="post_and_email">Post and Email</option>
                  <option value="fax">Fax</option>
                </select>
              </div>

              <div>
                <Label htmlFor="hmrcRef">HMRC Reference (optional)</Label>
                <Input
                  id="hmrcRef"
                  placeholder="e.g., Tracking number or receipt"
                  value={sendForm.hmrcReference}
                  onChange={(e) => setSendForm({ ...sendForm, hmrcReference: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes..."
                  value={sendForm.notes}
                  onChange={(e) => setSendForm({ ...sendForm, notes: e.target.value })}
                  className="mt-1.5"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowSendDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSent}
                  disabled={markAsSent.isPending}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Sent
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Letter dialog */}
      {showEditDialog && selectedLetter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5" />
                Edit Letter Content
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Make corrections or updates. This will <strong>not</strong> add extra time to the invoice.
              </p>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col space-y-4">
              {/* Info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">No extra time logged</p>
                  <p className="text-blue-700">Edits and regenerations after the initial generation do not add to billable time.</p>
                </div>
              </div>

              <div className="flex-shrink-0">
                <Label htmlFor="editReason">Reason for edit (optional)</Label>
                <Input
                  id="editReason"
                  placeholder="e.g., Fixed date error, Updated client details"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="flex-1 overflow-hidden">
                <Label htmlFor="editContent">Letter Content</Label>
                <Textarea
                  id="editContent"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="mt-1.5 h-[400px] font-mono text-sm resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setSelectedLetter(null);
                    setEditContent('');
                    setEditReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={updateContent.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateContent.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

