import React from 'react';
import useAuthStore from '../../store/authStore';
import HealthIdCard from '../../components/shared/HealthIdCard';
import NFCWriter from '../../components/shared/NFCWriter';
import { Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

const HealthIdPage = () => {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(user?.healthId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">My Health ID</h1>
        <p className="text-slate-600">Your unique MediBridge Health ID card. Use this to quickly share your medical records with healthcare providers.</p>
      </div>

      <div className="max-w-2xl">
        <HealthIdCard user={user} />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={handleCopy}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
        >
          {copied ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
          <span>{copied ? 'Copied!' : 'Copy Health ID'}</span>
        </button>
        
        {user?.healthId && (
          <NFCWriter healthId={user.healthId} />
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
        <ul className="list-disc pl-5 text-blue-800 space-y-2">
          <li>Share your Health ID with doctors to grant them access to your records.</li>
          <li>In case of emergency, paramedics can scan the QR code to view your vital information.</li>
          <li>If you have an NFC-enabled smartphone, you can write your ID to an NFC tag (like a sticker or bracelet) for instant tap-to-scan access.</li>
        </ul>
      </div>
    </div>
  );
};

export default HealthIdPage;
