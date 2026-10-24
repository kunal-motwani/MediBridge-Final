const axios = require('axios');

exports.predictLoanApproval = async (data) => {
  try {
    const modelUrl = process.env.MODEL_API_URL || 'http://localhost:5001';
    const response = await axios.post(`${modelUrl}/predict`, data);
    return response.data;
  } catch (error) {
    console.error('ML Model Service Error:', error.message);
    return { approved: null, error: 'Model unavailable', fallback: true };
  }
};
