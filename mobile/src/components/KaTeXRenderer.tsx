import React, { useMemo } from 'react';
import katex from 'katex';

interface KaTeXRendererProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

export const KaTeXRenderer: React.FC<KaTeXRendererProps> = ({ content, className = '', style }) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    // 1. Process diagram tokens: {{IMG::<url>}}
    let text = content.replace(/\{\{IMG::(https?:\/\/[^\}]+)\}\}/g, (_match, url) => {
      return `<div class="my-2 text-center"><img src="${url}" alt="Question Diagram" class="inline-block max-h-44 max-w-full rounded border border-slate-200 bg-white p-1" /></div>`;
    });

    // 2. Render math: both $$...$$ and $...$ as inline math so formulas flow naturally in sentences without line breaks
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_match, math) => {
      try {
        return `<span class="inline-math">${katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
        })}</span>`;
      } catch (e) {
        return `$${math}$`;
      }
    });

    text = text.replace(/\$([^\$\n]+?)\$/g, (_match, math) => {
      try {
        return `<span class="inline-math">${katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
        })}</span>`;
      } catch (e) {
        return `$${math}$`;
      }
    });

    // 4. Render common standalone LaTeX formulas that might not have $ wrappers (e.g., \int, \frac, \sqrt, \alpha, \pm)
    // Only if text contains backslashed LaTeX commands
    if (text.includes('\\') && !text.includes('class="katex"')) {
      const latexCommands = /\\(frac|sqrt|int|sum|lim|vec|times|pm|alpha|beta|gamma|theta|lambda|pi|Delta|Omega)\b/;
      if (latexCommands.test(text)) {
        try {
          return katex.renderToString(text, { displayMode: false, throwOnError: false });
        } catch (e) {
          // fallback to text
        }
      }
    }

    return text;
  }, [content]);

  if (className.includes('inline')) {
    return (
      <span
        className={`katex-wrapper inline leading-relaxed ${className}`}
        style={style}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  }

  return (
    <div
      className={`katex-wrapper leading-relaxed ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
