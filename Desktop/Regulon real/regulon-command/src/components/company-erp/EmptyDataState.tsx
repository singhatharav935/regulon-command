import React from 'react';

interface EmptyDataStateProps {
  icon?: string;
  title: string;
  message: string;
  onImportClick?: () => void;
  showImportButton?: boolean;
  className?: string;
}

export const EmptyDataState: React.FC<EmptyDataStateProps> = ({
  icon = '📊',
  title,
  message,
  onImportClick,
  showImportButton = true,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 text-center ${className}`}>
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white/90 mb-2">{title}</h3>
      <p className="text-sm text-white/50 max-w-md mb-6">{message}</p>
      {showImportButton && onImportClick && (
        <button
          onClick={onImportClick}
          className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
          }}
        >
          📥 Import Data
        </button>
      )}
    </div>
  );
};

export const LimitedDataWarning: React.FC<{ message?: string }> = ({
  message = 'Limited data available. Results may not be accurate. Import more transactions for reliable analysis.',
}) => {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg mb-4 text-sm"
      style={{
        background: 'rgba(234, 179, 8, 0.1)',
        border: '1px solid rgba(234, 179, 8, 0.3)',
        color: '#eab308',
      }}
    >
      <span className="text-lg">⚠️</span>
      <span>{message}</span>
    </div>
  );
};

export default EmptyDataState;
