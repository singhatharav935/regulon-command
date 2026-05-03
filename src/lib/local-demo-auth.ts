/**
 * Authentication Service
 * 
 * Uses Supabase Auth for real user registration and login.
 * Sends confirmation emails on signup; prevents duplicate email accounts.
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
  /** True when the user was created but must confirm their email before logging in */
  requiresEmailConfirmation?: boolean;
}

/**
 * Register a new user via Supabase Auth.
 *
 * Supabase will:
 *  - Reject duplicate emails (returns an error)
 *  - Send a confirmation email if email confirmations are enabled
 *  - Trigger the `handle_new_user()` DB function to create profiles/roles/personas
 */
export async function createLocalDemoUser(
  email: string,
  password: string,
  fullName: string,
  registrationRole: string,
  entityName?: string
): Promise<LocalAuthResult> {
  try {
    const redirectUrl = `${window.location.origin}/auth?mode=login&role=${registrationRole}`;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
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

    if (error) {
      // Supabase returns specific error messages for duplicate emails
      const msg = error.message.toLowerCase();
      if (
        msg.includes("already registered") ||
        msg.includes("already been registered") ||
        msg.includes("user already exists") ||
        msg.includes("already exists")
      ) {
        return {
          success: false,
          error:
            "An account with this email already exists. Please sign in instead.",
        };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: "Registration failed. Please try again." };
    }

    // When email confirmations are enabled, Supabase returns data.user but
    // data.session will be null.  We still consider signup successful but
    // flag that the user must confirm their email.
    const needsConfirmation = !data.session;

    // Supabase may return a fake "confirmed" user for duplicate signups
    // when "Email Confirmations" is ON.  Detect this by checking identities.
    const identities = (data.user as any)?.identities ?? data.user?.identities;
    if (Array.isArray(identities) && identities.length === 0) {
      // This means the email is already registered
      return {
        success: false,
        error:
          "An account with this email already exists. Please sign in instead.",
      };
    }

    return {
      success: true,
      requiresEmailConfirmation: needsConfirmation,
      user: {
        id: data.user.id,
        email: data.user.email!,
        user_metadata: {
          registration_role: registrationRole,
          full_name: fullName,
          verification_entity_name: entityName,
        },
      },
    };
  } catch (err: any) {
    console.error("Registration error:", err);
    return {
      success: false,
      error: err?.message || "An unexpected error occurred during registration.",
    };
  }
}

/**
 * Log in an existing user via Supabase Auth.
 */
export async function loginLocalDemoUser(
  email: string,
  password: string
): Promise<LocalAuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login credentials") || msg.includes("invalid")) {
        return {
          success: false,
          error: "Invalid email or password. Please try again.",
        };
      }
      if (msg.includes("email not confirmed")) {
        return {
          success: false,
          error:
            "Please confirm your email before signing in. Check your inbox for the confirmation link.",
        };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: "Login failed. Please try again." };
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email!,
        user_metadata: (data.user.user_metadata as any) ?? {
          registration_role: "company_owner",
          full_name: "",
        },
      },
    };
  } catch (err: any) {
    console.error("Login error:", err);
    return {
      success: false,
      error: err?.message || "An unexpected error occurred during login.",
    };
  }
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