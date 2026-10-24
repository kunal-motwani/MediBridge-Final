import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Stethoscope, FileText, UserCheck } from 'lucide-react';
import { hospitalService } from '../../services/hospitalService';
import { appointmentService } from '../../services/appointmentService';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const BookAppointment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [hospital, setHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    preferredDate: '',
    specialist: '',
    doctorId: '',
    preferredTime: '',
    additionalNotes: ''
  });

  const timeOptions = ['Morning', 'Afternoon', 'Evening'];

  const defaultSpecialties = [
    'Dental', 'OPD', 'Orthopedics', 'Cardiology', 'Dermatology', 'Neurology', 'Pediatrics', 'General Medicine'
  ];

  useEffect(() => {
    const fetchHospital = async () => {
      try {
        const res = await hospitalService.getHospitalById(id);
        const hosp = res.data.data;
        setHospital(hosp);
        setDoctors(hosp.doctors || []);
      } catch (err) {
        toast.error('Failed to load hospital details');
        navigate('/hospitals');
      } finally {
        setLoading(false);
      }
    };
    fetchHospital();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      // If doctor selected, automatically match their specialization if possible
      if (name === 'doctorId') {
        const selectedDoc = doctors.find(d => d._id === value);
        if (selectedDoc?.specialization && !prev.specialist) {
          next.specialist = selectedDoc.specialization;
        }
      }
      return next;
    });
  };

  // Filter available doctors if a department is selected
  const filteredDoctors = formData.specialist
    ? doctors.filter(d => !d.specialization || d.specialization.toLowerCase() === formData.specialist.toLowerCase())
    : doctors;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.preferredDate || !formData.specialist || !formData.preferredTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await appointmentService.createAppointment({
        hospitalId: id,
        ...formData
      });
      toast.success('Appointment booked successfully!');
      navigate('/appointments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!hospital) return null;

  const specialties = hospital.specializations?.length > 0 ? hospital.specializations : defaultSpecialties;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Link to={`/hospitals/${id}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Hospital
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 p-6 md:p-8">
          <h1 className="text-2xl font-bold text-slate-800">Book Appointment</h1>
          <p className="text-slate-500 mt-1">at <span className="font-semibold text-slate-700">{hospital.name}</span></p>
        </div>

        <div className="p-6 md:p-8">
          {/* Patient Details Review (Read-only) */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-3">Patient Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-600/70 mb-1">Name</p>
                <p className="font-medium text-slate-800">{user?.firstName} {user?.lastName}</p>
              </div>
              <div>
                <p className="text-blue-600/70 mb-1">Health ID</p>
                <p className="font-medium text-slate-800">{user?.healthId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-blue-600/70 mb-1">Contact Phone</p>
                <p className="font-medium text-slate-800">{user?.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-blue-600/70 mb-1">Email</p>
                <p className="font-medium text-slate-800">{user?.email}</p>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-4 italic">
              * This information will be shared with the hospital. You can update it in your Profile.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Department Selection */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-slate-700">
                <Stethoscope className="w-4 h-4 mr-2 text-blue-600" />
                Specialist / Department <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                name="specialist"
                value={formData.specialist}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select a department...</option>
                {specialties.map((spec, i) => (
                  <option key={i} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            {/* Doctor Selection (Option to choose specific doctor) */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-slate-700">
                <UserCheck className="w-4 h-4 mr-2 text-blue-600" />
                Select Doctor <span className="text-xs text-slate-400 font-normal ml-2">(Optional — choose specific doctor or first available)</span>
              </label>
              <select
                name="doctorId"
                value={formData.doctorId}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">-- Any Available Doctor in Department --</option>
                {filteredDoctors.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.name} ({doc.specialization || 'General'}) • Fee: ₹{doc.consultationFee || 500} {doc.experience ? `• ${doc.experience} yrs exp` : ''}
                  </option>
                ))}
              </select>
              {doctors.length === 0 && (
                <p className="text-xs text-slate-400 italic">No specific doctor profiles listed for this hospital yet. Any available department physician will be assigned.</p>
              )}
            </div>

            {/* Date and Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-700">
                  <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                  Preferred Date <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="date"
                  name="preferredDate"
                  min={today}
                  value={formData.preferredDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-slate-700">
                  <Clock className="w-4 h-4 mr-2 text-blue-600" />
                  Preferred Time of Day <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select time...</option>
                  {timeOptions.map((time, i) => (
                    <option key={i} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-slate-700">
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                Additional Notes
              </label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                placeholder="Briefly describe your symptoms or reason for visit..."
                rows="3"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              ></textarea>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-70 shadow-md"
              >
                {submitting ? 'Submitting...' : 'Confirm Appointment'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
