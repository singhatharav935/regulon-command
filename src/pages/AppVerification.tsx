import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const AppVerification = () => {
  const { user, persona, verificationStatus, isVerified } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [entityName, setEntityName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [notes, setNotes] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const requirements = useMemo(() => {
    if (persona === "external_ca" || persona === "in_house_ca") {
      return {
        title: "CA Verification",
        fields: ["entity", "license", "jurisdiction", "document"],
      };
    }

    if (persona === "in_house_lawyer") {
      return {
        title: "Lawyer Verification",
        fields: ["entity", "license", "jurisdiction", "document"],
      };
    }

    if (persona === "admin") {
      return {
        title: "Admin Verification",
        fields: ["entity", "registration", "jurisdiction", "document"],
      };
    }

    if (persona === "ca_firm") {
      return {
        title: "CA Firm Verification",
        fields: ["entity", "registration", "jurisdiction", "document"],
      };
    }

    return {
      title: "Company Verification",
      fields: ["entity", "registration", "jurisdiction", "document"],
    };
  }, [persona]);

  const hasField = (field: string) => requirements.fields.includes(field);

  const handleSubmit = async () => {
    if (!user || !persona) return;

    if (hasField("entity") && entityName.trim().length < 2) {
      toast({ title: "Entity name is required", variant: "destructive" });
      return;
    }

    if (hasField("registration") && registrationNumber.trim().length < 3) {
      toast({ title: "Registration number is required", variant: "destructive" });
      return;
    }

    if (hasField("license") && licenseNumber.trim().length < 3) {
      toast({ title: "License number is required", variant: "destructive" });
      return;
    }

    if (hasField("jurisdiction") && jurisdiction.trim().length < 2) {
      toast({ title: "Jurisdiction is required", variant: "destructive" });
      return;
    }

    if (hasField("document") && !documentFile) {
      toast({ title: "Verification document is required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let documentPath: string | null = null;

      if (documentFile) {
        const ext = documentFile.name.split(".").pop() || "pdf";
        const path = `${user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("verification-documents")
          .upload(path, documentFile, { upsert: true });

        if (uploadError) throw uploadError;
        documentPath = path;
      }

      const supabaseAny = supabase as any;
      const payload = {
        user_id: user.id,
        persona,
        entity_name: entityName.trim() || null,
        registration_number: registrationNumber.trim() || null,
        license_number: licenseNumber.trim() || null,
        jurisdiction: jurisdiction.trim() || null,
        document_path: documentPath,
        notes: notes.trim() || null,
        status: "pending",
        is_verified: false,
      };

      const { error } = await supabaseAny
        .from("user_verifications")
        .upsert(payload, { onConflict: "user_id" });

      if (error) throw error;

      toast({ title: "Verification submitted", description: "Your verification request is under review." });
      window.location.reload();
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="glass-card border-border/40">
            <CardHeader>
              <CardTitle>{requirements.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Submit mandatory KYC/professional details before dashboard access.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-200">
                Current status: {isVerified ? "approved" : verificationStatus || "not submitted"}
              </div>

              {hasField("entity") && (
                <div className="space-y-2">
                  <Label>Entity / Firm / Company Name</Label>
                  <Input value={entityName} onChange={(e) => setEntityName(e.target.value)} />
                </div>
              )}

              {hasField("registration") && (
                <div className="space-y-2">
                  <Label>Registration Number</Label>
                  <Input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
                </div>
              )}

              {hasField("license") && (
                <div className="space-y-2">
                  <Label>Professional License Number</Label>
                  <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
                </div>
              )}

              {hasField("jurisdiction") && (
                <div className="space-y-2">
                  <Label>Jurisdiction / State Council</Label>
                  <Input value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} />
                </div>
              )}

              {hasField("document") && (
                <div className="space-y-2">
                  <Label>Upload Verification Document</Label>
                  <Input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)} />
                </div>
              )}

              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional context for verification team" />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSubmit} disabled={submitting} className="btn-glow">
                  {submitting ? "Submitting..." : "Submit Verification"}
                </Button>
                {isVerified && (
                  <Button variant="outline" onClick={() => navigate("/app")}>
                    Continue to Dashboard
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AppVerification;
