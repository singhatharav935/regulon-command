import { useState, useEffect } from "react";
import { X, Cookie, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const CONSENT_KEY = "sannidh_cookie_consent";

export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const saveConsent = (consent: Omit<CookieConsent, "necessary" | "timestamp">) => {
    const fullConsent: CookieConsent = {
      necessary: true,
      ...consent,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(fullConsent));
    setShowBanner(false);

    window.dispatchEvent(
      new CustomEvent("cookieConsentChanged", { detail: fullConsent })
    );
  };

  const acceptAll = () => saveConsent({ analytics: true, marketing: true });
  const acceptNecessaryOnly = () => saveConsent({ analytics: false, marketing: false });

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none"
      >
        <div className="max-w-6xl mx-auto pointer-events-auto">
          <div className="bg-card border-2 border-border rounded-lg shadow-2xl p-6 md:p-8">
            <div className="flex items-start gap-4">
              <Cookie className="h-6 w-6 text-cyan-500 flex-shrink-0 mt-1" />
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  Cookie Consent
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4">
                  We use cookies to enhance your experience. By clicking "Accept All", you consent to our use of cookies.
                  {" "}
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-cyan-500 hover:underline font-medium"
                  >
                    {showDetails ? "Hide details" : "Learn more"}
                  </button>
                </p>

                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mb-4 space-y-2"
                  >
                    <div className="bg-muted/50 rounded p-2">
                      <h4 className="text-xs font-semibold">✅ Necessary (Required)</h4>
                      <p className="text-xs text-muted-foreground">Auth, security, core functionality</p>
                    </div>
                    <div className="bg-muted/50 rounded p-2">
                      <h4 className="text-xs font-semibold">📊 Analytics (Optional)</h4>
                      <p className="text-xs text-muted-foreground">Google Analytics for improvement</p>
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-2">
                  <Button onClick={acceptAll} className="bg-cyan-600 hover:bg-cyan-700">Accept All</Button>
                  <Button onClick={acceptNecessaryOnly} variant="outline">Necessary Only</Button>
                </div>

                <p className="text-xs text-muted-foreground mt-2">GDPR & DPDP Act 2023 compliant</p>
              </div>

              <button onClick={() => setShowBanner(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function getCookieConsent(): CookieConsent | null {
  const consent = localStorage.getItem(CONSENT_KEY);
  return consent ? JSON.parse(consent) : null;
}

export function hasConsented(type: "necessary" | "analytics" | "marketing"): boolean {
  const consent = getCookieConsent();
  return type === "necessary" || consent?.[type] === true;
}
