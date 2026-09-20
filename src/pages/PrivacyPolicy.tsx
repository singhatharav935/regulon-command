import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
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
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">
            Last Updated: {new Date().toLocaleDateString()}
          </p>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground">
                SANNIDH ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
                our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mb-3 mt-4">2.1 Information You Provide</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Account Information:</strong> Name, email address, phone number, password</li>
                <li><strong>Profile Information:</strong> Professional role, organization details, preferences</li>
                <li><strong>User Content:</strong> Documents, notes, tasks, and other data you upload</li>
                <li><strong>Communication Data:</strong> Messages, feedback, and support requests</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-4">2.2 Automatically Collected Information</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                <li><strong>Cookies and Tracking:</strong> Session cookies, analytics cookies, preference cookies</li>
                <li><strong>Log Data:</strong> Server logs, error reports, API requests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">
                We use your information for the following purposes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Service Delivery:</strong> To provide, maintain, and improve the Platform</li>
                <li><strong>Personalization:</strong> To customize your experience based on your role and preferences</li>
                <li><strong>Communication:</strong> To send updates, notifications, and respond to inquiries</li>
                <li><strong>Security:</strong> To protect against fraud, unauthorized access, and security threats</li>
                <li><strong>Analytics:</strong> To understand usage patterns and improve functionality</li>
                <li><strong>Compliance:</strong> To comply with legal obligations and regulatory requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground mb-4">
                We do not sell your personal data. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Service Providers:</strong> Third-party vendors who assist in platform operations (hosting, analytics, email)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or regulatory authority</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Encryption in transit (HTTPS/TLS) and at rest</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Secure data centers with physical and digital safeguards</li>
                <li>Employee training on data protection best practices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights (GDPR & DPDP Act 2023)</h2>
              <p className="text-muted-foreground mb-4">
                You have the following rights regarding your personal data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data ("Right to be Forgotten")</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong>Right to Object:</strong> Object to certain types of data processing</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw previously given consent at any time</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise these rights, please contact us at <span className="font-mono text-sm">privacy@sannidh.ai</span>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal data only for as long as necessary to fulfill the purposes outlined in this Privacy 
                Policy, unless a longer retention period is required by law. When you delete your account, we will delete 
                or anonymize your data within 30 days, except where we are legally required to retain it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground mb-4">
                We use cookies and similar tracking technologies to enhance your experience:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Essential Cookies:</strong> Required for authentication and security</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how you use the Platform</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                You can manage cookie preferences through your browser settings or our cookie consent banner.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your data may be transferred to and processed in countries other than India. We ensure appropriate 
                safeguards are in place, including Standard Contractual Clauses and data protection agreements, to 
                protect your data during international transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our Platform is not intended for individuals under the age of 18. We do not knowingly collect personal 
                data from children. If you believe we have inadvertently collected data from a child, please contact us 
                immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. India-Specific Compliance</h2>
              <p className="text-muted-foreground mb-4">
                In accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>We maintain servers and data centers within India for Indian user data</li>
                <li>We comply with data localization requirements for sensitive personal data</li>
                <li>We provide transparent consent mechanisms for data collection</li>
                <li>We designate a Data Protection Officer for India operations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by 
                posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use 
                of the Platform after such changes constitutes your acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact:
              </p>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-mono mb-2"><strong>Data Protection Officer</strong></p>
                <p className="text-sm font-mono">Email: privacy@sannidh.ai</p>
                <p className="text-sm font-mono">Email: dpo@sannidh.ai</p>
                <p className="text-sm font-mono">Website: www.sannidh.ai</p>
              </div>
            </section>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-8">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <strong>Note:</strong> This is a placeholder document. The final Privacy Policy will be prepared by 
                our legal team and will include additional provisions to ensure full compliance with GDPR, India's 
                DPDP Act 2023, IT Act 2000, and other applicable data protection regulations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
