const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const FundraiserCampaign = require('../models/FundraiserCampaign');
const Donation = require('../models/Donation');
const crypto = require('crypto');

exports.createCampaign = asyncHandler(async (req, res) => {
  const slug = req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + crypto.randomBytes(4).toString('hex');
  const fundingGap = req.body.totalRequired - (req.body.loanApproved || 0);

  const campaign = await FundraiserCampaign.create({
    ...req.body,
    patientId: req.user._id,
    shareSlug: slug,
    fundingGap,
    status: 'pending_verification'
  });

  res.status(201).json({ success: true, data: campaign });
});

exports.getMyCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await FundraiserCampaign.find({ patientId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: campaigns });
});

exports.getCampaignBySlug = asyncHandler(async (req, res) => {
  const campaign = await FundraiserCampaign.findOne({ shareSlug: req.params.slug })
    .populate('patientId', 'firstName lastName avatar');
    
  if (!campaign) {
    throw new ApiError(404, 'Campaign not found');
  }
  res.status(200).json({ success: true, data: campaign });
});

exports.updateCampaign = asyncHandler(async (req, res) => {
  const campaign = await FundraiserCampaign.findOneAndUpdate(
    { _id: req.params.id, patientId: req.user._id },
    req.body,
    { new: true }
  );
  if (!campaign) {
    throw new ApiError(404, 'Campaign not found');
  }
  res.status(200).json({ success: true, data: campaign });
});

exports.donate = asyncHandler(async (req, res) => {
  const campaign = await FundraiserCampaign.findById(req.params.id);
  if (!campaign) {
    throw new ApiError(404, 'Campaign not found');
  }

  const donation = await Donation.create({
    ...req.body,
    campaignId: campaign._id,
    status: 'completed' // In real world, this depends on payment gateway webhook
  });

  campaign.amountRaised += donation.amount;
  campaign.fundingGap = Math.max(0, campaign.totalRequired - campaign.loanApproved - campaign.amountRaised);
  
  if (campaign.amountRaised >= (campaign.totalRequired - campaign.loanApproved)) {
    campaign.status = 'funded';
  }
  
  await campaign.save();

  res.status(201).json({ success: true, data: donation });
});

exports.getCampaignDonors = asyncHandler(async (req, res) => {
  const donors = await Donation.find({ campaignId: req.params.id, status: 'completed' })
    .select('donorName isAnonymous amount message createdAt')
    .sort({ createdAt: -1 });
    
  const publicDonors = donors.map(d => ({
    name: d.isAnonymous ? 'Anonymous' : d.donorName,
    amount: d.amount,
    message: d.message,
    date: d.createdAt
  }));

  res.status(200).json({ success: true, data: publicDonors });
});
