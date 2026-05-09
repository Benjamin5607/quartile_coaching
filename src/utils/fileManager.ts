import { db } from '../db/dexie';
import type { Task, Quota } from '../db/dexie';
import { cleanValue } from './transformer';

export async function exportData() {
  const quotas = await db.quotas.toArray();
  const tasks = await db.tasks.toArray();
  const payload = { version: '1.0', exportedAt: new Date().toISOString(), quotas, tasks };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sla-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importData(file: File, onRefresh: () => void) {
  const text = await file.text();
  const data = JSON.parse(text) as { version: string; quotas: Quota[]; tasks: Task[] };
  if (data.version !== '1.0') throw new Error('지원하지 않는 파일 버전입니다.');

  const cleanQuotas: Quota[] = data.quotas.map(q => ({
    ...q,
    emails: q.emails.map(e => cleanValue(e).toLowerCase()).filter(Boolean)
  }));

  const importedTasks: Task[] = data.tasks.map(t => ({
    ...t,
    email: cleanValue(t.email).toLowerCase(),
    rawData: Object.fromEntries(Object.entries(t.rawData).map(([k, v]) => [k, cleanValue(v)])),
    slaDeadline: t.createdAt + (cleanQuotas.find(q => q.id === t.quotaId)?.slaHours || 24) * 3600 * 1000
  }));

  const existing = await db.tasks.toArray();
  const existingMap = new Map<string, Task>(existing.map(t => [t.id, t]));

  const merged = importedTasks.map(imp => {
    const loc = existingMap.get(imp.id);
    return (loc && loc.status === 'pending') ? loc : imp;
  });

  existing.forEach(loc => {
    if (!importedTasks.some(imp => imp.id === loc.id)) merged.push(loc);
  });

  // Dexie transaction 타입 충돌 우회
  await (db as any).transaction('rw', db.quotas, db.tasks, async () => {
    await db.quotas.clear();
    await db.quotas.bulkPut(cleanQuotas);
    await db.tasks.clear();
    await db.tasks.bulkPut(merged);
  });

  onRefresh();
}