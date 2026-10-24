import React from 'react';

const StatCard = ({ icon: Icon, title, value, subtitle } = {}) => {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex items-center space-x-4">
      {Icon && (
        <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <div>
        {title && <h3 className="text-sm font-medium text-slate-500">{title}</h3>}
        {value && <p className="text-2xl font-semibold text-slate-800">{value}</p>}
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
