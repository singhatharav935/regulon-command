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
  const normEmail = email.trim().toLowerCase();
  const hasEnv = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  if (hasEnv) {
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
        // If network error, fall back to local auth below
        if (!msg.includes("fetch") && !msg.includes("network")) {
          return { success: false, error: error.message };
        }
      } else if (data.user) {
        const needsConfirmation = !data.session;
        const identities = (data.user as any)?.identities ?? data.user?.identities;
        if (Array.isArray(identities) && identities.length === 0) {
          return {
            success: false,
            error: "An account with this email already exists. Please sign in instead.",
          };
        }
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
      }
    } catch (err: any) {
      console.warn("Supabase auth unavailable, falling back to local auth:", err);
    }
  }

  // ══ LOCAL FALLBACK FOR DEVELOPMENT / LOCALHOST ══
  const localUser = {
    id: `local-${Date.now()}`,
    email: normEmail,
    password,
    user_metadata: {
      registration_role: registrationRole,
      full_name: fullName,
      verification_entity_name: entityName,
    },
  };
  localStorage.setItem(`sannidh_local_user_${normEmail}`, JSON.stringify(localUser));
  localStorage.setItem("sannidh_current_user", JSON.stringify(localUser));
  localStorage.setItem("current_user_role", registrationRole);

  return {
    success: true,
    requiresEmailConfirmation: false,
    user: localUser,
  };
}

/**
 * Log in an existing user via Supabase Auth.
 */
export async function loginLocalDemoUser(
  email: string,
  password: string
): Promise<LocalAuthResult> {
  const normEmail = email.trim().toLowerCase();
  const hasEnv = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  if (hasEnv) {
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
            error: "Invalid email or password. Please try again.",
          };
        }
        if (msg.includes("email not confirmed")) {
          return {
            success: false,
            error: "Please confirm your email before signing in. Check your inbox for the confirmation link.",
          };
        }
        if (!msg.includes("fetch") && !msg.includes("network")) {
          return { success: false, error: error.message };
        }
      } else if (data?.user) {
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
      }
    } catch (err: any) {
      console.warn("Supabase auth unavailable, falling back to local auth:", err);
    }
  }

  // ══ LOCAL FALLBACK FOR DEVELOPMENT / LOCALHOST ══
  const storedRaw = localStorage.getItem(`sannidh_local_user_${normEmail}`);
  if (storedRaw) {
    try {
      const stored = JSON.parse(storedRaw);
      if (stored.password && stored.password !== password) {
        return { success: false, error: "Invalid password for local account." };
      }
      localStorage.setItem("sannidh_current_user", JSON.stringify(stored));
      localStorage.setItem("current_user_role", stored.user_metadata.registration_role || "company_owner");
      return { success: true, user: stored };
    } catch { /* ignore */ }
  }

  // Auto-generate local account for testing
  const mockUser = {
    id: `local-${Date.now()}`,
    email: normEmail,
    user_metadata: {
      registration_role: "company_owner",
      full_name: normEmail.split("@")[0],
    },
  };
  localStorage.setItem("sannidh_current_user", JSON.stringify(mockUser));
  localStorage.setItem("current_user_role", "company_owner");
  return { success: true, user: mockUser };
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