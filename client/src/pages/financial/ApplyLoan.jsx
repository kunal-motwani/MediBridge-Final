import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, CheckCircle2, AlertCircle } from 'lucide-react';
import { financialService } from '../../services/financialService';
import toast from 'react-hot-toast';

const ApplyLoan = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    treatmentType: '',
    estimatedCost: '',
    amountRequested: '',
    monthlyIncome: '',
    coapplicantIncome: '0',
    existingEMIs: '0',
    employmentType: 'salaried',
    creditHistory: '1',
    gender: 'Male',
    married: 'No',
    dependents: '0',
    education: 'Graduate',
    loanAmountTerm: '12',
    propertyArea: 'Urban',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckEligibility = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await financialService.checkEligibility(formData);
      setResult(res.data.data);
    } catch (error) {
      toast.error('Failed to check eligibility');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    try {
      setLoading(true);
      await financialService.createLoanApplication(formData);
      toast.success('Loan application submitted successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Medical Loan Application</h1>
        <p className="text-sm text-gray-500 mt-1">Check your eligibility instantly using our ML-powered engine.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <form onSubmit={handleCheckEligibility} className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Treatment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Type</label>
                  <input type="text" name="treatmentType" required value={formData.treatmentType} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="e.g. Heart Surgery" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost (₹)</label>
                  <input type="number" name="estimatedCost" required value={formData.estimatedCost} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Requested (₹)</label>
                  <input type="number" name="amountRequested" required value={formData.amountRequested} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan Term (Months)</label>
                  <select name="loanAmountTerm" value={formData.loanAmountTerm} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white">
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                    <option value="24">24 Months</option>
                    <option value="36">36 Months</option>
                  </select>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 pt-4">Financial & Demographics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (₹)</label>
                  <input type="number" name="monthlyIncome" required value={formData.monthlyIncome} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Co-applicant Income (₹)</label>
                  <input type="number" name="coapplicantIncome" value={formData.coapplicantIncome} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Existing EMIs (₹)</label>
                  <input type="number" name="existingEMIs" value={formData.existingEMIs} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                  <select name="employmentType" value={formData.employmentType} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white">
                    <option value="salaried">Salaried</option>
                    <option value="self_employed">Self Employed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credit History (1=Good, 0=Bad)</label>
                  <select name="creditHistory" value={formData.creditHistory} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white">
                    <option value="1">1 - Good/Existing</option>
                    <option value="0">0 - Bad/None</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                  <select name="education" value={formData.education} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white">
                    <option value="Graduate">Graduate</option>
                    <option value="Not Graduate">Not Graduate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Area</label>
                  <select name="propertyArea" value={formData.propertyArea} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white">
                    <option value="Urban">Urban</option>
                    <option value="Semiurban">Semiurban</option>
                    <option value="Rural">Rural</option>
                  </select>
                </div>
              </div>

              {!result && (
                <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  <Calculator size={18} />
                  {loading ? 'Analyzing...' : 'Check Eligibility'}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-1">
          {result ? (
            <div className={`bg-white rounded-xl shadow-sm border p-6 ${result.finalDecision === 'approved' ? 'border-green-200' : result.finalDecision === 'partial' ? 'border-orange-200' : 'border-red-200'}`}>
              <div className="flex flex-col items-center text-center mb-6">
                {result.finalDecision === 'approved' ? (
                  <CheckCircle2 className="w-16 h-16 text-green-500 mb-3" />
                ) : result.finalDecision === 'partial' ? (
                  <AlertCircle className="w-16 h-16 text-orange-500 mb-3" />
                ) : (
                  <AlertCircle className="w-16 h-16 text-red-500 mb-3" />
                )}
                <h3 className="text-xl font-bold text-gray-900 capitalize">{result.finalDecision}</h3>
                <p className="text-sm text-gray-500 mt-1">Based on ML & Rule Engine</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-600">Requested:</span>
                  <span className="font-semibold text-gray-900">₹{formData.amountRequested}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-600">Approved Amount:</span>
                  <span className={`font-bold ${result.approvedAmount >= formData.amountRequested ? 'text-green-600' : 'text-orange-600'}`}>
                    ₹{result.approvedAmount}
                  </span>
                </div>
              </div>

              {result.finalDecision !== 'rejected' && (
                <button onClick={handleSubmitApplication} disabled={loading} className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                  Submit Application
                </button>
              )}
              
              <button onClick={() => setResult(null)} className="w-full py-2 mt-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                Recalculate
              </button>
            </div>
          ) : (
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 text-center">
              <Calculator className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-blue-900 mb-2">How it works</h3>
              <p className="text-sm text-blue-700 mb-4 text-left">
                1. We use a machine learning model to assess your profile.<br/><br/>
                2. If the full amount isn't approved, we'll suggest partial funding.<br/><br/>
                3. The remainder can be raised via our integrated crowdfunding platform.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplyLoan;
