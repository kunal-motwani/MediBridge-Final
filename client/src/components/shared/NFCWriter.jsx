import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const NFCWriter = ({ healthId }) => {
  const [status, setStatus] = useState('idle'); // idle, waiting, success, error

  const writeNfc = async () => {
    if (!('NDEFReader' in window)) {
      toast.error('Web NFC is not supported on this device/browser.');
      return;
    }

    try {
      setStatus('waiting');
      const ndef = new window.NDEFReader();
      await ndef.write({
        records: [{ recordType: 'url', data: `${window.location.origin}/emergency/${healthId}` }]
      });
      setStatus('success');
      toast.success('Successfully written to NFC tag!');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setStatus('error');
      toast.error('Failed to write to NFC tag.');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <button
      onClick={writeNfc}
      disabled={status === 'waiting'}
      className="flex items-center justify-center space-x-2 w-full sm:w-auto px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition disabled:opacity-70"
    >
      <Activity className={`w-5 h-5 ${status === 'waiting' ? 'animate-pulse' : ''}`} />
      <span>
        {status === 'idle' && 'Write to NFC Tag'}
        {status === 'waiting' && 'Approach NFC Tag...'}
        {status === 'success' && 'Written Successfully!'}
        {status === 'error' && 'Write Failed'}
      </span>
    </button>
  );
};

export default NFCWriter;
