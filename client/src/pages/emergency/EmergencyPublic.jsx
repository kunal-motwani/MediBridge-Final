import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, HeartPulse, Droplet, Phone, Stethoscope, AlertTriangle } from 'lucide-react';
import { profileService } from '../../services/profileService';

const EmergencyPublic = () => {
  const { healthId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await profileService.getPublicEmergencyProfile(healthId);
        setProfile(res.data.data);
      } catch (err) {
        setError('Emergency profile not found or user has not set it up.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [healthId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-500 font-medium">Loading emergency data...</div>;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-600 text-white rounded-t-2xl p-6 text-center">
          <HeartPulse className="w-16 h-16 mx-auto mb-3 opacity-90" />
          <h1 className="text-3xl font-bold mb-1">EMERGENCY MEDICAL INFO</h1>
          <p className="text-red-100 font-medium tracking-wide">ID: {healthId.toUpperCase()}</p>
        </div>

        <div className="bg-white rounded-b-2xl shadow-xl p-6 md:p-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8 pb-6 border-b border-gray-100">
            {profile.name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="flex items-start gap-4 p-4 bg-red-50 rounded-xl">
              <Droplet className="w-8 h-8 text-red-500 shrink-0" />
              <div>
                <p className="text-sm text-red-800 font-medium uppercase tracking-wider mb-1">Blood Group</p>
                <p className="text-2xl font-bold text-red-600">{profile.bloodGroup || 'Unknown'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl">
              <AlertTriangle className="w-8 h-8 text-orange-500 shrink-0" />
              <div>
                <p className="text-sm text-orange-800 font-medium uppercase tracking-wider mb-1">Allergies</p>
                <p className="text-lg font-bold text-orange-900">
                  {profile.allergies?.length > 0 ? profile.allergies.join(', ') : 'None Reported'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 border-b pb-2 mb-3">
                <Stethoscope className="text-blue-500" /> Chronic Conditions
              </h3>
              <p className="text-gray-700">
                {profile.chronicConditions?.length > 0 ? profile.chronicConditions.join(', ') : 'None Reported'}
              </p>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 border-b pb-2 mb-3">
                <HeartPulse className="text-green-500" /> Current Medications
              </h3>
              <p className="text-gray-700">
                {profile.currentMedications?.length > 0 ? profile.currentMedications.join(', ') : 'None Reported'}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
              <Phone className="text-indigo-500" /> Emergency Contacts
            </h3>
            {profile.emergencyContacts?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.emergencyContacts.map((contact, idx) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                    <p className="font-bold text-gray-900">{contact.name}</p>
                    <p className="text-sm text-gray-500 mb-2">{contact.relation}</p>
                    <a href={`tel:${contact.phone}`} className="text-lg font-medium text-blue-600 hover:underline">
                      {contact.phone}
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No emergency contacts provided.</p>
            )}
          </div>

          {profile.organDonor && (
            <div className="mt-8 bg-green-50 text-green-800 p-4 rounded-lg text-center font-bold">
              ⚕ Registered Organ Donor
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyPublic;
