import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Parse markdown lines into formatted React elements
  const lines = content.split('\n');

  const parseInline = (text: string): React.ReactNode => {
    // Regex for inline code, bold, italic, and normal text
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Inline code: `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 rounded bg-earth-200/70 dark:bg-forest-700 text-xs font-mono text-emerald-800 dark:text-emerald-300"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Bold: **text**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic: *text* or _text_
      const italicMatch = remaining.match(/^(\*|_)([^*_]+)\1/);
      if (italicMatch) {
        parts.push(<em key={key++} className="italic text-earth-700 dark:text-sage-300">{italicMatch[2]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Regular character
      const nextSpecial = remaining.search(/[`*_]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  const renderedElements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      renderedElements.push(
        <ul key={`ul-${renderedElements.length}`} className="my-2 space-y-1 list-disc list-inside text-sm">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushCodeBlock = () => {
    if (inCodeBlock) {
      renderedElements.push(
        <pre
          key={`code-${renderedElements.length}`}
          className="my-2 p-3 rounded-xl bg-forest-950 text-sage-100 font-mono text-xs overflow-x-auto border border-forest-800"
        >
          <code>{codeBlockLines.join('\n')}</code>
        </pre>
      );
      codeBlockLines = [];
      inCodeBlock = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced Code Block: ```
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Unordered List Items: - or *
    const listMatch = line.match(/^(\s*)[-*•]\s+(.*)$/);
    if (listMatch) {
      inList = true;
      listItems.push(
        <li key={`li-${i}`} className="leading-relaxed">
          {parseInline(listMatch[2])}
        </li>
      );
      continue;
    } else {
      flushList();
    }

    // Headings
    if (line.startsWith('### ')) {
      renderedElements.push(
        <h3 key={i} className="text-sm font-bold text-forest-900 dark:text-sage-100 mt-2 mb-1">
          {parseInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith('## ')) {
      renderedElements.push(
        <h2 key={i} className="text-base font-bold text-forest-900 dark:text-sage-100 mt-3 mb-1.5">
          {parseInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      renderedElements.push(
        <h1 key={i} className="text-lg font-bold text-forest-950 dark:text-sage-50 mt-3 mb-2">
          {parseInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith('> ')) {
      // Blockquote
      renderedElements.push(
        <blockquote
          key={i}
          className="my-2 pl-3 py-1 border-l-4 border-sage-500 bg-sage-50/60 dark:bg-forest-800/60 rounded-r-lg text-xs italic text-forest-800 dark:text-sage-200"
        >
          {parseInline(line.slice(2))}
        </blockquote>
      );
    } else if (!line.trim()) {
      // Empty line -> spacing
      renderedElements.push(<div key={i} className="h-2" />);
    } else {
      // Standard paragraph line
      renderedElements.push(
        <p key={i} className="leading-relaxed my-0.5">
          {parseInline(line)}
        </p>
      );
    }
  }

  flushList();
  flushCodeBlock();

  return <div className={`space-y-0.5 ${className}`}>{renderedElements}</div>;
};
