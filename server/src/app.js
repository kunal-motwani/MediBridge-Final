const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const recordRoutes = require('./routes/recordRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const accessRoutes = require('./routes/accessRoutes');
const financialRoutes = require('./routes/financialRoutes');
const fundraiserRoutes = require('./routes/fundraiserRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const mockHospitalRoutes = require('./routes/mockHospitalRoutes');

const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'MediBridge API is running', data: { ok: true } });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);
app.use('/api/v1/records', recordRoutes);
app.use('/api/v1/document-access', require('./routes/documentAccessRoutes'));
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/access', accessRoutes);
app.use('/api/v1/financial', financialRoutes);
app.use('/api/v1/fundraisers', fundraiserRoutes);
app.use('/api/v1/emergency', emergencyRoutes);
app.use('/api/v1/mock/hospital', mockHospitalRoutes);
app.use('/api/v1/appointments', require('./routes/appointmentRoutes'));

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

module.exports = app;
