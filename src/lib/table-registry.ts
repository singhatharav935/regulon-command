/**
 * Table Registry — Prevents Supabase queries to non-existent tables/views.
 *
 * The browser logs "Failed to load resource: 400" for every failed PostgREST
 * request, and JavaScript cannot suppress these network-level console messages.
 * The ONLY way to eliminate them is to not send the request at all.
 *
 * This registry lists every table and view that actually exists in the Supabase
 * database. Before making a query, service code can call `tableExists()` to
 * avoid sending doomed requests.
 */

const EXISTING_TABLES = new Set([
  // Core
  'profiles',
  'user_roles',
  'companies',
  'company_members',
  'regulatory_exposure',
  // 'compliance_tasks', — not deployed; queries cause 400
  'documents',
  'deadlines',
  'ai_conversations',
  'ai_messages',
  'user_personas',
  'user_role_assignments',
  'user_profiles',
  'ca_workspace_profiles',
  'user_verifications',

  // Multi-entity
  'entities',
  'entity_groups',
  'entity_group_members',
  'entity_compliance_snapshot',
  'consolidated_reports',

  // CA client management
  'ca_clients',
  'consent_requests',
  // 'client_govt_notices', — not deployed; queries cause 400
  // 'ca_dependencies',    — not deployed; queries cause 400
  // 'communication_logs', — not deployed; queries cause 400
  // 'ca_task_history',    — not deployed; queries cause 400
  'ca_firm_invoices',

  // Client financials
  'client_financial_books',
  'client_module_calculations',
  'client_notice_data_room',
  'client_bank_transactions',
  'client_statutory_inputs',
  'client_bank_statements',
  'aa_consent_requests',

  // Drafting & legal
  'draft_runs',
  'lawyer_review_requests',
  'compliance_score_history',

  // CA audits
  'ca_audits',
  'ca_compliance_items',
  'ca_audit_documents',
  'ca_audit_reports',

  // CA firm
  'ca_firms',
  'ca_firm_members',
  'ca_firm_clients',
  'ca_assignments',
  'ca_firm_analytics',
  'ca_firm_documents',
  'ca_firm_ca_directory',

  // Audit trail & compliance
  'audit_trail_events',
  'compliance_scores',
  'compliance_reports',
  'data_retention_policies',
  'audit_alert_subscriptions',

  // Calendar & deadlines
  'compliance_calendar_events',
  'deadline_reminders',
  'escalation_rules',
  'escalation_logs',
  'recurring_deadline_templates',
  'deadline_sla_timers',

  // E-filing
  'efiling_portal_credentials',
  'efiling_templates',
  'efiling_jobs',
  'efiling_documents',
  'efiling_status_log',

  // Payment & tax
  // 'tax_liability_heads', — not deployed; queries cause 400
  'tax_computation_rules',
  'payment_transactions',
  'payment_reconciliation',
  'payment_reminders',

  // Document vault & OCR
  'document_vault',
  'document_versions',
  'ocr_jobs',
  'ocr_results',
  'document_access_logs',
  'deletion_requests',

  // ERP integration
  'erp_connections',
  'erp_sync_jobs',
  'erp_sync_logs',
  'erp_field_mappings',
  'erp_data_cache',

  // Enterprise API
  'enterprise_api_keys',
  'api_access_logs',
  'api_key_usage_summary',
  'webhook_endpoints',
  'webhook_deliveries',

  // RBAC
  'rbac_roles',
  'rbac_role_permissions',
  'rbac_teams',
  'rbac_team_members',
  'rbac_team_invitations',
  'rbac_member_activity_logs',

  // Notifications (only template table exists)
  'notification_templates',
]);

/**
 * Check if a table/view exists in the database.
 * Returns false for tables that would cause 400/404 errors.
 */
export function tableExists(tableName: string): boolean {
  return EXISTING_TABLES.has(tableName);
}

/**
 * Known RPC functions deployed in the database.
 * Queries to non-existent RPCs produce uncatchable 400 console errors.
 */
const EXISTING_RPCS = new Set<string>([
  // Add RPC function names here as they are deployed to Supabase.
  // 'bootstrap_retention_policies', — not deployed
]);

/**
 * Check if an RPC function exists in the database.
 * Returns false for RPCs that would cause 400 errors.
 */
export function rpcExists(rpcName: string): boolean {
  return EXISTING_RPCS.has(rpcName);
}

