import React, { useState, useEffect } from 'react';
import { SmartphoneNfc } from 'lucide-react';
import toast from 'react-hot-toast';

const SmartCardReader = ({ onRead }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(true);

  useEffect(() => {
    if (!('NDEFReader' in window)) {
      setNfcSupported(false);
    }
  }, []);

  const handleScan = async () => {
    if (!nfcSupported) {
      toast.error('Web NFC is not supported on this device/browser. Use Chrome on Android.');
      return;
    }

    try {
      setIsScanning(true);
      const ndef = new window.NDEFReader();
      await ndef.scan();
      toast.success('Ready to scan. Please tap the patient card to the back of your device.', { duration: 4000 });
      
      ndef.onreading = event => {
        const decoder = new TextDecoder();
        for (const record of event.message.records) {
          if (record.recordType === 'text') {
            const text = decoder.decode(record.data);
            if (text.startsWith('MB-')) {
              toast.success('Card read successfully!');
              onRead(text);
              setIsScanning(false);
            } else {
              toast.error('Invalid MediBridge card format.');
            }
          }
        }
      };

      ndef.onreadingerror = () => {
        toast.error('Cannot read card. Please try again.');
        setIsScanning(false);
      };
    } catch (error) {
      console.error(error);
      if (error.name === 'NotAllowedError') {
        toast.error('NFC permission denied.');
      } else {
        toast.error('Error starting NFC scan.');
      }
      setIsScanning(false);
    }
  };

  if (!nfcSupported) return null;

  return (
    <button
      type="button"
      onClick={handleScan}
      disabled={isScanning}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors border ${
        isScanning 
          ? 'bg-blue-50 border-blue-200 text-blue-600' 
          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
      }`}
      title="Tap smart card to read Health ID"
    >
      <SmartphoneNfc size={20} className={isScanning ? 'animate-pulse' : ''} />
      <span className="hidden sm:inline">
        {isScanning ? 'Scanning...' : 'Tap Card'}
      </span>
    </button>
  );
};

export default SmartCardReader;
