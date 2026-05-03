// Persona Types for Multi-Dashboard System

export type PersonaType = 
  | 'external_ca' 
  | 'inhouse_ca' 
  | 'ca_firm' 
  | 'inhouse_lawyer' 
  | 'company_owner' 
  | 'admin';

export interface PersonaConfig {
  id: PersonaType;
  label: string;
  description: string;
  icon: string;
  color: string;
  dashboardRoute: string;
}

export const PERSONA_CONFIG: Record<PersonaType, PersonaConfig> = {
  external_ca: {
    id: 'external_ca',
    label: 'External CA',
    description: 'Chartered Accountant - Audit multiple companies',
    icon: '🔍',
    color: 'bg-blue-500',
    dashboardRoute: '/real-external-ca-dashboard',
  },
  inhouse_ca: {
    id: 'inhouse_ca',
    label: 'In-house CA',
    description: 'Company Tax Officer - Manage single company compliance',
    icon: '📊',
    color: 'bg-green-500',
    dashboardRoute: '/real-inhouse-ca-dashboard',
  },
  ca_firm: {
    id: 'ca_firm',
    label: 'CA Firm',
    description: 'Firm Management - Manage CAs and clients',
    icon: '🏢',
    color: 'bg-purple-500',
    dashboardRoute: '/ca-firm-dashboard',
  },
  inhouse_lawyer: {
    id: 'inhouse_lawyer',
    label: 'In-house Lawyer',
    description: 'Legal Department - Manage contracts and litigation',
    icon: '⚖️',
    color: 'bg-red-500',
    dashboardRoute: '/lawyer-dashboard',
  },
  company_owner: {
    id: 'company_owner',
    label: 'Company Owner',
    description: 'Executive - High-level compliance overview',
    icon: '👔',
    color: 'bg-amber-500',
    dashboardRoute: '/real-company-dashboard',
  },
  admin: {
    id: 'admin',
    label: 'Admin',
    description: 'System Administrator - Full system control',
    icon: '⚙️',
    color: 'bg-slate-500',
    dashboardRoute: '/admin-dashboard',
  },
};

export interface SessionUser {
  id: string;
  email?: string;
  persona: PersonaType;
  companyId?: string;
  companyName?: string;
  isTestUser?: boolean;
  createdAt: Date;
}
