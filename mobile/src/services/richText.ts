/**
 * Converts question-bank text into safe HTML:
 *  - plain text is HTML-escaped (so "a < b" or stray tags can never break the page),
 *  - line breaks are kept, **bold** becomes <strong>,
 *  - $...$, $$...$$, \(...\) and \[...\] are rendered with KaTeX one formula at a time,
 *  - bare LaTeX commands written outside $ (e.g. "\alpha", "x^{2}" after "\sqrt{}") are rendered inline,
 *  - {{IMG::https://...}} and {{IMG::data:image/...}} become images.
 * Never throws: anything KaTeX can't parse is shown as escaped source text.
 */
import katex from 'katex';
// Chemistry notation (\ce{...}, \pu{...}); registers itself on the katex instance.
import 'katex/dist/contrib/mhchem.js';

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

type Seg = { kind: 'text' | 'math' | 'img'; value: string; display?: boolean };

/** Same splitting rules as the server's quality gate; an unmatched "$" is kept as text. */
export function splitRich(s: string): Seg[] {
  const out: Seg[] = [];
  let i = 0;
  let text = '';
  const flush = () => {
    if (text) out.push({ kind: 'text', value: text });
    text = '';
  };
  while (i < s.length) {
    if (s.startsWith('{{IMG::', i)) {
      const end = s.indexOf('}}', i);
      if (end > 0) {
        flush();
        out.push({ kind: 'img', value: s.slice(i + 7, end).trim() });
        i = end + 2;
        continue;
      }
    }
    if (s[i] === '\\' && s[i + 1] === '$') {
      text += '$';
      i += 2;
      continue;
    }
    const opener = s.startsWith('$$', i) ? '$$' : s[i] === '$' ? '$' : s.startsWith('\\(', i) ? '\\(' : s.startsWith('\\[', i) ? '\\[' : '';
    if (opener) {
      const closer = opener === '\\(' ? '\\)' : opener === '\\[' ? '\\]' : opener;
      let j = i + opener.length;
      let found = -1;
      while (j < s.length) {
        if (s[j] === '\\' && s[j + 1] === '$') {
          j += 2;
          continue;
        }
        if (s.startsWith(closer, j)) {
          found = j;
          break;
        }
        j++;
      }
      if (found > i + opener.length - 1 && found >= 0) {
        flush();
        out.push({ kind: 'math', value: s.slice(i + opener.length, found), display: opener === '$$' || opener === '\\[' });
        i = found + closer.length;
        continue;
      }
    }
    text += s[i];
    i++;
  }
  flush();
  return out;
}

function renderMath(expr: string, display: boolean): string {
  const src = expr.trim();
  if (!src) return '';
  // Multi-line environments need display mode; everything else flows inline with the sentence.
  const block = display && /\\begin\{|\\\\/.test(src);
  try {
    const html = katex.renderToString(src, { displayMode: block, throwOnError: true, strict: 'ignore', trust: false });
    return block ? `<span class="math-block">${html}</span>` : `<span class="inline-math">${html}</span>`;
  } catch {
    return `<span class="math-error">${escapeHtml(display ? `$$${src}$$` : `$${src}$`)}</span>`;
  }
}

// \command, optional {args}, optional ^ / _ scripts, e.g. \frac{1}{2}, \alpha, \sqrt{x}^{2}
const BARE_LATEX = /\\[a-zA-Z]+(?:\s*\{[^{}]*\})*(?:\s*[\^_]\s*(?:\{[^{}]*\}|[A-Za-z0-9]))*/g;
const KNOWN_COMMAND = /^\\(frac|dfrac|tfrac|sqrt|int|oint|sum|prod|lim|vec|hat|bar|overline|times|div|pm|mp|cdot|circ|degree|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|varphi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Phi|Psi|Omega|infty|partial|nabla|le|leq|ge|geq|ne|neq|approx|equiv|propto|sim|rightarrow|leftarrow|Rightarrow|leftrightarrow|rightleftharpoons|to|uparrow|downarrow|log|ln|sin|cos|tan|cot|sec|csc|angle|perp|parallel|therefore|because|mathrm|text|mathbf|ce)$/;

function renderPlain(t: string): string {
  let html = '';
  let last = 0;
  for (const m of t.matchAll(BARE_LATEX)) {
    const cmd = m[0].match(/^\\[a-zA-Z]+/)![0];
    if (!KNOWN_COMMAND.test(cmd)) continue;
    html += formatText(t.slice(last, m.index));
    html += renderMath(m[0], false);
    last = (m.index || 0) + m[0].length;
  }
  html += formatText(t.slice(last));
  return html;
}

function formatText(t: string): string {
  if (!t) return '';
  return escapeHtml(t)
    .replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

function renderImage(url: string): string {
  const ok = /^https?:\/\/[^\s"'<>]+$/i.test(url) || /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=\s]+$/i.test(url);
  if (!ok) return '';
  return `<span class="q-img-wrap"><img src="${escapeHtml(url.replace(/\s+/g, ''))}" alt="Question diagram" class="q-img" loading="lazy" /></span>`;
}

export function renderRichText(content: unknown): string {
  if (content === null || content === undefined) return '';
  const s = String(content).replace(/\r\n?/g, '\n');
  if (!s.trim()) return '';
  return splitRich(s)
    .map((seg) => (seg.kind === 'img' ? renderImage(seg.value) : seg.kind === 'math' ? renderMath(seg.value, !!seg.display) : renderPlain(seg.value)))
    .join('');
}
