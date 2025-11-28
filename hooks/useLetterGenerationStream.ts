/**
 * Hook for streaming letter generation with progress updates
 * 
 * Usage:
 * const { generateLetter, progress, letter, error, isGenerating } = useLetterGenerationStream();
 * 
 * await generateLetter({
 *   complaintAnalysis,
 *   clientReference,
 *   hmrcDepartment,
 *   ...
 * });
 */

import { useState, useCallback, useRef } from 'react';

interface ProgressUpdate {
  stage: string;
  percent: number;
  message: string;
}

interface GenerateLetterParams {
  complaintAnalysis: any;
  clientReference: string;
  hmrcDepartment: string;
  practiceLetterhead?: string;
  chargeOutRate?: number;
  userName?: string;
  userTitle?: string;
  userEmail?: string | null;
  userPhone?: string | null;
  additionalContext?: string;
}

interface UseLetterGenerationStreamResult {
  generateLetter: (params: GenerateLetterParams) => Promise<string | null>;
  progress: ProgressUpdate | null;
  letter: string | null;
  error: string | null;
  isGenerating: boolean;
  cancel: () => void;
}

export function useLetterGenerationStream(): UseLetterGenerationStreamResult {
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [letter, setLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      setError('Generation cancelled');
    }
  }, []);
  
  const generateLetter = useCallback(async (params: GenerateLetterParams): Promise<string | null> => {
    // Reset state
    setProgress(null);
    setLetter(null);
    setError(null);
    setIsGenerating(true);
    
    // Create abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch('/api/complaints/generate-letter-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (!response.body) {
        throw new Error('No response body');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let generatedLetter: string | null = null;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Parse SSE events
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // Keep incomplete event in buffer
        
        for (const event of events) {
          if (!event.trim()) continue;
          
          const lines = event.split('\n');
          let eventType = '';
          let eventData = '';
          
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7);
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6);
            }
          }
          
          if (!eventType || !eventData) continue;
          
          try {
            const data = JSON.parse(eventData);
            
            switch (eventType) {
              case 'progress':
                setProgress(data);
                break;
              case 'complete':
                generatedLetter = data.letter;
                setLetter(data.letter);
                break;
              case 'error':
                setError(data.message);
                break;
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', e);
          }
        }
      }
      
      setIsGenerating(false);
      return generatedLetter;
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Generation cancelled');
      } else {
        setError(err.message || 'Failed to generate letter');
      }
      setIsGenerating(false);
      return null;
    }
  }, []);
  
  return {
    generateLetter,
    progress,
    letter,
    error,
    isGenerating,
    cancel,
  };
}

/**
 * Progress display component helper
 */
export function getProgressStageLabel(stage: string): string {
  switch (stage) {
    case 'starting':
      return 'Starting...';
    case 'stage1':
      return 'Extracting facts from documents...';
    case 'stage2':
      return 'Structuring complaint letter...';
    case 'stage3':
      return 'Applying professional tone...';
    case 'overall':
      return 'Generating letter...';
    default:
      return 'Processing...';
  }
}

