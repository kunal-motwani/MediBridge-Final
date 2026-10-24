import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fundraiserService } from '../../services/fundraiserService';
import { HeartHandshake } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateFundraiser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    story: '',
    totalRequired: '',
    loanApproved: '0',
    treatmentType: '',
    hospitalName: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        totalRequired: Number(formData.totalRequired),
        loanApproved: Number(formData.loanApproved || 0),
        fundingGap: Math.max(0, Number(formData.totalRequired) - Number(formData.loanApproved || 0)),
      };
      await fundraiserService.createCampaign(payload);
      toast.success('Fundraiser campaign created successfully!');
      navigate('/fundraiser/my');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">Start a Medical Fundraiser</h1>
        <p className="text-sm text-slate-500 mt-1">
          Bridge the funding gap when treatment costs exceed personal funds or loan approvals.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Campaign Title</label>
          <input
            name="title"
            required
            placeholder="e.g. Help fund heart surgery for my mother"
            className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-blue-600"
            value={formData.title}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Treatment Type</label>
            <input
              name="treatmentType"
              required
              placeholder="e.g. Cardiac Bypass Surgery"
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-blue-600"
              value={formData.treatmentType}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Hospital Name</label>
            <input
              name="hospitalName"
              placeholder="e.g. Apollo Hospital"
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-blue-600"
              value={formData.hospitalName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Total Target Amount (₹)</label>
            <input
              type="number"
              name="totalRequired"
              required
              placeholder="e.g. 500000"
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-blue-600"
              value={formData.totalRequired}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Loan or Covered Amount (₹)</label>
            <input
              type="number"
              name="loanApproved"
              placeholder="e.g. 200000"
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-blue-600"
              value={formData.loanApproved}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Medical Story & Circumstances</label>
          <textarea
            name="story"
            required
            rows={5}
            placeholder="Explain why this medical help is needed, doctor's advice, and treatment timeline..."
            className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-blue-600"
            value={formData.story}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-3.5 rounded-xl transition-colors flex items-center justify-center"
        >
          {loading ? 'Creating Campaign...' : 'Launch Fundraiser Campaign'}
        </button>
      </form>
    </div>
  );
};

export default CreateFundraiser;
