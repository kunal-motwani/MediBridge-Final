const Joi = require('joi');

exports.prescriptionCreateSchema = Joi.object({
  hospitalId: Joi.string().optional(),
  diagnosis: Joi.array().items(Joi.string()).optional(),
  symptoms: Joi.array().items(Joi.string()).optional(),
  medicines: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('tablet','capsule','syrup','injection','cream','drops','inhaler','other').optional(),
    dosage: Joi.string().optional(),
    frequency: Joi.string().optional(),
    duration: Joi.string().optional(),
    timing: Joi.string().valid('before_meal','after_meal','empty_stomach','bedtime','as_needed').optional(),
    instructions: Joi.string().optional(),
    quantity: Joi.number().optional()
  })).min(1).required(),
  tests: Joi.array().items(Joi.string()).optional(),
  advice: Joi.string().optional(),
  followUpDate: Joi.date().optional(),
  vitals: Joi.object({
    bloodPressure: Joi.string().optional(),
    heartRate: Joi.number().optional(),
    temperature: Joi.number().optional(),
    weight: Joi.number().optional(),
    oxygenLevel: Joi.number().optional()
  }).optional()
});
