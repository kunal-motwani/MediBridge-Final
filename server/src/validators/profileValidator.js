const Joi = require('joi');

exports.updateProfileSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  dateOfBirth: Joi.date().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  phoneNumber: Joi.string().optional(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    pincode: Joi.string().optional(),
  }).optional()
});

exports.emergencyProfileSchema = Joi.object({
  bloodGroup: Joi.string().valid('A+','A-','B+','B-','AB+','AB-','O+','O-').optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  chronicConditions: Joi.array().items(Joi.string()).optional(),
  currentMedications: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    dosage: Joi.string().optional(),
    frequency: Joi.string().optional()
  })).optional(),
  emergencyContacts: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    relationship: Joi.string().optional(),
    phone: Joi.string().required()
  })).optional(),
  insuranceProvider: Joi.string().optional(),
  insurancePolicyNo: Joi.string().optional(),
  organDonor: Joi.boolean().optional(),
  notes: Joi.string().optional()
});

exports.changePinSchema = Joi.object({
  oldPin: Joi.string().required(),
  newPin: Joi.string().length(6).required()
});
