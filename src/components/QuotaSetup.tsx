import React, { useState, CSSProperties } from 'react';
import { db } from '../db/dexie';

export const QuotaSetup: React.FC = () => {
  const [name, setName] = useState('');
  const [emailsText, setEmailsText] = useState('');
  const [slaHours, setSlaHours] = useState(24);

  const handleAdd = async () => {
    if (!name.trim()) return;
    const emails = emailsText.split(/[\n,]+/).map((e: string) => e.trim().toLowerCase()).filter(Boolean);
    if (emails.length === 0) return;

    await db.quotas.add({
      id: crypto.randomUUID(),
      name: name.trim(),
      emails,
      slaHours: Number(slaHours) || 24
    });

    setName(''); setEmailsText(''); setSlaHours(24);
  };

  const styles: Record<string, CSSProperties> = {
    card: { background: '#f8f9fa', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid #e9ecef' },
    input: { width: '100%', padding: 8, margin: '4px 0', boxSizing: 'border-box', border: '1px solid #ced4da', borderRadius: 4 },
    textarea: { width: '100%', height: 60, padding: 8, margin: '4px 0', boxSizing: 'border-box', border: '1px solid #ced4da', borderRadius: 4 },
    btn: { padding: '8px 16px', cursor: 'pointer', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 4, marginTop: 8 }
  };

  return (
    <div style={styles.card}>
      <h3>1. 쿼타 설정</h3>
      <input placeholder="쿼타 이름" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} />
      <textarea placeholder="이메일 (줄바꿈/쉼표 구분)" value={emailsText} onChange={(e) => setEmailsText(e.target.value)} style={styles.textarea} />
      <input type="number" placeholder="SLA (시간)" value={slaHours} onChange={(e) => setSlaHours(Number(e.target.value))} style={styles.input} />
      <button onClick={handleAdd} style={styles.btn}>쿼타 추가</button>
    </div>
  );
};