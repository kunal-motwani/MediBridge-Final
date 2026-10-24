import api from './api';

export const fundraiserService = {
  createCampaign: (data) => api.post('/fundraisers/campaigns', data),
  getMyCampaigns: () => api.get('/fundraisers/campaigns/mine'),
  getCampaignBySlug: (slug) => api.get(`/fundraisers/campaigns/${slug}`),
  updateCampaign: (id, data) => api.put(`/fundraisers/campaigns/${id}`, data),
  donate: (id, data) => api.post(`/fundraisers/campaigns/${id}/donations`, data),
  getCampaignDonors: (id) => api.get(`/fundraisers/campaigns/${id}/donors`),
};
