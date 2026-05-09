import { Quota } from '../db/dexie';

export function cleanValue(val: unknown): string {
  if (val == null || val === '') return '';
  return String(val)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface CSVRow { [key: string]: string }

export function createTasksFromCSV(
  rows: CSVRow[],
  quotas: Quota[],
  selectedCols: string[],
  emailColName: string
) {
  const newTasks = [];
  const quotaMap = new Map<string, Quota>();
  quotas.forEach(q => q.emails.forEach(e => quotaMap.set(e.toLowerCase(), q)));

  for (const row of rows) {
    const email = cleanValue(row[emailColName]).toLowerCase();
    if (!email || !quotaMap.has(email)) continue;

    const quota = quotaMap.get(email)!;
    const cleanedRaw: Record<string, string> = {};

    selectedCols.forEach(col => {
      const v = cleanValue(row[col]);
      if (v) cleanedRaw[col] = v; // 빈 값은 털어내기
    });

    const now = Date.now();
    newTasks.push({
      id: crypto.randomUUID(),
      quotaId: quota.id,
      email,
      rawData: cleanedRaw,
      status: 'pending',
      createdAt: now,
      slaDeadline: now + quota.slaHours * 3600 * 1000
    });
  }
  return newTasks;
}
