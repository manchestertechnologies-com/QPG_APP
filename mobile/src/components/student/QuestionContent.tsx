import React from 'react';
import { KaTeXRenderer } from '../KaTeXRenderer';
import { ExamQuestion } from '../../services/classroomApi';

/** Renders the stem of any QPG question type (MCQ, assertion-reason, statements, match, diagram). */
export const QuestionStem: React.FC<{ q: Partial<ExamQuestion> }> = ({ q }) => (
  <div className="space-y-3 text-sm leading-relaxed text-ink">
    {q.question && <KaTeXRenderer content={q.question} />}

    {q.assertion && (
      <div className="space-y-1.5 rounded-xl border border-line bg-ink/[0.025] p-3 text-[13px]">
        <div>
          <strong className="text-gold">Assertion (A): </strong>
          <KaTeXRenderer content={q.assertion} className="inline" />
        </div>
        {q.reason && (
          <div>
            <strong className="text-gold">Reason (R): </strong>
            <KaTeXRenderer content={q.reason} className="inline" />
          </div>
        )}
      </div>
    )}

    {(q.statement_1 || q.statement_2) && (
      <div className="space-y-1.5 rounded-xl border border-line bg-ink/[0.025] p-3 text-[13px]">
        {q.statement_1 && (
          <div>
            <strong className="text-gold">Statement I: </strong>
            <KaTeXRenderer content={q.statement_1} className="inline" />
          </div>
        )}
        {q.statement_2 && (
          <div>
            <strong className="text-gold">Statement II: </strong>
            <KaTeXRenderer content={q.statement_2} className="inline" />
          </div>
        )}
      </div>
    )}

    {q.match_table && q.match_table.length > 0 && (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th className="border border-line px-3 py-1.5">List I</th>
              <th className="border border-line px-3 py-1.5">List II</th>
            </tr>
          </thead>
          <tbody>
            {q.match_table.map((row, i) => (
              <tr key={i}>
                <td className="border border-line px-3 py-1.5">
                  <KaTeXRenderer content={row.col1} className="inline" />
                </td>
                <td className="border border-line px-3 py-1.5">
                  <KaTeXRenderer content={row.col2} className="inline" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {!q.match_table && (q.column_a || q.column_b) && (
      <div className="grid grid-cols-2 gap-3 text-[13px]">
        {q.column_a && <KaTeXRenderer content={q.column_a} />}
        {q.column_b && <KaTeXRenderer content={q.column_b} />}
      </div>
    )}

    {q.diagram_svg && (
      // Diagrams are SVG authored in the teacher's own paper (same rendering as the paper workbench).
      <div className="flex justify-center rounded-xl bg-white p-3 [&_svg]:max-h-56 [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: q.diagram_svg }} />
    )}
  </div>
);

export const OPTION_KEYS = [
  { letter: 'A', field: 'opt_a' },
  { letter: 'B', field: 'opt_b' },
  { letter: 'C', field: 'opt_c' },
  { letter: 'D', field: 'opt_d' },
] as const;
