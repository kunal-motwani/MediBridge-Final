const Joi = require('joi');

exports.loanEligibilitySchema = Joi.object({
  treatmentType: Joi.string().required(),
  estimatedCost: Joi.number().required(),
  amountRequested: Joi.number().required(),
  monthlyIncome: Joi.number().required(),
  coapplicantIncome: Joi.number().optional(),
  existingEMIs: Joi.number().optional(),
  employmentType: Joi.string().valid('salaried', 'self_employed', 'unemployed').required(),
  creditHistory: Joi.boolean().required(),
  hospitalId: Joi.string().optional(),
  gender: Joi.string().optional(),
  married: Joi.boolean().optional(),
  dependents: Joi.number().optional(),
  education: Joi.string().optional(),
  loanAmountTerm: Joi.number().optional(),
  propertyArea: Joi.string().optional()
});

exports.loanApplicationSchema = exports.loanEligibilitySchema.append({
  supportingDocs: Joi.array().items(Joi.string()).optional(),
  purpose: Joi.string().optional(),
  notes: Joi.string().optional()
});
