const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const LoanApplication = require('../models/LoanApplication');
const { calculateRuleScore, calculateEMI } = require('../utils/loanEligibility');
const { predictLoanApproval } = require('../services/loanPredictionService');

exports.checkEligibility = asyncHandler(async (req, res) => {
  const { treatmentType, estimatedCost, amountRequested, monthlyIncome, coapplicantIncome, existingEMIs, employmentType, creditHistory, gender, married, dependents, education, loanAmountTerm, propertyArea } = req.body;

  const ruleScore = calculateRuleScore(req.body);

  const mlData = {
    gender, married, dependents, education, selfEmployed: employmentType === 'self_employed',
    applicantIncome: monthlyIncome, coapplicantIncome, loanAmount: amountRequested,
    loanAmountTerm, creditHistory, propertyArea
  };

  const mlResult = await predictLoanApproval(mlData);

  let finalDecision = 'rejected';
  let approvedAmount = 0;

  // Simple aggregation for demonstration
  const mlApproved = mlResult.approved || false;
  if (ruleScore >= 70 || (ruleScore >= 50 && mlApproved)) {
    finalDecision = 'approved';
    approvedAmount = amountRequested;
  } else if (ruleScore >= 40) {
    finalDecision = 'partial';
    approvedAmount = amountRequested * 0.6;
  }

  res.status(200).json({
    success: true,
    data: {
      ruleScore,
      mlPrediction: mlResult,
      finalDecision,
      approvedAmount
    }
  });
});

exports.createLoanApplication = asyncHandler(async (req, res) => {
  const ruleScore = calculateRuleScore(req.body);
  const application = await LoanApplication.create({
    ...req.body,
    userId: req.user._id,
    ruleScore,
    status: 'submitted'
  });

  res.status(201).json({ success: true, data: application });
});

exports.getMyApplications = asyncHandler(async (req, res) => {
  const applications = await LoanApplication.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: applications });
});

exports.getApplicationById = asyncHandler(async (req, res) => {
  const application = await LoanApplication.findOne({ _id: req.params.id, userId: req.user._id });
  if (!application) {
    throw new ApiError(404, 'Application not found');
  }
  res.status(200).json({ success: true, data: application });
});
