const Joi = require('joi');

exports.recordCreateSchema = Joi.object({
  title: Joi.string().required(),
  category: Joi.string().valid('lab_report','prescription','discharge_summary','imaging','diagnosis','surgery_note','follow_up','invoice','other').required(),
  description: Joi.string().optional(),
  clinicalNotes: Joi.string().optional(),
  diagnosis: Joi.array().items(Joi.string()).optional(),
  vitals: Joi.object({
    bloodPressure: Joi.string().optional(),
    heartRate: Joi.number().optional(),
    temperature: Joi.number().optional(),
    weight: Joi.number().optional(),
    oxygenLevel: Joi.number().optional()
  }).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isPrivate: Joi.boolean().optional(),
  recordDate: Joi.date().optional()
});

exports.recordUpdateSchema = exports.recordCreateSchema.fork(Object.keys(exports.recordCreateSchema.describe().keys), (schema) => schema.optional());
