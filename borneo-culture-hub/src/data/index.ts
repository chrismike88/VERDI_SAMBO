import raw from './budaya-2026.json';
import { DatasetSchema, type Dataset } from './schema';

export const data: Dataset = DatasetSchema.parse(raw);

export const pillarById = (id: string) => data.pillars.find((p) => p.id === id)!;
export const periodById = (id: string) => data.periods.find((p) => p.id === id);
export const evidenceById = (id: string) => data.evidence.find((e) => e.id === id);
