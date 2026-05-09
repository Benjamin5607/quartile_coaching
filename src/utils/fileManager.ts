import { db, Task, Quota } from '../db/dexie';
import { cleanValue } from './transformer';

// ✅ 내보내기
export async function exportSaveFile() {
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

// ✅ 가져오기 (기존 pending 유지 + 병합)
export async function importSaveFile(file: File) {
  const text = await file.text();
  const data = JSON.parse(text);
  if (data.version !== '1.0') throw new Error('지원하지 않는 파일 버전입니다.');

  const cleanQuotas: Quota[] = data.quotas.map((q: Quota) => ({
    ...q,
    emails: q.emails.map(e => cleanValue(e).toLowerCase()).filter(Boolean)
  }));

  const importedTasks: Task[] = data.tasks.map((t: Task) => ({
    ...t,
    email: cleanValue(t.email).toLowerCase(),
    rawData: Object.fromEntries(
      Object.entries(t.rawData).map(([k, v]) => [k, cleanValue(v)])
    ),
    synced: false,
    slaDeadline: t.createdAt + (cleanQuotas.find(q => q.id === t.quotaId)?.slaHours || 24) * 3600 * 1000
  }));

  // 🔄 병합: 기존 pending 태스크는 유지, 나머지는 업데이트/추가
  const existing = await db.tasks.toArray();
  const existingMap = new Map(existing.map(t => [t.id, t]));

  const merged = importedTasks.map(imp => {
    const loc = existingMap.get(imp.id);
    if (loc && loc.status === 'pending') return loc; // 기존 pending 유지
    return imp;
  });

  // 가져오기 파일에 없지만 로컬에 있던 태스크 복원
  existing.forEach(loc => {
    if (!importedTasks.some(imp => imp.id === loc.id)) merged.push(loc);
  });

  await db.transaction('rw', db.quotas, db.tasks, async () => {
    await db.quotas.clear();
    await db.quotas.bulkPut(cleanQuotas);
    await db.tasks.clear();
    await db.tasks.bulkPut(merged);
  });

  window.dispatchEvent(new CustomEvent('data-restored'));
}
