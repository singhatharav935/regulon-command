import React from 'react';
import { Upload, FileText, Landmark, Users, ShoppingCart, Database } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyDataStateProps {
  icon?: string;
  title: string;
  message: string;
  onImportClick?: () => void;
  showImportButton?: boolean;
  className?: string;
  /** Specific data type hint for contextual messaging */
  dataType?: 'bank' | 'invoices' | 'purchases' | 'payroll' | 'expenses' | 'general';
}

const DATA_TYPE_CONFIG: Record<string, { icon: React.ReactNode; hint: string }> = {
  bank: { icon: <Landmark className="w-5 h-5" />, hint: 'Upload a Bank Statement (CSV/Excel) to auto-populate this section' },
  invoices: { icon: <FileText className="w-5 h-5" />, hint: 'Create or import Sales Invoices to see your revenue data' },
  purchases: { icon: <ShoppingCart className="w-5 h-5" />, hint: 'Upload Purchase Bills or import GSTR-2B to populate this view' },
  payroll: { icon: <Users className="w-5 h-5" />, hint: 'Import your Salary Register (CSV/Excel) to compute PF, ESIC & TDS' },
  expenses: { icon: <FileText className="w-5 h-5" />, hint: 'Add expense vouchers to track indirect costs and TDS' },
  general: { icon: <Database className="w-5 h-5" />, hint: 'Upload financial documents to activate this module' },
};

export const EmptyDataState: React.FC<EmptyDataStateProps> = ({
  icon,
  title,
  message,
  onImportClick,
  showImportButton = true,
  className = '',
  dataType = 'general',
}) => {
  const config = DATA_TYPE_CONFIG[dataType] || DATA_TYPE_CONFIG.general;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center py-16 px-8 text-center ${className}`}
    >
      {/* Animated icon container */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/5 to-white/2 border border-white/8 flex items-center justify-center mb-5"
      >
        {icon ? (
          <span className="text-4xl">{icon}</span>
        ) : (
          <div className="text-muted-foreground/50">{config.icon}</div>
        )}
      </motion.div>

      <h3 className="text-base font-bold text-foreground/90 mb-1.5">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm mb-2">{message}</p>
      <p className="text-[10px] text-muted-foreground/60 max-w-xs mb-5">{config.hint}</p>

      {showImportButton && onImportClick && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onImportClick}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 bg-gradient-to-r from-cyan-500/20 to-blue-500/15 border border-cyan-500/25 text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/25 hover:border-cyan-500/40"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Financial Documents
        </motion.button>
      )}
    </motion.div>
  );
};

export const LimitedDataWarning: React.FC<{ message?: string }> = ({
  message = 'Limited data available. Results may not be fully accurate. Import more transactions for reliable analysis.',
}) => {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 text-[11px]"
      style={{
        background: 'rgba(234, 179, 8, 0.06)',
        border: '1px solid rgba(234, 179, 8, 0.2)',
        color: '#eab308',
      }}
    >
      <span className="text-sm">⚠️</span>
      <span>{message}</span>
    </div>
  );
};

export default EmptyDataState;
