const Joi = require('joi');

exports.requestAccessSchema = Joi.object({
  healthId: Joi.string().required(),
  accessPin: Joi.string().length(6).required()
});
