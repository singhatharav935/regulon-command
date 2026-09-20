// Central API Exports
export { ExternalCAAPI, type CAClient, type CAAudit, type ComplianceItem } from './external-ca-api';
export { InhouseCAAPI, type Employee, type PayrollRecord, type GSTFiling } from './inhouse-ca-api';
export { LawyerAPI, type Contract, type LegalCase, type LegalNotice, type LegalRisk } from './lawyer-api';
export { AdminAPI, type AdminUser, type CompanyRegistry, type AuditLogEntry } from './admin-api';

// API Provider for all personas
import { SupabaseClient } from '@supabase/supabase-js';
import { ExternalCAAPI } from './external-ca-api';
import { InhouseCAAPI } from './inhouse-ca-api';
import { LawyerAPI } from './lawyer-api';
import { AdminAPI } from './admin-api';

export class PersonaAPI {
  public externalCA: ExternalCAAPI;
  public inhouseCA: InhouseCAAPI;
  public lawyer: LawyerAPI;
  public admin: AdminAPI;

  constructor(supabase: SupabaseClient) {
    this.externalCA = new ExternalCAAPI(supabase);
    this.inhouseCA = new InhouseCAAPI(supabase);
    this.lawyer = new LawyerAPI(supabase);
    this.admin = new AdminAPI(supabase);
  }
}
