import React, { useState, useEffect } from 'react';
import { profileService } from '../../services/profileService';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Key, ShieldCheck, Lock } from 'lucide-react';

const PatientProfile = () => {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    address: ''
  });

  // PIN settings state
  const [pinData, setPinData] = useState({
    oldPin: '',
    newPin: '',
    confirmPin: ''
  });
  const [savingPin, setSavingPin] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await profileService.getProfile();
        setFormData(res.data.data);
        setLoading(false);
      } catch (err) {
        toast.error('Failed to load profile');
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await profileService.updateProfile(formData);
      setUser(res.data.data);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (pinData.newPin.length !== 4 || !/^\d{4}$/.test(pinData.newPin)) {
      toast.error('New PIN must be exactly 4 numeric digits');
      return;
    }
    if (pinData.newPin !== pinData.confirmPin) {
      toast.error('New PIN and Confirm PIN do not match');
      return;
    }

    setSavingPin(true);
    try {
      await profileService.changeAccessPin({
        oldPin: pinData.oldPin,
        newPin: pinData.newPin
      });
      toast.success('4-Digit Access PIN updated successfully!');
      setPinData({ oldPin: '', newPin: '', confirmPin: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update access PIN');
    } finally {
      setSavingPin(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Patient Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your personal information and doctor verification PIN</p>
      </div>

      {/* Main Profile Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
              <input type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
              <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input type="email" name="email" value={formData.email || ''} className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg outline-none" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
              <input type="date" name="dob" value={formData.dob ? formData.dob.split('T')[0] : ''} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
              <select name="gender" value={formData.gender || ''} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none">
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
              <textarea name="address" value={formData.address || ''} onChange={handleChange} rows="3" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"></textarea>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-70 shadow-sm">
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* 🔐 Access PIN Configuration Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Key size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Record Access PIN</h2>
            <p className="text-xs text-slate-500">
              Set or update your 4-digit Master PIN. Doctors enter this code to verify your verbal consent and gain 24-hr access to your records.
            </p>
          </div>
        </div>

        <form onSubmit={handlePinSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Current PIN <span className="text-slate-400 font-normal">(demo: 1234)</span>
              </label>
              <input
                type="password"
                maxLength={4}
                value={pinData.oldPin}
                onChange={(e) => setPinData({ ...pinData, oldPin: e.target.value })}
                placeholder="••••"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-center font-mono text-lg tracking-widest focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">New 4-Digit PIN</label>
              <input
                type="password"
                maxLength={4}
                value={pinData.newPin}
                onChange={(e) => setPinData({ ...pinData, newPin: e.target.value })}
                placeholder="••••"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-center font-mono text-lg tracking-widest focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm New PIN</label>
              <input
                type="password"
                maxLength={4}
                value={pinData.confirmPin}
                onChange={(e) => setPinData({ ...pinData, confirmPin: e.target.value })}
                placeholder="••••"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-center font-mono text-lg tracking-widest focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span>PIN is securely encrypted with bcrypt. Never share your password.</span>
            </div>
            <button
              type="submit"
              disabled={savingPin || !pinData.newPin || pinData.newPin.length !== 4}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              {savingPin ? 'Updating...' : 'Update Access PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientProfile;
