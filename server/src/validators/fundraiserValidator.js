const Joi = require('joi');

exports.campaignCreateSchema = Joi.object({
  loanApplicationId: Joi.string().optional(),
  title: Joi.string().required(),
  story: Joi.string().required(),
  totalRequired: Joi.number().required(),
  treatmentType: Joi.string().optional(),
  hospitalName: Joi.string().optional(),
  doctorName: Joi.string().optional(),
  deadline: Joi.date().optional()
});

exports.donationCreateSchema = Joi.object({
  donorName: Joi.string().optional(),
  donorEmail: Joi.string().email().optional(),
  donorPhone: Joi.string().optional(),
  isAnonymous: Joi.boolean().optional(),
  amount: Joi.number().min(1).required(),
  paymentMethod: Joi.string().valid('upi', 'card', 'netbanking', 'wallet').required(),
  transactionId: Joi.string().optional(),
  message: Joi.string().optional()
});
