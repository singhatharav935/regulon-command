import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const indexPath = join(process.cwd(), "supabase/functions/workspace-backend/index.ts");
const indexSource = readFileSync(indexPath, "utf8");

const listedRoutes = Array.from(indexSource.matchAll(/route:\s*"([A-Z]+ [^"]+)"/g)).map((match) => match[1]);

describe("workspace backend route access matrix contract", () => {
  it("includes all frontend-required route entries", () => {
    const requiredRoutes = [
      "GET /public/landing/overview",
      "POST /public/landing/lead",
      "GET /public/legal-documents",
      "GET /public/legal-documents/index",
      "GET /onboarding/status",
      "POST /onboarding/repair-self",
      "GET /company/dashboard",
      "POST /company/workspace",
      "GET /ca/dashboard",
      "GET /ca/workspace-profile",
      "GET /ca-firm/dashboard",
      "POST /ca-firm/workspace",
      "GET /legal/dashboard",
      "GET /admin/dashboard",
      "GET /draft-review/:id",
      "POST /draft-review/:id/save",
      "GET /drafting/preferences",
      "GET /drafting/capabilities",
      "GET /drafting/clients",
      "POST /drafting/ai",
      "POST /drafting/ai-stream",
      "POST /drafts",
    ];

    for (const route of requiredRoutes) {
      expect(listedRoutes).toContain(route);
    }
  });
});
