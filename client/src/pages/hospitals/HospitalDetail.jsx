import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { hospitalService } from '../../services/hospitalService';
import { MapPin, Phone, Mail, Globe, Star, Users, AlertCircle, ArrowLeft, Building2, BedDouble, Stethoscope, Calendar } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';

const HospitalDetail = () => {
  const { id } = useParams();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHospital = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await hospitalService.getHospitalById(id);
        setHospital(res.data.data);
      } catch (err) {
        console.error('Error fetching hospital details:', err);
        setError(err.response?.data?.message || 'Hospital not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };
    fetchHospital();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">{error || 'Hospital not found'}</h2>
        <Link
          to="/hospitals"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Hospital Search
        </Link>
      </div>
    );
  }

  const phone = hospital.phone || hospital.contactPhone;
  const email = hospital.email || hospital.contactEmail;
  const ratingValue = Number(hospital.rating) || 0;
  const isEmergency = hospital.emergencyAvailable || hospital.hasEmergency;
  const fullAddress = [
    hospital.address?.street,
    hospital.address?.city,
    hospital.address?.state,
    hospital.address?.pincode || hospital.address?.zipCode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button */}
      <Link
        to="/hospitals"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Hospitals Directory
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 md:p-10 text-white relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {hospital.type && (
                  <span className="px-3 py-1 bg-white/15 text-blue-200 rounded-full text-xs font-semibold capitalize backdrop-blur-sm border border-white/10">
                    {hospital.type} Hospital
                  </span>
                )}
                {isEmergency && (
                  <span className="px-3 py-1 bg-red-500/90 text-white rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm">
                    <AlertCircle className="w-3.5 h-3.5" /> 24/7 Emergency Available
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
                {hospital.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-slate-300 text-sm">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  {hospital.address?.city}, {hospital.address?.state}
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {ratingValue.toFixed(1)} / 5.0 Rating
                </span>
                {hospital.totalBeds && (
                  <span className="flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-blue-400" />
                    {hospital.totalBeds} Total Beds
                  </span>
                )}
              </div>
            </div>

            {/* Direct Header Book Appointment Button */}
            <div className="shrink-0">
              <Link
                to={`/hospitals/${hospital._id}/book`}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
              >
                <Calendar className="w-5 h-5" />
                <span>Book Appointment Now</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" /> About the Facility
              </h2>
              <p className="text-slate-600 leading-relaxed">
                {hospital.description ||
                  `${hospital.name} is a premier healthcare institution providing high-standard medical care, dedicated clinical specialists, and patient-centered services.`}
              </p>
            </section>

            {hospital.specializations && hospital.specializations.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-blue-600" /> Medical Specializations
                </h2>
                <div className="flex flex-wrap gap-2">
                  {hospital.specializations.map((spec, i) => (
                    <span
                      key={i}
                      className="px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium border border-blue-100"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {hospital.doctors && hospital.doctors.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" /> Associated Doctors & Specialists
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hospital.doctors.map((doc) => (
                    <div
                      key={doc._id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition"
                    >
                      <h4 className="font-bold text-slate-800">{doc.name}</h4>
                      <p className="text-xs text-blue-600 font-medium">{doc.specialization}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {doc.qualification} • {doc.experience} yrs exp
                      </p>
                      {doc.consultationFee && (
                        <p className="text-xs text-slate-700 font-semibold mt-2">
                          Fee: ₹{doc.consultationFee}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Contact Details Card */}
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-5">
              <h3 className="font-bold text-slate-800 text-lg border-b border-slate-200 pb-3">
                Contact & Location
              </h3>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Email Address</span>
                    {email ? (
                      <a href={`mailto:${email}`} className="text-blue-600 font-medium hover:underline break-all">
                        {email}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Not available</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Phone Number</span>
                    {phone ? (
                      <a href={`tel:${phone}`} className="text-slate-800 font-semibold hover:text-emerald-600">
                        {phone}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Not available</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Physical Address</span>
                    <p className="text-slate-700 font-medium leading-relaxed">
                      {fullAddress || 'Address not available'}
                    </p>
                  </div>
                </div>

                {hospital.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Website</span>
                      <a
                        href={hospital.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-medium break-all"
                      >
                        {hospital.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      {/* Book Appointment Button (Fixed Bottom Right) */}
      <div className="fixed bottom-8 right-8 z-50">
        <Link
          to={`/hospitals/${hospital._id}/book`}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-full shadow-xl hover:bg-blue-700 hover:shadow-2xl transition-all hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          <Calendar className="w-5 h-5" />
          Book Appointment
        </Link>
      </div>
    </div>
  );
};

export default HospitalDetail;
