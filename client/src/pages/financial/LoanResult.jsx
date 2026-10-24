import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';

const LoanResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="text-center py-12 max-w-lg mx-auto bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <p className="text-slate-500 mb-4">No recent eligibility evaluation found.</p>
        <Link to="/financial/apply" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium">
          Check Loan Eligibility
        </Link>
      </div>
    );
  }

  const { eligible, approvedAmount, interestRate, tenureMonths, estimatedEMI, ruleScore, mlScore } = result;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center space-y-4">
        {eligible ? (
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        ) : (
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <XCircle className="w-10 h-10" />
          </div>
        )}

        <h1 className="text-2xl font-bold text-slate-900">
          {eligible ? 'Pre-Approved for Medical Loan!' : 'Application Under Manual Review'}
        </h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          {eligible 
            ? 'Based on your financial profile and dual-scoring validation, you qualify for healthcare financing.'
            : 'Your initial automated score requires extra verification, or you can launch a medical fundraiser campaign.'}
        </p>

        {eligible && (
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl my-6 text-left">
            <div>
              <p className="text-xs text-slate-400">Approved Amount</p>
              <p className="text-lg font-bold text-blue-600">₹{approvedAmount?.toLocaleString() || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Interest Rate</p>
              <p className="text-lg font-bold text-slate-800">{interestRate || '8.5'}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Estimated EMI</p>
              <p className="text-lg font-bold text-slate-800">₹{estimatedEMI?.toLocaleString() || 'N/A'}/mo</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            to="/financial/history"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            View Loan History
          </Link>
          <Link
            to="/fundraiser/create"
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            <HeartHandshake className="w-4 h-4 mr-2" />
            Bridge Funding Gap with Fundraiser
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoanResult;
