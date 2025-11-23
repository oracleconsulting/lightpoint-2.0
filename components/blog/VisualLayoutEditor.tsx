'use client';

/**
 * Visual Layout Editor
 * Drag-and-drop UI to manually adjust placement of visual elements within content
 * Option C: Fine-tuning after intelligent auto-placement
 */

import React, { useState } from 'react';
import { GripVertical, MoveUp, MoveDown, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LayoutSection {
  type: string;
  content: any;
  style?: any;
}

interface ContentBlock {
  type: 'text' | 'visual';
  content: any;
  id: string;
  visualIndex?: number; // Original index in visual array
  paragraphIndex?: number; // Original index in paragraph array
}

interface VisualLayoutEditorProps {
  textParagraphs: string[];
  visualElements: LayoutSection[];
  initialPlacements?: { [visualIndex: number]: number };
  onSave: (placements: { [visualIndex: number]: number }) => void;
}

export function VisualLayoutEditor({
  textParagraphs,
  visualElements,
  initialPlacements = {},
  onSave,
}: VisualLayoutEditorProps) {
  const [placements, setPlacements] = useState<{ [visualIndex: number]: number }>(initialPlacements);
  const [previewMode, setPreviewMode] = useState(false);

  // Get visual element title for display
  const getVisualTitle = (visual: LayoutSection): string => {
    switch (visual.type) {
      case 'hero':
        return `Hero: ${visual.content?.title || 'Untitled'}`;
      case 'stats_grid':
        return `Stats Grid (${visual.content?.stats?.length || 0} stats)`;
      case 'chart':
        return `Chart: ${visual.content?.type || 'Unknown'} - ${visual.content?.title || 'Untitled'}`;
      case 'callout':
        return `Callout: ${visual.content?.title || visual.content?.text?.substring(0, 30) || 'Untitled'}`;
      case 'timeline':
        return `Timeline (${visual.content?.events?.length || 0} events)`;
      case 'numbered_steps':
        return `Steps (${visual.content?.steps?.length || 0} items)`;
      default:
        return `${visual.type}`;
    }
  };

  // Move visual to specific paragraph position
  const moveTo = (visualIndex: number, paragraphIndex: number) => {
    setPlacements(prev => ({
      ...prev,
      [visualIndex]: paragraphIndex,
    }));
  };

  // Remove placement (goes back to auto-placement)
  const removePlacement = (visualIndex: number) => {
    setPlacements(prev => {
      const newPlacements = { ...prev };
      delete newPlacements[visualIndex];
      return newPlacements;
    });
  };

  // Get all placements as sorted list
  const getPlacementsList = () => {
    const list: Array<{ visualIndex: number; paragraphIndex: number }> = [];
    Object.entries(placements).forEach(([vIdx, pIdx]) => {
      list.push({
        visualIndex: parseInt(vIdx),
        paragraphIndex: Number(pIdx),
      });
    });
    return list.sort((a, b) => a.paragraphIndex - b.paragraphIndex);
  };

  const handleSave = () => {
    onSave(placements);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Visual Layout Editor</h3>
          <p className="text-sm text-gray-600">Drag and drop visual elements to position them within your content</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit Mode' : 'Preview'}
          </Button>
          <Button onClick={handleSave}>
            Save Layout
          </Button>
        </div>
      </div>

      {previewMode ? (
        /* Preview Mode - Show how it will look */
        <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200">
          <div className="prose prose-lg max-w-none">
            {textParagraphs.map((paragraph, pIdx) => (
              <div key={`preview-${pIdx}`}>
                <p className="text-gray-700">{paragraph}</p>
                
                {/* Show visuals placed after this paragraph */}
                {getPlacementsList()
                  .filter(p => p.paragraphIndex === pIdx)
                  .map(p => (
                    <div key={`preview-visual-${p.visualIndex}`} className="my-8 p-6 bg-blue-50 border-2 border-blue-300 rounded-lg">
                      <div className="text-sm font-semibold text-blue-900 mb-2">
                        {getVisualTitle(visualElements[p.visualIndex])}
                      </div>
                      <div className="text-xs text-blue-700">
                        Visual content will render here
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Edit Mode - Drag and drop interface */
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Text Paragraphs */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Text Paragraphs</h4>
            <div className="space-y-3">
              {textParagraphs.map((paragraph, pIdx) => (
                <Card key={`para-${pIdx}`} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                      {pIdx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {paragraph}
                      </p>
                      
                      {/* Show visuals placed after this paragraph */}
                      {getPlacementsList()
                        .filter(p => p.paragraphIndex === pIdx)
                        .map(p => (
                          <div
                            key={`placed-${p.visualIndex}`}
                            className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <GripVertical className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <span className="text-sm font-medium text-blue-900 truncate">
                                {getVisualTitle(visualElements[p.visualIndex])}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePlacement(p.visualIndex)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Right: Visual Elements */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Visual Elements</h4>
            <div className="space-y-3">
              {visualElements.map((visual, vIdx) => {
                const currentPlacement = placements[vIdx];
                const isPlaced = currentPlacement !== undefined;

                return (
                  <Card key={`visual-${vIdx}`} className={`p-4 ${isPlaced ? 'bg-blue-50 border-blue-200' : ''}`}>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{getVisualTitle(visual)}</p>
                          {isPlaced && (
                            <p className="text-sm text-blue-600">
                              Placed after paragraph {currentPlacement + 1}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Placement Controls */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-700">Place after paragraph:</label>
                        <select
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          value={currentPlacement !== undefined ? currentPlacement : ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              moveTo(vIdx, parseInt(e.target.value));
                            } else {
                              removePlacement(vIdx);
                            }
                          }}
                        >
                          <option value="">Auto-placement</option>
                          {textParagraphs.map((_, pIdx) => (
                            <option key={pIdx} value={pIdx}>
                              Paragraph {pIdx + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {Object.keys(placements).length} manual placements
            </p>
            <p className="text-xs text-gray-600">
              {visualElements.length - Object.keys(placements).length} elements using auto-placement
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPlacements({})}>
            Reset All
          </Button>
        </div>
      </Card>
    </div>
  );
}

