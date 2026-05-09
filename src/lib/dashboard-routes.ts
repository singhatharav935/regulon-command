/**
 * Shared utility to map persona/role to the correct dashboard route.
 * Single source of truth used by Navbar, Auth pages, and RoleLandingRoute.
 */
import type { AppPersona } from "@/hooks/use-auth";

export function getDashboardRoute(persona: AppPersona | string | null): string {
  switch (persona) {
    case "external_ca":
      return "/real-external-ca-dashboard";
    case "in_house_ca":
      return "/real-inhouse-ca-dashboard";
    case "ca_firm":
      return "/dashboards/ca-firm";

    case "admin":
      return "/admin-dashboard";
    case "in_house_lawyer":
      return "/lawyer-dashboard";
    case "company_owner":
    default:
      return "/real-company-dashboard";
  }
}
