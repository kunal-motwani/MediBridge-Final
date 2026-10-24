const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const EmergencyProfile = require('../models/EmergencyProfile');
const MedicalRecord = require('../models/MedicalRecord');
const Prescription = require('../models/Prescription');
const FundraiserCampaign = require('../models/FundraiserCampaign');
const LoanApplication = require('../models/LoanApplication');
const AccessSession = require('../models/AccessSession');
const AccessLog = require('../models/AccessLog');
const Appointment = require('../models/Appointment');

// Mock hospital API returning fake records
router.get('/:code/records/:patientId', (req, res) => {
  const mockRecords = [
    {
      title: 'Complete Blood Count (CBC)',
      category: 'lab_report',
      description: 'Routine blood checkup and platelet analysis',
      clinicalNotes: 'All parameters normal. Hemoglobin: 14.2 g/dL, Platelets: 250,000.',
      hospitalName: 'Apollo Super Specialty Hospital',
      doctorName: 'Dr. Ananya Roy'
    },
    {
      title: 'Chest X-Ray PA View',
      category: 'imaging',
      description: 'Annual respiratory health checkup',
      clinicalNotes: 'Clear lung fields, normal cardiothoracic ratio, no active lesions.',
      hospitalName: 'Apollo Super Specialty Hospital',
      doctorName: 'Dr. Ananya Roy'
    }
  ];

  res.status(200).json({
    success: true,
    data: mockRecords
  });
});

