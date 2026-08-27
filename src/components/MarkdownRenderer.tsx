'use client';

import React, { useState } from 'react';
import { Copy, Check, Download, Printer, FileText } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  title?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, title = 'informe-reunion' }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #1e1b4b; border-bottom: 2px solid #6366f1; padding-bottom: 8px; }
            h2 { color: #312e81; margin-top: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
            h3 { color: #4338ca; }
            code { background: #f3f4f6; padding: 2px 6px; borderRadius: 4px; font-family: monospace; }
            blockquote { border-left: 4px solid #6366f1; padding-left: 16px; color: #4b5563; }
            ul, ol { padding-left: 24px; }
            li { margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <div id="content"></div>
          <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
          <script>
            document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(content)});
            setTimeout(() => { window.print(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="w-full space-y-4">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <FileText className="w-4 h-4 text-brand-400" />
          <span>Informe Estructurado en Español</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-200 transition-all border border-white/5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-400" />
                <span>Copiar</span>
              </>
            )}
          </button>

          <button
            onClick={downloadMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-medium text-gray-200 transition-all border border-white/5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-brand-400" />
            <span>Descargar .md</span>
          </button>

          <button
            onClick={printReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600/30 hover:bg-brand-600/50 border border-brand-500/40 text-xs font-medium text-brand-200 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Exportar PDF / Imprimir</span>
          </button>
        </div>
      </div>

      {/* Rendered content */}
      <div className="prose prose-invert max-w-none text-gray-200 text-sm leading-relaxed space-y-4 font-sans whitespace-pre-wrap selection:bg-brand-500/30">
        {content}
      </div>
    </div>
  );
};
