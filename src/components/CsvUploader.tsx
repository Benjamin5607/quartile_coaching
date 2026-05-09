import React, { useState, CSSProperties } from 'react';
import Papa from 'papaparse';
import { db } from '../db/dexie';
import { createTasksFromCSV, CSVRow } from '../utils/transformer';

export const CsvUploader: React.FC = () => {
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedCols, setSelectedCols] = useState<string[]>([]);
  const [emailCol, setEmailCol] = useState('');
  const [rawData, setRawData] = useState<CSVRow[]>([]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<CSVRow>(file, {
      header: true, skipEmptyLines: true,
      complete: (res: any) => {
        setColumns(res.meta.fields || []);
        setRawData(res.data);
      }
    });
  };

  const handleGenerate = async () => {
    if (!emailCol || selectedCols.length === 0) return;
    const quotas = await db.quotas.toArray();
    const newTasks = createTasksFromCSV(rawData, quotas, selectedCols, emailCol);
    if (newTasks.length) await db.tasks.bulkAdd(newTasks);
    setColumns([]); setSelectedCols([]); setEmailCol(''); setRawData([]);
  };

  const styles: Record<string, CSSProperties> = {
    card: { background: '#f8f9fa', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid #e9ecef' },
    btn: { padding: '8px 16px', cursor: 'pointer', background: '#198754', color: '#fff', border: 'none', borderRadius: 4 }
  };

  if (columns.length === 0) return (
    <div style={styles.card}>
      <h3>2. CSV 업로드</h3>
      <input type="file" accept=".csv" onChange={handleFile} />
    </div>
  );

  return (
    <div style={styles.card}>
      <h3>2. 컬럼 매핑 및 태스크 생성</h3>
      <label>이메일 컬럼: <select value={emailCol} onChange={(e) => setEmailCol(e.target.value)}>
        <option value="">선택</option>
        {columns.map((c: string) => <option key={c} value={c}>{c}</option>)}
      </select></label>
      <div style={{ margin: '10px 0', maxHeight: 150, overflowY: 'auto' as any }}>
        <strong>코칭 태스크 포함 컬럼:</strong><br/>
        {columns.map((c: string) => (
          <label key={c} style={{ marginRight: 12, display: 'inline-block' }}>
            <input type="checkbox" checked={selectedCols.includes(c)} onChange={(e) => {
              setSelectedCols(prev => e.target.checked ? [...prev, c] : prev.filter((x: string) => x !== c));
            }} /> {c}
          </label>
        ))}
      </div>
      <button onClick={handleGenerate} style={styles.btn} disabled={!emailCol || selectedCols.length === 0}>테스크 생성 ({rawData.length}행)</button>
    </div>
  );
};