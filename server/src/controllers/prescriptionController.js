const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Prescription = require('../models/Prescription');

exports.getMyPrescriptions = asyncHandler(async (req, res) => {
  const prescriptions = await Prescription.find({ patientId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: prescriptions });
});

exports.getActivePrescriptions = asyncHandler(async (req, res) => {
  const prescriptions = await Prescription.find({ patientId: req.user._id, isActive: true }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: prescriptions });
});

exports.getPrescriptionById = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findOne({ _id: req.params.id, patientId: req.user._id })
    .populate('doctorId', 'firstName lastName')
    .populate('hospitalId', 'name address');
    
  if (!prescription) {
    throw new ApiError(404, 'Prescription not found');
  }
  res.status(200).json({ success: true, data: prescription });
});

exports.markComplete = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findOneAndUpdate(
    { _id: req.params.id, patientId: req.user._id },
    { isActive: false },
    { new: true }
  );
  
  if (!prescription) {
    throw new ApiError(404, 'Prescription not found');
  }
  res.status(200).json({ success: true, data: prescription });
});
