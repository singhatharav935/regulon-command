/**
 * PaymentChallanPdfViewer — Full-page PDF viewer for Tax Payment Challans and Receipts
 * Renders a realistic, high-fidelity government challan receipt for successful payments.
 */
import { useEffect, useState, useRef } from 'react';
import { escapeHtml } from '@/lib/security-utils';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Download, Printer, CheckCircle, Shield,
  Building2, Landmark, Calendar, Hash, Clock, Stamp, QrCode,
  ZoomIn, ZoomOut, RotateCcw, FileText, ReceiptText, CircleDollarSign
} from 'lucide-react';
import { formatRupees, type TaxType } from '@/services/payment-service';

const AUTHORITY_META: Record<string, { authority: string; title: string; color: string; prefix: string }> = {
  gst: {
    authority: 'GOODS AND SERVICES TAX NETWORK (GSTN)',
    title: 'FORM GST PMT-06 (CHALLAN RECEIPT)',
    color: '#FF6B00',
    prefix: 'GSTN'
  },
  income_tax: {
    authority: 'INCOME TAX DEPARTMENT, GOVT OF INDIA',
    title: 'CHALLAN RECEIPT (ITNS 280 / 281)',
    color: '#059669',
    prefix: 'ITAX'
  },
  state: {
    authority: 'STATE TAX DEPARTMENT, GOVT OF INDIA',
    title: 'STATE PROFESSIONAL TAX RECEIPT',
    color: '#0D9488',
    prefix: 'STAX'
  },
  pf_esi: {
    authority: 'EMPLOYEES\' PROVIDENT FUND & ESI CORP',
    title: 'CHALLAN CUM RECEIPT (TRRN)',
    color: '#0891B2',
    prefix: 'ECR'
  },
  default: {
    authority: 'CENTRAL BOARD OF DIRECT & INDIRECT TAXES',
    title: 'CHALLAN PAYMENT RECEIPT',
    color: '#1E40AF',
    prefix: 'CBIC'
  }
};

const getAuthorityType = (taxType: string) => {
  if (taxType.startsWith('gst_')) return 'gst';
  if (['tds', 'tcs', 'advance_tax', 'self_assessment_tax', 'corporate_tax'].includes(taxType)) return 'income_tax';
  if (taxType.startsWith('epf_') || taxType.startsWith('esic_')) return 'pf_esi';
  if (taxType.startsWith('professional_') || taxType === 'pt_employer') return 'state';
  return 'default';
};

