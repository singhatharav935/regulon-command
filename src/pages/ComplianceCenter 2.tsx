import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackgroundEffects from "@/components/BackgroundEffects";
import { workspacePublicRequest } from "@/lib/workspace-backend";

type LegalDocIndexItem = {
  doc_key: string;
  version: string;
  title: string;
  summary?: string | null;
  requires_acceptance: boolean;
  effective_at?: string | null;
  published_at?: string | null;
};

const ROUTE_BY_DOC_KEY: Record<string, string> = {
  privacy_policy: "/privacy",
  terms_of_service: "/terms",
  refund_policy: "/refund-policy",
  dpa_terms: "/dpa",
  data_retention_policy: "/data-retention",
};

const ComplianceCenter = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["public-legal-docs-index"],
    queryFn: async () => workspacePublicRequest<LegalDocIndexItem[]>("/public/legal-documents/index"),
    staleTime: 60_000,
    retry: 1,
  });

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundEffects />
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass-card p-6 md:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Compliance Center</h1>
          <p className="mt-3 text-muted-foreground">
            Canonical legal documents, version history pointers, and publication status for market readiness.
          </p>

          {isLoading ? <p className="mt-6 text-muted-foreground">Loading legal documents...</p> : null}
          {isError ? (
            <p className="mt-6 text-destructive">
              Failed to load legal document index: {error instanceof Error ? error.message : "Unknown error"}
            </p>
          ) : null}

          {!isLoading && !isError ? (
            <div className="mt-8 grid gap-4">
              {(data ?? []).map((item) => (
                <div key={`${item.doc_key}-${item.version}`} className="rounded-lg border border-border/60 bg-background/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
                      <p className="text-xs text-muted-foreground">
                        Key: {item.doc_key} | Version: {item.version} | Effective: {item.effective_at ?? "N/A"}
                      </p>
                    </div>
                    <Link
                      to={ROUTE_BY_DOC_KEY[item.doc_key] ?? `/privacy`}
                      className="text-sm text-primary hover:underline"
                    >
                      View document
                    </Link>
                  </div>
                  {item.summary ? <p className="mt-3 text-sm text-muted-foreground">{item.summary}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ComplianceCenter;
