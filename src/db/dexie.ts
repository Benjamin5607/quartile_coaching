import Dexie from 'dexie';
import type { Table } from 'dexie';

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
}

export class AppDB extends Dexie {
  quotas!: Table<Quota, string>;
  tasks!: Table<Task, string>;

  constructor() {
    super('sla-coaching-db');
    this.version(1).stores({
      quotas: 'id, name',
      tasks: 'id, quotaId, email, status, slaDeadline, createdAt'
    });
  }
}

export const db = new AppDB();