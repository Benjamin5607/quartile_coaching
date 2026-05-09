import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/dexie';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { exportData, importData } from '../utils/fileManager';

ChartJS.register(ArcElement, Tooltip, Legend);

export const Dashboard: React.FC = () => {
  const tasks = useLiveQuery(() => db.tasks.toArray()) || [];

  const metrics = {
    pending: tasks.filter(t => t.status === 'pending').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'sla_failed').length,
    total: tasks.length
  };

  const pieData = {
    labels: ['Pending', 'Completed', 'SLA Failed'],
    datasets: [{ data: [metrics.pending, metrics.completed, metrics.failed], backgroundColor: ['#ffc107', '#28a745', '#dc3545'] }]
  };

  return (
    <div style={styles.card}>
      <h3>3. 대시보드</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {Object.entries(metrics).map(([k, v]) => (
          <div key={k} style={{ flex: 1, minWidth: 120, background: '#e9ecef', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <strong>{k.toUpperCase()}</strong><br/><span style={{ fontSize: 24 }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 320, height: 320 }}><Pie data={pieData} options={{ maintainAspectRatio: false }} /></div>
        <div style={{ flex: 1, overflowX: 'auto', maxHeight: 320 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: '#dee2e6' }}><th>Email</th><th>상태</th><th>마감</th><th></th></tr></thead>
            <tbody>
              {tasks.slice(-15).reverse().map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '4px' }}>{t.email}</td>
                  <td style={{ color: t.status === 'completed' ? '#198754' : t.status === 'sla_failed' ? '#dc3545' : '#ffc107', fontWeight: 'bold', padding: '4px' }}>{t.status}</td>
                  <td style={{ padding: '4px' }}>{new Date(t.slaDeadline).toLocaleString()}</td>
                  <td style={{ padding: '4px' }}>
                    {t.status === 'pending' && <button onClick={async () => await db.tasks.update(t.id, { status: 'completed', completedAt: Date.now() })} style={{ cursor: 'pointer', fontSize: 11 }}>완료</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button onClick={exportData} style={styles.btnSec}>💾 JSON 저장</button>
        <label style={styles.btnPri}>📂 JSON 불러오기 <input type="file" accept=".json" onChange={e => e.target.files?.[0] && importData(e.target.files[0], () => window.location.reload())} style={{ display: 'none' }} /></label>
      </div>
    </div>
  );
};

const styles = { 
  card: { background: '#f8f9fa', padding: 16, borderRadius: 8, border: '1px solid #e9ecef' },
  btnPri: { padding: '8px 12px', cursor: 'pointer', background: '#6c757d', color: '#fff', borderRadius: 4, display: 'inline-block' },
  btnSec: { padding: '8px 12px', cursor: 'pointer', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 4 }
};
