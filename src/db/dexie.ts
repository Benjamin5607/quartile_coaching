import Dexie, { Table } from 'dexie';

export interface Quota {
  id: string;
  name: string;
  emails: string[];
  slaHours: number;
}

export interface Task {
  id: string;
  quotaId: string;
  email: string;
  rawData: Record<string, string>;
  status: 'pending' | 'completed' | 'sla_failed';
  createdAt: number;
  slaDeadline: number;
  completedAt?: number;
  synced: boolean;
}

export class AppDB extends Dexie {
  quotas!: Table<Quota>;
  tasks!: Table<Task>;

  constructor() {
    super('coaching-sla-db');
    this.version(1).stores({
      quotas: 'id',
      tasks: 'id, quotaId, email, status, slaDeadline, synced'
    });
  }
}

export const db = new AppDB();
