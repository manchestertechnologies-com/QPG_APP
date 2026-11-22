import React, { useMemo } from 'react';
import { renderRichText } from '../services/richText';

interface KaTeXRendererProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

/** Safe rich-text renderer for question content (see services/richText.ts). */
export const KaTeXRenderer: React.FC<KaTeXRendererProps> = ({ content, className = '', style }) => {
  const renderedHtml = useMemo(() => renderRichText(content), [content]);

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
