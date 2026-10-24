const Joi = require('joi');

const registerPatientSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).required(),
  lastName: Joi.string().trim().min(1).max(50).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().trim().allow('', null),
  dateOfBirth: Joi.date().allow('', null),
  gender: Joi.string().valid('male', 'female', 'other').allow('', null),
  accessPin: Joi.string().pattern(/^\d{4}$/).required().messages({
    'string.pattern.base': 'Access PIN must be exactly 4 digits',
  }),
});

const registerDoctorSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).required(),
  lastName: Joi.string().trim().min(1).max(50).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().trim().allow('', null),
  specialization: Joi.string().trim().required(),
  qualification: Joi.string().trim().allow('', null),
  licenseNumber: Joi.string().trim().required(),
  experience: Joi.number().min(0).allow('', null),
  hospitalId: Joi.string().hex().length(24).allow('', null),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = { registerPatientSchema, registerDoctorSchema, loginSchema, refreshSchema };
