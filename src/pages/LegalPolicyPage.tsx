import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackgroundEffects from "@/components/BackgroundEffects";
import { workspacePublicRequest } from "@/lib/workspace-backend";

type LegalDoc = {
  doc_key: string;
  version: string;
  title: string;
  jurisdiction: string;
  summary?: string | null;
  content_markdown: string;
  requires_acceptance: boolean;
  effective_at?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
};

type LegalPolicyPageProps = {
  docKey: string;
  fallbackTitle: string;
};

const LegalPolicyPage = ({ docKey, fallbackTitle }: LegalPolicyPageProps) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["public-legal-doc", docKey],
    queryFn: async () => workspacePublicRequest<LegalDoc>(`/public/legal-documents?doc_key=${encodeURIComponent(docKey)}`),
    staleTime: 60_000,
    retry: 1,
  });

  const title = data?.title ?? fallbackTitle;
  const content = data?.content_markdown ?? "";
  const summary = data?.summary ?? null;

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundEffects />
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass-card p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            {summary ? <p className="mt-3 text-muted-foreground">{summary}</p> : null}
            <p className="mt-3 text-xs text-muted-foreground">
              Version: {data?.version ?? "N/A"} | Effective: {data?.effective_at ?? "Pending legal publish"}
            </p>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Loading policy document...</p>
          ) : null}

          {isError ? (
            <div className="space-y-2">
              <p className="text-destructive">Failed to load policy document.</p>
              <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : "Unknown error"}</p>
            </div>
          ) : null}

          {!isLoading && !isError ? (
            <article className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm leading-7 text-foreground font-sans">{content}</pre>
            </article>
          ) : null}

          <div className="mt-8 border-t border-border/50 pt-6">
            <p className="text-xs text-muted-foreground">
              Legal notice: This content must be reviewed and approved by your legal counsel before commercial release in regulated markets.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link to="/privacy" className="text-primary hover:underline">Privacy</Link>
              <Link to="/terms" className="text-primary hover:underline">Terms</Link>
              <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link>
              <Link to="/compliance" className="text-primary hover:underline">Compliance Center</Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LegalPolicyPage;
