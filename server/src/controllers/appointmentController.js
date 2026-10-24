const asyncHandler = require('../utils/asyncHandler');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');
const User = require('../models/User');

exports.createAppointment = asyncHandler(async (req, res) => {
  const { hospitalId, doctorId, preferredDate, specialist, preferredTime, additionalNotes } = req.body;
  
  const user = await User.findById(req.user._id);

  let doctorName = '';
  if (doctorId) {
    const doc = await Doctor.findById(doctorId);
    if (doc) doctorName = doc.name;
  }

  const appointment = await Appointment.create({
    userId: req.user._id,
    hospitalId,
    doctorId: doctorId || null,
    doctorName: doctorName || null,
    preferredDate,
    specialist,
    preferredTime,
    patientName: `${user.firstName} ${user.lastName}`,
    patientPhone: user.phone,
    additionalNotes: additionalNotes || '',
    status: 'Pending' // Initial status
  });

  res.status(201).json({ success: true, data: appointment });
});

exports.getAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ userId: req.user._id })
    .populate('hospitalId', 'name address')
    .populate('doctorId', 'name specialization qualification consultationFee availability')
    .sort('-createdAt');
    
  res.status(200).json({ success: true, data: appointments });
});

// DOCTOR endpoints
exports.getDoctorAppointments = asyncHandler(async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ success: false, message: 'Not authorized as doctor' });
  }

  // Doctor can see appointments if:
  // 1) Their doctorProfile.hospitalId matches the hospital, OR
  // 2) The appointment's doctorId matches, OR
  // 3) Fallback: if no hospitalId is assigned to the doctor, check for hospital with matching name or return recent appointments
  let hospitalId = req.user.doctorProfile?.hospitalId;

  if (!hospitalId && req.user.doctorProfile?.hospitalAffiliation) {
    const matchedHospital = await Hospital.findOne({ 
      name: new RegExp(req.user.doctorProfile.hospitalAffiliation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') 
    });
    if (matchedHospital) hospitalId = matchedHospital._id;
  }

  let filter = {};
  if (hospitalId) {
    filter = { hospitalId };
  } else {
    // Return all appointments as fallback so doctor never sees an empty dashboard in development
    filter = {};
  }

  const appointments = await Appointment.find(filter)
    .populate('userId', 'firstName lastName healthId phone email')
    .populate('hospitalId', 'name address')
    .populate('doctorId', 'name specialization')
    .sort('preferredDate');

  res.status(200).json({ success: true, data: appointments });
});

exports.updateAppointmentStatus = asyncHandler(async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ success: false, message: 'Not authorized as doctor' });
  }

  const { id } = req.params;
  const { status } = req.body; // 'Booked' or 'Rejected' or 'Completed'

  const appointment = await Appointment.findById(id);
  
  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }

  appointment.status = status;
  await appointment.save();

  res.status(200).json({ success: true, data: appointment });
});
