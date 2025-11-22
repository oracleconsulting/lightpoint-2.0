'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  FileUp, 
  AlertTriangle, 
  FileText, 
  BookOpen, 
  Settings,
  Home,
  DollarSign,
  Users,
  TrendingUp,
  X
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
  keywords?: string[];
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const commands: CommandItem[] = [
    // Quick Actions
    { id: 'upload', label: 'Upload Document', icon: FileUp, action: () => router.push('/complaints/new'), category: 'Actions', keywords: ['upload', 'document', 'file', 'add'] },
    { id: 'new-complaint', label: 'New Complaint', icon: AlertTriangle, action: () => router.push('/complaints/new'), category: 'Actions', keywords: ['create', 'new', 'complaint', 'start'] },
    { id: 'generate-letter', label: 'Generate Letter', icon: FileText, action: () => router.push('/letters'), category: 'Actions', keywords: ['letter', 'generate', 'draft', 'write'] },
    { id: 'find-precedent', label: 'Find Precedent', icon: BookOpen, action: () => router.push('/knowledge-base'), category: 'Actions', keywords: ['precedent', 'case', 'search', 'find'] },
    
    // Navigation
    { id: 'dashboard', label: 'Dashboard', icon: Home, action: () => router.push('/dashboard'), category: 'Navigate', keywords: ['home', 'dashboard', 'overview'] },
    { id: 'pricing', label: 'Pricing', icon: DollarSign, action: () => router.push('/pricing'), category: 'Navigate', keywords: ['pricing', 'plans', 'subscription'] },
    { id: 'settings', label: 'Settings', icon: Settings, action: () => router.push('/settings'), category: 'Navigate', keywords: ['settings', 'preferences', 'config'] },
    { id: 'team', label: 'Team Management', icon: Users, action: () => router.push('/team'), category: 'Navigate', keywords: ['team', 'users', 'members'] },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, action: () => router.push('/analytics'), category: 'Navigate', keywords: ['analytics', 'stats', 'reports'] },
  ];

  const filteredCommands = commands.filter(cmd => {
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.category.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some(k => k.includes(searchLower))
    );
  });

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const executeCommand = (cmd: CommandItem) => {
    cmd.action();
    setIsOpen(false);
    setSearch('');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Command Palette */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
        <div className="w-full max-w-2xl bg-white rounded-card shadow-2xl border border-gray-200 overflow-hidden animate-scale-in">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commands..."
              className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-base"
              autoFocus
            />
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto p-2">
            {Object.keys(groupedCommands).length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                No commands found
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category} className="mb-4 last:mb-0">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {category}
                  </div>
                  {cmds.map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => executeCommand(cmd)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-brand-primary/5 transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-brand-primary/10 transition-colors">
                          <Icon className="h-4 w-4 text-gray-600 group-hover:text-brand-primary transition-colors" />
                        </div>
                        <span className="flex-1 text-left text-sm font-medium text-gray-900 group-hover:text-brand-primary transition-colors">
                          {cmd.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">↑</kbd>
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">↵</kbd>
                select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">esc</kbd>
                close
              </span>
            </div>
            <div className="text-brand-blurple font-medium">
              ⌘K
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

