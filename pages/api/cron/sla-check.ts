import { sql } from '@vercel/postgres';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { rowCount } = await sql`
    UPDATE tasks
    SET status = 'sla_failed'
    WHERE status = 'pending' AND sla_deadline < NOW()
  `;

  return res.status(200).json({ failed_count: rowCount });
}
