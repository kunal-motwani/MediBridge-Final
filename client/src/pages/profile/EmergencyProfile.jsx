import React, { useState, useEffect } from 'react';
import { profileService } from '../../services/profileService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Plus, Trash2 } from 'lucide-react';

const EmergencyProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bloodGroup: '',
    allergies: [],
    chronicConditions: [],
    currentMedications: [],
    emergencyContacts: [],
    insuranceInfo: { provider: '', policyNumber: '' },
    isOrganDonor: false
  });

  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await profileService.getEmergencyProfile();
        if (res.data.data) {
          setFormData(res.data.data);
        }
        setLoading(false);
      } catch (err) {
        toast.error('Failed to load emergency profile');
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAddAllergy = () => {
    if (allergyInput.trim() && !formData.allergies.includes(allergyInput.trim())) {
      setFormData({ ...formData, allergies: [...formData.allergies, allergyInput.trim()] });
      setAllergyInput('');
    }
  };

  const handleAddCondition = () => {
    if (conditionInput.trim() && !formData.chronicConditions.includes(conditionInput.trim())) {
      setFormData({ ...formData, chronicConditions: [...formData.chronicConditions, conditionInput.trim()] });
      setConditionInput('');
    }
  };

  const removeArrayItem = (field, index) => {
    const newArray = [...formData[field]];
    newArray.splice(index, 1);
    setFormData({ ...formData, [field]: newArray });
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      currentMedications: [...formData.currentMedications, { name: '', dosage: '', frequency: '' }]
    });
  };

  const updateMedication = (index, field, value) => {
    const newMeds = [...formData.currentMedications];
    newMeds[index][field] = value;
    setFormData({ ...formData, currentMedications: newMeds });
  };

  const addContact = () => {
    setFormData({
      ...formData,
      emergencyContacts: [...formData.emergencyContacts, { name: '', relationship: '', phone: '' }]
    });
  };

  const updateContact = (index, field, value) => {
    const newContacts = [...formData.emergencyContacts];
    newContacts[index][field] = value;
    setFormData({ ...formData, emergencyContacts: newContacts });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileService.updateEmergencyProfile(formData);
      toast.success('Emergency profile updated');
    } catch (err) {
      toast.error('Failed to update emergency profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Emergency Medical Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-6">Basic & Vitals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Blood Group</label>
              <select 
                value={formData.bloodGroup || ''} 
                onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="">Select Blood Group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div className="flex items-center mt-6">
              <input 
                type="checkbox" 
                id="organDonor" 
                checked={formData.isOrganDonor || false} 
                onChange={(e) => setFormData({...formData, isOrganDonor: e.target.checked})}
                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="organDonor" className="ml-3 text-sm font-medium text-slate-700">Registered Organ Donor</label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-6">Medical History</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Allergies</label>
              <div className="flex mb-3">
                <input 
                  type="text" 
                  value={allergyInput} 
                  onChange={(e) => setAllergyInput(e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-l-lg outline-none" 
                  placeholder="E.g. Penicillin, Peanuts"
                />
                <button type="button" onClick={handleAddAllergy} className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.allergies?.map((allergy, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                    {allergy}
                    <button type="button" onClick={() => removeArrayItem('allergies', idx)} className="ml-2 text-red-600 hover:text-red-900">&times;</button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Chronic Conditions</label>
              <div className="flex mb-3">
                <input 
                  type="text" 
                  value={conditionInput} 
                  onChange={(e) => setConditionInput(e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-l-lg outline-none" 
                  placeholder="E.g. Asthma, Diabetes"
                />
                <button type="button" onClick={handleAddCondition} className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.chronicConditions?.map((cond, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800">
                    {cond}
                    <button type="button" onClick={() => removeArrayItem('chronicConditions', idx)} className="ml-2 text-amber-600 hover:text-amber-900">&times;</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Current Medications</h2>
            <button type="button" onClick={addMedication} className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium">
              <Plus className="w-4 h-4 mr-1" /> Add Medication
            </button>
          </div>
          <div className="space-y-4">
            {formData.currentMedications?.length === 0 && <p className="text-sm text-slate-500 italic">No current medications added.</p>}
            {formData.currentMedications?.map((med, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                <input type="text" placeholder="Medicine Name" value={med.name} onChange={(e) => updateMedication(idx, 'name', e.target.value)} className="flex-1 w-full px-3 py-2 border border-slate-300 rounded-md outline-none" />
                <input type="text" placeholder="Dosage" value={med.dosage} onChange={(e) => updateMedication(idx, 'dosage', e.target.value)} className="w-full sm:w-32 px-3 py-2 border border-slate-300 rounded-md outline-none" />
                <input type="text" placeholder="Frequency" value={med.frequency} onChange={(e) => updateMedication(idx, 'frequency', e.target.value)} className="w-full sm:w-48 px-3 py-2 border border-slate-300 rounded-md outline-none" />
                <button type="button" onClick={() => removeArrayItem('currentMedications', idx)} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="w-5 h-5" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Emergency Contacts</h2>
            <button type="button" onClick={addContact} className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium">
              <Plus className="w-4 h-4 mr-1" /> Add Contact
            </button>
          </div>
          <div className="space-y-4">
            {formData.emergencyContacts?.length === 0 && <p className="text-sm text-slate-500 italic">No emergency contacts added.</p>}
            {formData.emergencyContacts?.map((contact, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                <input type="text" placeholder="Contact Name" value={contact.name} onChange={(e) => updateContact(idx, 'name', e.target.value)} className="flex-1 w-full px-3 py-2 border border-slate-300 rounded-md outline-none" />
                <input type="text" placeholder="Relationship" value={contact.relationship} onChange={(e) => updateContact(idx, 'relationship', e.target.value)} className="w-full sm:w-40 px-3 py-2 border border-slate-300 rounded-md outline-none" />
                <input type="tel" placeholder="Phone Number" value={contact.phone} onChange={(e) => updateContact(idx, 'phone', e.target.value)} className="w-full sm:w-48 px-3 py-2 border border-slate-300 rounded-md outline-none" />
                <button type="button" onClick={() => removeArrayItem('emergencyContacts', idx)} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="w-5 h-5" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 pb-12">
          <button type="submit" disabled={saving} className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition shadow-md disabled:opacity-70">
            {saving ? 'Saving...' : 'Save Emergency Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmergencyProfile;
