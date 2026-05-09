import { sql } from '@vercel/postgres';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const tasks = req.body as any[];
      if (!tasks.length) return res.status(200).json({ ok: true });

      // Bulk Upsert
      const values = tasks.map(t => [
        t.id, t.quotaId, t.email, JSON.stringify(t.rawData), t.status, new Date(t.createdAt), new Date(t.slaDeadline)
      ]);

      await sql`
        INSERT INTO tasks (id, quota_id, email, raw_data, status, created_at, sla_deadline)
        SELECT * FROM UNNEST(${values.map(v => v[0])}, ${values.map(v => v[1])}, ${values.map(v => v[2])}, ${values.map(v => v[3])}, ${values.map(v => v[4])}, ${values.map(v => v[5])}, ${values.map(v => v[6])})
        ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, raw_data = EXCLUDED.raw_data
      `;
      return res.status(200).json({ success: true });
    }

    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM tasks ORDER BY created_at DESC`;
      return res.status(200).json(rows);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'DB Error' });
  }
}
