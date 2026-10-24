import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield } from 'lucide-react';

const HealthIdCard = ({ user }) => {
  if (!user) return null;

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Shield className="w-32 h-32" />
      </div>
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">MediBridge Health ID</h2>
          <p className="text-blue-200 mb-6">Government of India</p>
          
          <div className="space-y-4">
            <div>
              <p className="text-blue-200 text-sm">Full Name</p>
              <p className="text-xl font-semibold">{user.firstName} {user.lastName}</p>
            </div>
            
            <div className="flex gap-8">
              <div>
                <p className="text-blue-200 text-sm">Health ID Number</p>
                <p className="text-lg font-mono tracking-wider">{user.healthId || 'XXXX-XXXX-XXXX-XXXX'}</p>
              </div>
              {user.bloodGroup && (
                <div>
                  <p className="text-blue-200 text-sm">Blood Group</p>
                  <p className="text-lg font-bold text-red-400">{user.bloodGroup}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded-xl shadow-inner">
          <QRCodeSVG 
            value={`${window.location.origin}/emergency/${user.healthId}`} 
            size={120} 
            level="H" 
          />
        </div>
      </div>
    </div>
  );
};

export default HealthIdCard;
