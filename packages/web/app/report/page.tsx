'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { generatePartnerReport } from '@/lib/apiClient';
import {
  ConsolePanel,
  ConsoleHeading,
  ConsoleButton,
} from '@/components/console';

// =============================================================================
// Markdown Renderer Component
// =============================================================================

interface MarkdownRendererProps {
  content: string;
}

function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Simple markdown to HTML conversion for display
  const renderMarkdown = (md: string) => {
    // Split by lines and process
    const lines = md.split('\n');
    const elements: JSX.Element[] = [];
    let inCodeBlock = false;
    let codeContent: string[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let listItems: string[] = [];
    let inBlockquote = false;
    let blockquoteContent: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-3 text-green-500/90">
            {listItems.map((item, i) => (
              <li key={i} className="font-mono text-sm">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        const headerRow = tableRows[0];
        const dataRows = tableRows.slice(2); // Skip header and separator
        elements.push(
          <div key={`table-${elements.length}`} className="my-4 overflow-x-auto">
            <table className="w-full border-collapse border border-green-500/30">
              <thead>
                <tr className="bg-green-500/10">
                  {headerRow.map((cell, i) => (
                    <th key={i} className="border border-green-500/30 px-3 py-2 text-left font-mono text-xs text-green-400">
                      {cell.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="border border-green-500/30 px-3 py-2 font-mono text-xs text-green-500/80">
                        {cell.trim()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    const flushBlockquote = () => {
      if (blockquoteContent.length > 0) {
        elements.push(
          <blockquote key={`quote-${elements.length}`} className="border-l-4 border-cyan-500/50 bg-cyan-500/5 pl-4 py-3 my-4">
            {blockquoteContent.map((line, i) => (
              <p key={i} className="font-mono text-sm text-cyan-400">{line}</p>
            ))}
          </blockquote>
        );
        blockquoteContent = [];
        inBlockquote = false;
      }
    };

    lines.forEach((line, idx) => {
      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${idx}`} className="bg-black border border-green-500/30 p-3 my-3 overflow-x-auto">
              <code className="font-mono text-xs text-green-400">{codeContent.join('\n')}</code>
            </pre>
          );
          codeContent = [];
          inCodeBlock = false;
        } else {
          flushList();
          flushTable();
          flushBlockquote();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return;
      }

      // Handle blockquotes
      if (line.startsWith('>')) {
        if (!inBlockquote) {
          flushList();
          flushTable();
          inBlockquote = true;
        }
        blockquoteContent.push(line.replace(/^>\s*/, ''));
        return;
      } else if (inBlockquote && line.trim() === '') {
        // Continue blockquote through empty lines
        return;
      } else if (inBlockquote) {
        flushBlockquote();
      }

      // Handle tables
      if (line.includes('|') && line.trim().startsWith('|')) {
        if (!inTable) {
          flushList();
          flushBlockquote();
          inTable = true;
        }
        const cells = line.split('|').filter(cell => cell.trim() !== '');
        tableRows.push(cells);
        return;
      } else if (inTable) {
        flushTable();
      }

      // Handle headers
      if (line.startsWith('# ')) {
        flushList();
        flushBlockquote();
        elements.push(
          <h1 key={`h1-${idx}`} className="text-green-400 font-mono text-2xl font-bold mt-8 mb-4 pb-2 border-b border-green-500/30">
            {line.replace(/^#\s+/, '')}
          </h1>
        );
        return;
      }
      if (line.startsWith('## ')) {
        flushList();
        flushBlockquote();
        elements.push(
          <h2 key={`h2-${idx}`} className="text-green-400 font-mono text-xl font-bold mt-6 mb-3">
            {line.replace(/^##\s+/, '')}
          </h2>
        );
        return;
      }
      if (line.startsWith('### ')) {
        flushList();
        flushBlockquote();
        elements.push(
          <h3 key={`h3-${idx}`} className="text-green-400 font-mono text-lg font-semibold mt-4 mb-2">
            {line.replace(/^###\s+/, '')}
          </h3>
        );
        return;
      }

      // Handle list items
      if (line.match(/^[-*]\s+/)) {
        flushBlockquote();
        listItems.push(line.replace(/^[-*]\s+/, ''));
        return;
      } else {
        flushList();
      }

      // Handle horizontal rules
      if (line.match(/^---+$/)) {
        flushBlockquote();
        elements.push(
          <hr key={`hr-${idx}`} className="border-green-500/30 my-6" />
        );
        return;
      }

      // Handle empty lines
      if (line.trim() === '') {
        return;
      }

      // Regular paragraph
      elements.push(
        <p key={`p-${idx}`} className="font-mono text-sm text-green-500/90 my-2 leading-relaxed">
          {line}
        </p>
      );
    });

    // Flush remaining content
    flushList();
    flushTable();
    flushBlockquote();

    return elements;
  };

  return <div className="space-y-1">{renderMarkdown(content)}</div>;
}

// =============================================================================
// Main Report Page Component
// =============================================================================

export default function ReportPage() {
  const [report, setReport] = useState<string | null>(null);
  const [notionUrl, setNotionUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collectedData, setCollectedData] = useState<unknown>(null);
  const [copied, setCopied] = useState(false);

  // Load collected data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('ezreport_collected_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setCollectedData(parsed);
        // Auto-generate report when data is loaded
        handleGenerateReport(parsed);
      } catch (e) {
        console.error('Failed to parse saved data:', e);
        setError('Не удалось загрузить сохранённые данные. Вернитесь к сбору данных.');
      }
      } else {
        setError('Данные не найдены. Сначала выполните сбор данных.');
      }
  }, []);

  const handleGenerateReport = async (data?: unknown) => {
    const dataToUse = data || collectedData;
    if (!dataToUse) {
      setError('Нет данных для генерации отчёта');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setNotionUrl(null);

    try {
      const response = await generatePartnerReport(dataToUse);
      setReport(response.report);
      if (response.notionUrl) {
        setNotionUrl(response.notionUrl);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Report generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyReport = async () => {
    if (!report) return;
    
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-green-500 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/"
              className="text-green-500 font-mono text-sm hover:text-green-300 transition-colors"
            >
              [HOME]
            </Link>
            <span className="text-green-500/50">/</span>
            <Link
              href="/data"
              className="text-green-500 font-mono text-sm hover:text-green-300 transition-colors"
            >
              Data
            </Link>
            <span className="text-green-500/50">/</span>
            <Link
              href="/analyse"
              className="text-green-500 font-mono text-sm hover:text-green-300 transition-colors"
            >
              Analyse
            </Link>
            <span className="text-green-500/50">/</span>
            <span className="text-green-500 font-mono text-sm">Report</span>
          </div>
          <ConsoleHeading level={1} className="mb-2">
            [REPORT] Partner Sync Report
          </ConsoleHeading>
          <p className="text-green-500 font-mono text-sm opacity-80">
            Готовый отчёт для партнёров в формате Markdown
          </p>
        </div>

        {error && (
          <div className="mb-6 border border-red-500 bg-black p-4">
            <div className="text-red-500 font-mono text-sm">[ERROR] {error}</div>
            <Link
              href="/data"
              className="text-green-500 font-mono text-sm hover:text-green-300 transition-colors mt-2 inline-block"
            >
              → Вернуться к сбору данных
            </Link>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex items-center gap-4">
          <ConsoleButton
            onClick={() => handleGenerateReport()}
            disabled={isGenerating || !collectedData}
          >
            {isGenerating ? '[ GENERATING... ]' : '[REGENERATE REPORT]'}
          </ConsoleButton>
          
          {report && (
            <ConsoleButton onClick={handleCopyReport}>
              {copied ? '[ ✓ COPIED ]' : '[COPY MARKDOWN]'}
            </ConsoleButton>
          )}
        </div>

        {/* Notion Link */}
        {notionUrl && (
          <div className="mb-6 border border-cyan-500 bg-cyan-500/10 p-4">
            <div className="flex items-center gap-3">
              <span className="text-cyan-400 text-xl">📄</span>
              <div className="flex-1">
                <div className="text-cyan-400 font-mono text-sm font-bold mb-1">
                  [NOTION] Отчёт опубликован
                </div>
                <a
                  href={notionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-300 font-mono text-sm hover:text-cyan-100 hover:underline transition-colors break-all"
                >
                  {notionUrl}
                </a>
              </div>
              <a
                href={notionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-cyan-500 text-cyan-400 px-4 py-2 font-mono text-sm hover:bg-cyan-500/20 transition-colors"
              >
                [OPEN →]
              </a>
            </div>
          </div>
        )}

        {/* Report Display */}
        <ConsolePanel>
          <ConsoleHeading level={2} className="mb-4">
            [ 📄 PARTNER SYNC REPORT ]
          </ConsoleHeading>

          {isGenerating ? (
            <div className="py-8">
              <style jsx>{`
                @keyframes psychedelicText {
                  0% { color: #ff00ff; text-shadow: 0 0 10px #ff00ff; }
                  16% { color: #ff0080; text-shadow: 0 0 10px #ff0080; }
                  33% { color: #ff8000; text-shadow: 0 0 10px #ff8000; }
                  50% { color: #00ff00; text-shadow: 0 0 10px #00ff00; }
                  66% { color: #00ffff; text-shadow: 0 0 10px #00ffff; }
                  83% { color: #8000ff; text-shadow: 0 0 10px #8000ff; }
                  100% { color: #ff00ff; text-shadow: 0 0 10px #ff00ff; }
                }
              `}</style>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ 
                      animation: 'psychedelicText 0.5s infinite',
                      backgroundColor: 'currentColor'
                    }} 
                  />
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ 
                      animation: 'psychedelicText 0.5s infinite 0.1s',
                      backgroundColor: 'currentColor'
                    }} 
                  />
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ 
                      animation: 'psychedelicText 0.5s infinite 0.2s',
                      backgroundColor: 'currentColor'
                    }} 
                  />
                </div>
                <span 
                  className="font-mono text-sm font-bold"
                  style={{ animation: 'psychedelicText 0.8s infinite' }}
                >
                  Генерация отчёта с помощью AI...
                </span>
              </div>
            </div>
          ) : !report ? (
            <div className="text-green-500/50 font-mono text-sm py-8">
              [ Отчёт будет сгенерирован автоматически ]
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto pr-2">
              <MarkdownRenderer content={report} />
            </div>
          )}
        </ConsolePanel>

        {/* Raw Markdown Toggle */}
        {report && (
          <div className="mt-6">
            <details className="group">
              <summary className="text-green-500 font-mono text-sm cursor-pointer hover:text-green-300 transition-colors">
                [Toggle Raw Markdown]
              </summary>
              <div className="mt-4 border border-green-500/50 bg-black p-4 overflow-auto max-h-96">
                <pre className="font-mono text-xs text-green-500 whitespace-pre-wrap">
                  {report}
                </pre>
              </div>
            </details>
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block border border-green-500 text-green-500 px-6 py-3 font-mono hover:bg-green-500 hover:text-black transition-colors"
          >
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}
