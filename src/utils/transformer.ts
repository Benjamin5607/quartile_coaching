export function cleanValue(val: unknown): string {
  if (val == null || val === '') return '';
  return String(val)
    .replace(/[\r\n\t]+/g, ' ')      // 개행/탭 → 공백
    .replace(/\s+/g, ' ')            // 연속 공백 → 단일 공백
    .replace(/[^\p{L}\p{N}@\.\-_ ]/gu, '') // 특수문자/이모지 제거 (선택사항)
    .trim();
}

export function classifyTask(
  row: Record<string, string>,
  quotas: { id: string; emails: string[]; slaHours: number }[],
  selectedCols: string[]
) {
  const email = cleanValue(row.email).toLowerCase();
  if (!email) return null;

  const quota = quotas.find(q => q.emails.includes(email));
  if (!quota) return null;

  const cleanedRaw: Record<string, string> = {};
  selectedCols.forEach(col => {
    const v = cleanValue(row[col]);
    if (v) cleanedRaw[col] = v; // 빈 값은 아예 제외
  });

  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    quotaId: quota.id,
    email,
    rawData: cleanedRaw,
    status: 'pending',
    createdAt: now,
    slaDeadline: now + quota.slaHours * 3600 * 1000,
    synced: false
  };
}
