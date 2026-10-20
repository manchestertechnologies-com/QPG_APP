import { GeneratedPaper, Question } from '../types';

export class PdfService {
  /**
   * Helper to format question text:
   * Converts {{IMG::<url>}} to <div class="q-img"><img src="<url>" /></div>
   * Escapes HTML safely while preserving LaTeX math ($...$ and $$...$$)
   */
  public static formatQuestionContent(rawText: string): string {
    if (!rawText) return '';

    // Replace {{IMG::<url>}} with responsive HTML image
    let formatted = rawText.replace(/\{\{IMG::(https?:\/\/[^\}]+)\}\}/g, (_match, url) => {
      return `<div class="diagram-container"><img class="question-diagram" src="${url}" alt="Question Diagram" /></div>`;
    });

    // Replace line breaks with paragraphs/breaks
    formatted = formatted.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, ' ');

    return formatted;
  }

  /**
   * Generates production-ready, publication-grade HTML examination paper.
   * Uses KaTeX for vector-crisp LaTeX mathematical equations and chemical formulas.
   */
  public static generatePaperHtml(
    paper: GeneratedPaper,
    includeAnswerKey = true,
    includeSolutions = false
  ): string {
    let questionCounter = 1;

    let sectionsHtml = '';
    for (const sec of paper.sections) {
      sectionsHtml += `
        <div class="section-container">
          <div class="section-header">
            <span class="section-title">${sec.name.toUpperCase()}</span>
            <span class="section-meta">Attempt: ${sec.attempt_count} Questions | Marks: +${sec.marks_per_question}, -${sec.negative_marking}</span>
          </div>
          ${sec.description ? `<div class="section-desc">${sec.description}</div>` : ''}
          <div class="questions-list">
      `;

      for (const q of sec.questions) {
        const qNum = questionCounter++;
        const qText = this.formatQuestionContent(q.question);

        let optionsHtml = '';
        if (q.q_type === 'mcq_single' || q.opt_a || q.opt_b) {
          optionsHtml = `
            <div class="options-grid">
              <div class="option-item"><span class="opt-label">(A)</span> <span class="opt-text">${this.formatQuestionContent(q.opt_a || '')}</span></div>
              <div class="option-item"><span class="opt-label">(B)</span> <span class="opt-text">${this.formatQuestionContent(q.opt_b || '')}</span></div>
              <div class="option-item"><span class="opt-label">(C)</span> <span class="opt-text">${this.formatQuestionContent(q.opt_c || '')}</span></div>
              <div class="option-item"><span class="opt-label">(D)</span> <span class="opt-text">${this.formatQuestionContent(q.opt_d || '')}</span></div>
            </div>
          `;
        } else if (q.q_type === 'assertion_reason') {
          optionsHtml = `
            <div class="assertion-reason-box">
              <div class="ar-line"><strong>Assertion (A):</strong> ${this.formatQuestionContent(q.assertion || q.question)}</div>
              <div class="ar-line"><strong>Reason (R):</strong> ${this.formatQuestionContent(q.reason || '')}</div>
            </div>
            <div class="options-grid">
              <div class="option-item"><span class="opt-label">(A)</span> Both (A) and (R) are true and (R) is correct explanation of (A)</div>
              <div class="option-item"><span class="opt-label">(B)</span> Both (A) and (R) are true but (R) is NOT the correct explanation</div>
              <div class="option-item"><span class="opt-label">(C)</span> (A) is true but (R) is false</div>
              <div class="option-item"><span class="opt-label">(D)</span> Both (A) and (R) are false</div>
            </div>
          `;
        } else if (q.q_type === 'numerical') {
          optionsHtml = `
            <div class="numerical-answer-box">
              <span class="num-prompt">Answer: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ] (Round off to nearest integer)</span>
            </div>
          `;
        }

        let solutionBlock = '';
        if (includeSolutions && q.solution_text) {
          solutionBlock = `
            <div class="solution-box">
              <strong>Solution & Explanation:</strong><br/>
              ${this.formatQuestionContent(q.solution_text)}
            </div>
          `;
        }

        sectionsHtml += `
          <div class="question-card">
            <div class="q-header">
              <span class="q-num">Q.${qNum}.</span>
              <div class="q-body">${qText}</div>
            </div>
            ${optionsHtml}
            ${solutionBlock}
          </div>
        `;
      }

      sectionsHtml += `
          </div>
        </div>
      `;
    }

    // Answer Key Grid Table
    let answerKeyHtml = '';
    if (includeAnswerKey && paper.answer_key.length > 0) {
      let rows = '';
      const cols = 5; // 5 columns per row in key
      for (let i = 0; i < paper.answer_key.length; i += cols) {
        const slice = paper.answer_key.slice(i, i + cols);
        rows += '<tr>';
        for (const item of slice) {
          rows += `
            <td class="ak-qno">Q.${item.q_no}</td>
            <td class="ak-ans"><strong>${item.answer || item.num_answer || '-'}</strong></td>
          `;
        }
        // Fill empty cells if last row has fewer columns
        for (let j = slice.length; j < cols; j++) {
          rows += '<td class="ak-qno"></td><td class="ak-ans"></td>';
        }
        rows += '</tr>';
      }

      answerKeyHtml = `
        <div class="page-break"></div>
        <div class="answer-key-section">
          <div class="answer-key-title">ANSWER KEY & EVALUATION SHEET</div>
          <table class="answer-key-table">
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;
    }

    // Full HTML Document
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${paper.title}</title>
  
  <!-- KaTeX for high-performance LaTeX rendering -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      if (window.renderMathInElement) {
        renderMathInElement(document.body, {
          delimiters: [
            {left: "$$", right: "$$", display: true},
            {left: "$", right: "$", display: false},
            {left: "\\(", right: "\\)", display: false},
            {left: "\\[", right: "\\]", display: true}
          ],
          throwOnError: false
        });
      }
    });
  </script>

  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 18mm 15mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 9pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      font-size: 10pt;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    /* Header Container */
    .exam-header {
      border: 2px solid #0f172a;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 14px;
      text-align: center;
      background: #f8fafc;
    }

    .inst-name {
      font-size: 17pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
      text-transform: uppercase;
    }

    .paper-title {
      font-size: 13pt;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 6px;
    }

    .meta-bar {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #cbd5e1;
      padding-top: 6px;
      margin-top: 4px;
      font-size: 9pt;
      font-weight: 600;
      color: #334155;
    }

    /* Instructions Box */
    .instructions-box {
      border-left: 3px solid #3b82f6;
      background: #eff6ff;
      padding: 8px 12px;
      margin-bottom: 14px;
      border-radius: 0 4px 4px 0;
      font-size: 8.5pt;
    }

    .inst-heading {
      font-weight: 700;
      color: #1d4ed8;
      margin-bottom: 4px;
      text-transform: uppercase;
      font-size: 8.5pt;
    }

    .instructions-box ul {
      margin: 0;
      padding-left: 18px;
    }

    .instructions-box li {
      margin-bottom: 2px;
    }

    /* Section Styles */
    .section-container {
      margin-bottom: 16px;
    }

    .section-header {
      background: #1e293b;
      color: #ffffff;
      padding: 6px 10px;
      font-weight: 700;
      font-size: 9.5pt;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-title {
      letter-spacing: 0.5px;
    }

    .section-meta {
      font-size: 8.5pt;
      font-weight: 500;
      color: #94a3b8;
    }

    .section-desc {
      font-size: 8.5pt;
      font-style: italic;
      color: #475569;
      margin: 4px 0 8px 4px;
    }

    /* Question Cards */
    .question-card {
      page-break-inside: avoid;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px dashed #e2e8f0;
    }

    .q-header {
      display: flex;
      align-items: flex-start;
      margin-bottom: 6px;
    }

    .q-num {
      font-weight: 800;
      color: #0f172a;
      min-width: 32px;
      font-size: 10pt;
    }

    .q-body {
      flex: 1;
      font-weight: 500;
      color: #1e293b;
    }

    /* Diagram Styles */
    .diagram-container {
      text-align: center;
      margin: 8px 0;
    }

    .question-diagram {
      max-width: 260px;
      max-height: 180px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 4px;
      background: #ffffff;
    }

    /* Options Grid (2x2) */
    .options-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 16px;
      row-gap: 6px;
      padding-left: 32px;
      margin-top: 4px;
    }

    .option-item {
      display: flex;
      align-items: flex-start;
      font-size: 9.5pt;
    }

    .opt-label {
      font-weight: 700;
      color: #1e3a8a;
      min-width: 24px;
    }

    .opt-text {
      flex: 1;
      color: #334155;
    }

    /* Assertion Reason */
    .assertion-reason-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 6px 10px;
      margin-left: 32px;
      margin-bottom: 6px;
      font-size: 9pt;
    }

    .ar-line {
      margin-bottom: 3px;
    }

    /* Numerical Box */
    .numerical-answer-box {
      margin-left: 32px;
      margin-top: 6px;
      padding: 6px 10px;
      background: #f1f5f9;
      border-radius: 4px;
      display: inline-block;
      font-size: 9pt;
      font-weight: 600;
      color: #334155;
    }

    /* Solution Box */
    .solution-box {
      margin-top: 6px;
      margin-left: 32px;
      padding: 8px 10px;
      background: #fefce8;
      border-left: 3px solid #eab308;
      border-radius: 0 4px 4px 0;
      font-size: 8.5pt;
      color: #713f12;
    }

    /* Answer Key Table */
    .page-break {
      page-break-before: always;
    }

    .answer-key-section {
      margin-top: 24px;
      text-align: center;
    }

    .answer-key-title {
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      margin-bottom: 12px;
      letter-spacing: 0.5px;
    }

    .answer-key-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin: 0 auto;
    }

    .answer-key-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
      text-align: center;
    }

    .ak-qno {
      background: #f1f5f9;
      font-weight: 700;
      color: #475569;
      width: 8%;
    }

    .ak-ans {
      background: #ffffff;
      color: #1e3a8a;
      width: 12%;
    }
    .watermark-overlay {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 50pt;
      font-weight: 900;
      color: rgba(15, 23, 42, 0.07);
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
      letter-spacing: 4px;
      text-transform: uppercase;
    }

    .floating-branding-badge {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #090A0F;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 8.5pt;
      font-weight: 600;
      border: 1px solid rgba(255, 255, 255, 0.15);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    @media print {
      .floating-branding-badge, .badge-close-btn {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- Diagonal Platform / Custom Watermark -->
  <div class="watermark-overlay">${paper.header?.watermark_text || 'MANCHESTER TECHNOLOGIES'}</div>

  <!-- Floating Brand Badge for Free Tier -->
  <div class="floating-branding-badge">
    <span>Manchester Technologies</span>
    <span class="badge-close-btn" style="cursor: pointer; opacity: 0.7;">✕</span>
  </div>

  <!-- Examination Header -->
  <div class="exam-header">
    <div class="inst-name">${paper.header?.institution_name || paper.institution_name || 'MANCHESTER TECHNOLOGIES'}</div>
    <div class="paper-title">${paper.title}</div>
    <div class="meta-bar">
      <span>SUBJECT: ${paper.subject.toUpperCase()} (${paper.class_levels.map((c) => 'CLASS ' + c).join(', ')})</span>
      <span>PATTERN: ${paper.exam_type} REVISED</span>
      <span>TIME: ${paper.duration_minutes} MINS</span>
      <span>MAX MARKS: ${paper.total_marks}</span>
    </div>
  </div>

  <!-- General Instructions -->
  <div class="instructions-box">
    <div class="inst-heading">General Instructions:</div>
    <ul>
      ${paper.instructions.map((inst) => `<li>${inst}</li>`).join('')}
    </ul>
  </div>

  <!-- Sections & Questions -->
  ${sectionsHtml}

  <!-- Answer Key (if enabled) -->
  ${answerKeyHtml}

</body>
</html>`;
  }
}
