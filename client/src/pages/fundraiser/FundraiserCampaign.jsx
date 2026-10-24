import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fundraiserService } from '../../services/fundraiserService';
import { Heart, Users, ShieldCheck, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const FundraiserCampaign = () => {
  const { slug } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState('500');
  const [donorName, setDonorName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await fundraiserService.getCampaignBySlug(slug);
        setCampaign(res.data.data);
      } catch (err) {
        toast.error('Failed to load campaign');
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [slug]);

  const handleDonate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fundraiserService.donate(campaign._id, {
        amount: Number(donationAmount),
        donorName: donorName || 'Anonymous',
      });
      toast.success('Thank you so much for your generous support!');
      setCampaign({
        ...campaign,
        amountRaised: (campaign.amountRaised || 0) + Number(donationAmount),
      });
      setDonorName('');
    } catch (err) {
      toast.error('Failed to complete donation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12 max-w-lg mx-auto bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <p className="text-slate-500">Fundraiser campaign not found.</p>
      </div>
    );
  }

  const percent = Math.min(100, Math.round(((campaign.amountRaised || 0) / (campaign.fundingGap || 1)) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <span className="px-3 py-1 bg-red-50 text-red-600 font-semibold text-xs rounded-full uppercase">
            Medical Emergency Fundraiser
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">{campaign.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Treatment: <span className="font-medium text-slate-700">{campaign.treatmentType}</span> • Hospital: <span className="font-medium text-slate-700">{campaign.hospitalName || 'Verified Medical Center'}</span>
          </p>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-bold text-slate-900">₹{(campaign.amountRaised || 0).toLocaleString()}</span>
            <span className="text-sm text-slate-500">raised of ₹{(campaign.fundingGap || campaign.totalRequired || 0).toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
            <div className="bg-green-600 h-full rounded-full transition-all" style={{ width: `${percent}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 text-right">{percent}% completed</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">The Story</h2>
            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed text-sm">
              {campaign.story}
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 h-fit space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center">
              <Heart className="w-5 h-5 text-red-500 mr-2" />
              Make a Contribution
            </h3>
            <form onSubmit={handleDonate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Your Name</label>
                <input
                  placeholder="Anonymous (or your name)"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="50"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium p-3 rounded-xl transition-colors shadow-sm"
              >
                {submitting ? 'Processing...' : 'Donate Now'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundraiserCampaign;
