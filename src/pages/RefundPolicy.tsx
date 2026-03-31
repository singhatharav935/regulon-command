import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackgroundEffects from "@/components/BackgroundEffects";
import { AlertCircle } from "lucide-react";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundEffects />
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass-card p-6 md:p-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
              Refund & Cancellation Policy
            </h1>
            <p className="text-muted-foreground">
              Effective Date: March 31, 2026 | Last Updated: March 31, 2026
            </p>
          </div>

          {/* Placeholder Notice */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-8 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-300">
              <strong>Important Notice:</strong> This is a placeholder document. Final refund policy must be reviewed and approved by legal counsel and financial compliance team before commercial launch.
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-6">
            {/* Section 1: Overview */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">1. Overview</h2>
              <p className="text-muted-foreground leading-relaxed">
                REGULON is committed to customer satisfaction. This Refund & Cancellation Policy outlines the terms under which customers may request refunds or cancel their subscriptions to our compliance automation platform.
              </p>
            </section>

            {/* Section 2: Subscription Plans */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">2. Subscription Plans</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                REGULON offers the following subscription types:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Monthly Subscriptions:</strong> Billed monthly, cancel anytime</li>
                <li><strong>Annual Subscriptions:</strong> Billed yearly with discounted pricing</li>
                <li><strong>Enterprise Plans:</strong> Custom contracts with negotiated terms</li>
              </ul>
            </section>

            {/* Section 3: Free Trial */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">3. Free Trial Period</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We offer a 14-day free trial for new customers:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>No credit card required during trial</li>
                <li>Full access to platform features</li>
                <li>Cancel anytime before trial ends with no charges</li>
                <li>After trial, subscription auto-starts unless cancelled</li>
              </ul>
            </section>

            {/* Section 4: Refund Eligibility */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">4. Refund Eligibility</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">4.1 Monthly Subscriptions</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Refunds available within <strong>7 days</strong> of payment</li>
                <li>Pro-rated refunds for unused service period</li>
                <li>Must demonstrate technical issues or service unavailability</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">4.2 Annual Subscriptions</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Full refund within <strong>30 days</strong> of initial purchase</li>
                <li>After 30 days: pro-rated refund for unused months (minus 10% processing fee)</li>
                <li>Must not have processed more than 100 compliance documents</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">4.3 Non-Refundable Items</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>One-time setup fees</li>
                <li>Custom development work</li>
                <li>Third-party integration costs</li>
                <li>AI credits already consumed</li>
                <li>Professional services (consulting, training)</li>
              </ul>
            </section>

            {/* Section 5: Cancellation Process */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">5. Cancellation Process</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">5.1 How to Cancel</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                You can cancel your subscription at any time:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Go to Account Settings → Billing → Cancel Subscription</li>
                <li>Email support@regulon.ai with "Cancellation Request" in subject</li>
                <li>Contact customer support via in-app chat</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">5.2 Effective Date</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Monthly: Cancellation effective at end of current billing cycle</li>
                <li>Annual: Cancellation effective at end of current billing cycle (unless eligible for refund)</li>
                <li>No partial month refunds after grace period expires</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">5.3 Access After Cancellation</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Access continues until end of paid period</li>
                <li>Data exported automatically before account closure</li>
                <li>90-day grace period to reactivate (data retained)</li>
                <li>After 90 days: data permanently deleted per GDPR</li>
              </ul>
            </section>

            {/* Section 6: Refund Process */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">6. Refund Request Process</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">6.1 How to Request</h3>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                <li>Email refunds@regulon.ai with:
                  <ul className="list-disc list-inside ml-6 mt-2">
                    <li>Account email address</li>
                    <li>Reason for refund request</li>
                    <li>Screenshots of any technical issues (if applicable)</li>
                  </ul>
                </li>
                <li>Our team reviews within <strong>3 business days</strong></li>
                <li>If approved, refund processed within <strong>7-10 business days</strong></li>
                <li>Refund issued to original payment method</li>
              </ol>

              <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">6.2 Processing Time</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Credit/Debit Card: 5-10 business days</li>
                <li>Bank Transfer: 7-14 business days</li>
                <li>UPI/Digital Wallets: 3-5 business days</li>
              </ul>
            </section>

            {/* Section 7: Special Circumstances */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">7. Special Circumstances</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">7.1 Service Downtime</h3>
              <p className="text-muted-foreground leading-relaxed">
                If REGULON experiences more than <strong>4 hours</strong> of unplanned downtime in a billing cycle:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Automatic credit applied to next billing cycle</li>
                <li>Pro-rated refund available upon request</li>
                <li>Excludes scheduled maintenance (notified 48h in advance)</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">7.2 Data Breaches</h3>
              <p className="text-muted-foreground leading-relaxed">
                In case of confirmed data breach affecting your account:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                <li>Full refund of current billing period</li>
                <li>Free credit monitoring service for 12 months</li>
                <li>Incident report provided within 72 hours</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">7.3 Force Majeure</h3>
              <p className="text-muted-foreground leading-relaxed">
                No refunds for service interruptions due to events beyond our control (natural disasters, war, government actions, etc.)
              </p>
            </section>

            {/* Section 8: Enterprise Contracts */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">8. Enterprise Contracts</h2>
              <p className="text-muted-foreground leading-relaxed">
                Enterprise customers have custom refund terms outlined in their Master Service Agreement (MSA). Contact your account manager for details.
              </p>
            </section>

            {/* Section 9: Payment Disputes */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">9. Payment Disputes & Chargebacks</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                <strong>Before filing a chargeback:</strong>
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Contact our support team at billing@regulon.ai</li>
                <li>We resolve 95% of disputes within 48 hours</li>
                <li>Chargebacks may result in immediate account suspension</li>
                <li>Chargeback fees ($25) will be charged if dispute ruled in our favor</li>
              </ul>
            </section>

            {/* Section 10: Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">10. Contact Information</h2>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-muted-foreground mb-2"><strong>For refunds and cancellations:</strong></p>
                <ul className="list-none text-muted-foreground space-y-1">
                  <li>📧 Email: refunds@regulon.ai</li>
                  <li>💬 Support Chat: Available in dashboard (9 AM - 6 PM IST)</li>
                  <li>📞 Phone: +91-XXX-XXX-XXXX (Mon-Fri, 10 AM - 6 PM IST)</li>
                  <li>⏱️ Response Time: Within 24 hours (business days)</li>
                </ul>
              </div>
            </section>

            {/* Section 11: Policy Changes */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">11. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this refund policy. Customers will be notified via email <strong>30 days before</strong> changes take effect. Continued use after changes constitutes acceptance.
              </p>
            </section>

            {/* Section 12: Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">12. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                This policy is governed by the laws of India. Disputes will be resolved per the Terms of Service arbitration clause.
              </p>
            </section>
          </div>

          {/* Footer Notice */}
          <div className="mt-10 pt-6 border-t border-border/50">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-300">
                <strong>Legal Review Required:</strong> This document is a template and must be reviewed by qualified legal and financial advisors before use in production.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              <Link to="/disclaimers" className="text-primary hover:underline">Disclaimers</Link>
              <Link to="/compliance" className="text-primary hover:underline">Compliance Center</Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default RefundPolicy;
