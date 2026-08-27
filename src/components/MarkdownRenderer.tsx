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

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const safeTitle = title || 'Informe de Reunión';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>${safeTitle}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { 
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #1e293b; 
              padding: 20px; 
              max-width: 800px; 
              margin: 0 auto; 
            }
            .header-banner {
              border-bottom: 3px solid #4f46e5;
              padding-bottom: 12px;
              margin-bottom: 24px;
            }
            h1 { color: #1e1b4b; font-size: 24px; font-weight: 800; margin: 0 0 8px 0; }
            .meta { color: #64748b; font-size: 13px; font-weight: 500; }
            h2 { color: #312e81; font-size: 18px; margin-top: 28px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
            h3 { color: #4338ca; font-size: 15px; margin-top: 18px; }
            p { margin-bottom: 12px; font-size: 14px; }
            ul, ol { padding-left: 20px; margin-bottom: 16px; font-size: 14px; }
            li { margin-bottom: 6px; }
            strong { color: #0f172a; }
            blockquote { border-left: 4px solid #6366f1; padding-left: 14px; color: #475569; background: #f8fafc; padding-top: 6px; padding-bottom: 6px; margin: 12px 0; }
            .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <h1>${safeTitle}</h1>
            <div class="meta">Meetlingua AI • Informe de Reunión en Español</div>
          </div>
          <div id="content"></div>
          <div class="footer">Generado por Meetlingua AI — Transcripción en Alemán y traducción al Español</div>
          <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
          <script>
            document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(content)});
            setTimeout(() => { 
              window.print(); 
            }, 600);
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
            <Download className="w-3.5 h-3.5 text-gray-400" />
            <span>Descargar .md</span>
          </button>

          <button
            onClick={downloadPDF}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition-all cursor-pointer shadow-md shadow-brand-500/20"
          >
            <Download className="w-3.5 h-3.5 text-brand-200" />
            <span>Descargar PDF</span>
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
