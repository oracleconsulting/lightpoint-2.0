'use client';

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Send, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc/Provider';

interface Comment {
  id: string;
  author_name: string;
  content: string;
  is_featured: boolean;
  parent_comment_id: string | null;
  created_at: string;
}

interface BlogEngagementProps {
  postId: string;
  postSlug: string;
  initialLikeCount?: number;
  initialCommentCount?: number;
}

/**
 * Generate a simple browser fingerprint for anonymous like tracking
 */
function generateFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }
  const dataUrl = canvas.toDataURL();
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < dataUrl.length; i++) {
    const char = dataUrl.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `fp_${Math.abs(hash).toString(36)}`;
}

export function BlogEngagement({ 
  postId, 
  postSlug,
  initialLikeCount = 0, 
  initialCommentCount = 0 
}: BlogEngagementProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  
  // Comment form state
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // tRPC mutations
  const toggleLikeMutation = trpc.blog.toggleLike.useMutation();
  const addCommentMutation = trpc.blog.addComment.useMutation();
  const { data: commentsData, refetch: refetchComments } = trpc.blog.getComments.useQuery(
    { postId },
    { enabled: showCommentForm }
  );
  
  // Generate fingerprint on mount
  useEffect(() => {
    setFingerprint(generateFingerprint());
  }, []);
  
  // Check if already liked (from localStorage)
  useEffect(() => {
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
    if (likedPosts[postId]) {
      setHasLiked(true);
    }
  }, [postId]);
  
  // Update comments when data loads
  useEffect(() => {
    if (commentsData) {
      setComments(commentsData);
    }
  }, [commentsData]);
  
  const handleLike = async () => {
    if (isLiking || !fingerprint) return;
    
    setIsLiking(true);
    try {
      const result = await toggleLikeMutation.mutateAsync({
        postId,
        fingerprint,
      });
      
      setLikeCount(result.like_count);
      setHasLiked(result.action === 'liked');
      
      // Store in localStorage
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
      if (result.action === 'liked') {
        likedPosts[postId] = true;
      } else {
        delete likedPosts[postId];
      }
      localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
      
    } catch (error) {
      console.error('Like error:', error);
      setFeedbackMessage({ type: 'error', text: 'Could not save your like' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } finally {
      setIsLiking(false);
    }
  };
  
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authorName.trim() || !commentContent.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Please fill in your name and comment' });
      setTimeout(() => setFeedbackMessage(null), 3000);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addCommentMutation.mutateAsync({
        postId,
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim() || undefined,
        content: commentContent.trim(),
      });
      
      setHasSubmitted(true);
      setCommentContent('');
      refetchComments();
      
    } catch (error) {
      console.error('Comment error:', error);
      setFeedbackMessage({ type: 'error', text: 'Could not submit comment' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };
  
  return (
    <div className="border-t border-slate-200 mt-16 pt-12">
      {/* Feedback Message */}
      {feedbackMessage && (
        <div className={`
          max-w-md mx-auto mb-6 p-4 rounded-lg flex items-center gap-3
          ${feedbackMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}
        `}>
          {feedbackMessage.type === 'error' ? (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}
      
      {/* Like and Comment Buttons */}
      <div className="flex items-center justify-center gap-6 mb-8">
        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`
            group flex items-center gap-2 px-6 py-3 rounded-full
            transition-all duration-200 
            ${hasLiked 
              ? 'bg-red-50 text-red-600 border-2 border-red-200' 
              : 'bg-slate-50 text-slate-600 border-2 border-slate-200 hover:border-red-300 hover:bg-red-50 hover:text-red-500'
            }
          `}
        >
          <Heart 
            className={`h-5 w-5 transition-transform group-hover:scale-110 ${hasLiked ? 'fill-current' : ''}`} 
          />
          <span className="font-medium">
            {hasLiked ? 'Liked' : 'Like'} 
            {likeCount > 0 && ` (${likeCount})`}
          </span>
        </button>
        
        {/* Comment Button */}
        <button
          onClick={() => setShowCommentForm(!showCommentForm)}
          className={`
            group flex items-center gap-2 px-6 py-3 rounded-full
            transition-all duration-200
            ${showCommentForm
              ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
              : 'bg-slate-50 text-slate-600 border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-500'
            }
          `}
        >
          <MessageCircle className="h-5 w-5 transition-transform group-hover:scale-110" />
          <span className="font-medium">
            {showCommentForm ? 'Hide Comments' : 'Leave a Comment'}
          </span>
        </button>
      </div>
      
      {/* Comment Section */}
      {showCommentForm && (
        <div className="max-w-2xl mx-auto">
          {/* Comment Form */}
          {!hasSubmitted ? (
            <form onSubmit={handleSubmitComment} className="bg-slate-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                💬 Leave a Comment or Question
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Your Name *
                  </label>
                  <Input
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="John Smith"
                    required
                    className="bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email (optional)
                  </label>
                  <Input
                    type="email"
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="bg-white"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    We'll notify you of replies
                  </p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Your Comment or Question *
                </label>
                <Textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Share your thoughts, ask a question, or add your experience..."
                  rows={4}
                  required
                  className="bg-white resize-none"
                />
              </div>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Comment
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Thanks for your comment!
              </h3>
              <p className="text-green-700">
                Your comment has been submitted and will appear below.
              </p>
              <Button
                variant="outline"
                onClick={() => setHasSubmitted(false)}
                className="mt-4"
              >
                Add Another Comment
              </Button>
            </div>
          )}
          
          {/* Existing Comments */}
          {comments.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">
                Comments ({comments.length})
              </h3>
              
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className={`
                    p-4 rounded-lg
                    ${comment.is_featured 
                      ? 'bg-amber-50 border-2 border-amber-200' 
                      : 'bg-white border border-slate-200'
                    }
                  `}
                >
                  {comment.is_featured && (
                    <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded mb-2">
                      ⭐ Featured
                    </span>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {comment.author_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-800">
                          {comment.author_name}
                        </span>
                        <span className="text-sm text-slate-500">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-slate-700 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {comments.length === 0 && !isLoadingComments && (
            <p className="text-center text-slate-500 py-8">
              Be the first to leave a comment!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default BlogEngagement;

