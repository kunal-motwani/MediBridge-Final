import React from 'react';

const EmptyState = ({ icon: Icon, message, actionButton } = {}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
      {Icon && (
        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
      )}
      {message && <p className="text-slate-600 mb-6 text-center">{message}</p>}
      {actionButton && actionButton}
    </div>
  );
};

export default EmptyState;
