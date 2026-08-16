import type { CAAgentId } from './CAAgentOrchestrator';

/** Maps tab/section indices to agent IDs. Kept in a separate file to satisfy
 *  Vite SWC Fast Refresh which requires component files to export only components. */
export const CA_AGENT_SECTION_MAP: Record<number, CAAgentId> = {
  1: 'A1_PRIME', 2: 'A2_CROSS', 3: 'A3_AUDIT',
  4: 'D1_MAKER', 5: 'D2_REFINER', 6: 'D3_ALIGNER',
  7: 'R1_TAX', 8: 'R2_LEGAL', 9: 'R3_FINAL',
  10: 'M1_PULSE', 11: 'M2_TRACKER', 12: 'M3_HERALD'
};
