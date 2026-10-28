import reports from '#lib/data/reports-4471.json';
import notes from '#lib/data/desk-notes.json';
import { groupByCause, uniqueById, type Report } from '#lib/kb/causes';
import { tenantOf } from '#lib/kb/locales';

export function summarizeSplit(rows: Report[], ticket: number) {
  const raw = rows.filter((r) => r.mergedInto === ticket);
  const unique = uniqueById(raw);
  const groups = groupByCause(unique, tenantOf);
  return {
    raw: raw.length,
    total: unique.length,
    duplicates: raw.length - unique.length,
    groups,
    tagErrors: groups.reduce((n, g) =>
      n + g.reports.filter((r) => g.cause !== 'unplaced' && r.meta.intakeTag !== g.cause).length, 0),
    deskNotes: unique.filter((r) => notes.oneDayMove.includes(r.id)),
  };
}

export const split = summarizeSplit(reports as Report[], 4471);
