import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Star, AlertCircle, ExternalLink, BedDouble, Calendar } from 'lucide-react';
import Badge from '../ui/Badge';

const HospitalCard = ({ hospital }) => {
  if (!hospital) return null;

  // Format address nicely
  const formatAddress = (addr) => {
    if (!addr) return 'Address not available';
    if (typeof addr === 'string') return addr;
    const parts = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  };

  const formattedAddress = formatAddress(hospital.address);
  const ratingValue = Number(hospital.rating) || 0;
  const fullStars = Math.floor(ratingValue);
  const hasHalfStar = ratingValue - fullStars >= 0.5;

  const typeColorMap = {
    government: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    private: 'bg-blue-50 text-blue-700 border-blue-200',
    ngo: 'bg-purple-50 text-purple-700 border-purple-200',
    clinic: 'bg-teal-50 text-teal-700 border-teal-200',
  };

  const typeBadgeStyle = typeColorMap[hospital.type?.toLowerCase()] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col h-full overflow-hidden">
      {/* Top Header Accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 opacity-90 group-hover:opacity-100 transition-opacity" />

      <div className="p-6 flex flex-col flex-1">
        {/* Header: Title & Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {hospital.type && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${typeBadgeStyle}`}>
                  {hospital.type}
                </span>
              )}
              {hospital.emergencyAvailable && (
                <Badge variant="danger" className="font-semibold text-[11px] animate-pulse">
                  <AlertCircle className="w-3 h-3 mr-1" /> 24/7 ER
                </Badge>
              )}
            </div>
            <h3 className="font-bold text-lg text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors line-clamp-2">
              {hospital.name}
            </h3>
          </div>
        </div>

        {/* Rating Display (Numeric + Stars) */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center text-amber-500">
            {[...Array(5)].map((_, i) => {
              const starFilled = i < fullStars;
              const starHalf = !starFilled && i === fullStars && hasHalfStar;
              return (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    starFilled
                      ? 'fill-amber-400 text-amber-400'
                      : starHalf
                      ? 'fill-amber-200 text-amber-400'
                      : 'fill-slate-100 text-slate-300'
                  }`}
                />
              );
            })}
          </div>
          <span className="text-sm font-bold text-slate-800">
            {ratingValue > 0 ? ratingValue.toFixed(1) : 'Unrated'}
          </span>
          <span className="text-xs text-slate-400">/ 5.0</span>
          {hospital.totalBeds && (
            <span className="ml-auto flex items-center text-xs text-slate-500 font-medium">
              <BedDouble className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {hospital.totalBeds} beds
            </span>
          )}
        </div>

        {/* Essential Hospital Details */}
        <div className="space-y-2.5 flex-1 mb-5">
          {/* Email ID */}
          <div className="flex items-start text-sm text-slate-600 group/link">
            <Mail className="w-4 h-4 mr-2.5 mt-0.5 text-blue-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Email</span>
              {hospital.email ? (
                <a
                  href={`mailto:${hospital.email}`}
                  className="text-slate-700 hover:text-blue-600 font-medium truncate block transition-colors"
                  title={hospital.email}
                >
                  {hospital.email}
                </a>
              ) : (
                <span className="text-slate-400 italic">Not provided</span>
              )}
            </div>
          </div>

          {/* Phone Number */}
          <div className="flex items-start text-sm text-slate-600">
            <Phone className="w-4 h-4 mr-2.5 mt-0.5 text-emerald-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Phone</span>
              {hospital.phone ? (
                <a
                  href={`tel:${hospital.phone}`}
                  className="text-slate-700 hover:text-emerald-600 font-medium tracking-wide transition-colors"
                >
                  {hospital.phone}
                </a>
              ) : (
                <span className="text-slate-400 italic">Not provided</span>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start text-sm text-slate-600">
            <MapPin className="w-4 h-4 mr-2.5 mt-0.5 text-rose-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Address</span>
              <p className="text-slate-700 leading-snug line-clamp-2" title={formattedAddress}>
                {formattedAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Specializations Tags */}
        {hospital.specializations && hospital.specializations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5 pt-2 border-t border-slate-100">
            {hospital.specializations.slice(0, 3).map((spec, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-md"
              >
                {spec}
              </span>
            ))}
            {hospital.specializations.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-md">
                +{hospital.specializations.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Card Actions */}
        <div className="mt-auto pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
          <Link
            to={`/hospitals/${hospital._id}`}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all duration-200 border border-slate-200"
          >
            <span>View Details</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            to={`/hospitals/${hospital._id}/book`}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Visit</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HospitalCard;
