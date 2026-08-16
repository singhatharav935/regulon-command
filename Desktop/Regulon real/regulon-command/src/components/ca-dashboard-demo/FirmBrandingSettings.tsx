/**
 * FirmBrandingSettings
 * ====================
 * White-Label Branding (Audit Report — Level 5, P3).
 * Lets the CA upload their firm logo + name.
 * Persists to localStorage. Shows on dashboard header and PDF exports.
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle2, Building2, Palette, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface FirmBranding {
  firmName: string;
  caName: string;
  logoDataUrl: string | null;
  primaryColor: string;
  tagline: string;
}

const STORAGE_KEY = 'sannidh_firm_branding';

export function loadFirmBranding(): FirmBranding {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    firmName: '',
    caName: '',
    logoDataUrl: null,
    primaryColor: '#6366f1',
    tagline: 'Powered by SANNIDH AI',
  };
}

export function saveFirmBranding(branding: FirmBranding): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
}

export default function FirmBrandingSettings() {
  const [branding, setBranding] = useState<FirmBranding>(loadFirmBranding);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error('Logo too large', { description: 'Please upload an image under 500KB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBranding(prev => ({ ...prev, logoDataUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    saveFirmBranding(branding);
    setSaving(false);
    toast.success('Branding Saved', {
      description: `Your firm "${branding.firmName || 'SANNIDH'}" branding is now active on the dashboard and PDFs.`,
    });
    // Trigger header re-render across the app
    window.dispatchEvent(new CustomEvent('sannidh:branding-updated', { detail: branding }));
  };

  const handleReset = () => {
    const defaultBranding: FirmBranding = {
      firmName: '', caName: '', logoDataUrl: null,
      primaryColor: '#6366f1', tagline: 'Powered by SANNIDH AI',
    };
    setBranding(defaultBranding);
    saveFirmBranding(defaultBranding);
    toast.info('Branding reset to defaults');
    window.dispatchEvent(new CustomEvent('sannidh:branding-updated', { detail: defaultBranding }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-[900px]"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <Palette className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            White-Label Firm Branding
          </h2>
          <p className="text-sm text-muted-foreground">
            Your firm's logo and name appear on the dashboard header and all exported PDFs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo Upload */}
        <Card className="bg-card/40 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Upload className="w-4 h-4 text-purple-400" /> Firm Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className="border-2 border-dashed border-border/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
              onClick={() => fileRef.current?.click()}
            >
              {branding.logoDataUrl ? (
                <div className="relative">
                  <img
                    src={branding.logoDataUrl}
                    alt="Firm Logo"
                    className="max-h-20 max-w-full object-contain rounded"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); setBranding(prev => ({ ...prev, logoDataUrl: null })); }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <>
                  <Building2 className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    Click to upload your firm logo<br />
                    <span className="text-[10px]">PNG / SVG / JPG — Max 500KB</span>
                  </p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </CardContent>
        </Card>

        {/* Firm Details */}
        <Card className="bg-card/40 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" /> Firm Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Firm / Practice Name</label>
              <Input
                placeholder="e.g. Sharma & Associates, Chartered Accountants"
                value={branding.firmName}
                onChange={e => setBranding(prev => ({ ...prev, firmName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Your Name (CA)</label>
              <Input
                placeholder="e.g. CA Rahul Sharma, FCA"
                value={branding.caName}
                onChange={e => setBranding(prev => ({ ...prev, caName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tagline on PDF Footer</label>
              <Input
                placeholder="e.g. Powered by SANNIDH AI"
                value={branding.tagline}
                onChange={e => setBranding(prev => ({ ...prev, tagline: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Brand Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={e => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-10 h-9 rounded border border-border/50 cursor-pointer bg-transparent"
                />
                <span className="text-xs text-muted-foreground font-mono">{branding.primaryColor}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Preview */}
      <Card className="bg-card/20 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground">Live Preview — Dashboard Header</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{ background: `${branding.primaryColor}15`, borderLeft: `3px solid ${branding.primaryColor}` }}
          >
            {branding.logoDataUrl ? (
              <img src={branding.logoDataUrl} alt="Logo" className="h-8 w-8 object-contain rounded" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ background: branding.primaryColor }}
              >
                {(branding.firmName || 'S').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-bold text-sm text-foreground">{branding.firmName || 'Your Firm Name'}</p>
              <p className="text-xs text-muted-foreground">{branding.caName || 'CA Name'} · {branding.tagline}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Branding'}
        </Button>
        <Button variant="ghost" onClick={handleReset} className="text-muted-foreground">
          Reset to Defaults
        </Button>
      </div>
    </motion.div>
  );
}
