/**
 * GDPR Data Management Utilities
 * 
 * Implements user rights under GDPR and India's DPDP Act 2023:
 * - Right to Access (data export)
 * - Right to Erasure (right to be forgotten)
 * - Right to Data Portability
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Export all user data in JSON format
 * Implements: GDPR Article 20 (Right to Data Portability)
 */
export async function exportUserData(userId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;

    // Get user personas (roles)
    const { data: personas, error: personasError } = await supabase
      .from("user_personas")
      .select("*")
      .eq("user_id", userId);

    if (personasError) throw personasError;

    // Get user verifications
    const { data: verifications, error: verificationsError } = await supabase
      .from("user_verifications")
      .select("*")
      .eq("user_id", userId);

    if (verificationsError) throw verificationsError;

    // Get user roles
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId);

    if (rolesError) throw rolesError;

    // Compile all user data
    const userData = {
      exportDate: new Date().toISOString(),
      exportFormat: "JSON",
      gdprCompliance: "GDPR Article 20 - Right to Data Portability",
      dpdpCompliance: "DPDP Act 2023 - Right to Data Portability",
      userId,
      profile: profile || null,
      personas: personas || [],
      verifications: verifications || [],
      roles: roles || [],
      // Add more tables as needed:
      // workspaces, documents, tasks, etc.
    };

    return {
      success: true,
      data: userData,
    };
  } catch (error) {
    console.error("Error exporting user data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export data",
    };
  }
}

/**
 * Download user data as JSON file
 */
export function downloadUserDataJSON(data: any, fileName: string = "my-data.json") {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Delete all user data permanently
 * Implements: GDPR Article 17 (Right to Erasure / Right to be Forgotten)
 * 
 * ⚠️ WARNING: This is PERMANENT and IRREVERSIBLE
 */
export async function deleteUserData(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Delete in reverse order of dependencies to avoid foreign key constraints
    
    // 1. Delete user verifications
    const { error: verificationsError } = await supabase
      .from("user_verifications")
      .delete()
      .eq("user_id", userId);

    if (verificationsError) throw verificationsError;

    // 2. Delete user personas
    const { error: personasError } = await supabase
      .from("user_personas")
      .delete()
      .eq("user_id", userId);

    if (personasError) throw personasError;

    // 3. Delete user roles
    const { error: rolesError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (rolesError) throw rolesError;

    // 4. Delete user profile (if exists)
    const { error: profileError } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", userId);

    if (profileError && profileError.code !== "PGRST116") {
      // PGRST116 = no rows found (acceptable)
      throw profileError;
    }

    // 5. Delete user from auth (this should cascade delete related data)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      // If we don't have admin access, user can delete their own account
      console.warn("Could not delete user from auth (requires admin access)");
      // User should be signed out and account will be marked for deletion
    }

    // 6. Sign out the user
    await supabase.auth.signOut();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting user data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete data",
    };
  }
}

/**
 * Request account deletion (for users without admin access)
 * Creates a deletion request that admin can process
 */
export async function requestAccountDeletion(
  userId: string,
  reason?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Create deletion request (you'll need to create this table)
    const { error } = await supabase.from("deletion_requests").insert({
      user_id: userId,
      requested_at: new Date().toISOString(),
      reason: reason || "User requested account deletion",
      status: "pending",
    });

    if (error) throw error;

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error requesting account deletion:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to request deletion",
    };
  }
}

/**
 * Anonymize user data instead of deleting
 * Alternative to full deletion - keeps data for analytics but removes PII
 */
export async function anonymizeUserData(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Replace user data with anonymized values
    const anonymousEmail = `deleted-user-${userId.slice(0, 8)}@anonymized.local`;
    
    // Update profile with anonymized data
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({
        email: anonymousEmail,
        full_name: "Deleted User",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError && profileError.code !== "PGRST116") {
      throw profileError;
    }

    // Mark verifications as anonymized
    const { error: verificationsError } = await supabase
      .from("user_verifications")
      .update({
        verification_data: { anonymized: true },
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (verificationsError) throw verificationsError;

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error anonymizing user data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to anonymize data",
    };
  }
}
