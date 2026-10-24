import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { financialService } from '../../services/financialService';
import { Landmark, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const LoanHistory = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const res = await financialService.getMyApplications();
        setLoans(res.data.data || []);
      } catch (err) {
        toast.error('Failed to load loan applications');
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Loan Applications</h1>
          <p className="text-sm text-slate-500">Track and manage your medical financing applications</p>
        </div>
        <Link
          to="/financial/apply"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          New Application
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : loans.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <Landmark className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800">No Applications Yet</h3>
          <p className="text-slate-500 text-sm mt-1 mb-4">You have not submitted any medical loan applications.</p>
          <Link to="/financial/apply" className="text-blue-600 font-medium">
            Check Your Eligibility Now →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {loans.map((loan) => (
            <div key={loan._id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 capitalize">
                    {loan.status || 'Submitted'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(loan.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900">{loan.treatmentType || 'Medical Treatment'}</h3>
                <p className="text-sm text-slate-500">
                  Requested: ₹{loan.amountRequested?.toLocaleString()} • Estimated Cost: ₹{loan.estimatedCost?.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Approved</p>
                <p className="text-lg font-bold text-slate-900">
                  ₹{loan.approvedAmount ? loan.approvedAmount.toLocaleString() : '0'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoanHistory;
