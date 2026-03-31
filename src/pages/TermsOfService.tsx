import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="bg-card border rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">
            Last Updated: {new Date().toLocaleDateString()}
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using REGULON ("the Platform"), you accept and agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
              <p className="text-muted-foreground mb-4">
                REGULON is a regulatory compliance intelligence platform that provides:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Real-time monitoring of regulatory updates from government sources</li>
                <li>AI-powered compliance automation and drafting tools</li>
                <li>Task management and deadline tracking</li>
                <li>Document management and audit trail capabilities</li>
                <li>Role-based dashboards for various compliance professionals</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground mb-4">
                To use certain features of the Platform, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain the security of your password and account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
              <p className="text-muted-foreground mb-4">
                You agree to use the Platform only for lawful purposes and in accordance with these Terms. You agree NOT to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Upload malicious code or content</li>
                <li>Attempt to gain unauthorized access to the Platform</li>
                <li>Use the Platform to transmit spam or unsolicited messages</li>
                <li>Reverse engineer or attempt to extract source code</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
              <p className="text-muted-foreground">
                All content, features, and functionality of the Platform, including but not limited to text, graphics, logos, 
                and software, are the property of REGULON and are protected by copyright, trademark, and other intellectual 
                property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Disclaimer of Warranties</h2>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-yellow-600 dark:text-yellow-500 font-semibold mb-2">
                  IMPORTANT: Professional Advisory Disclaimer
                </p>
                <p className="text-muted-foreground">
                  THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. REGULON DOES NOT 
                  PROVIDE LEGAL, FINANCIAL, OR PROFESSIONAL ADVICE. The information and tools provided are for informational 
                  purposes only and should not be considered as a substitute for professional advice from qualified legal, 
                  financial, or compliance advisors.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                TO THE FULLEST EXTENT PERMITTED BY LAW, REGULON SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
                CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR 
                INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Data and Privacy</h2>
              <p className="text-muted-foreground">
                Your use of the Platform is subject to our Privacy Policy. By using the Platform, you consent to the 
                collection, use, and disclosure of your information as described in the Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
              <p className="text-muted-foreground">
                We reserve the right to suspend or terminate your access to the Platform at any time, without prior notice, 
                for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for 
                any other reason in our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of India, without regard to its 
                conflict of law provisions. Any disputes arising from these Terms shall be subject to the exclusive 
                jurisdiction of the courts in [City], India.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. We will notify you of any material changes by 
                posting the new Terms on the Platform. Your continued use of the Platform after such changes constitutes 
                your acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mt-4">
                <p className="text-sm font-mono">Email: legal@regulon.ai</p>
                <p className="text-sm font-mono">Website: www.regulon.ai</p>
              </div>
            </section>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-8">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <strong>Note:</strong> This is a placeholder document. The final Terms of Service will be prepared by 
                our legal team and will include additional provisions specific to Indian regulatory requirements and 
                international compliance standards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
