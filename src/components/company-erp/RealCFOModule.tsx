/**
 * REAL VIRTUAL CFO MODULE — Live Data Binding
 * ============================================
 * Thin live wrapper around VirtualCFOModule for Supabase connected companies.
 */

import { VirtualCFOModule } from "./VirtualCFOModule";

interface Props {
  companyId: string;
  companyName?: string;
}

export function RealCFOModule({ companyName }: Props) {
  return <VirtualCFOModule companyName={companyName || "Your Company"} />;
}

export default RealCFOModule;
