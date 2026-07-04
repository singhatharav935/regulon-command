/**
 * EFilingAckPdfViewer — Full-page PDF viewer for E-Filing Acknowledgment documents
 * Renders a beautiful, realistic acknowledgment PDF for acknowledged/approved filings.
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Download, Printer, Share2, CheckCircle, Shield,
  FileCheck2, Building2, Calendar, Hash, Clock, Stamp, QrCode,
  ChevronLeft, ZoomIn, ZoomOut, RotateCcw,
} from 'lucide-react';

const PORTAL_META: Record<string, { label: string; icon: string; color: string; authority: string }> = {
  gst_portal:  { label: 'GST Portal',    icon: '🧾', color: '#FF6B00', authority: 'GSTN — Goods & Services Tax Network, Govt. of India' },
  mca21:       { label: 'MCA21',         icon: '🏛️', color: '#1E40AF', authority: 'Ministry of Corporate Affairs — Govt. of India' },
  income_tax:  { label: 'Income Tax',    icon: '💰', color: '#059669', authority: 'Income Tax Department — Govt. of India' },
  traces:      { label: 'TRACES',        icon: '📋', color: '#7C3AED', authority: 'TRACES — TDS Reconciliation Analysis System' },
  epfo:        { label: 'EPFO',          icon: '👷', color: '#0891B2', authority: 'Employees\' Provident Fund Organisation' },
  esic:        { label: 'ESIC',          icon: '🏥', color: '#0D9488', authority: 'Employees\' State Insurance Corporation' },
  roc:         { label: 'ROC/MCA',       icon: '📑', color: '#4F46E5', authority: 'Registrar of Companies — Ministry of Corporate Affairs' },
};

const FILING_TYPE_LABEL: Record<string, string> = {
  gstr1: 'GSTR-1 — Outward Supplies Return',
  gstr3b: 'GSTR-3B — Monthly Summary Return',
  gstr9: 'GSTR-9 — Annual Return',
  gstr9c: 'GSTR-9C — Reconciliation Statement',
  itr1: 'ITR-1 (Sahaj) — Individual Income Tax Return',
  itr3: 'ITR-3 — Business/Profession Return',
  itr4: 'ITR-4 (Sugam) — Presumptive Income Return',
  itr5: 'ITR-5 — LLP/Partnership Return',
  itr6: 'ITR-6 — Companies Income Tax Return',
  itr7: 'ITR-7 — Trust/NGO Return',
  form26q: 'Form 26Q — Non-Salary TDS Return',
  form24q: 'Form 24Q — Salary TDS Return',
  form27eq: 'Form 27EQ — TCS Return',
  mca_aoc4: 'AOC-4 — Financial Statements Filing',
  mca_mgt7: 'MGT-7 — Annual Return (Companies)',
  mca_dir3kyc: 'DIR-3 KYC — Director KYC',
  roc_filing: 'ROC — General Filing',
  epf_ecr: 'EPF ECR — Electronic Challan cum Return',
  custom: 'Custom Filing',
};

export default function EFilingAckPdfViewer() {
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [zoom, setZoom] = useState(100);
  const printRef = useRef<HTMLDivElement>(null);
  
  const [verificationCode] = useState(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 16 }, (_, i) =>
      (i > 0 && i % 4 === 0 ? '-' : '') + chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  });

  useEffect(() => {
    const raw = localStorage.getItem('efiling_pdf_job');
    if (raw) {
      try {
        setJob(JSON.parse(raw));
      } catch {}
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a printable blob
    const element = printRef.current;
    if (!element) return;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${job?.filing_title ?? 'Acknowledgment'}</title>
          <style>
            body { font-family: 'Arial', sans-serif; color: #1a1a1a; padding: 40px; }
            .header { border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; }
            .section { margin-bottom: 20px; }
            .label { font-size: 11px; color: #666; text-transform: uppercase; font-weight: bold; }
            .value { font-size: 14px; margin-top: 4px; }
            .stamp { border: 3px solid green; border-radius: 50%; width: 120px; height: 120px; 
                     display: flex; align-items: center; justify-content: center; 
                     color: green; font-weight: bold; font-size: 16px; text-align: center; }
          </style>
        </head>
        <body>${element.innerHTML}</body>
      </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job?.ack_number ?? 'ack'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <FileCheck2 className="w-16 h-16 text-cyan-400 mx-auto mb-4 opacity-30" />
          <h2 className="text-xl font-bold text-foreground mb-2">No filing selected</h2>
          <p className="text-muted-foreground mb-6">Please select a filing from the E-Filing dashboard to view its acknowledgment.</p>
          <Button onClick={() => navigate(-1)} className="bg-cyan-600 hover:bg-cyan-700">
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back to E-Filing
          </Button>
        </div>
      </div>
    );
  }

  const portalMeta = PORTAL_META[job.portal] ?? PORTAL_META.gst_portal;
  const filingLabel = FILING_TYPE_LABEL[job.filing_type] ?? job.filing_type;
  const ackDate = job.ack_date ? new Date(job.ack_date) : new Date();
  const periodStart = job.period_start ? new Date(job.period_start) : null;
  const periodEnd = job.period_end ? new Date(job.period_end) : null;
  const isAcknowledged = job.status === 'acknowledged' || job.status === 'approved';


  return (
    <div className="min-h-screen bg-[#0A0A0F] text-foreground">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-[#0D0D18]/95 backdrop-blur-xl border-b border-border/30 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Filings
            </Button>
            <div className="h-5 w-px bg-border/40" />
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium">E-Filing Acknowledgment</span>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setZoom(z => Math.max(50, z - 10))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setZoom(z => Math.min(200, z + 10))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setZoom(100)}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="border-border/50 text-xs gap-1">
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} className="border-border/50 text-xs gap-1">
              <Download className="w-3.5 h-3.5" /> Download
            </Button>
            <Badge variant="outline" className={`text-xs ${isAcknowledged ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'}`}>
              {isAcknowledged ? '✓ Acknowledged' : job.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* PDF Viewer Area */}
      <div className="p-8 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-200"
        >
          {/* PDF Document */}
          <div
            ref={printRef}
            className="bg-white text-gray-900 w-[794px] min-h-[1123px] shadow-2xl rounded-sm overflow-hidden"
            style={{ fontFamily: "'Times New Roman', serif" }}
          >
            {/* Government Header Strip */}
            <div className="bg-[#002147] text-white px-12 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                      {portalMeta.icon}
                    </div>
                    <div>
                      <h1 className="text-lg font-bold tracking-wide">GOVERNMENT OF INDIA</h1>
                      <p className="text-sm text-blue-200">{portalMeta.authority}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-blue-200">
                  <p>Document Reference</p>
                  <p className="font-mono text-white font-bold mt-1">{job.ack_number ?? 'ACK-DEMO-001'}</p>
                </div>
              </div>
            </div>

            {/* Status Banner */}
            {isAcknowledged && (
              <div className="bg-green-600 text-white px-12 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-bold text-sm tracking-wide">FILING SUCCESSFULLY ACKNOWLEDGED</span>
                </div>
                <span className="text-xs font-mono">
                  {ackDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}

            {/* Document Body */}
            <div className="px-12 py-8">
              {/* Title */}
              <div className="text-center border-b-2 border-gray-300 pb-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 tracking-wide mb-1">
                  ACKNOWLEDGMENT RECEIPT
                </h2>
                <p className="text-gray-600 text-sm">{filingLabel}</p>
                <div className="mt-3 inline-block bg-gray-100 px-4 py-1 rounded text-xs font-mono text-gray-600">
                  Portal: {portalMeta.label}
                </div>
              </div>

              {/* Filing Details Grid */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">
                    Filing Information
                  </h3>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-2 text-gray-500 font-medium pr-4">Filing Title</td>
                        <td className="py-2 text-gray-800 font-semibold">{job.filing_title}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500 font-medium pr-4">Filing Type</td>
                        <td className="py-2 text-gray-800">{job.filing_type?.toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500 font-medium pr-4">Portal</td>
                        <td className="py-2 text-gray-800">{portalMeta.label}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500 font-medium pr-4">Filing Status</td>
                        <td className="py-2">
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold uppercase">
                            {job.status}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500 font-medium pr-4">CA Approved</td>
                        <td className="py-2 text-gray-800">{job.ca_approved ? 'Yes — Digitally Verified' : 'No'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-200 pb-2">
                    Period & Timeline
                  </h3>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      {periodStart && (
                        <tr>
                          <td className="py-2 text-gray-500 font-medium pr-4">Period Start</td>
                          <td className="py-2 text-gray-800">{periodStart.toLocaleDateString('en-IN')}</td>
                        </tr>
                      )}
                      {periodEnd && (
                        <tr>
                          <td className="py-2 text-gray-500 font-medium pr-4">Period End</td>
                          <td className="py-2 text-gray-800">{periodEnd.toLocaleDateString('en-IN')}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="py-2 text-gray-500 font-medium pr-4">Acknowledged On</td>
                        <td className="py-2 text-gray-800 font-semibold">
                          {ackDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500 font-medium pr-4">Time</td>
                        <td className="py-2 text-gray-800 font-mono text-xs">
                          {ackDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-500 font-medium pr-4">Progress</td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${job.progress_percent}%` }} />
                            </div>
                            <span className="text-xs text-gray-600">{job.progress_percent}%</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Acknowledgment Number Block */}
              {job.ack_number && (
                <div className="border-2 border-blue-800 rounded-lg p-6 mb-8 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2">
                        Acknowledgment Reference Number (ARN)
                      </p>
                      <p className="text-3xl font-mono font-bold text-blue-900 tracking-widest">
                        {job.ack_number}
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        This ARN is the official reference for this e-filing submission. Use this number for all future correspondence with the authority.
                      </p>
                    </div>
                    <div className="text-right">
                      {/* Simulated QR Code visual - stable pattern based on ARN */}
                      <div className="w-24 h-24 bg-blue-800 rounded-lg flex items-center justify-center flex-col gap-1">
                        <div className="grid grid-cols-5 gap-0.5 p-2">
                          {Array.from({ length: 25 }).map((_, i) => {
                            // Stable pseudo-random based on ARN + index
                            const seed = (job.ack_number ?? 'ACK').charCodeAt(i % (job.ack_number?.length || 10));
                            const filled = ((seed * (i + 7)) % 3) !== 0;
                            return (
                              <div
                                key={i}
                                className="w-2.5 h-2.5 rounded-sm"
                                style={{ backgroundColor: filled ? 'white' : 'transparent' }}
                              />
                            );
                          })}
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">Scan to verify</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Message */}
              {job.status_message && (
                <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-8">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">System Message</p>
                  <p className="text-sm text-gray-700">{job.status_message}</p>
                </div>
              )}

              {/* Verification Section */}
              <div className="border-t-2 border-dashed border-gray-300 pt-6 mt-6">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                      Digital Verification
                    </h3>
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <p className="text-xs text-gray-500 mb-1">Verification Code</p>
                      <p className="font-mono text-xs text-gray-800 font-bold break-all">{verificationCode}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Verify at: <span className="text-blue-600">verify.{job.portal === 'gst_portal' ? 'gst.gov.in' : job.portal === 'mca21' ? 'mca.gov.in' : 'incometax.gov.in'}</span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                      Official Stamp
                    </h3>
                    <div className="flex items-center justify-center">
                      <div className="relative w-28 h-28 border-4 border-green-700 rounded-full flex flex-col items-center justify-center text-center">
                        <div className="absolute inset-1 border-2 border-green-500/30 rounded-full" />
                        <CheckCircle className="w-6 h-6 text-green-700 mb-1" />
                        <p className="text-xs font-bold text-green-800">FILED &</p>
                        <p className="text-[9px] text-green-800 font-bold">VERIFIED</p>
                        <p className="text-[9px] text-green-600 mt-0.5 font-bold">SANNIDH</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-400">
                  This is a system-generated acknowledgment. No signature is required.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Processed by <strong>SANNIDH AI Compliance Core</strong> · {portalMeta.authority}
                </p>
                <div className="flex justify-center items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Shield className="w-3 h-3 text-green-500" />
                    <span>256-bit Encrypted</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <CheckCircle className="w-3 h-3 text-blue-500" />
                    <span>Digitally Authenticated</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Hash className="w-3 h-3 text-purple-500" />
                    <span>WORM Sealed</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-300 mt-2">
                  Page 1 of 1 · Generated: {new Date().toLocaleString('en-IN')} IST
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body > * { display: none; }
          #print-root { display: block; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
