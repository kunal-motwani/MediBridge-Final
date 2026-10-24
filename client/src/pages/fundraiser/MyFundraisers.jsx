import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fundraiserService } from '../../services/fundraiserService';
import { HeartHandshake, Share2, Plus, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const MyFundraisers = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fundraiserService.getMyCampaigns();
        setCampaigns(res.data.data || []);
      } catch (err) {
        toast.error('Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Fundraisers</h1>
          <p className="text-sm text-slate-500">Manage and track your medical crowdfunding campaigns</p>
        </div>
        <Link
          to="/fundraiser/create"
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Fundraiser
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800">No Active Campaigns</h3>
          <p className="text-slate-500 text-sm mt-1 mb-4">You have not created any fundraising campaigns yet.</p>
          <Link to="/fundraiser/create" className="text-blue-600 font-medium">
            Start a Fundraiser →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((c) => {
            const percent = Math.min(100, Math.round(((c.amountRaised || 0) / (c.fundingGap || 1)) * 100));
            return (
              <div key={c._id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg">{c.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Treatment: {c.treatmentType || 'General Care'}</p>
                  </div>
                  <Link
                    to={`/fundraiser/${c.shareSlug || c._id}`}
                    className="flex items-center text-xs text-blue-600 font-medium hover:underline bg-blue-50 px-3 py-1.5 rounded-lg"
                  >
                    View Public Page <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Raised: ₹{(c.amountRaised || 0).toLocaleString()}</span>
                    <span>Goal: ₹{(c.fundingGap || c.totalRequired || 0).toLocaleString()} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyFundraisers;
