/**
 * Authentication Service — Supabase Only
 *
 * SECURITY: No local fallbacks. Every registration and login goes through
 * real Supabase Auth. Fake/unverified accounts are NOT allowed.
 *
 * - Registration: Supabase creates the user, sends email confirmation
 * - Login: Supabase verifies credentials, returns real session
 * - Routing: Based on registration_role stored in user_metadata
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
  requiresEmailConfirmation?: boolean;
}

/**
 * Register a new user via Supabase Auth.
 * No local fallback — if Supabase is unavailable, registration fails safely.
 */
export async function createLocalDemoUser(
  email: string,
  password: string,
  fullName: string,
  registrationRole: string,
  entityName?: string
): Promise<LocalAuthResult> {
  const normEmail = email.trim().toLowerCase();

  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return {
      success: false,
      error: "Authentication service is not configured. Please contact support.",
    };
  }

  try {
    const redirectUrl = `${window.location.origin}/auth?mode=login&role=${registrationRole}`;

    const { data, error } = await supabase.auth.signUp({
      email: normEmail,
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
      const msg = error.message.toLowerCase();
      if (
        msg.includes("already registered") ||
        msg.includes("already been registered") ||
        msg.includes("user already exists") ||
        msg.includes("already exists")
      ) {
        return {
          success: false,
          error: "An account with this email already exists. Please sign in instead.",
        };
      }
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: "Registration failed. Please try again." };
    }

    // Supabase silently returns a user with empty identities for duplicate emails
    const identities = (data.user as any)?.identities ?? data.user?.identities;
    if (Array.isArray(identities) && identities.length === 0) {
      return {
        success: false,
        error: "An account with this email already exists. Please sign in instead.",
      };
    }

    const needsConfirmation = !data.session;
    return {
      success: true,
      requiresEmailConfirmation: needsConfirmation,
      user: {
        id: data.user.id,
        email: data.user.email!,
        user_metadata: (data.user.user_metadata as any) ?? {
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
      error: err?.message || "Registration failed. Please check your connection and try again.",
    };
  }
}

/**
 * Log in an existing user via Supabase Auth.
 * No local fallback — invalid credentials are rejected, not bypassed.
 */
export async function loginLocalDemoUser(
  email: string,
  password: string
): Promise<LocalAuthResult> {
  const normEmail = email.trim().toLowerCase();

  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return {
      success: false,
      error: "Authentication service is not configured. Please contact support.",
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normEmail,
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login credentials") || msg.includes("invalid")) {
        return {
          success: false,
          error: "Invalid email or password. Please check your credentials and try again.",
        };
      }
      if (msg.includes("email not confirmed")) {
        return {
          success: false,
          error: "Your email is not confirmed yet. Please check your inbox for the confirmation link.",
        };
      }
      if (msg.includes("too many requests")) {
        return {
          success: false,
          error: "Too many login attempts. Please wait a few minutes and try again.",
        };
      }
      return { success: false, error: error.message };
    }

    if (!data?.user) {
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
      error: err?.message || "Login failed. Please check your connection and try again.",
    };
  }
}

/**
 * Returns the correct dashboard route based on the user's role.
 * Used after login/registration to redirect to the right dashboard.
 */
export function getDashboardRoute(role: string): string {
  switch (role) {
    case "external_ca":
      return "/dashboards/external-ca/full";
    case "in_house_ca":
      return "/dashboards/inhouse-ca";
    case "ca_firm":
      return "/dashboards/ca-firm";
    case "in_house_lawyer":
      return "/dashboards/lawyer";
    case "admin":
      return "/dashboards/admin";
    case "company_owner":
    default:
      return "/real-company-dashboard";
  }
}

/**
 * Check if we should use local demo mode (only for explicitly flagged preview builds)
 */
export function shouldUseLocalDemo(): boolean {
  return import.meta.env.VITE_ENABLE_PREVIEW_BYPASS === "true";
}

/**
 * Get demo dashboard data based on role (used only in DEMO dashboards, not real ones)
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
          compliance_score: 72,
          health_status: "good",
        },
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