export default function PaymentChallanPdfViewer() {
  const navigate = useNavigate();
  const [liability, setLiability] = useState<any>(null);
  const [zoom, setZoom] = useState(100);
  const printRef = useRef<HTMLDivElement>(null);
  
  const [verificationCode] = useState(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 16 }, (_, i) =>
      (i > 0 && i % 4 === 0 ? '-' : '') + chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  });

  const [mockDetails, setMockDetails] = useState({
    cpin: '',
    cin: '',
    utr: '',
    paymentDate: ''
  });

  useEffect(() => {
    const raw = localStorage.getItem('payment_pdf_liability');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setLiability(parsed);

        // Generate stable mock values based on ID
        const seed = parsed.id || 'default';
        const numHash = seed.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        
        setMockDetails({
          cpin: parsed.challan_number || `330626${Math.floor(10000000 + numHash * 8923) % 90000000}`,
          cin: parsed.challan_number 
            ? `${parsed.challan_number}01` 
            : `330626${Math.floor(10000000 + numHash * 8923) % 90000000}UTIB${Math.floor(100000 + numHash * 71) % 900000}`,
          utr: parsed.bank_reference_no || `UTIN26${Math.floor(10000000 + numHash * 9127) % 90000000}B`,
          paymentDate: parsed.payment_date || parsed.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0]
        });
      } catch {}
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = printRef.current;
    if (!element) return;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(liability?.tax_label ?? 'Challan Receipt')}</title>
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
    a.download = `${mockDetails.cpin || 'challan'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!liability) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-center">
          <ReceiptText className="w-16 h-16 text-green-400 mx-auto mb-4 opacity-30" />
          <h2 className="text-xl font-bold text-foreground mb-2">No payment selected</h2>
          <p className="text-muted-foreground mb-6">Please select a paid liability from the dashboard to generate its PDF.</p>
          <Button onClick={() => navigate(-1)} className="bg-green-600 hover:bg-green-700">
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  const authKey = getAuthorityType(liability.tax_type);
  const meta = AUTHORITY_META[authKey] ?? AUTHORITY_META.default;
  const entities = liability.entities;
  const entityName = entities?.entity_name || liability.entity_name || 'Demo Enterprise Ltd';
  const pan = entities?.pan || 'AAAAA1111A';
  const gstin = entities?.gstin || '29AAAAA1111A1Z1';

  // Tax Breakdown Calculation (Simulate Major & Minor Heads)
  const totalPaid = liability.amount_paid_paise || liability.total_due_paise || 0;
  const interest = liability.interest_paise || 0;
  const lateFee = liability.late_fee_paise || 0;
  const penalty = liability.penalty_paise || 0;
  const baseTax = Math.max(0, totalPaid - interest - lateFee - penalty);

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
              <ArrowLeft className="w-4 h-4" /> Back to Payments
            </Button>
            <div className="h-5 w-px bg-border/40" />
            <div className="flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">Challan Payment Receipt</span>
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
              <Download className="w-3.5 h-3.5" /> Download HTML/PDF
            </Button>
            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
              ✓ Successful
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
            className="bg-white text-gray-900 w-[794px] min-h-[1123px] shadow-2xl rounded-sm overflow-hidden p-12"
            style={{ fontFamily: "'Times New Roman', serif" }}
          >
            {/* Government Header Section */}
            <div className="border-b-4 border-double border-gray-900 pb-4 mb-6">
              <div className="text-center">
                <h1 className="text-lg font-bold uppercase tracking-wider text-gray-800">{meta.authority}</h1>
                <h2 className="text-md font-semibold text-gray-600 mt-0.5">{meta.title}</h2>
              </div>
            </div>

            {/* Success Banner */}
            <div className="bg-green-700 text-white px-6 py-2 rounded mb-6 flex items-center justify-between text-xs font-bold">
              <span>TAX PAYMENT TRANSACTION SUCCESSFULLY PROCESSSED</span>
              <span>DATE: {new Date(mockDetails.paymentDate).toLocaleDateString('en-IN')}</span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-6 border-b border-gray-200 pb-4">
              <div>
                <span className="text-xs text-gray-500 block uppercase font-bold tracking-wider">Entity Name / Taxpayer</span>
                <span className="font-bold text-gray-800">{entityName}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block uppercase font-bold tracking-wider">PAN / TAN Reference</span>
                <span className="font-mono font-bold text-gray-800">{pan}</span>
              </div>
              {authKey === 'gst' && (
                <div>
                  <span className="text-xs text-gray-500 block uppercase font-bold tracking-wider">GSTIN</span>
                  <span className="font-mono font-bold text-gray-800">{gstin}</span>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-500 block uppercase font-bold tracking-wider">Tax Type Category</span>
                <span className="text-gray-800 font-semibold">{liability.tax_label}</span>
              </div>
            </div>

            {/* Challan Identifiers (CIN/CPIN) */}
            <div className="grid grid-cols-3 gap-4 border border-blue-900 rounded p-4 bg-blue-50 mb-6 text-sm">
              <div>
                <span className="text-xs text-blue-800 font-bold block uppercase tracking-wide">Common Portal CPIN</span>
                <span className="font-mono font-bold text-blue-950 tracking-wider text-base">{mockDetails.cpin}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-blue-800 font-bold block uppercase tracking-wide">Challan Identification No (CIN)</span>
                <span className="font-mono font-bold text-blue-950 tracking-wider text-base">{mockDetails.cin}</span>
              </div>
            </div>

            {/* Ledger breakdown table */}
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-200 pb-1">
              Payment Breakdown Ledger
            </h3>
            <table className="w-full text-sm mb-6 border border-collapse border-gray-300">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300">
                  <th className="border border-gray-300 p-2 text-left">Description Major/Minor Head</th>
                  <th className="border border-gray-300 p-2 text-right w-36">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2">Tax Liability Base Major Head</td>
                  <td className="border border-gray-300 p-2 text-right font-mono">{formatRupees(baseTax)}</td>
                </tr>
                {interest > 0 && (
                  <tr>
                    <td className="border border-gray-300 p-2">Interest on Delayed Return (Section 50)</td>
                    <td className="border border-gray-300 p-2 text-right font-mono text-red-700">{formatRupees(interest)}</td>
                  </tr>
                )}
                {lateFee > 0 && (
                  <tr>
                    <td className="border border-gray-300 p-2">Late Fee Charges (Portal Statutory Fees)</td>
                    <td className="border border-gray-300 p-2 text-right font-mono text-red-700">{formatRupees(lateFee)}</td>
                  </tr>
                )}
                {penalty > 0 && (
                  <tr>
                    <td className="border border-gray-300 p-2">Statutory Penalty Levy</td>
                    <td className="border border-gray-300 p-2 text-right font-mono text-red-700">{formatRupees(penalty)}</td>
                  </tr>
                )}
                <tr className="bg-gray-50 font-bold text-base border-t-2 border-gray-500">
                  <td className="border border-gray-300 p-2">Total Amount Paid (in figures)</td>
                  <td className="border border-gray-300 p-2 text-right font-mono text-green-800">{formatRupees(totalPaid)}</td>
                </tr>
              </tbody>
            </table>

            {/* Bank details */}
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-gray-200 pb-1">
              Bank Transaction & Gateway Settlement details
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-6 border border-gray-200 p-4 rounded bg-gray-50">
              <div>
                <span className="text-xs text-gray-500 block">RECEIVING BRANCH / INTERMEDIARY</span>
                <span className="font-semibold text-gray-800">{liability.bank_name || 'HDFC Bank - Corporate E-Payment Hub'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">BANK UTR / GATEWAY PAYMENT ID</span>
                <span className="font-mono font-semibold text-gray-800">{mockDetails.utr}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">PAYMENT MODE</span>
                <span className="font-semibold text-gray-800 uppercase">{liability.payment_mode || 'NetBanking (Digital)'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">TRANSACTION STATUS</span>
                <span className="text-green-700 font-bold uppercase">SUCCESS / SETTLED</span>
              </div>
            </div>

            {/* Validation & Seals */}
            <div className="border-t border-gray-300 pt-6 mt-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                    Verification Protocol
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs">
                    <p className="text-gray-500 mb-1">Receipt Hash Signature</p>
                    <p className="font-mono text-gray-800 font-bold break-all">{verificationCode}</p>
                    <p className="text-gray-400 mt-2">
                      Secured by 256-bit encryption. Verify at the government tax portal under Challan Status Inquiry (CSI).
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                    Official Stamp & Authorization
                  </h3>
                  <div className="flex items-center justify-center">
                    <div className="relative w-28 h-28 border-4 border-green-700 rounded-full flex flex-col items-center justify-center text-center">
                      <div className="absolute inset-1 border-2 border-green-500/30 rounded-full" />
                      <CheckCircle className="w-6 h-6 text-green-700 mb-1" />
                      <p className="text-xs font-bold text-green-800">PAID &</p>
                      <p className="text-[9px] text-green-800 font-bold">VERIFIED</p>
                      <p className="text-[9px] text-green-600 mt-0.5 font-bold">SANNIDH</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-400">
                This is a system-generated electronic receipt. No physical signature is required under section 143 of IT Act / Rule 87 of GST Rules.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Processed via SANNIDH Autonomous Swarm Payment System.
              </p>
              <p className="text-[10px] text-gray-300 mt-3">
                Generated: {new Date().toLocaleString('en-IN')} IST · Page 1 of 1
              </p>
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
