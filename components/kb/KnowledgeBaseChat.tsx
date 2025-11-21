'use client';

import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, User, ThumbsUp, ThumbsDown, Copy, Check, ExternalLink } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    title: string;
    category: string;
    excerpt: string;
    relevance: number;
  }>;
  created_at: string;
}

export default function KnowledgeBaseChat() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const startConversation = trpc.kbChat.startConversation.useMutation({
    onSuccess: (data) => {
      setConversationId(data.id);
      console.log('✅ New conversation started:', data.id);
    },
  });

  const sendMessage = trpc.kbChat.sendMessage.useMutation({
    onSuccess: (data) => {
      const assistantMsg: Message = {
        id: data.assistantMessage.id,
        role: 'assistant',
        content: data.assistantMessage.content,
        sources: data.sources,
        created_at: data.assistantMessage.created_at,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('❌ Chat error:', error);
      alert('Failed to get response. Please try again.');
      setIsLoading(false);
    },
  });

  useEffect(() => {
    // Start a new conversation on mount
    startConversation.mutate();
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !conversationId || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const conversationHistory = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    sendMessage.mutate({
      conversationId,
      message: input,
      conversationHistory,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestedQuestions = [
    "What are the HMRC complaint escalation procedures?",
    "How long should HMRC take to respond to a complaint?",
    "What is CHG Section 4.2.1 about?",
    "When should I escalate to the Adjudicator?",
    "What remedies can I request from HMRC?",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-5xl mx-auto">
      {/* Chat Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bot className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Knowledge Base Chat</h2>
            <p className="text-sm text-muted-foreground">
              Ask questions about HMRC complaints, procedures, and guidance
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          Powered by Claude Opus 4.1 • Searches CHG, CRG, and historical precedents
        </Badge>
      </div>

      {/* Messages Container */}
      <Card className="flex-1 mb-4 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Ask me anything about HMRC complaints, procedures, or guidance. 
                I have access to CHG, CRG, Charter standards, and historical precedents.
              </p>
              <div className="grid grid-cols-1 gap-2 max-w-2xl">
                <p className="text-xs font-medium text-muted-foreground mb-2">Suggested questions:</p>
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    onClick={() => setInput(question)}
                    className="text-left p-3 rounded-lg border border-blue-200 bg-blue-50/30 hover:bg-blue-50 transition-colors text-sm"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="p-2 bg-blue-100 rounded-lg h-fit">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                  
                  <div className={`flex flex-col max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    </div>

                    {/* Sources for assistant messages */}
                    {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                      <div className="mt-2 space-y-2 w-full">
                        <p className="text-xs font-medium text-muted-foreground">Sources:</p>
                        {message.sources.slice(0, 3).map((source) => (
                          <div key={`${source.title}-${source.relevance}`} className="text-xs p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-blue-900">{source.title}</span>
                              <Badge variant="outline" className="text-xs">{source.relevance}% relevant</Badge>
                            </div>
                            <p className="text-blue-700">{source.excerpt}</p>
                            <span className="text-blue-600">Category: {source.category}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    {message.role === 'assistant' && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="h-7 text-xs"
                        >
                          {copiedId === message.id ? (
                            <><Check className="h-3 w-3 mr-1" /> Copied</>
                          ) : (
                            <><Copy className="h-3 w-3 mr-1" /> Copy</>
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <ThumbsUp className="h-3 w-3 mr-1" /> Helpful
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <ThumbsDown className="h-3 w-3 mr-1" /> Not helpful
                        </Button>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="p-2 bg-blue-600 rounded-lg h-fit">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="p-2 bg-blue-100 rounded-lg h-fit">
                    <Bot className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Input Area */}
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about HMRC complaints..."
          className="resize-none"
          rows={3}
          disabled={isLoading || !conversationId}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading || !conversationId}
          className="px-6"
          size="lg"
        >
          {isLoading ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-2 text-center">
        Press Enter to send, Shift+Enter for new line • Responses based on your knowledge base
      </p>
    </div>
  );
}

