import { motion } from "framer-motion";
import { Building2, Receipt, Landmark, Building, TrendingUp } from "lucide-react";

interface RegulatorExposure {
  regulator: string;
  status: 'active' | 'evaluated' | 'potential' | 'not_applicable';
  notes?: string;
}

interface RegulatoryExposurePanelProps {
  exposures: RegulatorExposure[];
}

const regulatorConfig: Record<string, { icon: React.ElementType; label: string; colorClass: string }> = {
  MCA: { icon: Building2, label: "Ministry of Corporate Affairs", colorClass: "regulator-mca" },
  GST: { icon: Receipt, label: "Goods & Services Tax", colorClass: "regulator-gst" },
  "Income Tax": { icon: Landmark, label: "Income Tax Department", colorClass: "regulator-it" },
  RBI: { icon: Building, label: "Reserve Bank of India", colorClass: "regulator-rbi" },
  SEBI: { icon: TrendingUp, label: "Securities and Exchange Board", colorClass: "regulator-sebi" },
};

const statusConfig: Record<string, { label: string; bgClass: string; textClass: string }> = {
  active: { label: "Active", bgClass: "bg-green-500/20", textClass: "text-green-400" },
  evaluated: { label: "Evaluated · Not Applicable", bgClass: "bg-muted/50", textClass: "text-muted-foreground" },
  potential: { label: "Potential", bgClass: "bg-yellow-500/20", textClass: "text-yellow-400" },
  not_applicable: { label: "Not Applicable", bgClass: "bg-muted/30", textClass: "text-muted-foreground" },
};

const RegulatoryExposurePanel = ({ exposures }: RegulatoryExposurePanelProps) => {
  // Ensure all 5 regulators are always shown
  const allRegulators = ["MCA", "GST", "Income Tax", "RBI", "SEBI"];
  
  const getExposure = (regulator: string) => {
    return exposures.find(e => e.regulator === regulator) || { regulator, status: 'potential' as const };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6 mb-8"
    >
      <h2 className="text-xl font-semibold text-foreground mb-6">Regulatory Exposure</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {allRegulators.map((regulator, index) => {
          const config = regulatorConfig[regulator];
          const exposure = getExposure(regulator);
          const status = statusConfig[exposure.status];
          const Icon = config.icon;
          
          return (
            <motion.div
              key={regulator}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className={`p-4 rounded-xl border bg-card/50 hover:bg-card/80 transition-all duration-300 border-${config.colorClass}/30`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-${config.colorClass}/20`}>
                  <Icon className={`w-5 h-5 text-${config.colorClass}`} />
                </div>
                <span className="font-semibold text-foreground">{regulator}</span>
              </div>
              
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{config.label}</p>
              
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.bgClass} ${status.textClass}`}>
                {status.label}
              </div>
              
              {exposure.notes && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{exposure.notes}</p>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default RegulatoryExposurePanel;
