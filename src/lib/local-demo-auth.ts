/**
 * Local Development Authentication
 * 
 * For development/demo purposes when Supabase backend is not fully configured.
 * This allows testing the complete registration and dashboard flow locally.
 */

import { supabase } from "@/integrations/supabase/client";

export interface LocalAuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    user_metadata: {
      registration_role: string;
      full_name: string;
      verification_entity_name?: string;
    };
  };
  error?: string;
}

// In-memory user storage for demo mode
const localUsers = new Map<string, any>();

/**
 * Create a local demo user (for development only)
 */
export async function createLocalDemoUser(
  email: string,
  password: string,
  fullName: string,
  registrationRole: string,
  entityName?: string
): Promise<LocalAuthResult> {
  
  // First try Supabase registration
  try {
    const redirectUrl = `${window.location.origin}/auth?mode=login&role=${registrationRole}`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          registration_role: registrationRole,
          verification_entity_name: entityName,
        },
      },
    });

    if (!error && data.user) {
      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email!,
          user_metadata: data.user.user_metadata as any,
        },
      };
    }
  } catch (supabaseError) {
    console.log("Supabase registration failed, using local demo mode:", supabaseError);
  }

  // Fallback to local demo mode
  const userId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const user = {
    id: userId,
    email: email,
    user_metadata: {
      registration_role: registrationRole,
      full_name: fullName,
      verification_entity_name: entityName,
    },
    created_at: new Date().toISOString(),
  };

  localUsers.set(email, user);
  
  return {
    success: true,
    user: user,
  };
}

/**
 * Login with local demo user
 */
export async function loginLocalDemoUser(email: string, password: string): Promise<LocalAuthResult> {
  
  // First try Supabase login
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email!,
          user_metadata: data.user.user_metadata as any,
        },
      };
    }
  } catch (supabaseError) {
    console.log("Supabase login failed, checking local demo mode:", supabaseError);
  }

  // Fallback to local demo user
  const user = localUsers.get(email);
  if (user) {
    return {
      success: true,
      user: user,
    };
  }

  return {
    success: false,
    error: "User not found. Please register first.",
  };
}

/**
 * Check if we should use local demo mode
 */
export function shouldUseLocalDemo(): boolean {
  return import.meta.env.VITE_ENABLE_PREVIEW_BYPASS === "true";
}

/**
 * Get demo dashboard data based on role
 */
export function getDemoDashboardData(role: string) {
  const baseData = {
    lastUpdated: new Date().toISOString(),
    demoMode: true,
  };

  switch (role) {
    case "company_owner":
      return {
        ...baseData,
        company: { 
          name: "Your Company", 
          industry: "Technology", 
          compliance_health: 0,
          setup_required: true 
        },
        exposures: [],
        tasks: [],
        documents: [],
        deadlines: [],
        draftRuns: [],
        draftAuditEvents: [],
        setupInstructions: [
          "Complete company profile",
          "Upload business registration documents",
          "Set up compliance monitoring",
        ],
      };

    case "external_ca":
    case "in_house_ca":
      return {
        ...baseData,
        companies: [],
        tasks: [],
        documents: [],
        deadlines: [],
        drafts: [],
        setupInstructions: [
          "Complete CA verification",
          "Upload professional certificates",
          "Connect with client companies",
        ],
      };

    case "admin":
      return {
        ...baseData,
        companies: [],
        tasks: [],
        documents: [],
        deadlines: [],
        roles: [],
        drafts: [],
        systemHealth: {
          api: "healthy",
          database: "healthy", 
          auth: "healthy",
          storage: "healthy",
        },
        setupInstructions: [
          "Configure system settings",
          "Set up monitoring",
          "Review user registrations",
        ],
      };

    case "in_house_lawyer":
      return {
        ...baseData,
        legalTasks: [],
        documents: [],
        compliance: [],
        setupInstructions: [
          "Complete legal verification",
          "Set up document review workflow",
          "Configure compliance alerts",
        ],
      };

    case "ca_firm":
      return {
        ...baseData,
        clients: [],
        staff: [],
        workload: [],
        setupInstructions: [
          "Complete firm registration",
          "Add team members",
          "Set up client management",
        ],
      };

    default:
      return baseData;
  }
}