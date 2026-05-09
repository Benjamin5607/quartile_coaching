import { db } from '../db/dexie';
import type { Task } from '../db/dexie';

export async function recalculateSLA() {
  const now = Date.now();
  await db.tasks
    .where('status').equals('pending')
    .and((t: Task) => t.slaDeadline <= now)
    .modify({ status: 'sla_failed' });
}

export function startSLAEngine() {
  recalculateSLA();
  const interval = setInterval(recalculateSLA, 60000);
  return () => clearInterval(interval);
}