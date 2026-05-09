import { useEffect } from 'react';
import { QuotaSetup } from './components/QuotaSetup';
import { CsvUploader } from './components/CsvUploader';
import { Dashboard } from './components/Dashboard';
import { startSLAEngine } from './utils/slaEngine';

function App() {
  useEffect(() => {
    const cleanup = startSLAEngine();
    return cleanup; // 언마운트 시 정리
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>🎯 Coaching SLA Tracker</h1>
      <QuotaSetup />
      <CsvUploader />
      <Dashboard />
    </div>
  );
}

export default App;
