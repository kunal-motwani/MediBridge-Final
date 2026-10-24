const Joi = require('joi');

exports.hospitalSearchSchema = Joi.object({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  type: Joi.string().valid('government', 'private', 'ngo', 'clinic').optional(),
  specialization: Joi.string().optional(),
  emergencyAvailable: Joi.boolean().optional(),
  minRating: Joi.number().min(0).max(5).optional(),
  sortBy: Joi.string().optional()
});