// Seed endpoint for full demonstration data
router.all('/seed-demo', async (req, res) => {
  try {
    // 1. Clear existing seed collections
    await Hospital.deleteMany({});
    await Doctor.deleteMany({});
    await User.deleteMany({});
    await EmergencyProfile.deleteMany({});
    await MedicalRecord.deleteMany({});
    await Prescription.deleteMany({});
    await FundraiserCampaign.deleteMany({});
    await LoanApplication.deleteMany({});
    await AccessSession.deleteMany({});
    await AccessLog.deleteMany({});
    await Appointment.deleteMany({});

    // 2. Create Sample Hospitals
    const hospitalsData = [
      {
        name: 'Apollo Super Specialty Hospital',
        type: 'private',
        specializations: ['Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Emergency Medicine'],
        address: { street: '21 Greams Lane, Bandra West', city: 'Mumbai', state: 'Maharashtra', pincode: '400050' },
        phone: '+91 22 2829 0000',
        email: 'contact@apollomumbai.com',
        website: 'https://apollohospitals.com',
        rating: 4.9,
        totalBeds: 500,
        emergencyAvailable: true,
        insuranceAccepted: ['Star Health', 'HDFC ERGO', 'ICICI Lombard', 'Care Health', 'Max Bupa'],
        isVerified: true
      },
      {
        name: 'AIIMS Central Institute of Medical Sciences',
        type: 'government',
        specializations: ['General Medicine', 'Cardiology', 'Pediatrics', 'Nephrology', 'Pulmonology'],
        address: { street: 'Ansari Nagar', city: 'Delhi', state: 'Delhi', pincode: '110029' },
        phone: '+91 11 2658 8500',
        email: 'enquiry@aiims.edu',
        rating: 4.8,
        totalBeds: 1200,
        emergencyAvailable: true,
        insuranceAccepted: ['PMJAY / Ayushman Bharat', 'CGHS', 'ESI', 'National Insurance'],
        isVerified: true
      },
      {
        name: 'Fortis Memorial Health Institute',
        type: 'private',
        specializations: ['Oncology', 'Robotic Surgery', 'Cardiology', 'Gastroenterology'],
        address: { street: 'Sector 44', city: 'Delhi', state: 'Haryana', pincode: '122002' },
        phone: '+91 124 496 2200',
        email: 'support@fortisdelhi.com',
        rating: 4.6,
        totalBeds: 350,
        emergencyAvailable: true,
        insuranceAccepted: ['HDFC ERGO', 'Bajaj Allianz', 'Max Bupa', 'Tata AIG'],
        isVerified: true
      },
      {
        name: 'Manipal Hospital Life Centre',
        type: 'private',
        specializations: ['Orthopedics', 'Pediatrics', 'Gastroenterology', 'Neurology'],
        address: { street: '98 HAL Airport Road', city: 'Bangalore', state: 'Karnataka', pincode: '560017' },
        phone: '+91 80 2502 4444',
        email: 'care@manipal.com',
        rating: 4.5,
        totalBeds: 600,
        emergencyAvailable: true,
        insuranceAccepted: ['Tata AIG', 'Star Health', 'Niva Bupa'],
        isVerified: true
      },
      {
        name: 'Ruby Hall Clinic & Heart Institute',
        type: 'clinic',
        specializations: ['Cardiology', 'General Medicine', 'Diabetology'],
        address: { street: '40 Sassoon Road', city: 'Pune', state: 'Maharashtra', pincode: '411001' },
        phone: '+91 20 6645 5100',
        email: 'info@rubyhall.com',
        rating: 4.4,
        totalBeds: 160,
        emergencyAvailable: false,
        insuranceAccepted: ['National Insurance', 'New India Assurance'],
        isVerified: true
      }
    ];

    const hospitals = await Hospital.insertMany(hospitalsData);
    const apolloHospital = hospitals[0];

    // 3. Create Doctors in the Directory
    const doctorsDirectory = [
      {
        name: 'Dr. Ananya Roy',
        specialization: 'Cardiology',
        qualification: 'MBBS, MD (Internal Medicine), DM (Cardiology), FACC (USA)',
        experience: 14,
        hospitalId: apolloHospital._id,
        consultationFee: 1200,
        availability: { days: ['Monday', 'Wednesday', 'Friday', 'Saturday'], hours: '09:00 AM - 02:00 PM' },
        rating: 4.9
      },
      {
        name: 'Dr. Rajesh Deshmukh',
        specialization: 'Neurology',
        qualification: 'MBBS, DNB (Neuro)',
        experience: 18,
        hospitalId: apolloHospital._id,
        consultationFee: 1500,
        availability: { days: ['Tuesday', 'Thursday', 'Saturday'], hours: '10:00 AM - 04:00 PM' },
        rating: 4.8
      },
      {
        name: 'Dr. Priya Nambiar',
        specialization: 'General Medicine',
        qualification: 'MBBS, MD',
        experience: 9,
        hospitalId: hospitals[1]._id,
        consultationFee: 500,
        availability: { days: ['Monday', 'Tuesday', 'Thursday'], hours: '08:00 AM - 01:00 PM' },
        rating: 4.6
      },
      {
        name: 'Dr. Vikram Malhotra',
        specialization: 'Oncology',
        qualification: 'MBBS, MS, MCh (Surgical Oncology)',
        experience: 21,
        hospitalId: hospitals[2]._id,
        consultationFee: 2000,
        availability: { days: ['Monday', 'Thursday'], hours: '11:00 AM - 03:00 PM' },
        rating: 4.9
      }
    ];
    await Doctor.insertMany(doctorsDirectory);

    // 4. Create the Demo Doctor User (Dr. Ananya Roy)
    const demoDoctor = new User({
      firstName: 'Ananya',
      lastName: 'Roy',
      email: 'doctor@medibridge.com',
      password: 'Password123!',
      phone: '+91 98201 54321',
      dateOfBirth: new Date('1983-09-12'),
      gender: 'female',
      role: 'doctor',
      address: {
        street: 'Penthouse 4B, Sea Face Enclave',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050'
      },
      doctorProfile: {
        doctorId: 'DOC-APL-0042',
        hospitalId: apolloHospital._id,
        specialization: 'Interventional Cardiology & Electrophysiology',
        qualification: 'MBBS, MD (Internal Med), DM (Cardiology), FACC (USA), FSCAI',
        licenseNumber: 'MCI-2012-78901',
        experience: 14,
        isVerified: true
      }
    });
    await demoDoctor.save();

    // 5. Create 4 Patients for Dr. Ananya Roy
    const patientsData = [
      {
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: 'patient@medibridge.com',
        password: 'Password123!',
        phone: '+91 98765 43210',
        gender: 'male',
        dateOfBirth: new Date('1996-05-14'),
        role: 'patient',
        healthId: 'MB-2026-100001',
        accessPin: '1234',
        address: { street: '42 MG Road, Bandra West', city: 'Mumbai', state: 'Maharashtra', pincode: '400050' }
      },
      {
        firstName: 'Priya',
        lastName: 'Patel',
        email: 'priya.patel@test.com',
        password: 'Password123!',
        phone: '+91 98234 11223',
        gender: 'female',
        dateOfBirth: new Date('1988-11-20'),
        role: 'patient',
        healthId: 'MB-2026-100002',
        accessPin: '1234',
        address: { street: '14 Hill Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400050' }
      },
      {
        firstName: 'Amit',
        lastName: 'Verma',
        email: 'amit.verma@test.com',
        password: 'Password123!',
        phone: '+91 98111 88776',
        gender: 'male',
        dateOfBirth: new Date('1975-03-08'),
        role: 'patient',
        healthId: 'MB-2026-100003',
        accessPin: '1234',
        address: { street: '78 Linking Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400052' }
      },
      {
        firstName: 'Meera',
        lastName: 'Nair',
        email: 'meera.nair@test.com',
        password: 'Password123!',
        phone: '+91 98900 44332',
        gender: 'female',
        dateOfBirth: new Date('1991-08-25'),
        role: 'patient',
        healthId: 'MB-2026-100004',
        accessPin: '1234',
        address: { street: '102 Juhu Tara Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400049' }
      }
    ];

    const createdPatients = [];
    for (const p of patientsData) {
      const patient = new User(p);
      await patient.save();
      createdPatients.push(patient);
    }

    const [patientRahul, patientPriya, patientAmit, patientMeera] = createdPatients;

    // 6. Create Active Access Sessions (24hr access) for Dr. Ananya Roy with Rahul and Priya
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await AccessSession.create([
      {
        patientId: patientRahul._id,
        doctorId: demoDoctor._id,
        status: 'active',
        expiresAt: tomorrow,
        permissions: { viewRecords: true, viewPrescriptions: true, viewEmergency: true, addRecords: true, addPrescription: true }
      },
      {
        patientId: patientPriya._id,
        doctorId: demoDoctor._id,
        status: 'active',
        expiresAt: tomorrow,
        permissions: { viewRecords: true, viewPrescriptions: true, viewEmergency: true, addRecords: true, addPrescription: true }
      }
    ]);

    // 7. Create Access Logs (Audit Trail so getMyPatients finds all 4 patients!)
    for (const pat of createdPatients) {
      await AccessLog.create([
        {
          patientId: pat._id,
          doctorId: demoDoctor._id,
          action: 'access_granted',
          details: `PIN verified. 24hr temporary session started at ${apolloHospital.name}.`,
          ipAddress: '127.0.0.1'
        },
        {
          patientId: pat._id,
          doctorId: demoDoctor._id,
          action: 'viewed_records',
          details: 'Reviewed past clinical history and diagnostic reports.',
          ipAddress: '127.0.0.1'
        }
      ]);
    }

    // 8. Create Emergency Profiles
    await EmergencyProfile.create([
      {
        userId: patientRahul._id,
        bloodGroup: 'O+',
        allergies: ['Penicillin', 'Peanuts'],
        chronicConditions: ['Mild Asthma', 'Hypertension Stage 1'],
        currentMedications: [
          { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily (morning)' },
          { name: 'Salbutamol Inhaler', dosage: '100mcg', frequency: 'As needed' }
        ],
        emergencyContacts: [
          { name: 'Sunita Sharma', relationship: 'Mother', phone: '+91 98765 00001' }
        ],
        insuranceProvider: 'Star Health Premier',
        insurancePolicyNo: 'SH-2025-998822',
        organDonor: true,
        notes: 'Carries emergency rescue inhaler.'
      },
      {
        userId: patientPriya._id,
        bloodGroup: 'B+',
        allergies: ['Sulfa drugs'],
        chronicConditions: ['Coronary Artery Disease'],
        currentMedications: [
          { name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily (night)' },
          { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily (morning)' }
        ],
        emergencyContacts: [
          { name: 'Rohan Patel', relationship: 'Husband', phone: '+91 98234 99999' }
        ],
        insuranceProvider: 'HDFC ERGO Health',
        insurancePolicyNo: 'HE-2024-443322',
        organDonor: true,
        notes: 'Regular cardiac follow-up every 3 months.'
      }
    ]);

    // 9. Create Medical Records for Patients
    await MedicalRecord.create([
      {
        userId: patientRahul._id,
        uploadedBy: { type: 'doctor', doctorId: demoDoctor._id, doctorName: 'Dr. Ananya Roy', hospitalId: apolloHospital._id, hospitalName: apolloHospital.name },
        title: '2D Echocardiogram & Doppler Study',
        category: 'imaging',
        description: 'Complete cardiac echo evaluation for valve stenosis check.',
        clinicalNotes: 'Ejection Fraction 62%. Concentric LV remodeling. Aortic valve leaflets mildly thickened.',
        vitals: { bloodPressure: '126/82', heartRate: 74, temperature: 98.6, weight: 70, oxygenLevel: 99 },
        doctorName: 'Dr. Ananya Roy',
        hospitalName: apolloHospital.name,
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: 'pdf',
        recordDate: new Date('2026-08-15')
      },
      {
        userId: patientRahul._id,
        uploadedBy: { type: 'hospital_fetch', hospitalName: 'Apollo Super Specialty Hospital' },
        title: 'Comprehensive Lipid Profile & HbA1c',
        category: 'lab_report',
        description: 'Fasting lipid panel.',
        clinicalNotes: 'Total Cholesterol: 182 mg/dL, HDL: 52 mg/dL, Triglycerides: 135 mg/dL, HbA1c: 5.4%.',
        doctorName: 'Dr. Ananya Roy',
        hospitalName: apolloHospital.name,
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: 'pdf',
        recordDate: new Date('2026-07-20')
      },
      {
        userId: patientPriya._id,
        uploadedBy: { type: 'doctor', doctorId: demoDoctor._id, doctorName: 'Dr. Ananya Roy', hospitalId: apolloHospital._id, hospitalName: apolloHospital.name },
        title: 'Coronary Angiogram Evaluation',
        category: 'imaging',
        description: 'Diagnostic catheterization assessing coronary arterial perfusion.',
        clinicalNotes: 'LAD patent post stent placement in 2024. Normal flow TIMI III.',
        vitals: { bloodPressure: '120/78', heartRate: 68, temperature: 98.4, weight: 58, oxygenLevel: 98 },
        doctorName: 'Dr. Ananya Roy',
        hospitalName: apolloHospital.name,
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileType: 'pdf',
        recordDate: new Date('2026-09-02')
      }
    ]);

    // 10. Create Prescriptions Authored by Dr. Ananya Roy
    await Prescription.create([
      {
        patientId: patientRahul._id,
        doctorId: demoDoctor._id,
        hospitalId: apolloHospital._id,
        diagnosis: ['Stage 1 Hypertension', 'Cardiovascular Risk Mitigation'],
        symptoms: ['Morning headache', 'Mild palpitations during heavy exertion'],
        medicines: [
          { name: 'Amlodipine', type: 'tablet', dosage: '5mg', frequency: '1-0-0', duration: '30 days', timing: 'after_meal', instructions: 'Take right after breakfast' },
          { name: 'Metoprolol Succinate', type: 'tablet', dosage: '25mg', frequency: '0-0-1', duration: '30 days', timing: 'bedtime', instructions: 'Take before sleep' }
        ],
        tests: ['Repeat 2D Echo in 6 months', 'Serum Electrolytes'],
        advice: 'Restrict sodium to < 2.0g/day. Daily 30 min light cardio.',
        isActive: true,
        createdAt: new Date('2026-09-10')
      },
      {
        patientId: patientPriya._id,
        doctorId: demoDoctor._id,
        hospitalId: apolloHospital._id,
        diagnosis: ['Chronic Coronary Artery Disease', 'Hyperlipidemia'],
        symptoms: ['Follow-up post stenting'],
        medicines: [
          { name: 'Atorvastatin', type: 'tablet', dosage: '20mg', frequency: '0-0-1', duration: '60 days', timing: 'bedtime', instructions: 'Take after dinner' },
          { name: 'Clopidogrel', type: 'tablet', dosage: '75mg', frequency: '1-0-0', duration: '60 days', timing: 'after_meal', instructions: 'Antiplatelet maintenance' }
        ],
        advice: 'Low-cholesterol Mediterranean diet. Regular lipid profile monitoring.',
        isActive: true,
        createdAt: new Date('2026-09-15')
      }
    ]);

    // 11. Create Appointments for Dr. Ananya Roy at Apollo Hospital
    const nextWeek = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await Appointment.create([
      {
        userId: patientRahul._id,
        hospitalId: apolloHospital._id,
        preferredDate: nextWeek,
        specialist: 'Cardiology (Dr. Ananya Roy)',
        preferredTime: 'Morning',
        status: 'Booked',
        patientName: 'Rahul Sharma',
        patientPhone: '+91 98765 43210'
      },
      {
        userId: patientAmit._id,
        hospitalId: apolloHospital._id,
        preferredDate: inThreeDays,
        specialist: 'Cardiology (Dr. Ananya Roy)',
        preferredTime: 'Afternoon',
        status: 'Pending',
        patientName: 'Amit Verma',
        patientPhone: '+91 98111 88776'
      }
    ]);

    // 12. Create Fundraiser & Loan for Rahul
    await FundraiserCampaign.create({
      patientId: patientRahul._id,
      title: 'Support Cardiac Valve Reconstruction for Rahul',
      story: 'Rahul was diagnosed with progressive valve stenosis requiring minimally invasive repair at Apollo Hospital. Insurance covers initial hospitalization, but specialized prosthetic reconstruction requires community support.',
      totalRequired: 450000,
      loanApproved: 250000,
      fundingGap: 200000,
      amountRaised: 85000,
      treatmentType: 'Minimally Invasive Cardiac Valve Repair',
      hospitalName: apolloHospital.name,
      doctorName: 'Dr. Ananya Roy',
      status: 'active',
      isVerified: true,
      shareSlug: 'rahul-cardiac-care-2026'
    });

    await LoanApplication.create({
      userId: patientRahul._id,
      hospitalId: apolloHospital._id,
      treatmentType: 'Cardiac Valve Reconstruction',
      estimatedCost: 450000,
      amountRequested: 250000,
      monthlyIncome: 65000,
      employmentType: 'salaried',
      creditHistory: true,
      ruleScore: 88,
      mlScore: 92,
      approvedAmount: 250000,
      interestRate: 8.5,
      tenure: 24,
      emi: 11365,
      status: 'approved'
    });

    res.status(200).json({
      success: true,
      message: 'Comprehensive Doctor, Hospital, and Patient demo data seeded successfully!',
      data: {
        doctor: {
          name: `${demoDoctor.firstName} ${demoDoctor.lastName}`,
          email: demoDoctor.email,
          hospital: apolloHospital.name,
          specialization: demoDoctor.doctorProfile.specialization,
          degrees: demoDoctor.doctorProfile.qualification,
          license: demoDoctor.doctorProfile.licenseNumber,
          experience: `${demoDoctor.doctorProfile.experience} years`,
          activeSessions: 2,
          patientsAssigned: createdPatients.length
        },
        patients: createdPatients.map(p => ({
          name: `${p.firstName} ${p.lastName}`,
          healthId: p.healthId,
          email: p.email,
          accessPin: '1234'
        }))
      }
    });
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({ success: false, message: 'Seeding failed', error: error.message });
  }
});

module.exports = router;
