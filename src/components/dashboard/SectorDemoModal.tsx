/**
 * SECTOR DEMO MODAL
 * =================
 * "See Your Business Here" personalizer modal.
 * User enters company name + picks their sector.
 * Clicking Apply regenerates the entire demo dashboard with sector-specific data.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Sparkles, Building2, ChevronDown, CheckCircle2 } from "lucide-react";
import { ALL_SECTORS, generateSectorProfile } from "@/lib/autoSectorEngine";
import { useSectorDemo } from "@/contexts/SectorDemoContext";

export function SectorDemoModal() {
  const { isModalOpen, setModalOpen, setProfile } = useSectorDemo();
  const [companyName, setCompanyName] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [sectorSearch, setSectorSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const filteredSectors = useMemo(() =>
    ALL_SECTORS.filter(s => s.toLowerCase().includes(sectorSearch.toLowerCase())),
    [sectorSearch]
  );

  const handleApply = () => {
    if (!selectedSector) return;
    setGenerating(true);
    setDone(false);

    // Simulate brief generation animation then apply
    setTimeout(() => {
      const profile = generateSectorProfile(
        companyName.trim() || `${selectedSector} Company`,
        selectedSector
      );
      setProfile(profile);
      setDone(true);
      setTimeout(() => {
        setGenerating(false);
        setModalOpen(false);
        setDone(false);
      }, 800);
    }, 1200);
  };

  const handleReset = () => {
    setProfile(null);
    setCompanyName("");
    setSelectedSector("");
    setSectorSearch("");
  };

  if (!isModalOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-visible"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">See Your Business Here</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Personalise this demo with your company & sector</p>
              </div>
            </div>
            <button
              onClick={() => setModalOpen(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Company Name */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Company Name
                <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Sharma Industries Pvt Ltd"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>

            {/* Sector Dropdown */}
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                Industry Sector
                <span className="text-cyan-400 ml-1">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`w-full px-3.5 py-2.5 bg-slate-800 border rounded-xl text-sm text-left flex items-center justify-between transition-all ${
                    selectedSector
                      ? "border-cyan-500/40 text-white"
                      : "border-slate-700 text-slate-500"
                  } ${dropdownOpen ? "border-cyan-500/60 ring-1 ring-cyan-500/20" : ""}`}
                >
                  <span className="truncate">
                    {selectedSector || "Select your industry sector..."}
                  </span>
                  <ChevronDown className={`w-4 h-4 shrink-0 ml-2 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-50 w-full mt-1 bg-slate-850 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
                      style={{ background: "#0f172a" }}
                    >
                      {/* Search inside dropdown */}
                      <div className="p-2 border-b border-slate-800">
                        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800 rounded-lg">
                          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <input
                            type="text"
                            value={sectorSearch}
                            onChange={(e) => setSectorSearch(e.target.value)}
                            placeholder="Search sectors..."
                            className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Sector list */}
                      <div className="max-h-52 overflow-y-auto py-1 custom-scrollbar">
                        {filteredSectors.length === 0 && (
                          <p className="text-xs text-slate-500 text-center py-4">No sectors found</p>
                        )}
                        {filteredSectors.map((sector) => (
                          <button
                            key={sector}
                            type="button"
                            onClick={() => {
                              setSelectedSector(sector);
                              setDropdownOpen(false);
                              setSectorSearch("");
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                              selectedSector === sector
                                ? "bg-cyan-500/10 text-cyan-300"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            }`}
                          >
                            {sector}
                            {selectedSector === sector && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Info note */}
            <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl px-3.5 py-2.5">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <span className="text-cyan-400 font-medium">What changes:</span> Company name, all financial numbers (revenue, P&L, GST, TDS, cash flow), AI compliance alerts, and sector-relevant features across all dashboard tabs.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400 hover:text-white hover:border-slate-600 transition-all"
            >
              Reset to Default
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedSector || generating}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                !selectedSector
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-lg shadow-cyan-500/20"
              }`}
            >
              {done ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Applied!
                </>
              ) : generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900/40 border-t-slate-900 rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Apply Demo
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
