'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, Printer } from 'lucide-react';

interface LetterPreviewProps {
  letter: string;
  onDownload?: () => void;
}

// Convert markdown-style formatting to HTML
function formatLetter(text: string): string {
  return text
    // Bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text_ (but not part of **__)
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>')
    // Convert line breaks
    .replace(/\n/g, '<br/>');
}

export function LetterPreview({ letter, onDownload }: LetterPreviewProps) {
  const handleCopy = () => {
    // Copy plain text (with markdown)
    navigator.clipboard.writeText(letter);
    alert('Letter copied to clipboard!');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formattedLetter = formatLetter(letter);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Complaint Letter</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 2.5cm; }
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.6;
              color: #000;
              max-width: 210mm;
              margin: 0 auto;
              padding: 2.5cm;
              background: white;
            }
            strong {
              font-weight: bold;
            }
            em {
              font-style: italic;
            }
            p {
              margin: 0 0 1em 0;
            }
          </style>
        </head>
        <body>
          <div>${formattedLetter}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownload = () => {
    // Download as formatted HTML
    const formattedLetter = formatLetter(letter);
    const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Complaint Letter</title>
    <style>
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 12pt;
        line-height: 1.6;
        color: #000;
        max-width: 210mm;
        margin: 0 auto;
        padding: 2.5cm;
      }
      strong { font-weight: bold; }
      em { font-style: italic; }
      p { margin: 0 0 1em 0; }
      @media print {
        body { margin: 0; }
        @page { margin: 2.5cm; }
      }
    </style>
  </head>
  <body>
    <div>${formattedLetter}</div>
  </body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complaint-letter-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Generated Letter</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Text
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download HTML
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-white border rounded-lg p-8 shadow-sm">
          <div 
            className="prose prose-sm max-w-none"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: '11pt',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
            }}
            dangerouslySetInnerHTML={{ __html: formatLetter(letter) }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

