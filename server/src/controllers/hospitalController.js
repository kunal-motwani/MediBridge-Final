const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');

exports.getHospitals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, city, state, type, specialization, emergencyAvailable, minRating, sortBy, search, q, name } = req.query;
  const query = {};

  const searchTerm = (search || q || name || '').trim();
  if (searchTerm) {
    const searchRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { 'address.street': searchRegex },
      { 'address.city': searchRegex },
      { 'address.state': searchRegex },
      { specializations: searchRegex }
    ];
  }

  if (city) query['address.city'] = new RegExp(city.trim(), 'i');
  if (state) query['address.state'] = new RegExp(state.trim(), 'i');
  if (type) query.type = type;
  if (specialization) query.specializations = { $in: [new RegExp(specialization.trim(), 'i')] };
  if (emergencyAvailable !== undefined && emergencyAvailable !== '') {
    query.emergencyAvailable = emergencyAvailable === 'true' || emergencyAvailable === true;
  }
  if (minRating) query.rating = { $gte: Number(minRating) };

  const sort = sortBy ? { [sortBy.replace('-', '')]: sortBy.startsWith('-') ? -1 : 1 } : { rating: -1, createdAt: -1 };
  const skip = (Number(page) - 1) * Number(limit);

  const hospitals = await Hospital.find(query).sort(sort).skip(skip).limit(Number(limit));
  const total = await Hospital.countDocuments(query);

  res.status(200).json({
    success: true,
    data: hospitals,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
  });
});

exports.getHospitalById = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) {
    throw new ApiError(404, 'Hospital not found');
  }

  const doctors = await Doctor.find({ hospitalId: hospital._id });
  
  res.status(200).json({ success: true, data: { ...hospital.toObject(), doctors } });
});

exports.searchHospitals = asyncHandler(async (req, res) => {
  const { q, query, name } = req.query;
  const searchTerm = (q || query || name || '').trim();
  
  let filter = {};
  if (searchTerm) {
    const searchRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter = {
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { 'address.street': searchRegex },
        { 'address.city': searchRegex },
        { 'address.state': searchRegex },
        { specializations: searchRegex }
      ]
    };
  }

  const hospitals = await Hospital.find(filter).sort({ rating: -1, name: 1 }).limit(100);
  res.status(200).json({ success: true, data: hospitals, count: hospitals.length });
});

