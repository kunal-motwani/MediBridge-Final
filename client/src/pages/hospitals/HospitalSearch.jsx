import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { Search, MapPin, X, Building, AlertCircle, RefreshCw, SlidersHorizontal, Sparkles } from 'lucide-react';
import { hospitalService } from '../../services/hospitalService';
import HospitalCard from '../../components/hospitals/HospitalCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

const HospitalSearch = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchHospitals = useCallback(async (search = '', type = 'all', emergency = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) {
        params.q = search.trim();
      }
      if (type !== 'all') {
        params.type = type;
      }
      if (emergency) {
        params.emergencyAvailable = true;
      }

      const res = await hospitalService.searchHospitals(params);
      const list = res.data?.data || [];
      
      startTransition(() => {
        setHospitals(list);
      });
    } catch (err) {
      console.error('Failed to fetch hospitals:', err);
      setError(err.response?.data?.message || 'Failed to fetch hospital records. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time search with 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHospitals(searchQuery, selectedType, emergencyOnly);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedType, emergencyOnly, fetchHospitals]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setEmergencyOnly(false);
  };

  const typeOptions = [
    { label: 'All Types', value: 'all' },
    { label: 'Government', value: 'government' },
    { label: 'Private', value: 'private' },
    { label: 'NGO', value: 'ngo' },
    { label: 'Clinic', value: 'clinic' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold backdrop-blur-sm border border-blue-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Healthcare Directory & Network</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Find & Explore Hospitals
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Search verified hospitals, clinics, and emergency medical facilities across the network. View real-time contact details, addresses, and ratings.
          </p>
        </div>

        {/* Real-time Search Bar inside header */}
        <div className="mt-8 relative z-10">
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-2xl">
            <div className="relative flex items-center bg-white rounded-xl shadow-inner">
              <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by hospital name, city, address, or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 text-slate-800 placeholder-slate-400 rounded-xl outline-none text-sm md:text-base font-medium focus:ring-2 focus:ring-blue-600 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Type:
          </span>
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedType(opt.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                selectedType === opt.value
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Emergency Toggle & Status Indicator */}
        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={emergencyOnly}
              onChange={(e) => setEmergencyOnly(e.target.checked)}
              className="w-4 h-4 text-red-600 bg-slate-100 border-slate-300 rounded focus:ring-red-500 focus:ring-2 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              24/7 ER Only
            </span>
          </label>

          <div className="text-xs font-medium text-slate-500 border-l border-slate-200 pl-4">
            {loading ? (
              <span className="inline-flex items-center gap-1.5 text-blue-600">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Searching...
              </span>
            ) : (
              <span>
                Showing <strong className="text-slate-800">{hospitals.length}</strong> {hospitals.length === 1 ? 'hospital' : 'hospitals'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchHospitals(searchQuery, selectedType, emergencyOnly)}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton / State */}
      {loading && hospitals.length === 0 ? (
        <div className="py-16">
          <LoadingSpinner />
        </div>
      ) : hospitals.length === 0 ? (
        <EmptyState
          icon={MapPin}
          message={
            searchQuery || selectedType !== 'all' || emergencyOnly
              ? `No hospitals match "${searchQuery || 'selected filters'}". Try adjusting your search query or filters.`
              : 'No hospitals available in the database currently.'
          }
          actionButton={
            (searchQuery || selectedType !== 'all' || emergencyOnly) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm"
              >
                Clear All Filters
              </button>
            )
          }
        />
      ) : (
        /* Responsive Grid of Hospital Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hospitals.map((hospital) => (
            <HospitalCard key={hospital._id || hospital.id} hospital={hospital} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HospitalSearch;
